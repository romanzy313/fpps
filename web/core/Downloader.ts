import { ValueSubscriber } from "../utils/ValueSubscriber";
import { PeerMessage, TransferStatus } from "./protocol";
import {
  CalcTransferSpeed,
  makeCalcTransferSpeed,
  TransferSpeed,
  TransferStats,
  zeroTransferStats,
} from "./transferStats";
import { IPeerChannel } from "./WebRTC/types";

export class Downloader {
  status = new ValueSubscriber<TransferStatus>("idle");
  private stats: TransferStats = zeroTransferStats();
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  private speed: TransferSpeed | null = null;
  private calcSpeed: CalcTransferSpeed | null = null;

  constructor(private peerChannel: IPeerChannel) {
    peerChannel.listenOnMessage((msg) => {
      this.onPeerMessage(msg);
    });
  }

  getStats() {
    return this.stats;
  }

  getSpeed() {
    return this.speed;
  }

  private resetStatsProgress() {
    this.stats = {
      ...this.stats,
      transferredBytes: 0,
      currentIndex: 0,
    };
  }

  private isAborted() {
    return this.status.value === "aborted";
  }

  start(writableStream: WritableStream<Uint8Array>) {
    if (this.status.value === "done") {
      this.status.setValue("idle");
    }

    if (this.status.value === "transfer") {
      throw new Error(
        "Cannot start a transfer while it's already in progress (bad status)",
      );
    }
    if (this.writer) {
      throw new Error(
        "Cannot start a transfer while it's already in progress (bad writer)",
      );
    }

    this.stats = zeroTransferStats();
    this.writer = writableStream.getWriter();
    this.peerChannel.write({ type: "transfer-start" });
  }

  async abort() {
    this.peerChannel.write({ type: "transfer-abort" });
    this.internalAbort();
  }

  private onPeerMessage(message: PeerMessage) {
    // console.log("NEW MESSAGE", message);
    switch (message.type) {
      case "transfer-start":
        // no-op
        break;
      case "transfer-started":
        this.status.setValue("transfer");
        break;

      case "transfer-chunk":
        if (this.isAborted()) {
          return;
        }
        if (this.status.value !== "transfer") {
          throw new Error("Cannot receive a chunk while not downloading");
        }

        if (!this.writer) {
          throw new Error("Cannot receive a chunk without a writer");
        }
        this.writer.write(message.value);
        break;
      case "transfer-done":
        this.done();

        break;
      case "transfer-stats":
        this.stats = message.value;
        if (!this.calcSpeed) {
          this.calcSpeed = makeCalcTransferSpeed(message.value.totalBytes);
        }

        this.speed = this.calcSpeed(message.value.transferredBytes);
        break;
      case "transfer-abort":
        if (this.status.value === "transfer") {
          this.internalAbort();
        }
        break;

      case "preview-content":
        // files have changed, so reset the UI
        this.resetStatsProgress();
        this.status.setValue("idle");
        break;

      default:
        throw new Error(`Unknown message type`);
    }

    // Handle data
  }

  private async internalAbort() {
    this.transferFinished();

    if (this.status.value !== "transfer") {
      throw new Error(
        `Cannot abort a non-downloading transfer (bad status: ${this.status.value})`,
      );
    }

    this.status.setValue("aborted");

    if (!this.writer) {
      throw new Error("Cannot abort a non-downloading transfer (no writer)");
    }

    await this.writer.abort();
    this.writer = null;
  }

  private async done() {
    this.transferFinished();

    this.status.setValue("done");
    if (!this.writer) {
      throw new Error("Cannot complete a transfer without a writer");
    }
    await this.writer.close();
    this.writer = null;
  }

  private transferFinished() {
    this.speed = null;
    this.calcSpeed = null;
  }

  dispose() {
    this.status.dispose();
  }
}

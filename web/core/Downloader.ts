import { ValueSubscriber } from "../utils/ValueSubscriber";
import {
  PeerMessage,
  TransferStats,
  TransferStatus,
  zeroTransferStats,
} from "./protocol";
import { AsyncZipDeflate, Zip } from "fflate/browser";
import { IPeerChannel } from "./WebRTC/types";

export class Downloader {
  status = new ValueSubscriber<TransferStatus>("idle");
  private stats: TransferStats = zeroTransferStats();
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  constructor(private peerChannel: IPeerChannel) {
    peerChannel.listenOnMessage((msg) => {
      this.onData(msg);
    });
  }

  getStats() {
    return this.stats;
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

  private async internalAbort() {
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
    this.status.setValue("done");
    if (!this.writer) {
      throw new Error("Cannot complete a transfer without a writer");
    }
    await this.writer.close();
    this.writer = null;
  }

  private onData(message: PeerMessage) {
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

  dispose() {
    this.status.dispose();
  }
}

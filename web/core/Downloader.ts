import { ValueSubscriber } from "../utils/ValueSubscriber";
import { PeerMessage, TransferStatus } from "./protocol";
import { TransferProgress } from "./TransferSpeed";
import { PeerChannel } from "./WebRTC/types";

const PROGRESS_EVERY_MS = 500;

export class Downloader {
  status = new ValueSubscriber<TransferStatus>("idle");

  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  private speed = new TransferProgress();

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage((msg) => {
      this.onPeerMessage(msg);
    });
  }

  getSpeed() {
    return this.speed.value;
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
      case "transfer-started": {
        this.status.setValue("transfer");

        this.speed.reset(message.value.transferSizeBytes);
        this.speed.startInterval(PROGRESS_EVERY_MS);

        break;
      }

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

        console.log("pushing delta", message.value.length);
        this.speed.pushDelta(message.value.length);
        this.writer.write(message.value);

        break;
      case "transfer-done":
        console.log("TRANSFER DONE, finishing up");
        this.done();

        break;
      case "transfer-abort":
        if (this.status.value === "transfer") {
          this.internalAbort();
        }
        break;

      case "preview-content":
        // files have changed, so reset the UI
        this.status.setValue("idle");
        break;

      default:
        throw new Error(`Unknown message type`);
    }

    // Handle data
  }

  private async done() {
    this.speed.done();
    this.status.setValue("done");

    if (!this.writer) {
      throw new Error("Cannot complete a transfer without a writer");
    }
    await this.writer.close();
    this.writer = null;
  }

  private async internalAbort() {
    if (this.status.value !== "transfer") {
      throw new Error(
        `Cannot abort a non-downloading transfer (bad status: ${this.status.value})`,
      );
    }

    this.status.setValue("aborted");
    this.speed.reset();

    if (!this.writer) {
      throw new Error("Cannot abort a non-downloading transfer (no writer)");
    }

    await this.writer.abort();
    this.writer = null;
  }

  dispose() {
    this.status.dispose();
  }
}

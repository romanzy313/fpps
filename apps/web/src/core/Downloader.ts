import { PeerMessage, TransferStats } from "./PeerChannel";
import { PeerChannel } from "./PeerChannel";

export class Downloader {
  private status: "idle" | "downloading" | "done" | "aborted" = "idle";
  private stats: TransferStats | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnData(this.onData.bind(this));
  }

  start(writableStream: WritableStream<Uint8Array>) {
    if (this.status === "done") {
      this.status = "idle";
    }

    if (this.status === "downloading") {
      throw new Error(
        "Cannot start a transfer while it's already in progress (bad status)",
      );
    }
    if (this.writer) {
      throw new Error(
        "Cannot start a transfer while it's already in progress (bad writer)",
      );
    }

    this.stats = null;
    this.writer = writableStream.getWriter();
    this.peerChannel.send({ type: "transfer-start" });
  }

  private isAborted() {
    return this.status === "aborted";
  }

  async abort() {
    this.peerChannel.send({ type: "transfer-abort" });
    this.internalAbort();
  }

  private async internalAbort() {
    if (this.status !== "downloading") {
      throw new Error(
        `Cannot abort a non-downloading transfer (bad status: ${this.status})`,
      );
    }

    this.status = "aborted";
    if (!this.writer) {
      throw new Error("Cannot abort a non-downloading transfer (no writer)");
    }
    await this.writer.abort();
    this.writer = null;
  }

  private async done() {
    this.status = "done";
    if (!this.writer) {
      throw new Error("Cannot complete a transfer without a writer");
    }
    await this.writer.close();
    this.writer = null;
  }

  getStatus() {
    return this.status;
  }

  getStats() {
    return this.stats;
  }

  private onData(message: PeerMessage) {
    switch (message.type) {
      case "transfer-started":
        this.status = "downloading";
        break;
      case "transfer-chunk":
        if (this.isAborted()) {
          return;
        }
        if (this.status !== "downloading") {
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
      case "transfer-start":
      case "ping":
        // no-op
        break;
      case "transfer-abort":
        this.internalAbort();
        break;
      default:
        throw new Error(`Unknown message type`);
    }

    // Handle data
  }
}

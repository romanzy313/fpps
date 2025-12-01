import { ValueSubscriber } from "../utils/ValueSubscriber";
import {
  PeerMessage,
  TransferStats,
  TransferStatus,
  zeroTransferStats,
} from "./PeerChannel";
import { PeerChannel } from "./PeerChannel";

export class Downloader {
  status = new ValueSubscriber<TransferStatus>("idle");
  private stats: TransferStats = zeroTransferStats();
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage(this.onData.bind(this));
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
    this.peerChannel.sendMessage({ type: "transfer-start" });
  }

  private isAborted() {
    return this.status.value === "aborted";
  }

  async abort() {
    this.peerChannel.sendMessage({ type: "transfer-abort" });
    this.internalAbort();
  }

  private async internalAbort() {
    if (this.status.value !== "transfer") {
      throw new Error(
        `Cannot abort a non-downloading transfer (bad status: ${this.status})`,
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

  getStats() {
    return this.stats;
  }

  private onData(message: PeerMessage) {
    switch (message.type) {
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
        // console.log("GOT STATS", {
        //   value: message.value,
        // });
        this.stats = message.value;
        break;
      case "transfer-start":
      case "preview-stats":
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

  dispose() {
    this.status.dispose();
  }
}

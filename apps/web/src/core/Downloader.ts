import { PeerMessage, TransferStats } from "./PeerChannel";
import { PeerChannel } from "./PeerChannel";

export class Downloader {
  private status: "idle" | "downloading" | "done" = "idle";
  private stats: TransferStats | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array>;

  constructor(
    peerChannel: PeerChannel,
    writableStream: WritableStream<Uint8Array>,
  ) {
    peerChannel.listenOnData(this.onData.bind(this));
    this.writer = writableStream.getWriter();
  }

  getStatus() {
    return this.status;
  }

  getStats() {
    return this.stats;
  }

  private onData(message: PeerMessage) {
    switch (message.type) {
      case "transfer-start":
        this.status = "downloading";
        this.stats = {
          currentIndex: 0,
          transferredBytes: 0,
          totalFiles: message.value.totalFileCount,
          totalBytes: message.value.totalSizeBytes,
        };
        break;
      case "transfer-chunk":
        if (this.status === "downloading") {
          this.writer.write(message.value);
        }
        break;
      case "transfer-done":
        this.status = "done";
        this.writer.close();
        break;
      case "transfer-stats":
        this.stats = message.value;
        break;
      // the rest are no-op
    }

    // Handle data
  }
}

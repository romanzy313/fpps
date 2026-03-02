import { PeerMessage, TransferStatus } from "./protocol";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { PeerChannel } from "./WebRTC/types";
import { TransferStats, transferStatsFromFiles } from "./TransferStats";
import { TransferSpeed } from "./TransferSpeed";
import { makeZip, predictLength } from "client-zip";
import { ChunkSplitterTransformer } from "./ChunkSplitterTransformer";

const CHUNK_SIZE = 2 << 15; // 65kb

export class Uploader {
  private PROGRESS_EVERY_MS = 1000;
  private progressInterval: NodeJS.Timeout | null = null;

  private files: File[] = [];

  status = new ValueSubscriber<TransferStatus>("idle");

  private stats: TransferStats = transferStatsFromFiles([]);
  private speed = new TransferSpeed();

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage(this.onPeerMessage.bind(this));
  }

  getStats() {
    return this.stats;
  }

  getSpeed() {
    return this.speed.value;
  }

  getFiles() {
    return this.files;
  }

  setFiles(files: File[]) {
    if (this.status.value === "transfer") {
      throw new Error("Cannot set files while uploading");
    }
    this.files = files;
    this.stats = transferStatsFromFiles(files);
  }

  stop() {
    this.peerChannel.write({ type: "transfer-abort" });

    this.abortTransfer();
  }

  private onPeerMessage(message: PeerMessage) {
    switch (message.type) {
      case "transfer-start":
        // this.startTransfer();
        this.startTransferAsync();
        break;
      case "transfer-abort":
        if (this.status.value === "transfer") {
          this.abortTransfer();
        }
        break;
    }
  }

  dispose() {
    this.status.dispose();
  }

  private async startTransferAsync() {
    if (!this.peerChannel.isReady()) {
      throw new Error("Peer channel is not ready to upload");
    }

    if (this.status.value === "transfer") {
      throw new Error("Cannot start transfer: uploader is already uploading");
    }

    if (this.files.length === 0) {
      throw new Error("No files to transfer");
    }

    const stream = makeZip(
      this.files.map((file) => ({
        name: file.webkitRelativePath || file.name,
        size: file.size,
        input: file,
      })),
    );

    this.progressInterval = setInterval(() => {
      this.speed.tick(this.stats.transferredBytes);

      // would be nice for the reciever to extrapolate this...
      // reciever knows how long the payload is
      this.peerChannel.write({
        type: "transfer-stats",
        value: this.stats,
      });
    }, this.PROGRESS_EVERY_MS);

    this.stats.currentIndex = 0;
    this.stats.transferredBytes = 0;

    this.speed.reset(this.stats.totalBytes);

    const predicted = Number(predictLength(this.files));
    const totalRaw = this.stats.totalBytes;

    const reader = stream
      .pipeThrough(
        new TransformStream(new ChunkSplitterTransformer(CHUNK_SIZE)),
      )
      .getReader();

    this.status.setValue("transfer");

    try {
      console.log("file prediction", {
        predicted,
        totalRaw,
        difference: totalRaw - predicted,
      });

      await this.peerChannel.writeAsync({
        type: "transfer-started",
        value: this.stats,
      });

      while (true) {
        if (this.status.value === "aborted") {
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;

        // the bytes a bit off the predicteced length, but its okay
        this.stats.transferredBytes += value.byteLength;

        await this.peerChannel.writeAsync({
          type: "transfer-chunk",
          value,
        });
      }

      await this.peerChannel.writeAsync({
        type: "transfer-done",
      });

      reader.releaseLock();

      this.status.setValue("done");
      //roll back stats to 100%
      this.stats.transferredBytes = this.stats.totalBytes;
    } catch (err) {
      console.error("error while transferring");
      this.status.setValue("idle");
      stream.cancel(err);
    } finally {
      console.log("actually transferred", {
        actual: this.stats.transferredBytes,
        predicted,
        totalRaw,
        differenceRaw: this.stats.transferredBytes - totalRaw,
        differencePredicted: this.stats.transferredBytes - predicted,
      });

      this.speed.reset(0);
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
      }
    }
  }

  // peer sends this
  private abortTransfer() {
    if (this.status.value !== "transfer") {
      throw new Error(
        "Cannot abort transfer: uploader is not in uploading state",
      );
    }

    this.status.setValue("aborted");
  }
}

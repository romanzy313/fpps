import { PeerMessage, TransferStatus } from "./protocol";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { PeerChannel } from "./WebRTC/types";
import { TransferProgress } from "./TransferSpeed";
import { makeZip, predictLength } from "client-zip";
import { ChunkSplitterTransformer } from "./ChunkSplitterTransformer";

const CHUNK_SIZE = 2 << 15; // 65kb
const PROGRESS_EVERY_MS = 500;

export class Uploader {
  private files: File[] = [];

  status = new ValueSubscriber<TransferStatus>("idle");

  private progress = new TransferProgress();

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage(this.onPeerMessage.bind(this));
  }

  getSpeed() {
    return this.progress.value;
  }

  getFiles() {
    return this.files;
  }

  setFiles(files: File[]) {
    if (this.status.value === "transfer") {
      throw new Error("Cannot set files while uploading");
    }
    this.files = files;
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

    const predictedBytes = Number(predictLength(this.files));

    this.progress.reset(predictedBytes);
    this.progress.startInterval(PROGRESS_EVERY_MS);

    const stream = makeZip(
      this.files.map((file) => ({
        name: file.webkitRelativePath || file.name,
        size: file.size,
        input: file,
      })),
    );

    const reader = stream
      .pipeThrough(
        new TransformStream(new ChunkSplitterTransformer(CHUNK_SIZE)),
      )
      .getReader();

    this.status.setValue("transfer");

    try {
      await this.peerChannel.writeAsync({
        type: "transfer-started",
        value: {
          transferSizeBytes: predictedBytes,
        },
      });

      while (true) {
        if (this.status.value === "aborted") {
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;

        this.progress.pushDelta(value.byteLength);

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

      // set progress to 100%
      this.progress.done();
    } catch (err) {
      this.progress.reset(0);

      console.error("error while transferring");
      this.status.setValue("idle");

      reader.cancel(err);
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

import {
  PeerChannel,
  PeerMessage,
  TransferStats,
  TransferStatus,
} from "./PeerChannel";
import { ValueSubscriber } from "../utils/ValueSubscriber";

export class Uploader {
  // config vars
  private WRITE_CHUNK_SIZE = 1 << 15; // 32kb
  // TODO: send the progress every 0.5 seconds!
  private PROGRESS_EVERY_BYTES = (1 << 13) * 16; // 8 * 16kb

  private files: File[] = [];
  status = new ValueSubscriber<TransferStatus>("idle");
  private writeBuffer = new Uint8Array(this.WRITE_CHUNK_SIZE);
  private writeBufferPos = 0;
  private currentFileIndex = 0;
  private totalProcessedBytes = 0;
  private lastStatSentBytes = 0;

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage(this.onData.bind(this));
  }

  // TODO: for some reason this does not count duplicate file bytes
  // Its nice, but why?
  get totalSizeBytes(): number {
    // TODO: pls cache
    return this.files.reduce((acc, file) => acc + file.size, 0);
  }

  get totalFileCount(): number {
    return this.files.length;
  }

  getStats(): TransferStats {
    return {
      currentIndex: this.currentFileIndex,
      totalFiles: this.totalFileCount,
      transferredBytes: this.totalProcessedBytes,
      totalBytes: this.totalSizeBytes,
    };
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

  private isAborted() {
    return this.status.value === "aborted";
  }

  private flushTransferChunks() {
    if (this.writeBufferPos > 0) {
      // console.log("FLUSHING TRANSFER CHUNKS, size", this.writeBufferPos);
      this.peerChannel.sendMessage({
        type: "transfer-chunk",
        value: this.writeBuffer.slice(0, this.writeBufferPos),
      });
      this.writeBufferPos = 0;
    }
  }

  private sendBufferedChunk(chunk: Uint8Array) {
    // optimization for large chunks
    if (this.writeBufferPos === 0 && chunk.byteLength > this.WRITE_CHUNK_SIZE) {
      this.peerChannel.sendMessage({
        type: "transfer-chunk",
        value: chunk,
      });
      return;
    }

    if (this.writeBufferPos + chunk.byteLength < this.WRITE_CHUNK_SIZE) {
      // buffer
      this.writeBuffer.set(chunk, this.writeBufferPos);
      this.writeBufferPos += chunk.byteLength;
    } else {
      this.flushTransferChunks();

      this.peerChannel.sendMessage({
        type: "transfer-chunk",
        value: chunk,
      });
    }
  }

  private done() {
    this.flushTransferChunks();
    this.peerChannel.sendMessage({
      type: "transfer-stats",
      value: this.getStats(),
    });
    this.peerChannel.sendMessage({ type: "transfer-done" });
    this.status.setValue("done");
  }

  private async start() {
    if (!this.peerChannel.isReady()) {
      throw new Error("Peer channel is not ready to upload");
    }

    if (this.status.value === "transfer") {
      throw new Error("Cannot start transfer: uploader is already uploading");
    }

    if (this.files.length === 0) {
      throw new Error("No files to transfer");
    }

    this.status.setValue("transfer");

    this.writeBufferPos = 0;

    // TODO: careful
    this.currentFileIndex = 0;
    this.totalProcessedBytes = 0;
    this.lastStatSentBytes = 0;

    this.peerChannel.sendMessage({
      type: "transfer-started",
    });
    this.peerChannel.sendMessage({
      type: "transfer-stats",
      value: this.getStats(),
    });

    const firstFile = this.files[0]!;
    let reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> = firstFile
      .stream()
      .getReader();

    this.peerChannel.sendMessage({
      type: "transfer-next-file",
      name: firstFile.webkitRelativePath || firstFile.name,
    });

    for (;;) {
      if (this.isAborted()) {
        return;
      }

      if (this.peerChannel.hasBackpressure()) {
        await sleep(10);
        continue;
      }

      // TODO: this could fail?
      const { value, done } = await reader.read();

      // console.log("READING A FILE", {
      //   byteLen: value?.byteLength,
      //   done,
      //   index: this.currentFileIndex,
      // });
      await sleep(0); // this is needed for vite to pass the tests... ugh

      if (done) {
        reader.releaseLock();

        this.flushTransferChunks(); // inefficient, all coms must be buffered

        this.currentFileIndex++;
        if (this.currentFileIndex === this.files.length) {
          // actually done
          // index is out of bounds, so that file progress is correct
          this.done();
          return;
        }

        const nextFile = this.files[this.currentFileIndex]!;
        reader = nextFile.stream().getReader();
        // send the next file message
        this.peerChannel.sendMessage({
          type: "transfer-next-file",
          name: nextFile.webkitRelativePath || nextFile.name,
        });
        continue;
      }

      if (
        this.totalProcessedBytes - this.lastStatSentBytes >
        this.PROGRESS_EVERY_BYTES
      ) {
        this.lastStatSentBytes = this.totalProcessedBytes;
        // console.log("PROGRESS SEND STATS", {
        //   value: this.getStats(),
        // });
        this.peerChannel.sendMessage({
          type: "transfer-stats",
          value: this.getStats(),
        });
      }

      this.totalProcessedBytes += value.byteLength;
      this.sendBufferedChunk(value);
    }
  }

  abort() {
    this.peerChannel.sendMessage({ type: "transfer-abort" });
    this.internalAbort();
  }

  private internalAbort() {
    if (this.status.value !== "transfer") {
      throw new Error(
        "Cannot abort transfer: uploader is not in uploading state",
      );
    }
    this.status.setValue("aborted");
  }

  private onData(message: PeerMessage) {
    switch (message.type) {
      case "transfer-start":
        this.start();
        break;
      case "transfer-abort":
        if (this.status.value === "transfer") {
          this.internalAbort();
        }
        break;
    }
  }

  dispose() {
    this.status.dispose();
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

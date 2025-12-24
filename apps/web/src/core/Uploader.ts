import { AsyncZipDeflate, Zip } from "fflate/browser";
import {
  PeerChannel,
  PeerMessage,
  TransferStats,
  TransferStatus,
} from "./PeerChannel";
import { ValueSubscriber } from "../utils/ValueSubscriber";

export class Uploader {
  // config vars
  private WRITE_CHUNK_SIZE = 1 << 14; // 16kb
  // TODO: send the progress every 0.5 seconds!
  private PROGRESS_EVERY_BYTES = (1 << 13) * 16; // 8 * 16kb

  private files: File[] = [];
  status = new ValueSubscriber<TransferStatus>("idle");
  private writeBuffer = new Uint8Array(this.WRITE_CHUNK_SIZE);
  private writeBufferPos = 0;
  private zip: Zip | null = null;
  private currentFileIndex = 0;
  private totalProcessedBytes = 0;
  private lastStatSentBytes = 0;
  private current: {
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
    deflate: AsyncZipDeflate;
    progress: number;
  } | null = null;

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnDrained(this.onDrained.bind(this));
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

  private resetInternals() {
    this.zip = null;
    if (this.current?.reader) {
      this.current.reader.cancel();
    }
    this.current = null;
    this.writeBufferPos = 0;
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
      // console.log("WRITING LARGE CHUNK OPTIMIZATION, size", chunk.byteLength);
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
    // console.log("DONE SENDING STATS", {
    //   value: this.getStats(),
    // });
    this.flushTransferChunks();
    this.peerChannel.sendMessage({
      type: "transfer-stats",
      value: this.getStats(),
    });
    this.peerChannel.sendMessage({ type: "transfer-done" });
    this.status.setValue("done");
    this.resetInternals();
  }

  private start() {
    if (!this.peerChannel.isReady()) {
      throw new Error("Peer channel is not ready to upload");
    }

    if (this.status.value === "transfer") {
      throw new Error("Cannot start transfer: uploader is already uploading");
    }
    this.status.setValue("transfer");

    this.resetInternals();

    this.zip = new Zip((err, data, done) => {
      if (err) {
        // when connection error is enountered, it thows here:
        // Error: Zip error: Cannot send: data channel is not open
        // TODO: move this error type to the status of the class
        // separate error value?
        // TODO: backpressure issues encounter error:
        // Error: Zip error: stream finished
        throw new Error(`Zip error: ${err.message}`);
      }

      // TODO: some chunks are really small. need to accumulate internally
      // if the zip contains lots of small files, each one is a "chunk here"
      // console.log(
      //   "ZIP CHUNK OF SIZE",
      //   data.byteLength,
      //   "SENT",
      //   "IS DONE?",
      //   done,
      // );
      // backpressure is managed on reading side
      // this.peerChannel.sendMessage({ type: "transfer-chunk", value: data });
      this.sendBufferedChunk(data);

      if (done) {
        // console.log("ZIP WAS ENDED, DONE");

        this.done();
      }
    });

    this.peerChannel.sendMessage({
      type: "transfer-started",
    });
    this.peerChannel.sendMessage({
      type: "transfer-stats",
      value: this.getStats(),
    });

    this.advance();
    this.process();
  }

  // returns true if next files exists
  // true value means processing must continue
  private advance(): boolean {
    if (this.isAborted()) {
      return false;
    }

    if (!this.zip) {
      throw new Error("No zip instance");
    }

    if (!this.current) {
      // initialization
      if (this.files.length === 0) {
        throw new Error("No files to initially advance");
      }
      this.currentFileIndex = 0;
      this.totalProcessedBytes = 0;
      this.lastStatSentBytes = 0;
    } else {
      this.currentFileIndex++;
    }

    if (this.current) {
      this.current.reader.releaseLock();
    }

    if (this.currentFileIndex >= this.files.length) {
      // reached the end
      this.current = null; // this is ugly very much
      this.zip.end();

      return false;
    }
    const file = this.files[this.currentFileIndex]!;

    const deflate = new AsyncZipDeflate(file.webkitRelativePath || file.name, {
      level: 6,
    });
    this.zip.add(deflate);

    this.current = {
      reader: file.stream().getReader(),
      deflate,
      progress: 0,
    };

    return true;
  }

  private process() {
    if (this.status.value !== "transfer") {
      return;
    }

    if (!this.peerChannel.isReady()) {
      throw new Error("Connection problem, do something about it");
    }

    if (this.peerChannel.hasBackpressure()) {
      console.warn("Tried to process under backpressure, retrying later");
      return;
    }

    if (!this.current) {
      console.error("CANNOT ADVANCE: no current", this);
      throw new Error("Assertion error: No current file 1");
    }

    const { reader, deflate } = this.current;

    reader.read().then(({ value, done }) => {
      console.log("READ VALUE", { lenBytes: value?.byteLength, done });
      if (done) {
        deflate.push(new Uint8Array([]), true);

        if (this.advance()) {
          this.process();
        }
        return;
      }

      const uncompressedBytes = value.byteLength;

      this.current!.progress += uncompressedBytes;
      this.totalProcessedBytes += uncompressedBytes;

      deflate.push(value, false);

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

      return this.process();
    });
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
    this.resetInternals();
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

  private onDrained() {
    // ignore drain when transfer finished...
    // ugly ugly
    if (this.current !== null) {
      this.process();
    }
  }

  dispose() {
    this.status.dispose();
  }
}

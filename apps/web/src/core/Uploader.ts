import { Zip } from "fflate";
import { PeerChannel, PeerMessage, TransferStats } from "./PeerChannel";
import { ZipDeflate } from "fflate/node";

export class Uploader {
  // config vars
  // private READ_CHUNK_SIZE = 8096;
  private READ_CHUNK_SIZE = 777; // temp for now
  private PROGRESS_EVERY_BYTES = this.READ_CHUNK_SIZE * 10;

  private files: File[] = [];
  private status: "idle" | "transfer" | "done" | "aborted" = "idle";
  private zip: Zip | null = null;
  private underBackpressure = false;
  private currentFileIndex = 0;
  private totalProcessedBytes = 0;
  private lastStatSentBytes = 0;
  private current: {
    file: File;
    deflate: ZipDeflate;
    progress: number;
  } | null = null;

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnDrained(this.onDrained.bind(this));
    peerChannel.listenOnData(this.onData.bind(this));
  }

  get totalSizeBytes(): number {
    // TODO: pls cache
    return this.files.reduce((acc, file) => acc + file.size, 0);
  }

  get totalFileCount(): number {
    return this.files.length;
  }

  getStatus() {
    return this.status;
  }

  getStats(): TransferStats {
    return {
      currentIndex: this.currentFileIndex,
      totalFiles: this.totalFileCount,
      transferredBytes: this.totalProcessedBytes,
      totalBytes: this.totalSizeBytes,
    };
  }

  setFiles(files: File[]) {
    if (this.status === "transfer") {
      throw new Error("Cannot set files while uploading");
    }
    this.files = files;
  }

  private isAborted() {
    return this.status === "aborted";
  }

  private resetInternals() {
    this.zip = null;
    this.current = null;
    this.underBackpressure = false;
  }

  private done() {
    this.peerChannel.send({ type: "transfer-stats", value: this.getStats() });
    this.peerChannel.send({ type: "transfer-done" });
    this.status = "done";
    this.resetInternals();
  }

  private start() {
    if (!this.peerChannel.isReady()) {
      throw new Error("Peer channel is not ready to upload");
    }

    if (this.status === "transfer") {
      throw new Error("Cannot start transfer: uploader is already uploading");
    }
    this.status = "transfer";

    this.zip = new Zip((err, data, done) => {
      if (err) {
        // TODO: bubble error to the class variable
        throw new Error(`Zip error: ${err.message}`);
      }

      // backpressure is not managed here
      this.peerChannel.send({ type: "transfer-chunk", value: data });

      if (done) {
        this.done();
      }
    });

    this.peerChannel.send({
      type: "transfer-started",
    });
    this.peerChannel.send({
      type: "transfer-stats",
      value: this.getStats(),
    });
    this.advance();
    this.process();
  }

  // how things are communicated:
  // 1) send totalCount + totalSize
  //  --- 2) send many chunks
  //  --- 3) send progress every x Chunks
  // 4) send done

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
      const file = this.files[0]!;
      const deflate = new ZipDeflate(file.webkitRelativePath || file.name, {
        level: 9,
      });
      this.zip.add(deflate);

      this.current = {
        file,
        deflate,
        progress: 0,
      };
      this.currentFileIndex = 0;
      return true;
    }

    const file = this.files[++this.currentFileIndex];
    if (!file) {
      // reached the end
      this.current = null;
      this.zip.end();

      return false;
    }

    const deflate = new ZipDeflate(file.webkitRelativePath || file.name, {
      level: 9,
    });
    this.zip.add(deflate);

    this.current = {
      file,
      deflate,
      progress: 0,
    };

    return true;
  }

  private process() {
    if (this.isAborted()) {
      return;
    }

    if (this.underBackpressure) {
      throw new Error("Cannot process under backpressure");
    }

    if (!this.peerChannel.isReady()) {
      throw new Error("Connection problem, do something about it");
    }

    // check for backpressure and let
    if (this.peerChannel.hasBackpressure()) {
      this.underBackpressure = true;
      return;
    }

    if (!this.current) {
      throw new Error("Assertion error: No current file 1");
    }

    const { file, deflate } = this.current;

    const start = this.current.progress;
    const end = Math.min(start + this.READ_CHUNK_SIZE, file.size);

    if (start === file.size) {
      if (this.advance()) {
        this.process();
        return;
      }
    }

    file
      .slice(start, end)
      .bytes()
      .then((bytes) => {
        if (!this.current) {
          throw new Error("Assertion error: No current file 2");
        }
        const uncompressedBytes = end - start;
        this.current.progress += uncompressedBytes;
        this.totalProcessedBytes += uncompressedBytes;

        const done = end === file.size;
        deflate.push(bytes, done);

        // stats handling here
        if (
          !done &&
          this.totalProcessedBytes - this.lastStatSentBytes >
            this.PROGRESS_EVERY_BYTES
        ) {
          this.lastStatSentBytes = this.totalProcessedBytes;
          this.peerChannel.send({
            type: "transfer-stats",
            value: this.getStats(),
          });
        }

        if (!done) {
          return this.process();
        }

        if (this.advance()) {
          this.process();
        }
      });
  }

  abort() {
    this.internalAbort();
    this.peerChannel.send({ type: "transfer-abort" });
  }

  private internalAbort() {
    if (this.status !== "transfer") {
      throw new Error(
        "Cannot abort transfer: uploader is not in uploading state",
      );
    }
    this.status = "aborted";
    this.resetInternals();
  }

  private onData(message: PeerMessage) {
    switch (message.type) {
      case "transfer-start":
        this.start();
        break;
      case "transfer-abort":
        this.internalAbort();
        break;
    }
  }

  private onDrained() {
    if (this.underBackpressure) {
      this.underBackpressure = false;
      this.process();
    } else {
      console.warn("DRAINED BUT WAS NOT UNDER BACKPRESSURE");
    }
  }
}

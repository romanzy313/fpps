import { Zip, ZipPassThrough } from "fflate/browser";

import { PeerMessage, TransferStatus } from "./protocol";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { PeerChannel } from "./WebRTC/types";
import { BufferedWriter, IBufferedWriter } from "./BufferedWriter";
import { TransferStats, transferStatsFromFiles } from "./TransferStats";
import { TransferSpeed } from "./TransferSpeed";

const CHUNK_SIZE = 2 << 15; // 65kb

export class Uploader {
  private PROGRESS_EVERY_MS = 1000;
  private progressInterval: NodeJS.Timeout | null = null;

  private files: File[] = [];

  status = new ValueSubscriber<TransferStatus>("idle");

  private stats: TransferStats = transferStatsFromFiles([]);
  private speed = new TransferSpeed();

  private current: {
    status: "transfer" | "backpressure" | "abort";
    isReading: boolean;
    zip: Zip;
    // bufferedWriter: IBufferedWriter;
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>;
    deflate: ZipPassThrough;
  } | null = null;

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage(this.onPeerMessage.bind(this));
    peerChannel.listenOnDrain(this.onDrain.bind(this));
  }

  private hasBackpressure() {
    return this.peerChannel.hasBackpressure();
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
        this.startTransfer();
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

  private startTransfer() {
    if (!this.peerChannel.isReady()) {
      throw new Error("Peer channel is not ready to upload");
    }

    if (this.status.value === "transfer") {
      throw new Error("Cannot start transfer: uploader is already uploading");
    }

    if (this.files.length === 0) {
      throw new Error("No files to transfer");
    }

    if (this.current) {
      throw new Error("Current was not cleaned up");
    }

    this.status.setValue("transfer");

    this.peerChannel.write({
      type: "transfer-started",
      value: this.stats,
    });

    this.progressInterval = setInterval(() => {
      this.speed.tick(this.stats.transferredBytes);

      this.peerChannel.write({
        type: "transfer-stats",
        value: this.stats,
      });
    }, this.PROGRESS_EVERY_MS);

    this.stats.currentIndex = 0;
    this.stats.transferredBytes = 0;

    this.speed.reset(this.stats.totalBytes);

    this.initCurrent();

    this.next();
  }

  // peer sends this
  private abortTransfer() {
    if (this.status.value !== "transfer") {
      throw new Error(
        "Cannot abort transfer: uploader is not in uploading state",
      );
    }

    this.requestZipEnd("abort");
  }

  private next() {
    if (!this.current) {
      throw new Error("Current transfer not defined 1");
    }

    if (this.current.status === "abort") {
      return;
    }

    if (this.current.status !== "transfer") {
      console.error("NEXT: unexpected status of", this.current.status);
      return;
    }

    if (this.hasBackpressure()) {
      this.current.status = "backpressure";
      return; // awaiting drain
    }

    if (this.current.isReading) {
      // This is just sanity assurance
      console.warn("Concurrent read detected");
      return;
    }
    this.current.isReading = true;

    this.current.reader.read().then((readRes) => {
      if (!this.current) {
        throw new Error("Current transfer not defined 2");
      }
      this.current.isReading = false;

      if (readRes.done) {
        this.stats.currentIndex++;

        if (this.stats.currentIndex === this.files.length) {
          this.requestZipEnd("done");
          return;
        }

        // close deflate
        this.current.deflate.push(new Uint8Array(0), true);

        const file = this.files[this.stats.currentIndex]!;

        // update the reader and deflate to the next file
        this.current.reader = this.createReader(file);
        this.current.deflate = this.createDeflate(file, this.current.zip);

        this.next();

        return;
      }

      const value = readRes.value;

      this.stats.transferredBytes += value.byteLength;

      this.current.deflate.push(value);

      this.next();
    });
  }

  private initCurrent() {
    if (this.current) {
      throw new Error("current already inited");
    }

    // create the current
    // const bufferedWriter = new BufferedWriter(CHUNK_SIZE, (data) => {
    //   this.peerChannel.write({
    //     type: "transfer-chunk",
    //     value: data,
    //   });
    // });

    const zip = new Zip((err, data, done) => {
      if (err) {
        // when connection error is enountered, it thows here:
        // Error: Zip error: Cannot send: data channel is not open
        // TODO: unified error handling
        // FIXME: error handling! this is restarable
        // The uploader needs to be able to emit errors
        throw new Error(`Zip error: ${err.message}`);
      }

      this.peerChannel.write({
        type: "transfer-chunk",
        value: data,
      });

      // bufferedWriter.write(data);

      if (done) {
        // bufferedWriter.flush();
        this.onZipEnd();
      }
    });

    const file = this.files[0]!;

    this.current = {
      status: "transfer",
      isReading: false,
      // bufferedWriter,
      zip,
      reader: this.createReader(file),
      deflate: this.createDeflate(file, zip),
    };
  }

  private requestZipEnd(reason: "done" | "abort") {
    if (!this.current) {
      console.warn("REQUESTEND: current not initialized");
      return;
    }
    if (reason === "abort") {
      this.current.status = "abort";
    }
    this.current.deflate.push(new Uint8Array(0), true);
    this.current.zip.end();
  }

  private onZipEnd() {
    if (!this.current) {
      throw new Error("current not initialized");
    }

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    this.speed.reset(0);

    if (this.current.status === "abort") {
      this.status.setValue("aborted");
      this.current = null;
      return;
    }
    // otherwise its done

    // this.current.bufferedWriter.flush();

    // Whats going on here?

    this.peerChannel.write({
      type: "transfer-stats",
      value: this.stats,
    });

    this.peerChannel.write({ type: "transfer-done" });

    this.status.setValue("done");
    this.current = null;
  }

  private onDrain() {
    if (!this.current) {
      return;
    }

    if (this.current.status === "abort") {
      return;
    }

    if (this.current.status === "transfer") {
      console.warn("ONDRAIN: unexpected status", this.current.status);
      return;
    }

    this.current.status = "transfer";

    this.next();
  }

  private createReader(file: File) {
    const reader = file
      .stream()
      .pipeThrough(
        new TransformStream(new ChunkSplitterTransformer(CHUNK_SIZE)),
      )
      .getReader();

    return reader;
  }

  private createDeflate(file: File, zip: Zip) {
    const deflate = new ZipPassThrough(file.webkitRelativePath || file.name);
    zip.add(deflate);

    return deflate;
  }
}

class ChunkSplitterTransformer implements Transformer<Uint8Array, Uint8Array> {
  private readonly chunkSize: number;
  private buffer: Uint8Array;
  private bufferUsed: number;

  constructor(chunkSize: number = 65536) {
    // 64KB default
    this.chunkSize = chunkSize;
    this.buffer = new Uint8Array(chunkSize);
    this.bufferUsed = 0;
  }

  transform(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ): void {
    let chunkOffset = 0;

    while (chunkOffset < chunk.length) {
      // Calculate how much we can copy to buffer
      const available = this.chunkSize - this.bufferUsed;
      const toCopy = Math.min(available, chunk.length - chunkOffset);

      // Copy data to buffer
      this.buffer.set(
        chunk.subarray(chunkOffset, chunkOffset + toCopy),
        this.bufferUsed,
      );
      this.bufferUsed += toCopy;
      chunkOffset += toCopy;

      // If buffer is full, enqueue it
      if (this.bufferUsed === this.chunkSize) {
        controller.enqueue(this.buffer.slice(0, this.chunkSize));
        this.bufferUsed = 0;
      }
    }
  }

  flush(controller: TransformStreamDefaultController<Uint8Array>): void {
    // Send any remaining data
    if (this.bufferUsed > 0) {
      controller.enqueue(this.buffer.slice(0, this.bufferUsed));
      this.bufferUsed = 0;
    }
  }
}

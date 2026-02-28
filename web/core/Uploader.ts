import { Zip, ZipDeflate } from "fflate/browser";

import { PeerMessage, TransferStatus } from "./protocol";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { IPeerChannel } from "./WebRTC/types";
import { ChunkedWriter } from "./ChunkedWriter";
import {
  makeCalcTransferSpeed,
  TransferSpeed,
  CalcTransferSpeed,
  TransferStats,
  transferStatsFromFiles,
} from "./transferStats";

const CHUNK_SIZE = 2 << 15; // 65kb

export class Uploader {
  private PROGRESS_EVERY_MS = 1000;
  private progressInterval: NodeJS.Timeout | null = null;

  private files: File[] = [];

  status = new ValueSubscriber<TransferStatus>("idle");

  private stats: TransferStats = transferStatsFromFiles([]);
  private speed: TransferSpeed | null = null;

  private current: {
    status: "transfer" | "backpressure" | "abort" | "done";
    isReading: boolean;
    zip: Zip;
    bufferedWriter: ChunkedWriter;
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>;
    deflate: ZipDeflate;
    calcSpeed: CalcTransferSpeed;
  } | null = null;

  constructor(private peerChannel: IPeerChannel) {
    peerChannel.listenOnMessage(this.onData.bind(this));
    peerChannel.listenOnDrain(this.onDrain.bind(this));
  }

  private hasBackpressure() {
    return this.peerChannel.hasBackpressure();
  }

  getStats() {
    return this.stats;
  }

  getSpeed() {
    return this.speed;
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

  private onData(message: PeerMessage) {
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
    });
    this.peerChannel.write({
      type: "transfer-stats",
      value: this.stats,
    });
    this.progressInterval = setInterval(() => {
      this.speed = this.current?.calcSpeed(this.stats.transferredBytes) ?? null;

      this.peerChannel.write({
        type: "transfer-stats",
        value: this.stats,
      });
    }, this.PROGRESS_EVERY_MS);

    this.stats.currentIndex = 0;
    this.stats.transferredBytes = 0;

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
    const bufferedWriter = new ChunkedWriter(CHUNK_SIZE, (data) => {
      this.peerChannel.write({
        type: "transfer-chunk",
        value: data,
      });
    });
    const zip = new Zip((err, data, done) => {
      if (err) {
        // when connection error is enountered, it thows here:
        // Error: Zip error: Cannot send: data channel is not open
        // TODO: unified error handling
        // FIXME: error handling! this is fatal
        throw new Error(`Zip error: ${err.message}`);
      }

      bufferedWriter.write(data);

      if (done) {
        bufferedWriter.flush();
        this.onZipEnd();
      }
    });

    const file = this.files[0]!;

    this.current = {
      status: "transfer",
      isReading: false,
      bufferedWriter,
      zip,
      reader: this.createReader(file),
      deflate: this.createDeflate(file, zip),
      calcSpeed: makeCalcTransferSpeed(this.stats.totalBytes),
    };
  }

  private requestZipEnd(reason: "done" | "abort") {
    if (!this.current) {
      console.warn("REQUESTEND: current not initialized");
      return;
    }

    this.current.status = reason;
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

    switch (this.current.status) {
      case "abort":
        this.status.setValue("aborted");
        // abort handling
        break;
      case "done":
        this.status.setValue("done");

        // this.flushTransferChunks();
        this.peerChannel.write({ type: "transfer-done" });

        this.peerChannel.write({
          type: "transfer-stats",
          value: this.stats,
        });
        break;
      default:
        throw new Error(`unexpected status ${this.current.status}`);
    }

    this.current = null;
  }

  private onDrain() {
    if (!this.current) {
      return;
    }

    if (this.current.status !== "backpressure") {
      console.error("ONDRAIN: unexpected status", this.current.status);
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
    // TODO: dynamic level based on mime type
    const deflate = new ZipDeflate(file.webkitRelativePath || file.name, {
      level: 6,
    });
    // add to the zip
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

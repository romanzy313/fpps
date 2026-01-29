import { ValueSubscriber } from "../utils/ValueSubscriber";
import {
  PeerMessage,
  TransferStats,
  TransferStatus,
  zeroTransferStats,
} from "./PeerChannel";
import { AsyncZipDeflate, Zip } from "fflate/browser";
import { IPeerChannel } from "./WebRTC/REWORK";

export class Downloader {
  status = new ValueSubscriber<TransferStatus>("idle");
  private stats: TransferStats = zeroTransferStats();
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private zip: Zip | null = null;
  private deflate: AsyncZipDeflate | null = null;

  constructor(private peerChannel: IPeerChannel) {
    peerChannel.listenOnMessage((msg) => {
      this.onData(msg);
    });
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
    this.peerChannel.write({ type: "transfer-start" });
    this.zip = new Zip((err, data, done) => {
      // console.log("zip callback", { err, byteLen: data?.byteLength, done });
      if (!this.writer) {
        throw new Error("Assertion failed: writer cant be null");
      }
      if (err) {
        this.writer.abort();
        this.writer = null;
        this.deflate = null;
        this.zip = null;
        // when terminate is called this is an expected behavior?
        // this.status.setValue("aborted") // ???
        throw new Error(`Zip error: ${err.message}`);
      }

      this.writer.write(data);

      if (done) {
        // console.log("ZIP SAID ITS DONE");
        this.writer.close().then(() => {
          // console.log("CLOSED WRITER");
          // cleanup code here
          this.writer = null;
          this.zip = null;
          this.deflate = null;
          this.status.setValue("done");
        });
      }
    });
  }

  private isAborted() {
    return this.status.value === "aborted";
  }

  async abort() {
    this.peerChannel.write({ type: "transfer-abort" });
    this.internalAbort();
  }

  private async internalAbort() {
    if (this.status.value !== "transfer") {
      throw new Error(
        `Cannot abort a non-downloading transfer (bad status: ${this.status.value})`,
      );
    }

    this.status.setValue("aborted");
    if (!this.writer) {
      throw new Error("Cannot abort a non-downloading transfer (no writer)");
    }
    if (!this.zip) {
      throw new Error("Cannot abort a non-downloading transfer (no zip)");
    }
    this.zip.terminate();
    await this.writer.abort();
    this.writer = null;
  }

  getStats() {
    return this.stats;
  }

  private onData(message: PeerMessage) {
    // console.log("NEW MESSAGE", message);
    switch (message.type) {
      case "transfer-start":
      case "preview-stats":
        // no-op
        break;
      case "transfer-started":
        this.status.setValue("transfer");
        break;
      case "transfer-next-file":
        {
          if (!this.zip) {
            throw new Error("Assertion error: zip undefined on next file");
          }
          if (this.deflate) {
            this.deflate.push(new Uint8Array(), true);
          }

          const deflate = new AsyncZipDeflate(message.name, {
            level: 4,
          });
          this.zip.add(deflate);
          this.deflate = deflate;
        }
        break;
      case "transfer-chunk":
        if (this.isAborted()) {
          return;
        }
        if (this.status.value !== "transfer") {
          throw new Error("Cannot receive a chunk while not downloading");
        }
        if (!this.zip || !this.deflate) {
          throw new Error("Cannot receive a chunk without a zip and deflate");
        }
        this.deflate.push(message.value);
        break;
      case "transfer-done":
        if (!this.zip) {
          throw new Error("Assertion failed: this zip must be defined");
        }
        if (this.deflate) {
          this.deflate.push(new Uint8Array(), true);
        }

        // console.log("TRANSFER IS DONE, ENDING ZIP");
        this.zip.end();

        break;
      case "transfer-stats":
        // console.log("GOT STATS", {
        //   value: message.value,
        // });
        this.stats = message.value;
        break;

      case "transfer-abort":
        if (this.status.value === "transfer") {
          this.internalAbort();
        }
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

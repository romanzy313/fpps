import { Toast } from "../utils/Toast";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { TRANSFER_PROGRESS_EVERY_MS } from "./consts";
import { PeerMessage, TransferStatus } from "./protocol";
import { TransferProgress } from "./TransferSpeed";
import { PeerChannel } from "./WebRTC/types";

export class Downloader {
  status = new ValueSubscriber<TransferStatus>("idle");

  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  private progress = new TransferProgress();

  constructor(
    private peerChannel: PeerChannel,
    private getWriter: (
      downloadSizeBytes: number,
    ) => WritableStreamDefaultWriter<Uint8Array<ArrayBufferLike>>,
  ) {
    // these do not need to be cleaned up
    // everything will be disposed
    peerChannel.listenOnMessage((msg) => {
      this.onPeerMessage(msg);
    });
    peerChannel.listenOnError((err) => {
      // do not try to send error, connection failed
      this.internalError(err.toString());
    });
  }

  getProgress() {
    return this.progress.value;
  }

  private isAborted() {
    return this.status.value === "aborted";
  }

  start() {
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

    this.peerChannel.write({ type: "transfer-start", value: undefined });
  }

  async abort() {
    if (this.status.value !== "transfer") {
      throw new Error(`Cannot abort a non-downloading transfer (bad status)`);
    }

    this.peerChannel.write({ type: "transfer-abort", value: undefined });
    this.internalAbort();
  }

  private onPeerMessage(message: PeerMessage) {
    switch (message.type) {
      case "transfer-start": {
        // no-op, we send this
        break;
      }
      case "transfer-started": {
        if (this.status.value === "transfer") {
          throw new Error(
            "Cannot start a transfer while it's already in progress (bad status)",
          );
        }
        if (this.writer) {
          throw new Error(
            "Cannot start a transfer while it's already in progress (writer exists)",
          );
        }

        this.status.setValue("transfer");

        this.writer = this.getWriter(message.value.transferSizeBytes);

        this.progress.reset(message.value.transferSizeBytes);
        this.progress.startInterval(TRANSFER_PROGRESS_EVERY_MS);

        break;
      }

      case "transfer-chunk": {
        if (this.isAborted()) {
          return;
        }
        if (this.status.value !== "transfer") {
          throw new Error("Cannot receive a chunk while not downloading");
        }
        if (!this.writer) {
          throw new Error("Cannot receive a chunk without a writer");
        }

        this.progress.pushDelta(message.value.length);
        this.writer.write(message.value);

        break;
      }
      case "transfer-done": {
        if (this.status.value !== "transfer") {
          throw new Error("Cannot complete a transfer (bad status)");
        }
        if (!this.writer) {
          throw new Error("Cannot complete a transfer (no writer)");
        }

        this.status.setValue("done");
        this.progress.done();

        this.writer.close().then(() => {
          this.writer = null;
        });

        break;
      }
      case "transfer-abort": {
        if (this.status.value !== "transfer") {
          return;
        }
        this.internalAbort();
        break;
      }
      case "transfer-error": {
        this.internalError(message.value.message);

        break;
      }

      case "preview-content": {
        // files have changed, so reset the UI
        this.status.setValue("idle");
        break;
      }

      default:
        throw new Error(`Unknown message type`);
    }

    // Handle data
  }

  private async internalAbort() {
    if (!this.writer) {
      throw new Error("Cannot abort a non-downloading transfer (no writer)");
    }

    this.status.setValue("aborted");
    this.progress.reset();

    this.writer.abort().then(() => {
      this.writer = null;
    });
  }

  private async internalError(message: string) {
    if (this.status.value !== "transfer") {
      return;
    }
    if (!this.writer) {
      throw new Error("Cannot abort a non-downloading transfer (no writer)");
    }

    Toast.error(`Transfer error`, message);

    this.status.setValue("error");
    this.progress.reset();

    this.writer.abort().then(() => {
      this.writer = null;
    });
  }

  dispose() {
    this.status.dispose();
  }
}

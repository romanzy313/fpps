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
        "Initializer: Cannot start a transfer while it's already in progress (bad status)",
      );
    }
    if (this.writer) {
      console.warn("Initializer: bad writer when trying starting a download");

      this.abortWriter();
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
            "Peer requests a transfer while it's already in progress (bad status)",
          );
        }
        if (this.writer) {
          console.warn(
            "Peer requests a transfer while it's already in progress (writer exists)",
          );

          this.abortWriter();
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

        Toast.success("Download complete");

        this.status.setValue("done");
        this.progress.done();

        this.closeWriter();

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
    this.status.setValue("aborted");
    this.progress.reset();

    this.abortWriter();
  }

  private async internalError(message: string) {
    if (this.status.value !== "transfer") {
      return;
    }

    Toast.error(`Transfer error: ${message}`);

    this.status.setValue("error");
    this.progress.reset();

    this.abortWriter();
  }

  private abortWriter() {
    if (!this.writer) {
      console.warn("No writer to abort");
      return;
    }

    this.writer.abort();
    this.writer = null;
  }

  private closeWriter() {
    if (!this.writer) {
      console.warn("No writer to close");
      return;
    }

    // TODO: give it 3 seconds before setting to null?
    // this.writer.close().then(() => {
    //   console.log("writer closed");
    //   this.writer = null;
    // });

    this.writer.close();
    setTimeout(() => {
      this.writer = null;
    });
  }

  dispose() {
    this.status.dispose();
  }
}

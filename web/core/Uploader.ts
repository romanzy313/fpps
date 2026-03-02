import { PeerMessage, TransferStatus } from "./protocol";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { PeerChannel } from "./WebRTC/types";
import { TransferProgress } from "./TransferSpeed";
import { makeZip, predictLength } from "client-zip";
import { ChunkSplitterTransformer } from "./ChunkSplitterTransformer";
import { TRANSFER_CHUNK_BYTES, TRANSFER_PROGRESS_EVERY_MS } from "./consts";
import { Toast } from "../utils/toast";

export class Uploader {
  private files: File[] = [];

  status = new ValueSubscriber<TransferStatus>("idle");

  private progress = new TransferProgress();

  constructor(private peerChannel: PeerChannel) {
    peerChannel.listenOnMessage(this.onPeerMessage.bind(this));
    peerChannel.listenOnError((err) => {
      // do not try to send error, connection failed
      this.internalError(err.toString());
    });
  }

  getProgress() {
    return this.progress.value;
  }

  addFiles(files: File[]) {
    // TODO: filter existsing
    this.setFiles([...this.files, ...files]);
  }

  setFiles(files: File[]) {
    if (this.status.value === "transfer") {
      throw new Error("Cannot set files while uploading");
    }
    this.files = files;
  }

  stop() {
    this.peerChannel.write({ type: "transfer-abort", value: undefined });

    this.internalAbort();
  }

  private onPeerMessage(message: PeerMessage) {
    switch (message.type) {
      case "transfer-start":
        // this.startTransfer();
        this.startTransferAsync();
        break;
      case "transfer-abort":
        if (this.status.value === "transfer") {
          this.internalAbort();
        }
        break;
      case "transfer-error":
        this.internalError(message.value.message);
        break;
    }
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

    this.status.setValue("transfer");

    const predictedBytes = Number(predictLength(this.files));

    this.progress.reset(predictedBytes);
    this.progress.startInterval(TRANSFER_PROGRESS_EVERY_MS);

    const stream = makeZip(
      this.files.map((file) => ({
        name: file.webkitRelativePath || file.name,
        size: file.size,
        input: file,
      })),
    );

    const reader = stream
      .pipeThrough(
        new TransformStream(new ChunkSplitterTransformer(TRANSFER_CHUNK_BYTES)),
      )
      .getReader();

    const shouldStop = () => this.status.value !== "transfer";

    try {
      await this.peerChannel.writeAsync({
        type: "transfer-started",
        value: {
          transferSizeBytes: predictedBytes,
        },
      });

      while (true) {
        if (shouldStop()) {
          this.progress.reset();
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
        value: undefined,
      });

      reader.releaseLock();

      this.status.setValue("done");

      Toast.success("Upload complete");

      // set progress to 100%
      this.progress.done();
    } catch (cause) {
      this.handleAndTrySendError(cause);

      reader.cancel();
    }
  }

  // peer sends this
  private internalAbort() {
    if (this.status.value !== "transfer") {
      throw new Error(
        "Cannot abort transfer: uploader is not in uploading state",
      );
    }

    this.status.setValue("aborted");
  }

  private async internalError(message: string) {
    if (this.status.value !== "transfer") {
      return;
    }

    Toast.error(`Transfer error`, message);

    this.status.setValue("error");
    this.progress.reset();
  }

  private async handleAndTrySendError(cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);

    this.internalError(message);

    try {
      await this.peerChannel.writeAsync({
        type: "transfer-error",
        value: { message },
      });
    } catch {
      // do nothing
    }
  }

  dispose() {
    this.status.dispose();
  }
}

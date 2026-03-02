import { TransferSummary } from "./TransferStats";

export type TransferStatus = "idle" | "transfer" | "done" | "aborted" | "error";

export type PreviewContent = {
  stats: TransferSummary;
};

type Payload<K, V> = { type: K; value: V };
export type PeerMessage =
  | Payload<"transfer-started", { transferSizeBytes: number }>
  | Payload<"transfer-start", void>
  | Payload<"transfer-chunk", Uint8Array>
  | Payload<"transfer-error", { message: string }>
  | Payload<"transfer-abort", void>
  | Payload<"transfer-done", void>
  | Payload<"preview-content", PreviewContent>;

const CHUNK_START = "c".charCodeAt(0);
const JSON_START = "{".charCodeAt(0);

// Simple encoding scheme
// if first byte starts with "c" -> its a chunk
// if with "{" -> its arbitrary json
export class TransferProtocol {
  static encode(message: PeerMessage): Uint8Array {
    if (message.type === "transfer-chunk") {
      return new Uint8Array([CHUNK_START, ...message.value]);
    }

    return new TextEncoder().encode(JSON.stringify(message));
  }

  static decode(data: Uint8Array): PeerMessage {
    if (data.byteLength < 1) {
      throw new Error("Invalid length");
    }

    if (data[0] === CHUNK_START) {
      return {
        type: "transfer-chunk",
        value: data.slice(1),
      };
    } else if (data[0] === JSON_START) {
      const decoder = new TextDecoder();

      return JSON.parse(decoder.decode(data));
    }

    throw new Error("Unknown payload");
  }
}

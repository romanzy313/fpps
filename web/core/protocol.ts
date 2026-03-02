import { TransferSummary } from "./TransferStats";

export type TransferStatus = "idle" | "transfer" | "done" | "aborted";

export type PreviewContent = {
  stats: TransferSummary;
};

// export type TransferStart = {
//   totalFiles: number;
//   totalBytes: number;
//   totalNetworkBytes: number;
// };
// TODO: send speed updates with stats
export type PeerMessage =
  | { type: "transfer-started"; value: { transferSizeBytes: number } }
  | { type: "transfer-start" }
  | { type: "transfer-chunk"; value: Uint8Array }
  | { type: "transfer-abort" }
  | { type: "transfer-done" }
  | { type: "preview-content"; value: PreviewContent };

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

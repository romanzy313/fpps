// export interface PeerChannelSender {
//   isReady(): boolean;
//   backpressureRemainingBytes(): number;
//   sendMessage(message: PeerMessage): void;
//   listenOnDrained(cb: () => void): void; // TODO: return unsub function
// }

// export interface PeerChannelReciever {
//   listenOnMessage(cb: (message: PeerMessage) => void): void;
// }

// export interface PeerChannel extends PeerChannelSender, PeerChannelReciever {}

export type TransferStatus = "idle" | "transfer" | "done" | "aborted";

export type TransferStats = {
  currentIndex: number;
  totalFiles: number;
  transferredBytes: number;
  totalBytes: number;
};

export function zeroTransferStats(): TransferStats {
  return {
    currentIndex: 0,
    totalFiles: 0,
    transferredBytes: 0,
    totalBytes: 0,
  };
}

export type PreviewContent = {
  totalCount: number;
  totalBytes: number;
};

export type PeerMessage =
  | { type: "transfer-started" }
  | { type: "transfer-start" }
  | { type: "transfer-next-file"; name: string }
  | { type: "transfer-chunk"; value: Uint8Array }
  | { type: "transfer-stats"; value: TransferStats }
  | { type: "transfer-abort" }
  | { type: "transfer-done" }
  | { type: "preview-content"; value: PreviewContent };

// TODO: encode it simply with json
// if first byte starts with "c" -> its a chunk
// if with "{" -> its arbitrary json
export class TransferProtocol {
  static encode(message: PeerMessage): Uint8Array {
    function stringify(value: unknown) {
      return new TextEncoder().encode(JSON.stringify(value));
    }

    switch (message.type) {
      case "transfer-start":
        return new TextEncoder().encode("t0");
      case "transfer-started":
        return new TextEncoder().encode("t1");
      case "transfer-next-file":
        return new Uint8Array([
          ...new TextEncoder().encode("t6"),
          ...new TextEncoder().encode(message.name),
        ]);
      case "transfer-chunk":
        return new Uint8Array([
          ...new TextEncoder().encode("t2"),
          ...message.value,
        ]);
      case "transfer-stats":
        return new Uint8Array([
          ...new TextEncoder().encode("t3"),
          ...stringify([
            message.value.currentIndex,
            message.value.totalFiles,
            message.value.transferredBytes,
            message.value.totalBytes,
          ]),
        ]);
      case "transfer-abort":
        return new TextEncoder().encode("t4");
      case "transfer-done":
        return new TextEncoder().encode("t5");
      case "preview-content":
        return new Uint8Array([
          ...new TextEncoder().encode("p1"),
          ...stringify([message.value.totalCount, message.value.totalBytes]),
        ]);
    }
  }
  static decode(data: Uint8Array): PeerMessage {
    if (data.byteLength < 1) {
      throw new Error("Invalid length");
    }

    const decoder = new TextDecoder();
    const id = data.slice(0, 2);
    const type = decoder.decode(id);

    const rest = data.slice(2);
    function json() {
      return JSON.parse(decoder.decode(rest));
    }
    function string() {
      return decoder.decode(rest);
    }

    switch (type) {
      case "t0":
        return { type: "transfer-start" };
      case "t1":
        return { type: "transfer-started" };
      case "t6":
        return { type: "transfer-next-file", name: string() };
      case "t2":
        return { type: "transfer-chunk", value: rest };
      case "t3": {
        const [currentIndex, totalFiles, transferredBytes, totalBytes] = json();
        return {
          type: "transfer-stats",
          value: { currentIndex, totalFiles, transferredBytes, totalBytes },
        };
      }
      case "t4":
        return { type: "transfer-abort" };
      case "t5":
        return { type: "transfer-done" };
      case "p1": {
        const [totalFiles, totalBytes] = json();
        return {
          type: "preview-content",
          value: { totalCount: totalFiles, totalBytes },
        };
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }
}

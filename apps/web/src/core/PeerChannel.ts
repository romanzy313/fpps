export interface PeerChannelSender {
  isReady(): boolean;
  hasBackpressure(): boolean;
  send(message: PeerMessage): void;
  listenOnDrained(cb: () => void): void;
}

export interface PeerChannelReciever {
  listenOnData(cb: (message: PeerMessage) => void): void;
}

export interface PeerChannel extends PeerChannelSender, PeerChannelReciever {}

export type TransferStats = {
  currentIndex: number;
  totalFiles: number;
  transferredBytes: number;
  totalBytes: number;
  // speed can be here
};

export type PeerMessage =
  | {
      type: "ping";
    }
  | {
      type: "transfer-start";
      value: { totalFileCount: number; totalSizeBytes: number };
    }
  | { type: "transfer-chunk"; value: Uint8Array }
  | { type: "transfer-stats"; value: TransferStats }
  | { type: "transfer-aborted" }
  | { type: "transfer-done" };

export class TransferProtocol {
  static encode(message: PeerMessage): Uint8Array {
    switch (message.type) {
      case "ping":
        return new TextEncoder().encode("0");
      case "transfer-start":
        return new TextEncoder().encode(
          "1" +
            JSON.stringify([
              message.value.totalFileCount,
              message.value.totalSizeBytes,
            ]),
        );
      case "transfer-chunk":
        return new Uint8Array([
          ...new TextEncoder().encode("2"),
          ...message.value,
        ]);
      case "transfer-stats":
        return new Uint8Array([
          ...new TextEncoder().encode("3"),
          ...new TextEncoder().encode(
            JSON.stringify([
              message.value.currentIndex,
              message.value.totalFiles,
              message.value.transferredBytes,
              message.value.totalBytes,
            ]),
          ),
        ]);
      case "transfer-aborted":
        return new TextEncoder().encode("4");
      case "transfer-done":
        return new TextEncoder().encode("5");
    }
  }
  static decode(data: Uint8Array): PeerMessage {
    if (data.byteLength < 1) {
      throw new Error("Invalid length");
    }

    const decoder = new TextDecoder();
    const id = data.slice(0, 5);
    const type = decoder.decode(id);

    const rest = data.slice(1);
    function json() {
      return JSON.parse(decoder.decode(rest));
    }

    switch (type) {
      case "0":
        return { type: "ping" };
      case "1": {
        const [totalFileCount, totalSizeBytes] = json();
        return {
          type: "transfer-start",
          value: { totalFileCount, totalSizeBytes },
        };
      }
      case "2": {
        return { type: "transfer-chunk", value: rest };
      }
      case "3": {
        const [currentIndex, totalFiles, transferredBytes, totalBytes] = json();
        return {
          type: "transfer-stats",
          value: { currentIndex, totalFiles, transferredBytes, totalBytes },
        };
      }
      case "4": {
        return { type: "transfer-aborted" };
      }
      case "5": {
        return { type: "transfer-done" };
      }
      default:
        throw new Error("invalid payload type" + type);
    }
  }
}

import { decode, encode } from "json-or-binary";
import { PeerFiles } from "./Core";

export type PeerMessage =
  | {
      type: "ping";
      value: null;
    }
  | {
      type: "testMessage";
      value: string;
    }
  | {
      type: "filesUpdated";
      value: PeerFiles;
    };

export function peerMessageToBytes(data: PeerMessage): Uint8Array {
  return encode(data);
}

export function peerMessageFromBytes(data: Uint8Array): PeerMessage {
  return decode(data);
}

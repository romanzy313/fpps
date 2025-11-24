import { decode, encode } from "json-or-binary";
import type { PeerMessage } from "./types";

export function peerMessageToBytes(data: PeerMessage): Uint8Array {
  return encode(data);
}

export function peerMessageFromBytes(data: Uint8Array): PeerMessage {
  return decode(data);
}

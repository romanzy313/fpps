import { decode, encode } from "json-or-binary";
import type { PeerMessage } from "./types";

export function p2pToBytes(data: PeerMessage): Uint8Array {
  return encode(data);
}

export function p2pFromBytes(data: Uint8Array): PeerMessage {
  return decode(data);
}

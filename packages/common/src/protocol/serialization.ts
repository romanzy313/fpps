import { decode, encode } from "json-or-binary";
import type { ProtocolType } from "./types";

export function p2pToBytes(data: ProtocolType): Uint8Array {
  return encode(data);
}

export function p2pFromBytes(data: Uint8Array): ProtocolType {
  return decode(data);
}

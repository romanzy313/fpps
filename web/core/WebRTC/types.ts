import { ApplicationError } from "../ApplicationError";
import { PeerMessage } from "../protocol";

export type PeerConnectionStatus = "disconnected" | "connecting" | "connected";

export interface Signaler {
  start(): void;
  stop(): void;
  onMessage(cb: (msg: string) => void): void;
  onError(cb: (err: Error) => void): void;
  send(msg: string): void;
}

export interface PeerChannel {
  isReady(): boolean;
  listenOnMessage(cb: (msg: PeerMessage) => void): void;
  listenOnError(cb: (err: ApplicationError) => void): void;
  start(): void;
  stop(): void;

  write(msg: PeerMessage, cb?: () => void): boolean;
  writeAsync(msg: PeerMessage): Promise<void>;
  // writeWait(msg: PeerMessage): Promise<void> | null;
}

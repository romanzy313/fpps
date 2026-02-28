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
  hasBackpressure(): boolean;
  listenOnMessage(cb: (msg: PeerMessage) => void): void;
  listenOnDrain(cb: () => void): void;
  listenOnError(cb: (err: ApplicationError) => void): void;
  start(): void;
  stop(): void;

  write(msg: PeerMessage): void;
}

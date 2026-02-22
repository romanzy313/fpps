import { ApplicationError } from "../applicationError";
import { PeerMessage } from "../protocol";

export type PeerConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface Signaler {
  start(): void;
  stop(): void;
  onMessage(cb: (msg: string) => void): void;
  onError(cb: (err: Error) => void): void;
  send(msg: string): void;
}

export interface IPeerChannel {
  isReady(): boolean;
  hasBackpressure(): boolean;
  listenOnMessage(cb: (msg: PeerMessage) => void): void;
  listenOnDrain(cb: () => void): void;
  listenOnError(cb: (err: ApplicationError) => void): void;
  start(): void;
  stop(): void;

  // if true is returned, continue sending
  // if false is returned, backpressure is encountered. Backoff until drain event
  write(msg: PeerMessage): boolean;
}

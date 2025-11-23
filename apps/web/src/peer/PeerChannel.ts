type PeerConnectionStatus = "connected" | "connecting" | "disconnected";

export interface PeerChannel {
  connect(): Promise<void>;
  onConnectionStateChange(cb: (status: PeerConnectionStatus) => void): void;
  enqueue(message: ArrayBuffer): Promise<{
    success: boolean;
  }>; // if no success, the message needs to be enqueued again?
  read(): Promise<{
    done: boolean;
    data: ArrayBuffer;
  }>; // this works like a reader. what happens during disconnects?
}

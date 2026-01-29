import { PeerMessage, TransferProtocol } from "./PeerChannel";
import { IPeerChannel } from "./WebRTC/REWORK";

const maxPendingBytes = 1 << 18; // 256kb
const drainMs = 50;

class TestPeerChannel implements IPeerChannel {
  constructor(
    private parent: TestPeerChannels,
    private index: number,
  ) {}

  _ready = false;
  _pendingBytes = maxPendingBytes;

  _onDataCallback: ((message: PeerMessage) => void) | null = null;
  _onDrainedCallback: (() => void) | null = null;
  _receivedMessages: PeerMessage[] = [];
  _sendMessages: PeerMessage[] = [];

  start(): void {
    this._ready = true;
  }

  destroy(): void {
    this._ready = false;
  }

  isReady(): boolean {
    return this._ready;
  }

  hasBackpressure(): boolean {
    return this._pendingBytes < 0;
  }

  write(message: PeerMessage) {
    if (!this._ready) {
      throw new Error("Not ready");
    }

    const size = TransferProtocol.encode(message).byteLength;
    this._pendingBytes -= size;

    this._sendMessages.push(message);
    this.parent.peerSent(this.index, message);

    setTimeout(() => {
      this._pendingBytes += size;
    }, drainMs);

    const resume = !this.hasBackpressure();

    if (!resume) {
      console.log("UNDER BACKPRESSURE");
    }

    return resume;
  }

  listenOnDrain(cb: () => void): void {
    this._onDrainedCallback = cb;
  }

  listenOnMessage(cb: (message: PeerMessage) => void): void {
    this._onDataCallback = cb;
  }

  listenOnError(_: (err: Error) => void): void {
    //
  }
}

export class TestPeerChannels {
  private peers: [TestPeerChannel, TestPeerChannel];

  private latencyMs: number = 16.6;

  constructor(private backpressureChance: number) {
    this.peers = [new TestPeerChannel(this, 0), new TestPeerChannel(this, 1)];
    this.peers[0].start();
    this.peers[1].start();
  }

  private otherIndex(index: number): number {
    return index === 0 ? 1 : 0;
  }
  private getPeerIndex(id: "a" | "b"): 0 | 1 {
    return id === "a" ? 0 : 1;
  }

  getPeerChannel(id: "a" | "b"): TestPeerChannel {
    return this.peers[this.getPeerIndex(id)];
  }
  getSentMessages(id: "a" | "b"): PeerMessage[] {
    return this.peers[this.getPeerIndex(id)]._sendMessages;
  }
  getReceivedMessages(id: "a" | "b"): PeerMessage[] {
    return this.peers[this.getPeerIndex(id)]._receivedMessages;
  }

  peerSent(index: number, data: PeerMessage) {
    const otherPeer = this.peers[this.otherIndex(index)]!;
    setTimeout(() => {
      otherPeer._receivedMessages.push(data);
      if (otherPeer._onDataCallback) {
        otherPeer._onDataCallback(data);
      }
    }, this.latencyMs);
  }
}

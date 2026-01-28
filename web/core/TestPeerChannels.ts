import { PeerChannel, PeerMessage, TransferProtocol } from "./PeerChannel";

const maxPendingBytes = (1 << 15) * 3; // 32kb * 3
const drainMs = 5;

class TestPeerChannel implements PeerChannel {
  constructor(
    private parent: TestPeerChannels,
    private index: number,
  ) {}

  _prendingBytes = maxPendingBytes;

  _onDataCallback: ((message: PeerMessage) => void) | null = null;
  _onDrainedCallback: (() => void) | null = null;
  _receivedMessages: PeerMessage[] = [];
  _sendMessages: PeerMessage[] = [];

  isReady(): boolean {
    return true;
  }

  backpressureRemainingBytes(): number {
    return this._prendingBytes;
  }

  sendMessage(message: PeerMessage): void {
    const size = TransferProtocol.encode(message).byteLength;
    this._prendingBytes -= size;

    if (this._prendingBytes < 0) {
      throw new Error("buckled under backpressure");
    }

    this._sendMessages.push(message);
    this.parent.peerSent(this.index, message);

    setTimeout(() => {
      this._prendingBytes += size;
    }, drainMs);
  }

  listenOnDrained(cb: () => void): void {
    this._onDrainedCallback = cb;
  }

  listenOnMessage(cb: (message: PeerMessage) => void): void {
    this._onDataCallback = cb;
  }
}

export class TestPeerChannels {
  private peers: [TestPeerChannel, TestPeerChannel];

  private latencyMs: number = 16.6;

  constructor(private backpressureChance: number) {
    this.peers = [new TestPeerChannel(this, 0), new TestPeerChannel(this, 1)];
  }

  private otherIndex(index: number): number {
    return index === 0 ? 1 : 0;
  }
  private getPeerIndex(id: "a" | "b"): 0 | 1 {
    return id === "a" ? 0 : 1;
  }

  getPeerChannel(id: "a" | "b"): PeerChannel {
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

    // const thisPeer = this.peers[index]!;

    // if (
    //   !thisPeer._underBackpressure &&
    //   Math.random() < this.backpressureChance
    // ) {
    //   console.log("RANDOM BACKPRESSURE");
    //   const thisPeer = this.peers[index]!;
    //   thisPeer._underBackpressure = true;
    //   setTimeout(() => {
    //     thisPeer._underBackpressure = false;
    //     if (thisPeer._onDrainedCallback) {
    //       thisPeer._onDrainedCallback();
    //     }
    //   }, this.backpressureMs);
    // }
  }
}

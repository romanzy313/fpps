interface BackpressureWriter {
  // return false when backpressure is encountered
  // when false is returned, wait for onDrain callback to proceed
  write(data: Uint8Array): boolean;
  close(): void;

  readonly canWrite: boolean;

  onDrain: (() => void) | null;
  onError: ((error: Error) => void) | null;
}

// import Peer from "simple-peer";
import Peer from "peer-lite";
import { PeerMessage, TransferProtocol } from "../PeerChannel";
import { MultiSubscriber } from "../../utils/MultiSubscriber";
import { getIceServers } from "./iceServers";

// use SSE instead!
export interface Signaling {
  start(myId: string, peerId: string): void;
  stop(): void;
  onMessage(cb: (msg: string) => void): void;
  onError(cb: (err: Error) => void): void;
  send(msg: string): void;
}

function reworkSignaling() {
  // get is listen
  // post is to send. The url is used for the ID.
  const evtSource = new EventSource("sse-demo.php");
  evtSource.addEventListener("message", (ev) => {
    // ev.data -> string type
  });
  evtSource.close();
}

export interface IPeerChannel {
  isReady(): boolean;
  hasBackpressure(): boolean;
  listenOnMessage(cb: (msg: PeerMessage) => void): void;
  listenOnDrain(cb: () => void): void;
  listenOnError(cb: (err: Error) => void): void;
  start(): void;
  destroy(): void;

  // if true is returned, continue sending
  // if false is returned, backpressure is encountered. Backoff until drain event
  write(msg: PeerMessage): boolean;
}

type ConnOpts = {
  myId: string;
  peerId: string;
  isInitiator: boolean;
};

// encode it simply with json
// if first byte starts with "c" -> its a chunk
// if with "{" -> its arbitrary json

type UniversalSignal =
  | {
      type: "signal";
      value: RTCSessionDescriptionInit;
    }
  | {
      type: "candidate";
      value: RTCIceCandidate[];
    };

// this is destroyed on error!
// connects right away
export class BetterPeerChannel implements IPeerChannel {
  private peer: Peer | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private _isReady = false; // I dont like this
  private _destroyed = false;
  private onDrain: (() => void) | null = null;
  // value of permaError means that it is a permanent error, cannot be recovered
  // usually means that connection failed to be established due to privacy settings such as
  // disabled WebRTC, or no direction connections are allowed
  public onConnectionState:
    | ((state: "permaError" | "connecting" | "connected") => void)
    | null = null;
  public onError: ((err: Error) => void) | null = null;

  _messageSubscribers = new MultiSubscriber<PeerMessage>();

  constructor(
    private signaler: Signaling,
    private opts: ConnOpts,
  ) {}

  isReady(): boolean {
    return this._isReady;
  }

  listenOnMessage(cb: (msg: PeerMessage) => void) {
    this._messageSubscribers.subscribe(cb);
  }
  listenOnDrain(cb: () => void) {
    this.onDrain = cb;
  }
  listenOnError(cb: (err: Error) => void) {
    this.onError = cb;
  }

  start() {
    this.restart();

    // setInterval(() => {
    //   console.log("STATUS REPORT", {
    //     status: this.peer?.status(),
    //     readyState: this.dataChannel?.readyState,
    //   });
    // }, 3000);
  }

  hasBackpressure(): boolean {
    if (!this.dataChannel) {
      throw new Error("Assertion failed: no dataChannel");
    }
    const remaining =
      this.dataChannel.bufferedAmountLowThreshold -
      this.dataChannel.bufferedAmount;

    return remaining < 0;
  }

  write(msg: PeerMessage): boolean {
    if (!this.dataChannel) {
      throw new Error("Assertion failed: no dataChannel");
    }

    if (this.dataChannel.readyState !== "open") {
      console.error("dataChannel", { dataChannel: this.dataChannel });
      throw new Error("Assertion failed: dataChannel is not open");
    }

    const encoded = TransferProtocol.encode(msg);

    const continueWriting = !this.hasBackpressure();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dataChannel.send(encoded as any);

    return continueWriting;
  }

  private permanentError() {
    if (this.onConnectionState) {
      this.onConnectionState("permaError");
    }

    this.destroy();
  }

  private handleError(err: Error) {
    if (this.onError) {
      this.onError(err);
    }

    const isPerma = err.message.includes("PERMANENT");

    if (isPerma) {
      this.permanentError();
    } else {
      this.restart();
    }
  }

  destroy() {
    this._destroyed = true;
    this._isReady = false;
    this.signaler.stop();

    this.dataChannel?.close();
    this.dataChannel = null;
    this.peer?.destroy();
    this.peer = null;
  }

  private setupDataChannel() {
    const dataChannel = this.peer!.getDataChannel("TEST")!;
    console.log("PEER CHANNEL OPEN", {
      dataChannel,
    });

    dataChannel.binaryType = "arraybuffer";
    dataChannel.bufferedAmountLowThreshold = 1 << 20; // 1mb

    dataChannel.addEventListener("open", () => {
      console.log("DATACHANNEL OPENED");
      this._isReady = true;
      if (this.onConnectionState) {
        this.onConnectionState("connected");
      }

      this.signaler.stop();
    });

    dataChannel.addEventListener("close", () => {
      console.error("DATACHANNEL CLOSED", {
        dataChannel: dataChannel,
      });

      // FIXME: dont restart when close is desired
      if (!this._destroyed) {
        this.restart();
      }
    });
    dataChannel.addEventListener("error", (ev) => {
      console.error("DATACHANNEL ERROR", {
        error: ev.error,
      });

      // is this correct?
      // this.restart();
    });

    dataChannel.addEventListener("bufferedamountlow", () => {
      if (this.onDrain) {
        this.onDrain();
      }
    });

    this.dataChannel = dataChannel;
  }

  private restart() {
    this.destroy();

    this._destroyed = false; // hhh
    if (this.onConnectionState) {
      this.onConnectionState("connecting");
    }

    this.peer = new Peer({
      enableDataChannels: true,
      batchCandidates: false,
      config: {
        iceServers: getIceServers("Dev"),
      },
    });

    this.signaler.start(this.opts.myId, this.opts.peerId);

    this.peer.on("connected", () => {
      console.log("PEER CONNECTED");

      this.peer!.addDataChannel("TEST", {
        ordered: true,
        maxRetransmits: undefined,
      });

      this.setupDataChannel();
    });

    this.peer.on("disconnected", () => {
      // TODO: careful!
      console.log("PEER DISCONNECTED");
    });

    this.peer.on("error", (err) => {
      this.handleError(new Error(err.message));
    });
    this.signaler.onError((err) => {
      this.handleError(err);
    });

    this.signaler.onMessage((data) => {
      const { type, value }: UniversalSignal = JSON.parse(data);

      if (type === "signal") {
        this.peer!.signal(value);
      } else {
        for (const cand of value) {
          this.peer!.addIceCandidate(cand);
        }
      }
    });

    this.peer.on("signal", (signal) => {
      const universal: UniversalSignal = {
        type: "signal",
        value: signal,
      };

      this.signaler.send(JSON.stringify(universal));
    });
    this.peer.on("onicecandidates", (conds) => {
      const universal: UniversalSignal = {
        type: "candidate",
        value: conds,
      };
      this.signaler.send(JSON.stringify(universal));
    });

    // this.peer.on("channelOpen", ({ channel: dataChannel }) => {
    //   if (dataChannel.label !== "TEST") {
    //     return;
    //   }

    // });

    this.peer.on("channelData", (ev) => {
      if (ev.source !== "incoming") {
        console.warn("WHY OUTGOING IS HERE?", { ev });
      }

      const data = new Uint8Array(ev.data as ArrayBuffer);

      const decoded = TransferProtocol.decode(data);

      // console.log("RECIEVED A MESSAGE", { decoded, data, ev });

      this._messageSubscribers.notifyListeners(decoded);
    });

    this.peer.start({
      polite: this.opts.isInitiator,
    });
  }
}

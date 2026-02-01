import Peer from "peer-lite";
import { PeerMessage, TransferProtocol } from "../PeerChannel";
import { MultiSubscriber } from "../../utils/MultiSubscriber";
import { getIceServers } from "./iceServers";
import { IPeerChannel, Signaler } from "./types";
import { ApplicationError, convertError } from "../applicationError";
import { EventEmitterAsyncResource } from "node:events";

type ConnOpts = {
  myId: string;
  peerId: string;
  isInitiator: boolean;
};

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
  private _intentionallyStopped = false;
  private _errored = false;
  private onDrain: (() => void) | null = null;
  // value of permaError means that it is a permanent error, cannot be recovered
  // usually means that connection failed to be established due to privacy settings such as
  // disabled WebRTC, or no direction connections are allowed
  public onConnectionState:
    | ((state: "error" | "connecting" | "connected") => void)
    | null = null;

  _errorSubscribers = new MultiSubscriber<ApplicationError>();

  _messageSubscribers = new MultiSubscriber<PeerMessage>();

  constructor(
    private signaler: Signaler,
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
  listenOnError = this._errorSubscribers.subscribe;
  // listenOnError(cb: (err: Error) => void) {
  //   this.onError = cb;
  // }

  start() {
    if (this._errored) {
      throw new Error("Cannot start when errored");
    }

    this._reset();
    this._intentionallyStopped = false;

    this.restart();

    // setInterval(() => {
    //   console.log("STATUS REPORT", {
    //     status: this.peer?.status(),
    //     readyState: this.dataChannel?.readyState,
    //   });
    // }, 3000);
  }

  stop() {
    this._reset();
    this._intentionallyStopped = true;
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

  private handleError(anyError: unknown) {
    const applicationError = convertError(anyError);

    this._errorSubscribers.notify(applicationError);

    if (applicationError.fatal) {
      if (this.onConnectionState) {
        this.onConnectionState("error");
      }

      this._errored = true;
      this._reset();
    } else {
      this.restart();
    }
  }

  private _reset() {
    this._isReady = false;
    this.signaler.stop();

    this.dataChannel?.close();
    this.dataChannel = null;
    this.peer?.destroy();
    this.peer = null;
  }

  // TODO: need to have a function to fully disconnect and cleanup
  // no reconnections!
  dispose() {
    throw new Error("TODO");
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

      // TODO: make sure this works
      if (!this._intentionallyStopped) {
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
    if (this._errored) {
      throw new Error("Cannot restart as rtc is errored");
    }

    this._reset();

    if (this.onConnectionState) {
      this.onConnectionState("connecting");
    }

    try {
      this.peer = new Peer({
        enableDataChannels: true,
        batchCandidates: true,
        config: {
          iceServers: getIceServers("Dev"),
        },
      });
    } catch (err) {
      this.handleError(err);

      return;
    }

    this.signaler.start();

    this.peer.on("connected", () => {
      console.log("PEER CONNECTED");

      this.peer!.addDataChannel("TEST", {
        ordered: true,
        maxRetransmits: undefined,
        id: 99,
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

    this.signaler.onMessage(async (data) => {
      const { type, value }: UniversalSignal = JSON.parse(data);

      if (type === "signal") {
        this.peer!.signal(value);
      } else {
        for (const cand of value) {
          try {
            await this.peer!.addIceCandidate(cand);
          } catch (err) {
            // notmal due to async candidate exchange
            console.warn("addIceCandidate error", err);
          }
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

      this._messageSubscribers.notify(decoded);
    });

    this.peer.start({
      // no politeness, as apps start offline
      // polite: this.opts.isInitiator,
    });
  }
}

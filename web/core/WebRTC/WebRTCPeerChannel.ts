import Peer from "peer-lite";
import { PeerMessage, TransferProtocol } from "../protocol";
import { MultiSubscriber } from "../../utils/MultiSubscriber";
import { getIceServers } from "./iceServers";
import { PeerChannel, PeerConnectionStatus, Signaler } from "./types";
import {
  ApplicationError,
  applicationErrorFromUnknown,
  FatalError,
  RestarableError,
} from "../ApplicationError";
import { Encryptor } from "../../utils/encryption";
import { Err } from "../../helpers";

const RECONNECT_DELAY = 1_000;

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
export class WebRTCPeerChannel implements PeerChannel {
  private peer: Peer | null = null;
  private dataChannel: RTCDataChannel | null = null;

  // there are too many flags here
  private _isReady = false; // can data be sent? this is not too reliable for now
  private _errored = false; // did critical error occur

  private onDrain: (() => void) | null = null;
  // value of permaError means that it is a permanent error, cannot be recovered
  // usually means that connection failed to be established due to privacy settings such as
  // disabled WebRTC, or no direction connections are allowed
  public onConnectionState: ((state: PeerConnectionStatus) => void) | null =
    null;

  _errorSubscribers = new MultiSubscriber<ApplicationError>();

  _messageSubscribers = new MultiSubscriber<PeerMessage>();

  constructor(
    private signaler: Signaler,
    private encryptor: Encryptor,
    private backpressureAmount: number = 1 << 20, // 1mb by default
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

  start() {
    if (this._errored) {
      throw new Error("Cannot start when errored");
    }

    this._reset();

    this.restart();
  }

  stop() {
    console.warn("Datachannel was requested to stop!");
    this._reset();
  }

  hasBackpressure(): boolean {
    if (!this.dataChannel) {
      return false;
      // throw new Error("Assertion failed: no dataChannel");
    }
    const remaining =
      this.dataChannel.bufferedAmountLowThreshold -
      this.dataChannel.bufferedAmount;

    return remaining <= 0;
  }

  // returns true if writing can continue
  write(msg: PeerMessage): boolean {
    if (!this.dataChannel) {
      this.handleError(
        new FatalError("Data channel does not exist", "connection_interrupted"),
      );
      console.error("dataChannel 1", { dataChannel: this.dataChannel });

      return false;
    }

    if (this.dataChannel.readyState !== "open") {
      this.handleError(
        new FatalError(
          "WebRTC connection is not open",
          "connection_interrupted",
        ),
      );
      console.error("dataChannel 2", { dataChannel: this.dataChannel });
      return false;
    }

    const encoded = TransferProtocol.encode(msg);

    const shouldContinue = !this.hasBackpressure();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dataChannel.send(encoded as any);

    return shouldContinue;
  }

  private handleError(anyError: unknown): void {
    const applicationError = applicationErrorFromUnknown(anyError);

    if (applicationError instanceof RestarableError) {
      console.error("RestartableError on peer connection", {
        error: applicationError,
      });
      // TODO: data-channel-failure is something that happens in the end...
      // need to reconnect
      return; //when channel is closed, it will reconnect by itself
    }
    this._errorSubscribers.notify(applicationError);

    // TODO: sometimes this will reconnect forever?
    // if (applicationError instanceof RestarableError) {
    //   return this.restart();
    // }

    this._errored = true;
    this._reset();
  }

  private _reset() {
    console.warn("datachannel is reset!");
    this._isReady = false;
    this.signaler.stop();

    if (this.onConnectionState) {
      this.onConnectionState("disconnected");
    }

    this.dataChannel?.close();
    this.dataChannel = null;
    this.peer?.destroy();
    this.peer = null;
  }

  dispose() {
    console.warn("datachannel is disposed!");

    this._reset();
    this._messageSubscribers.dispose();
    this._errorSubscribers.dispose();
  }

  private setupDataChannel() {
    const dataChannel = this.peer!.getDataChannel("fpps")!;

    dataChannel.binaryType = "arraybuffer";
    dataChannel.bufferedAmountLowThreshold = this.backpressureAmount;

    dataChannel.addEventListener("open", () => {
      console.log("DATACHANNEL OPENED", {
        dataChannel,
      });
      this._isReady = true;
      if (this.onConnectionState) {
        this.onConnectionState("connected");
      }

      this.signaler.stop();
    });

    dataChannel.addEventListener("close", () => {
      if (this.onConnectionState) {
        this.onConnectionState("disconnected");
      }

      console.error("DATACHANNEL CLOSED", {
        dataChannel,
      });
    });
    dataChannel.addEventListener("error", (ev) => {
      console.error("DATACHANNEL ERROR", {
        error: ev.error,
      });

      this.handleError(ev.error);
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
      return;
    }

    this._reset();

    try {
      this.peer = new Peer({
        enableDataChannels: true,
        batchCandidates: true,
        config: {
          iceServers: getIceServers(),
        },
      });
    } catch (err) {
      this.handleError(err);

      return;
    }

    this.signaler.start();

    this.peer.on("connected", () => {
      console.log("PEER CONNECTED");

      this.peer!.addDataChannel("fpps", {
        ordered: true,
        maxRetransmits: undefined,
        id: 99,
      });

      this.setupDataChannel();
    });

    this.peer.on("disconnected", () => {
      console.log("PEER DISCONNECTED");
      if (this.onConnectionState) {
        this.onConnectionState("disconnected");
      }

      setTimeout(() => {
        this.restart();
      }, RECONNECT_DELAY);
    });

    this.peer.on("error", (err) => {
      console.log("PEER ERROR");
      this.handleError(new Error(err.message));
    });
    this.signaler.onError((err) => {
      console.log("SIGNALING ERROR", { err });
      this.handleError(err);
    });

    this.signaler.onMessage(async (encrypted) => {
      if (!this._isReady) {
        if (this.onConnectionState) {
          this.onConnectionState("connecting");
        }
      }

      const { type, value } = (await this.encryptor.decrypt(
        encrypted,
      )) as UniversalSignal;

      if (type === "signal") {
        try {
          this.peer!.signal(value);
        } catch (err) {
          console.warn("Peer failed to signal", err);
        }
      } else {
        for (const cand of value) {
          try {
            await this.peer!.addIceCandidate(cand);
          } catch (err) {
            // normal due to async candidate exchange
            console.warn("addIceCandidate error", err);
          }
        }
      }
    });

    this.peer.on("signal", async (signal) => {
      const universal: UniversalSignal = {
        type: "signal",
        value: signal,
      };

      const encrypted = await this.encryptor.encrypt(universal);

      this.signaler.send(encrypted);
    });
    this.peer.on("onicecandidates", async (conds) => {
      const universal: UniversalSignal = {
        type: "candidate",
        value: conds,
      };

      const encrypted = await this.encryptor.encrypt(universal);

      this.signaler.send(encrypted);
    });

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
    });
  }
}

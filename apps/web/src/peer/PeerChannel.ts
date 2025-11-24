import { P2PSignalingPayload } from "@fpps/common";
import { RoomParams } from "../utils/roomParams";
import { SignalingApi } from "./SignalingApi";

type PeerConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";
// | "closed";

// this could be a bad idea...
// use a closer api... no async iterators, pure callback goodness
// export interface PeerChannel {
//   connect(roomParams: RoomParams): Promise<void>;
//   onConnectionStateChange(cb: (status: PeerConnectionStatus) => void): void;
//   enqueue(message: ArrayBuffer): Promise<{
//     success: boolean;
//   }>; // if no success, the message needs to be enqueued again?
//   read(): Promise<{
//     done: boolean;
//     data: ArrayBuffer;
//   }>; // this works like a reader. what happens during disconnects?
// }

export const publicGoogleStunServers = ["stun:stun.l.google.com:19302"];
export const devStunServers = ["stun:localhost:3478"];

export interface PeerConnectionOptions {
  iceServerUris: string[][]; // TODO: use sensible free ICE servers https://www.metered.ca/blog/list-of-webrtc-ice-servers/
}

export type PeerChannelCallbacks = {
  onConnectionStateChange: (status: PeerConnectionStatus) => void;
  // onMessageReceived: (message: ArrayBuffer) => void;
  onMessageReceived: (message: Uint8Array) => void;
  onDataDrained: () => void;
  onError: (message: string) => void;
};

// TODO: will reconnects need to recreate SignalingApi?
// TODO: can implement the perfect negotication pattern as documented here:
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
// the initiator can be impolite, while the joiner is polite
// It works okay right now, but sometimes requires a refresh
export class PeerChannelImpl {
  private pc: RTCPeerConnection | null = null;
  private _signalingApi: SignalingApi | null = null;
  private dataChannel: RTCDataChannel | null = null;

  constructor(
    private roomParams: RoomParams,
    private callbacks: PeerChannelCallbacks,
    private options: PeerConnectionOptions,
  ) {}

  private get signalingApiMust() {
    if (!this._signalingApi) {
      throw new Error("Signaling API is not initialized");
    }
    return this._signalingApi;
  }

  private destroySignalingApi() {
    if (!this._signalingApi) {
      return;
    }
    this._signalingApi.stop();
    this._signalingApi = null;
  }

  private init() {
    this.close();

    // init things
    this.pc = new RTCPeerConnection({
      iceServers: this.options.iceServerUris.map((url) => ({ urls: url })),
    });
    this.setupPeerConnection();
    this._signalingApi = new SignalingApi(
      this.roomParams,
      (p2pSignalingPayload) => {
        this.handleSignalingMessage(p2pSignalingPayload);
      },
    );
    this._signalingApi.start();
  }

  async connect() {
    this.init();

    if (this.roomParams.isInitiator) {
      this.dataChannel = this.pc!.createDataChannel("data", {
        ordered: true, // Ensure ordered delivery
        maxRetransmits: undefined, // Reliable delivery
      });
      this.setupDataChannel();

      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);

      this.signalingApiMust.send({
        type: "offer",
        sdp: offer.sdp!,
      });
    } else {
      // no nothing?
    }
  }

  private setupPeerConnection() {
    if (!this.pc) {
      throw new Error("PeerConnection is not initialized");
    }
    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingApiMust.send({
          type: "ice-candidate",
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle incoming data channel (for non-initiator)
    this.pc.ondatachannel = (event) => {
      console.log("Received data channel");
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.pc.onconnectionstatechange = () => {
      console.log("Connection state:", this.pc!.connectionState);

      let newState: PeerConnectionStatus = "disconnected";

      switch (this.pc!.connectionState) {
        case "connected":
          newState = "connected";
          this.destroySignalingApi();
          break;
        case "disconnected":
          newState = "disconnected";
          break;
        case "failed":
          newState = "failed";
          this.connect(); // for now, use the failed state as need to reconnect
          break;
        case "closed":
          newState = "disconnected";
          // what to do with signaling api here?
          break;
        case "connecting":
          newState = "connecting";
          // what to do with signaling api here?
          break;
        case "new":
          console.warn("Ignoring new connection state");
          break;
      }

      this.callbacks.onConnectionStateChange(newState);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.pc!.iceConnectionState);
    };
  }

  private setupDataChannel() {
    if (!this.dataChannel) {
      throw new Error("Data channel not initialized");
    }
    this.dataChannel.binaryType = "arraybuffer";
    this.dataChannel.bufferedAmountLowThreshold = 1 << 15; // 32 KiB as example threshold

    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
    };

    this.dataChannel.onmessage = (event) => {
      console.log("Received message:", event.data);
      this.callbacks.onMessageReceived(event.data);
    };

    this.dataChannel.onbufferedamountlow = () => {
      console.log("Buffered amount low, it was drained, resume sending");
      this.callbacks.onDataDrained();
    };

    this.dataChannel.onerror = (event) => {
      console.error("Data channel error event:", event);

      this.callbacks.onError(event.error.message);
    };

    this.dataChannel.onclose = () => {
      // if this was intentional, then close. Otherwise try to connect
      console.log("Data channel closed");
    };
  }

  private async handleSignalingMessage(payload: P2PSignalingPayload) {
    try {
      switch (payload.type) {
        case "offer":
          await this.handleOffer(payload.sdp);
          break;
        case "answer":
          await this.handleAnswer(payload.sdp);
          break;
        case "ice-candidate":
          await this.handleIceCandidate(payload.candidate);
          break;
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
    }
  }

  private async handleOffer(sdp: string) {
    await this.pc!.setRemoteDescription({
      type: "offer",
      sdp,
    });

    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);

    this.signalingApiMust.send({
      type: "answer",
      sdp: answer.sdp!,
    });
  }

  private async handleAnswer(sdp: string) {
    await this.pc!.setRemoteDescription({
      type: "answer",
      sdp,
    });
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  // sends data to the peer. If false it returned, it means that the sender
  // must retry sending. Ideally they should wait for the backpressure to go away
  send(data: Uint8Array): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.error("Data channel is not open");
      return false;
    }
    if (
      this.dataChannel.bufferedAmount >
      this.dataChannel.bufferedAmountLowThreshold
    ) {
      console.log("Data channel is full, try again later");
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dataChannel.send(data as any);

    return true;
  }

  close() {
    if (this.pc) {
      this.pc.close();
      this.dataChannel = null;
      this.pc = null;
    }
    // TODO: also set this.pc to null
    this.destroySignalingApi();
  }

  getStats(): Promise<RTCStatsReport | null> {
    return this.pc?.getStats() ?? Promise.resolve(null);
  }
}

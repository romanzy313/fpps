import { RoomParams } from "../../utils/roomParams";
import { PeerChannel, PeerMessage, TransferProtocol } from "../PeerChannel";
import { SignalingApi } from "./SignalingApi";
import { MultiSubscriber } from "../../utils/MultiSubscriber";
import { SignalingPayload } from "./api";

const BACKPRESSURE_THRESHOLD = 1 << 20; // 1 Mb
// const BACKPRESSURE_THRESHOLD = 1 << 15; // 32kb

export type PeerConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export interface PeerConnectionOptions {
  roomParams: RoomParams;
  iceServers: RTCIceServer[]; // TODO: use sensible free ICE servers https://www.metered.ca/blog/list-of-webrtc-ice-servers/
}

export type PeerChannelCallbacks = {
  onConnectionStateChange: (status: PeerConnectionStatus) => void;
  onError: (error: Error) => void;
};

export class WebRTCPeerChannelManager {
  private pc: RTCPeerConnection | null = null;
  private signalingApi: SignalingApi | null = null;
  private dataChannel: RTCDataChannel | null = null;

  private peerPingTimeout: NodeJS.Timeout | null = null;
  private myPingInterval: NodeJS.Timeout | null = null;

  private connectionStatus: PeerConnectionStatus = "disconnected";
  _messageSubscribers = new MultiSubscriber<PeerMessage>();
  _drainSubscribers = new MultiSubscriber<void>();

  private peerChannel = new WebRTCPeerChannel(this);

  constructor(
    private options: PeerConnectionOptions,
    private callbacks: PeerChannelCallbacks,
  ) {}

  dispose() {
    this._messageSubscribers.dispose();
    this._drainSubscribers.dispose();
    this.close();
  }

  getPeerChannel(): PeerChannel {
    return this.peerChannel;
  }

  getRTCStats(): Promise<RTCStatsReport | null> {
    return this.pc?.getStats() ?? Promise.resolve(null);
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  private setConnectionStatus(status: PeerConnectionStatus) {
    this.connectionStatus = status;
    this.callbacks.onConnectionStateChange(status);
  }

  async connect() {
    this.init();

    if (this.options.roomParams.isInitiator) {
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
      // need to resend the offer somehow, as these values can expire
      // this will be useful for polite sending
    }
  }

  _send(data: PeerMessage) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.error("WHAT WAS ATTEMPTED TO SEND", data);
      throw new Error("Cannot send: data channel is not open");
    }
    const encoded = TransferProtocol.encode(data);

    const arrayBuffer = encoded.buffer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dataChannel.send(arrayBuffer as any);
  }

  get _hasBackpressure() {
    if (!this.dataChannel) {
      throw new Error("Cannot check backpressure: data channel is not open");
    }
    const hasBackpressure =
      this.dataChannel.bufferedAmount >
      this.dataChannel.bufferedAmountLowThreshold;

    if (hasBackpressure) {
      console.warn("Backpressure encountered");
    }

    return hasBackpressure;
  }

  _canSend(): boolean {
    const isDatachannelOpen =
      this.dataChannel !== null && this.dataChannel.readyState === "open";

    return isDatachannelOpen;
  }

  private close() {
    if (this.pc) {
      this.pc.close(); // this closes the data channel too?!
      this.dataChannel = null;
      this.pc = null;
    }
    this.destroySignalingApi();

    if (this.myPingInterval) {
      clearInterval(this.myPingInterval);
      this.myPingInterval = null;
    }
    if (this.peerPingTimeout) {
      clearTimeout(this.peerPingTimeout);
      this.peerPingTimeout = null;
    }
  }

  private get signalingApiMust() {
    if (!this.signalingApi) {
      throw new Error("Signaling API is not initialized");
    }
    return this.signalingApi;
  }

  private destroySignalingApi() {
    if (!this.signalingApi) {
      return;
    }
    this.signalingApi.stop();
    this.signalingApi = null;
  }

  private init() {
    this.close();

    // init things
    this.pc = new RTCPeerConnection({
      iceServers: this.options.iceServers,
    });
    this.setupPeerConnection();
    this.signalingApi = new SignalingApi(
      this.options.roomParams,
      (p2pSignalingPayload) => {
        this.handleSignalingMessage(p2pSignalingPayload);
      },
    );
    this.signalingApi.start();
  }

  private setupPeerConnection() {
    if (!this.pc) {
      throw new Error("PeerConnection is not initialized");
    }
    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (!event.candidate) {
        console.log("ICE candidate gathering complete.");
        return;
      }

      console.log("Candidate found:", event.candidate.candidate);

      // Detect STUN (srflx) or TURN (relay) candidates
      if (event.candidate.type === "srflx") {
        console.log(
          "✅ STUN server is reachable. Public IP:",
          event.candidate.address,
        );
      } else if (event.candidate.type === "relay") {
        console.log(
          "✅ TURN server is working. Relay address:",
          event.candidate.address,
        );
      }

      this.signalingApiMust.send({
        type: "ice-candidate",
        candidate: event.candidate.toJSON(),
      });
    };

    // Handle incoming data channel (for non-initiator)
    this.pc.ondatachannel = (event) => {
      console.log("Received data channel");
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.pc.onconnectionstatechange = () => {
      console.log("Connection status:", this.pc!.connectionState);

      let newStatus: PeerConnectionStatus = "disconnected";

      switch (this.pc!.connectionState) {
        case "connected":
          this.destroySignalingApi();
          newStatus = "connecting"; // still need to wait for the data channel to open
          break;
        case "disconnected":
          newStatus = "disconnected";
          break;
        case "failed":
          newStatus = "failed";
          // this could be ICE type of failure... dont use it for reconnects
          this.connect();
          break;
        case "closed":
          newStatus = "disconnected";
          // what to do with signaling api here?
          break;
        case "connecting":
          newStatus = "connecting";
          break;
        case "new":
          console.warn("Ignoring new connection state");
          break;
      }

      this.setConnectionStatus(newStatus);
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
    this.dataChannel.bufferedAmountLowThreshold = BACKPRESSURE_THRESHOLD; // 32 KiB as example threshold

    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
      this.callbacks.onConnectionStateChange("connected");
    };

    this.dataChannel.onmessage = (event) => {
      // convert to Uint8Array
      const uint8Array = new Uint8Array(event.data);

      const decoded = TransferProtocol.decode(uint8Array);
      this._messageSubscribers.notifyListeners(decoded);
    };

    this.dataChannel.onbufferedamountlow = () => {
      console.log("Buffered amount low, it was drained, resume sending");
      this._drainSubscribers.notifyListeners();
    };

    this.dataChannel.onerror = (event) => {
      this.callbacks.onError(event.error);
    };

    this.dataChannel.onclose = () => {
      // TODO: will always start to reconnect
      console.log("Data channel closed");
    };
  }

  private async handleSignalingMessage(payload: SignalingPayload) {
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
      console.error("WEBRTC Error handling signaling message!!! :", error);
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
}

export class WebRTCPeerChannel implements PeerChannel {
  constructor(private manager: WebRTCPeerChannelManager) {}

  isReady(): boolean {
    return this.manager._canSend();
  }
  hasBackpressure(): boolean {
    return this.manager._hasBackpressure;
  }
  sendMessage(message: PeerMessage): void {
    this.manager._send(message);
  }
  listenOnDrained(cb: () => void): void {
    this.manager._drainSubscribers.subscribe(cb);
  }
  listenOnMessage(cb: (message: PeerMessage) => void): void {
    this.manager._messageSubscribers.subscribe(cb);
  }
}

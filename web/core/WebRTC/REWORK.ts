interface BackpressureWriter {
  // return false when backpressure is encountered
  // when false is returned, wait for onDrain callback to proceed
  write(data: Uint8Array): boolean;
  close(): void;

  readonly canWrite: boolean;

  onDrain: (() => void) | null;
  onError: ((error: Error) => void) | null;
}

import Peer from "simple-peer";
import { PeerMessage, TransferProtocol } from "../PeerChannel";

// use SSE instead!
export interface Signaling {
  start(myId: string, peerId: string): void;
  stop(): void;
  onMessage(cb: (msg: string) => void): void;
  onError(cb: (err: Error) => void): void;
  send(msg: string): void;
}

function usingSimplePeer() {
  const signaler: Signaling = null as any;
  var peer = new Peer({
    initiator: true,
    channelConfig: {
      ordered: true,
      maxRetransmits: undefined,
    },
  });

  signaler.start("MYID", "PEERID");

  function anyError(err: Error) {
    signaler.stop();
    peer.end();
  }

  peer.on("error", (err) => {
    // peer error
  });
  signaler.onError((err) => {});

  signaler.onMessage((data) => {
    const decoded = JSON.parse(data);
    peer.signal(decoded);
  });

  peer.on("signal", (data) => {
    // when peer1 has signaling data, give it to peer2 somehow
    signaler.send(JSON.stringify(data));
  });
  peer.on("connect", () => {
    signaler.stop();
    // wait for 'connect' event before using the data channel

    if (!peer.write("hello")) {
      peer.once("drain", () => {});
    }

    peer.send("hey peer2, how is it going?");
  });

  peer.on("data", (data) => {
    // got a data channel message
    console.log("got a message from peer1: " + data);
  });

  function write(data: Uint8Array, onDrain: () => void) {
    if (!peer.write(data)) {
      peer.once("drain", onDrain);
    }
  }

  return {
    write,
  };
}

async function pair() {
  type bacd = {
    pp: ReadableWritablePair;
  };
  const aaa: bacd = null as any;

  await aaa.pp.writable.getWriter().write("asdasd");
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

type ConnOpts = {
  myId: string;
  peerId: string;
  isInitiator: boolean;
};

// encode it simply with json
// if first byte starts with "c" -> its a chunk
// if with "{" -> its arbitrary json

// this is destroyed on error!
// connects right away
export class BetterWebRTC {
  private peer: Peer.Instance | null = null;
  public onDrain: (() => void) | null = null;
  // value of permaError means that it is a permanent error, cannot be recovered
  // usually means that connection failed to be established due to privacy settings such as
  // disabled WebRTC, or no direction connections are allowed
  public onConnectionState:
    | ((state: "permaError" | "connecting" | "connected") => void)
    | null = null;
  public onError: ((err: Error) => void) | null = null;
  public onMessage: ((msg: PeerMessage) => void) | null = null;

  constructor(
    private signaler: Signaling,
    private opts: ConnOpts,
  ) {}

  start() {
    this.restart();
  }

  private permanentError() {
    if (this.onConnectionState) {
      this.onConnectionState("permaError");
    }

    this.destroy();
  }

  private onRestarableError(err: Error) {
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

  private destroy() {
    this.signaler.stop();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  private restart() {
    if (this.onConnectionState) {
      this.onConnectionState("connecting");
    }

    this.destroy();

    this.peer = new Peer({
      initiator: this.opts.isInitiator,
      channelConfig: {
        ordered: true,
        maxRetransmits: undefined,
      },
    });
    this.signaler.start(this.opts.myId, this.opts.peerId);

    this.peer.on("error", (err) => {
      this.onRestarableError(err);
    });
    this.signaler.onError((err) => {
      this.onRestarableError(err);
    });

    this.signaler.onMessage((data) => {
      const decoded = JSON.parse(data);
      this.peer!.signal(decoded);
    });

    this.peer.on("signal", (data) => {
      // when peer1 has signaling data, give it to peer2 somehow
      this.signaler.send(JSON.stringify(data));
    });
    this.peer.on("connect", () => {
      if (this.onConnectionState) {
        this.onConnectionState("connected");
      }

      this.signaler.stop();
    });

    this.peer.on("data", (data) => {
      const decoded = TransferProtocol.decode(data);

      if (this.onMessage) {
        this.onMessage(decoded);
      }
    });

    // OR this.peer.on("resume", () => {});
    this.peer.on("drain", () => {
      if (this.onDrain) {
        this.onDrain();
      }
    });
  }

  // writing sends the payload, not the raw DATA!
  write(msg: PeerMessage): boolean {
    const encoded = TransferProtocol.encode(msg);

    return this.peer!.write(encoded);
  }
}

import { useSyncExternalStore } from "preact/compat";
import {
  PeerChannelImpl,
  PeerConnectionOptions,
  PeerConnectionStatus,
} from "./PeerChannel";
import { RoomParams } from "../utils/roomParams";
import {
  PeerMessage,
  peerMessageFromBytes,
  peerMessageToBytes,
} from "./peerMessage";
import { secureId } from "../utils/secureId";

export type FileItem = {
  path: string;
  name: string;
  sizeBytes: number;
};

export type PeerFiles = {
  id: string;
  items: FileItem[];
};

export type PeerConnectionState =
  | "online"
  | "offline"
  | "connecting"
  | "reconnecting";

// core implementation, like a room manager. Name TDB
export class Core {
  private peerChannel: PeerChannelImpl;
  // this should be a signal?
  connectionState: ReactSubscribable<PeerConnectionState>;

  private filesToUpload: File[] = [];
  myFiles: PeerFiles = {
    id: secureId(),
    items: [],
  };
  peerFiles: PeerFiles = {
    id: secureId(),
    items: [],
  };
  // connect on constructor
  constructor(roomParams: RoomParams, options: PeerConnectionOptions) {
    this.peerChannel = new PeerChannelImpl(
      roomParams,
      {
        onConnectionStateChange: this.onConnectionStateChange.bind(this),
        onMessageReceived: this.onMessageReceived.bind(this),
        onError: (errMessage) => {
          // this needs to be merged with failed connection state?
          // or can these errors be ignored?
          console.error("PEERCHANNEL ERROR encountered", errMessage);
        },
        onDataDrained: this.onDataDrained.bind(this),
        sendPing: this.sendPing.bind(this),
      },
      options,
    );
    this.connectionState = new ReactSubscribable<PeerConnectionState>(
      "offline",
    );
    this.peerChannel.connect();
  }

  public dispose() {
    this.peerChannel.close();
  }

  // public functions
  public addFiles(files: File[]) {
    this.filesToUpload.push(...files);

    const parsedFiles = files.map(parseFile);
    this.myFiles.id = secureId();
    this.myFiles.items = [...this.myFiles.items, ...parsedFiles];

    if (this.peerChannel.canSend) {
      // then send updated data
      this.sendToPeer({ type: "filesUpdated", value: this.myFiles });
    }
  }

  public startDownload() {
    // this needs to send message to another peer to start the upload
    console.log("Starting download of ", this.peerFiles.items);
  }

  private sendToPeer(message: PeerMessage) {
    return this.peerChannel.send(peerMessageToBytes(message), {
      useBackpressure: false,
    });
  }
  private sendToPeerWithBackpressure(message: PeerMessage) {
    return this.peerChannel.send(peerMessageToBytes(message), {
      useBackpressure: true,
    });
  }

  private onConnectionStateChange(status: PeerConnectionStatus) {
    if (status === "connected") {
      this.connectionState.set("online");
      // send out initial message

      // connected does not mean that data channel is open!

      this.sendToPeer({
        type: "filesUpdated",
        value: this.myFiles,
      });
    } else if (status === "failed") {
      this.connectionState.set("reconnecting");
      // issue a reconnect
      // this logic should really be inside the peer channel. Automatic reconnects are a thing sendToPeerWithBackpressure
      // the ping pong is handled here though?
      this.peerChannel.connect();
    } else if (status === "connecting") {
      this.connectionState.set("connecting");
    } else if (status === "disconnected") {
      this.connectionState.set("offline");
    } else {
      throw new Error(`Unknown connection status: ${status}`);
    }

    // also, the connection state must be shown to UI
  }

  private onMessageReceived(raw: Uint8Array) {
    const message = peerMessageFromBytes(raw);

    switch (message.type) {
      case "ping":
        this.peerChannel.recievedPing();
        break;
      case "filesUpdated":
        this.peerFiles = message.value;
        console.log("peer said the files are", {
          id: this.peerFiles.id,
          count: this.peerFiles.items.length,
        });
        break;
      case "testMessage":
        console.log("Received test message:", message.value);
        break;
      default:
        throw new Error(`Unknown message type`);
    }
  }

  private onDataDrained() {
    console.log("DATA WAS DRAINED");
    // Handle data drained event (during upload)
  }

  private sendPing() {
    this.sendToPeer({
      type: "ping",
      value: null,
    });
  }
}

// many listeners

export class ReactSubscribable<T> {
  constructor(private _value: T) {}

  private listeners = new Set<(value: T) => void>();
  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this._value));
  }

  get value() {
    return this._value;
  }

  set(value: T) {
    this._value = value;
    this.notifyListeners();
  }

  subscribe(callback: (value: T) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

// many listeners
export class ReactValuePortal<T> {
  constructor(private _value: T) {}

  private listeners = new Set<() => void>();
  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  get value() {
    return this._value;
  }

  set(value: T) {
    this._value = value;
    this.notifyListeners();
  }

  getReactive() {
    return {
      subscribe: (callback: () => void) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      },
      getState: () => this._value,
    };
  }

  asExtenalStore() {
    return useSyncExternalStore(
      (callback) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      },
      () => this.value,
    );
  }
  // what is fucking handled where man
}

function parseFile(file: File) {
  return {
    path: file.webkitRelativePath.replace("/" + file.name, ""), // TODO: check windows
    name: file.name,
    sizeBytes: file.size,
    file,
  };
}

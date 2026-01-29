import { RoomParams } from "../utils/roomParams";
import { secureId } from "../utils/secureId";
import { ReactiveValue } from "../utils/ReactiveValue";
import {
  PeerConnectionStatus,
  WebRTCPeerChannelManager,
} from "./WebRTC/WebRTCPeerChannelManager";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { getIceServers } from "./WebRTC/iceServers";
import { PeerChannel } from "./PeerChannel";
import { parseFile } from "../utils/parseFile";
import { Uploader } from "./Uploader";
import { Downloader } from "./Downloader";
import { BetterPeerChannel } from "./WebRTC/REWORK";
import { SignalingImpl } from "./WebRTC/SignalingNext";
// import * as streamsaver from "streamsaver";
// import { config } from "../config";

export type FileItem = {
  path: string;
  name: string;
  sizeBytes: number;
};

export type FullFilesState = {
  id: string;
  items: FileItem[]; // not done here!
  totalCount: number;
  totalBytes: number;
};

export function emptyPeerFiles(): FullFilesState {
  return {
    id: secureId(),
    items: [],
    totalCount: 0,
    totalBytes: 0,
  };
}

// core implementation, like a room manager. Name TDB
export class Core {
  private betterPeerChannel: BetterPeerChannel;
  // this should be a signal?
  connectionState = new ValueSubscriber<PeerConnectionStatus>("disconnected");
  onError: ((err: Error) => void) | null = null;

  private uploader: Uploader;
  private downloader: Downloader;

  uploadStatsValue() {
    return this.uploader.getStats();
  }
  get uploaderStatus() {
    return this.uploader.status;
  }

  downloadStatsValue() {
    return this.downloader.getStats();
  }
  get downloaderStatus() {
    return this.downloader.status;
  }

  private myFiles: FullFilesState = {
    id: secureId(),
    items: [],
    totalCount: 0,
    totalBytes: 0,
  };
  private peerFiles: FullFilesState = {
    id: secureId(),
    items: [],
    totalCount: 0,
    totalBytes: 0,
  };

  public filesReactor = new ReactiveValue(() => ({
    myFiles: this.myFiles,
    peerFiles: this.peerFiles,
  }));

  constructor(roomParams: RoomParams) {
    console.log("intializing new core", {
      roomParams,
    });

    const betterPeerChannel = new BetterPeerChannel(
      new SignalingImpl(roomParams),
      {
        isInitiator: roomParams.isInitiator,
        myId: roomParams.myId,
        peerId: roomParams.peerId,
      },
    );
    betterPeerChannel.listenOnMessage((message) => {
      switch (message.type) {
        case "preview-stats":
          this.peerFiles.totalCount = message.value.totalCount;
          this.peerFiles.totalBytes = message.value.totalBytes;
          this.filesReactor.notifyListeners();

          break;
      }
    });
    betterPeerChannel.onConnectionState = (status) => {
      if (status === "connected" || status === "connecting") {
        this.connectionState.setValue(status);
      } else if (status === "permaError") {
        this.connectionState.setValue("failed"); // TODO
      }

      if (status === "connected") {
        this.sendPreviewStats();
      }
    };
    betterPeerChannel.listenOnError((err) => {
      if (this.onError) {
        this.onError(err);
      }
    });
    this.uploader = new Uploader(betterPeerChannel);
    this.downloader = new Downloader(betterPeerChannel);

    betterPeerChannel.start();

    this.betterPeerChannel = betterPeerChannel;
  }

  public dispose() {
    this.betterPeerChannel.destroy();
    this.filesReactor.dispose();
    this.connectionState.dispose();
    this.uploader.dispose();
    this.downloader.dispose();
  }

  // public functions
  public addFiles(files: File[]) {
    this.uploader.setFiles([...this.uploader.getFiles(), ...files]);

    const parsedFiles = files.map(parseFile);

    this.myFiles.id = secureId();
    this.myFiles.items = [...this.myFiles.items, ...parsedFiles];
    this.myFiles.totalCount += parsedFiles.length;
    this.myFiles.totalBytes += parsedFiles.reduce(
      (acc, file) => acc + file.sizeBytes,
      this.myFiles.totalBytes,
    );

    this.filesReactor.notifyListeners();

    if (this.betterPeerChannel.isReady()) {
      this.sendPreviewStats();
    }
  }

  public clearFiles() {
    this.uploader.setFiles([]);

    this.myFiles.id = secureId();
    this.myFiles.items = [];
    this.myFiles.totalCount = 0;
    this.myFiles.totalBytes = 0;

    this.filesReactor.notifyListeners();

    if (this.betterPeerChannel.isReady()) {
      this.sendPreviewStats();
    }
  }

  public startDownload() {
    // const streamSaver = window.streamSaver;
    // const writeStream = streamSaver.createWriteStream("test.zip", {});
    const writeStream = window.streamSaver.createWriteStream(
      "download.zip",
      {},
    );
    this.downloader.start(writeStream);
  }
  public abortDownload() {
    this.downloader.abort();
  }
  public abortUpload() {
    this.uploader.abort();
  }

  private sendPreviewStats() {
    this.betterPeerChannel.write({
      type: "preview-stats",
      value: {
        totalCount: this.myFiles.totalCount,
        totalBytes: this.myFiles.totalBytes,
      },
    });
  }
}

function isRTCUserAbortError(error: Error) {
  return (
    error.name === "OperationError" &&
    error.message.includes("User-Initiated Abort")
  );
}

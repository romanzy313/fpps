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
import { createWriteStream } from "streamsaver";
// import * as streamsaver from "streamsaver";

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
  private peerManager: WebRTCPeerChannelManager;
  private peerChannel: PeerChannel;
  // this should be a signal?
  connectionState = new ValueSubscriber<PeerConnectionStatus>("disconnected");

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

    // TODO: choose intelligently
    const iceServers = getIceServers("Dev");

    this.peerManager = new WebRTCPeerChannelManager(
      { roomParams, iceServers },
      {
        onConnectionStateChange: (status) => {
          this.connectionState.setValue(status);
          if (status === "connected") {
            this.sendPreviewStats();
          }
        },
        onError: (error) => {
          console.error("WRAPPED ERROR", error);
        },
      },
    );
    this.peerChannel = this.peerManager.getPeerChannel();
    this.peerChannel.listenOnData((message) => {
      switch (message.type) {
        case "preview-stats":
          this.peerFiles.totalCount = message.value.totalCount;
          this.peerFiles.totalBytes = message.value.totalBytes;
          this.filesReactor.notifyListeners();

          break;
      }
    });

    this.uploader = new Uploader(this.peerChannel);
    this.downloader = new Downloader(this.peerChannel);

    this.peerManager.connect(); // connect right away?
  }

  public dispose() {
    this.peerManager.dispose(); // closes it
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
      this.myFiles.totalCount,
    );

    this.filesReactor.notifyListeners();

    if (this.peerChannel.isReady()) {
      this.sendPreviewStats();
    }
  }

  public startDownload() {
    // const streamSaver = window.streamSaver;
    // const writeStream = streamSaver.createWriteStream("test.zip", {});
    const writeStream = createWriteStream("download.zip", {});
    this.downloader.start(writeStream);
  }
  public abortDownload() {
    this.downloader.abort();
  }
  public abortUpload() {
    this.uploader.abort();
  }

  private sendPreviewStats() {
    this.peerChannel.send({
      type: "preview-stats",
      value: {
        totalCount: this.myFiles.items.length,
        totalBytes: this.myFiles.items.reduce(
          (acc, file) => acc + file.sizeBytes,
          0,
        ),
      },
    });
  }
}

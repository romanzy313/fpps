import { RoomParams } from "../utils/roomParams";
import { ReactiveValue } from "../utils/ReactiveValue";
import { PeerConnectionStatus } from "./WebRTC/types";
import { ValueSubscriber } from "../utils/ValueSubscriber";
import { parseFile } from "../utils/parseFile";
import { Uploader } from "./Uploader";
import { Downloader } from "./Downloader";
import { WebRTCPeerChannel, SignalingSSE } from "./WebRTC";
import { ApplicationError, FatalError } from "./ApplicationError";
import { MultiSubscriber } from "../utils/MultiSubscriber";
import { Encryptor } from "../utils/encryption";
import { nanoid } from "nanoid";

const BACKPRESSURE_AMOUNT = 1 << 20; // 1mb

export type FileItem = {
  path: string;
  name: string;
  sizeBytes: number;
};

export type FullFilesState = {
  id: string;
  items: FileItem[];
  totalCount: number;
  totalBytes: number;
};

function randomId() {
  return nanoid(20);
}

export function emptyPeerFiles(): FullFilesState {
  return {
    id: randomId(),
    items: [],
    totalCount: 0,
    totalBytes: 0,
  };
}

// core implementation, like a room manager. Name TDB
export class Core {
  private peerChannel: WebRTCPeerChannel;
  // this should be a signal?
  connectionState = new ValueSubscriber<PeerConnectionStatus>("disconnected");
  error = new MultiSubscriber<ApplicationError | null>();

  private uploader: Uploader;
  private downloader: Downloader;

  uploadStatsValue() {
    return this.uploader.getStats();
  }
  uploadSpeedValue() {
    return this.uploader.getSpeed();
  }
  get uploaderStatus() {
    return this.uploader.status;
  }

  downloadStatsValue() {
    return this.downloader.getStats();
  }
  downloadSpeedValue() {
    return this.downloader.getSpeed();
  }
  get downloaderStatus() {
    return this.downloader.status;
  }

  private myFiles: FullFilesState = {
    id: randomId(),
    items: [],
    totalCount: 0,
    totalBytes: 0,
  };
  private peerFiles: FullFilesState = {
    id: randomId(),
    items: [],
    totalCount: 0,
    totalBytes: 0,
  };

  public filesReactor = new ReactiveValue(() => ({
    myFiles: this.myFiles,
    peerFiles: this.peerFiles,
  }));

  constructor(roomParams: RoomParams) {
    console.log("intializing core", {
      roomParams,
    });

    const signaler = new SignalingSSE(roomParams.myId, roomParams.peerId);
    const encryptor = new Encryptor(roomParams.secret);

    const peerChannel = new WebRTCPeerChannel(
      signaler,
      encryptor,
      BACKPRESSURE_AMOUNT,
    );

    peerChannel.listenOnMessage((message) => {
      switch (message.type) {
        case "preview-content":
          this.peerFiles.totalCount = message.value.totalCount;
          this.peerFiles.totalBytes = message.value.totalBytes;
          this.filesReactor.notifyListeners();

          break;
      }
    });

    peerChannel.onConnectionState = (status) => {
      console.log("PEER CHANNEL STATE", {
        status,
      });

      this.connectionState.setValue(status);

      if (status !== "disconnected") {
        this.error.notify(null);
      }

      if (status === "connected") {
        this.sendPreviewContent();
      }
    };
    peerChannel.listenOnError((err) => {
      this.error.notify(err);
    });

    this.uploader = new Uploader(peerChannel);
    this.downloader = new Downloader(peerChannel);

    setTimeout(() => {
      peerChannel.start();
    });

    this.peerChannel = peerChannel;
  }

  public dispose() {
    this.peerChannel.stop();
    this.filesReactor.dispose();
    this.connectionState.dispose();
    this.uploader.dispose();
    this.downloader.dispose();
    this.error.dispose();
  }

  // public functions
  public addFiles(files: File[]) {
    this.uploader.setFiles([...this.uploader.getFiles(), ...files]);

    const parsedFiles = files.map(parseFile);

    this.myFiles.id = randomId();
    this.myFiles.items = [...this.myFiles.items, ...parsedFiles];
    this.myFiles.totalCount += parsedFiles.length;
    this.myFiles.totalBytes += parsedFiles.reduce(
      (acc, file) => acc + file.sizeBytes,
      this.myFiles.totalBytes,
    );

    this.filesReactor.notifyListeners();

    this.uploaderStatus.setValue("idle");

    if (this.peerChannel.isReady()) {
      this.sendPreviewContent();
    }
  }

  public clearFiles() {
    this.uploader.setFiles([]);

    this.myFiles.id = randomId();
    this.myFiles.items = [];
    this.myFiles.totalCount = 0;
    this.myFiles.totalBytes = 0;

    this.filesReactor.notifyListeners();

    if (this.peerChannel.isReady()) {
      this.sendPreviewContent();
    }
  }

  public startDownload() {
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
    this.uploader.stop();
  }

  private sendPreviewContent() {
    this.peerChannel.write({
      type: "preview-content",
      value: {
        totalCount: this.myFiles.totalCount,
        totalBytes: this.myFiles.totalBytes,
      },
    });
  }
}

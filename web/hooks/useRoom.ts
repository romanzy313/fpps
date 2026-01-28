import { useCallback, useEffect, useState } from "preact/hooks";
import { stringifyRoomParams } from "../utils/roomParams";

import { useRoomParams2 } from "./useRoomParams";
import { Core, emptyPeerFiles, FullFilesState } from "../core/Core";
import { PeerConnectionStatus } from "../core/WebRTC/WebRTCPeerChannelManager";
import {
  TransferStats,
  TransferStatus,
  zeroTransferStats,
} from "../core/PeerChannel";

const STATS_UPDATE_INTERVAL_MS = 500;

export function useRoom() {
  const roomParams = useRoomParams2();
  const [shareCode, setShareCode] = useState<string>("");

  const [core, setCore] = useState<Core | null>(null);
  const [connectionState, setConnectionState] =
    useState<PeerConnectionStatus>("disconnected");

  const [myFiles, setMyFiles] = useState<FullFilesState>(emptyPeerFiles());
  const [peerFiles, setPeerFiles] = useState<FullFilesState>(emptyPeerFiles());

  const [uploadStatus, setUploadStatus] = useState<TransferStatus>("idle");
  const [downloadStatus, setDownloadStatus] = useState<TransferStatus>("idle");

  const [uploadStats, setUploadStats] =
    useState<TransferStats>(zeroTransferStats());
  const [downloadStats, setDownloadStats] =
    useState<TransferStats>(zeroTransferStats());

  useEffect(() => {
    const newCore = new Core(roomParams);
    setCore(newCore);

    setShareCode(
      stringifyRoomParams({
        myId: roomParams.peerId,
        peerId: roomParams.myId,
        secret: roomParams.secret,
        isInitiator: !roomParams.isInitiator,
      }),
    );

    // all subscriptions are cleared on core.dispose()
    newCore.connectionState.subscribe((state) => {
      setConnectionState(state);
    });
    newCore.filesReactor.subscribe(({ myFiles, peerFiles }) => {
      setMyFiles(myFiles);
      setPeerFiles(peerFiles);
    });
    newCore.uploaderStatus.subscribe((status) => {
      setUploadStatus(status);
    });
    newCore.downloaderStatus.subscribe((status) => {
      setDownloadStatus(status);
    });

    // query stats every 500 ms
    const stopInterval = setInterval(() => {
      setDownloadStats(newCore.downloadStatsValue());
      setUploadStats(newCore.uploadStatsValue());
    }, STATS_UPDATE_INTERVAL_MS);

    // if (typeof window !== "undefined") {
    //   window.
    // }

    return () => {
      newCore.dispose();
      clearInterval(stopInterval);
    };
  }, [roomParams]);

  const addMoreFiles = useCallback(
    (files: File[]) => {
      core!.addFiles(files);
    },
    [core],
  );

  const clearFiles = useCallback(() => {
    core!.clearFiles();
  }, [core]);

  const startDownload = useCallback(() => {
    core!.startDownload();
  }, [core]);

  const abortDownload = useCallback(() => {
    core!.abortDownload();
  }, [core]);

  const abortUpload = useCallback(() => {
    core!.abortUpload();
  }, [core]);

  return {
    roomParams,
    connectionState,
    myFiles,
    peerFiles,
    shareCode,
    addMoreFiles,
    clearFiles,
    startDownload,
    abortDownload,
    abortUpload,
    downloadStatus,
    uploadStatus,
    downloadStats,
    uploadStats,
  };
}

export type UseRoom = ReturnType<typeof useRoom>;

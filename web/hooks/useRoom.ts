import { useCallback, useEffect, useState } from "preact/hooks";
import { stringifyRoomParams } from "../utils/roomParams";

import { useRoomParams } from "./useRoomParams";
import { Core, emptyPeerFiles, FullFilesState } from "../core/Core";
import { PeerConnectionStatus } from "../core/WebRTC/types";
import {
  TransferSpeed,
  TransferStats,
  TransferStatus,
  zeroTransferStats,
} from "../core";
import { usePreventNavigation } from "./usePreventNavigation";
import { ApplicationError } from "../core/ApplicationError";

const STATS_UPDATE_INTERVAL_MS = 500;

export function useRoom() {
  const roomParams = useRoomParams();
  const [shareCode, setShareCode] = useState<string>("");

  const [core, setCore] = useState<Core | null>(null);
  const [connectionState, setConnectionState] =
    useState<PeerConnectionStatus>("disconnected");
  const [error, setError] = useState<ApplicationError | null>(null);

  const [myFiles, setMyFiles] = useState<FullFilesState>(emptyPeerFiles());
  const [peerFiles, setPeerFiles] = useState<FullFilesState>(emptyPeerFiles());

  const [uploadStatus, setUploadStatus] = useState<TransferStatus>("idle");
  const [downloadStatus, setDownloadStatus] = useState<TransferStatus>("idle");

  const [uploadStats, setUploadStats] =
    useState<TransferStats>(zeroTransferStats());
  const [downloadStats, setDownloadStats] =
    useState<TransferStats>(zeroTransferStats());

  const [uploadSpeed, setUploadSpeed] = useState<TransferSpeed | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<TransferSpeed | null>(
    null,
  );

  const [isTransferring, setIsTransferring] = useState(false);
  useEffect(() => {
    setIsTransferring(
      downloadStatus === "transfer" || uploadStatus === "transfer",
    );
  }, [downloadStatus, uploadStatus]);

  usePreventNavigation(
    "A transfer is in progress? Leaving this page will interrupt file sharing.",
    isTransferring,
  );

  useEffect(() => {
    const newCore = new Core(roomParams);
    setCore(newCore);

    setShareCode(
      stringifyRoomParams({
        myId: roomParams.peerId,
        peerId: roomParams.myId,
        secret: roomParams.secret,
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
    newCore.error.subscribe((value) => {
      setError(value);
    });

    // query stats every 500 ms
    // TODO: this is bad
    const stopInterval = setInterval(() => {
      setDownloadStats(newCore.downloadStatsValue());
      setUploadStats(newCore.uploadStatsValue());
      setDownloadSpeed(newCore.downloadSpeedValue());
      setUploadSpeed(newCore.uploadSpeedValue());
    }, STATS_UPDATE_INTERVAL_MS);

    return () => {
      newCore.dispose();
      clearInterval(stopInterval);
    };
  }, [roomParams]);

  function clearError() {
    setError(null);
  }

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
    downloadStats,
    downloadSpeed,
    uploadStatus,
    uploadStats,
    uploadSpeed,
    error,
    clearError,
  };
}

export type UseRoom = ReturnType<typeof useRoom>;

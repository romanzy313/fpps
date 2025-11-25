import { useCallback, useEffect, useState } from "preact/hooks";
import { stringifyRoomParams } from "../utils/roomParams";

import { getIceServers } from "../peer/iceServers";

import { Core, FileItem, PeerConnectionState } from "../peer/Core";
import { useRoomParams2 } from "./useRoomParams";

export function useRoom() {
  const roomParams = useRoomParams2();
  const [shareCode, setShareCode] = useState<string>("");
  const [core, setCore] = useState<Core>(null as any);
  const [connectionState, setConnectionState] =
    useState<PeerConnectionState>("offline");
  const [myFiles, setMyFiles] = useState<FileItem[]>([]);
  const [peerFiles, setPeerFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    const newCore = new Core(roomParams, {
      iceServers: getIceServers("Dev"),
    });
    setCore(newCore);

    const connectionUnsub = newCore.connectionState.subscribe((state) => {
      setConnectionState(state);
    });

    const filesUnsub = newCore.filesReactor.subscribe(
      ({ myFiles, peerFiles }) => {
        setMyFiles(myFiles);
        setPeerFiles(peerFiles);
      },
    );

    setShareCode(
      stringifyRoomParams({
        myId: roomParams.peerId,
        peerId: roomParams.myId,
        secret: roomParams.secret,
        isInitiator: !roomParams.isInitiator,
      }),
    );

    return () => {
      newCore.dispose();
      connectionUnsub();
      filesUnsub();
    };
  }, [roomParams]);

  const addMyFiles = useCallback(
    (files: File[]) => {
      core!.addFiles(files);
    },
    [core],
  );

  const startDownload = useCallback(() => {
    core!.startDownload();
  }, [core]);

  return {
    roomParams,
    connectionState,
    myFiles,
    peerFiles,
    shareCode,
    addMyFiles,
    startDownload,
  };
}

export type UseRoom = ReturnType<typeof useRoom>;

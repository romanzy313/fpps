import { useCallback, useEffect, useState } from "preact/hooks";
import { stringifyRoomParams } from "../utils/roomParams";

import { getIceServers } from "../peer/iceServers";

import { Core, PeerConnectionState } from "../peer/Core";
import { useRoomParams2 } from "./useRoomParams";

export function useRoom() {
  const roomParams = useRoomParams2();
  const [shareCode, setShareCode] = useState<string>("");
  const [core, setCore] = useState<Core>(null as any);
  const [connectionState, setConnectionState] =
    useState<PeerConnectionState>("offline");

  useEffect(() => {
    console.log("intializing new core", roomParams);
    const newCore = new Core(roomParams, {
      iceServers: getIceServers("Dev"),
    });
    setCore(newCore);

    const connectionUnsub = newCore.connectionState.subscribe((state) => {
      setConnectionState(state);
    });

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
    myFiles: core?.myFiles.items ?? [], // TODO: make these reactive
    peerFiles: core?.peerFiles.items ?? [],
    shareCode,
    addMyFiles,
    startDownload,
  };
}

export type UseRoom = ReturnType<typeof useRoom>;

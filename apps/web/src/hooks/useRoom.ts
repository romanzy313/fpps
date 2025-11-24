import { useEffect, useRef } from "preact/hooks";
import { parseRoomParams, stringifyRoomParams } from "../utils/roomParams";
import { useRoomStore } from "./useRoomStore";
import {
  PeerMessage,
  peerMessageFromBytes,
  peerMessageToBytes,
} from "@fpps/common";
import { PeerChannelImpl } from "../peer/PeerChannel";
import { getIceServers } from "../peer/iceServers";

export function useRoom() {
  // this could be dangerous...
  const roomParams = useRef(parseRoomParams(window.location.hash.substring(1)));
  const roomStore = useRoomStore(roomParams.current);
  const { state, dispatch } = roomStore;

  const shareCode = useRef(
    stringifyRoomParams({
      myId: state.room.peerId,
      peerId: state.room.myId,
      secret: state.room.secret,
      isInitiator: !state.room.isInitiator,
    }),
  );

  const sendMessageToPeer = useRef<(value: PeerMessage) => boolean>(() => {
    throw new Error("TOO EARLY");
  });

  // this does not need to be established right away?
  useEffect(() => {
    const iceServers = getIceServers("Dev");

    console.log("initializing peer channel");
    const peerChannel = new PeerChannelImpl(
      roomParams.current,
      {
        onConnectionStateChange(status) {
          switch (status) {
            case "connected":
              dispatch({ type: "peerConnected" });
              break;
            case "connecting":
              dispatch({ type: "peerConnecting" });
              break;
            case "disconnected":
              dispatch({ type: "peerDisconnected" });
              break;
            case "failed":
              // hmmm
              dispatch({
                type: "peerError",
                error: "Connection to peer failed",
              });
              break;
          }
        },
        onDataDrained() {
          console.log("data drained");
        },
        onError(message) {
          console.error("connection error", message);
          dispatch({ type: "peerError", error: message });
        },
        onMessageReceived(raw) {
          const message = peerMessageFromBytes(raw);

          console.log("message received", message);

          switch (message.type) {
            case "ping":
              //technically pong are not needed
              sendMessageToPeer.current({ type: "pong", value: null });
              break;
            case "pong":
              break;
            case "filesAdded":
              dispatch({ type: "peerFilesAdded", files: message.value });
              break;

            default:
              console.error("unknown message", message);
              break;
          }
        },
      },
      {
        iceServers,
      },
    );

    peerChannel.connect();
    sendMessageToPeer.current = (value: PeerMessage) => {
      return peerChannel.send(peerMessageToBytes(value));
    };

    const interval = setInterval(() => {
      const ok = sendMessageToPeer.current({
        type: "ping",
        value: null,
      });

      if (!ok) {
        console.warn("BACKPRESSURE ENCOUNTERED or not connected");
      }
    }, 5_000);

    return () => {
      console.log("closing peer channel");
      peerChannel.close();
      clearInterval(interval);
    };
  }, []);

  const isPeerOffline = state.connection.peerStatus === "offline";

  function addMyFiles(files: File[]) {
    dispatch({ type: "myFilesAdded", files });
    // file list must be split into parts and retired somehow
    // if peer is not connected, this will go out of sync
    const ok = sendMessageToPeer.current({
      type: "filesAdded",
      value: files.map((f) => ({
        path: f.webkitRelativePath, // this is wrong, it needs to be done on the outside...
        name: f.name,
        sizeBytes: f.size,
      })),
    });

    if (!ok) {
      console.error("FAILED OT SEND filesAdded to the peer");
    }
  }

  return {
    state,
    isPeerOffline,
    shareCode,
    addMyFiles,
  };
}

export type UseRoom = ReturnType<typeof useRoom>;

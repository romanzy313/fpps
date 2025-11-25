import { useEffect, useState } from "preact/hooks";
import { parseRoomParams, RoomParams } from "../utils/roomParams";

function ssrRoomParams(): RoomParams {
  return {
    peerId: "",
    myId: "",
    secret: "",
    isInitiator: false,
  };
}

export function useRoomParams2() {
  if (typeof window === "undefined") {
    return ssrRoomParams();
  }

  const [roomParams, setRoomParams] = useState<RoomParams>(
    parseRoomParams(window.location.hash.substring(1)),
  );

  useEffect(() => {
    const onHashChange = () => {
      // console.log("hash has changed", window.location.hash);
      setRoomParams(parseRoomParams(window.location.hash.substring(1)));
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [window.location.hash]);

  return roomParams;
}

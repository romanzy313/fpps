import { useEffect, useState } from "preact/hooks";
import { parseRoomParams, RoomParams } from "../utils/roomParams";

function ssrRoomParams(): RoomParams {
  return {
    peerId: "",
    myId: "",
    secret: "",
  };
}

export function useRoomParams(): RoomParams {
  if (typeof window === "undefined") {
    return ssrRoomParams();
  }

  const [roomParams, setRoomParams] = useState(
    parseRoomParams(window.location.hash.substring(1)),
  );

  useEffect(() => {
    const onHashChange = () => {
      setRoomParams(parseRoomParams(window.location.hash.substring(1)));
    };

    return () => window.removeEventListener("hashchange", onHashChange);
  }, [window.location.hash]);

  if (!roomParams) {
    window.location.href = "/"; // Redirect to home page if room params are invalid
    return {
      peerId: "",
      myId: "",
      secret: "",
    };
  }

  return roomParams;
}

import { useEffect, useState } from "preact/hooks";
import { parseRoomParams } from "../utils/roomParams";

export function useRoomParams2() {
  const [roomParams, setRoomParams] = useState(
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

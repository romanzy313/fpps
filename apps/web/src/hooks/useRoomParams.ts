import { RoomParams } from "../utils/roomParams";
import { parseRoomParams, stringifyRoomParams } from "../utils/roomParams";

import { useUrlHash } from "./useUrlHash";

export function useRoomParams() {
  const { hashValue, setHash } = useUrlHash();

  return {
    value: parseRoomParams(hashValue),
    setValue: (value: RoomParams) => {
      setHash(stringifyRoomParams(value));
    },
  };
}

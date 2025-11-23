export type RoomParams = {
  peerId: string;
  myId: string;
  secret: string; // TODO: use for encryption
  isInitiator: boolean;
};

export function isValidRoomHash(hash: string) {
  try {
    const params = parseRoomParams(hash);

    if (params.myId === "" || params.peerId === "") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function parseRoomParams(hash: string) {
  const value: RoomParams = {
    peerId: "",
    myId: "",
    secret: "",
    isInitiator: true,
  };

  const parts = hash.split(";");

  for (const part of parts) {
    const [key, partValue] = part.split(":");
    switch (key) {
      case "p":
        value.peerId = partValue;
        break;
      case "m":
        value.myId = partValue;
        break;
      case "s":
        value.secret = partValue;
        break;
      case "i":
        if (partValue !== "1" && partValue !== "0") {
          throw new Error(`Invalid value for initiator: ${partValue}`);
        }
        value.isInitiator = partValue === "1";
        break;
      default:
        throw new Error(`Unknown key: ${key}. PartValue: ${partValue}`);
    }
  }

  return value;
}

export function stringifyRoomParams(value: RoomParams) {
  const parts = [
    `p:${value.peerId}`,
    `m:${value.myId}`,
    `s:${value.secret}`,
    `i:${value.isInitiator ? "1" : "0"}`,
  ];

  return parts.join(";");
}

/**
 *
 * @deprecated Use route() instead
 */
export function setUrlRoomParams(value: RoomParams) {
  const str = stringifyRoomParams(value);
  window.history.replaceState(null, "", `#${str}`);
}

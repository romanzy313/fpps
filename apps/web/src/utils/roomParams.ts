export type RoomParams = {
  peerId: string;
  myId: string;
  secret: string; // TODO: use for encryption
};

export function parseRoomParams(hash: string) {
  const value: RoomParams = {
    peerId: "",
    myId: "",
    secret: "",
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
      case "":
        console.warn("NO HASH KEY", { key, partValue });
        break;
      default:
        throw new Error(`Unknown key: ${key}`);
    }
  }

  return value;
}

export function stringifyRoomParams(value: RoomParams) {
  const parts = [`p:${value.peerId}`, `m:${value.myId}`, `s:${value.secret}`];

  return parts.join(";");
}

export function setUrlRoomParams(value: RoomParams) {
  const str = stringifyRoomParams(value);
  window.history.replaceState(null, "", `#${str}`);
}

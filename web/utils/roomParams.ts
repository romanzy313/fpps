export type RoomParams = {
  peerId: string;
  myId: string;
  secret: string;
};

export function isValidRoomHash(hash: string) {
  const params = parseRoomParams(hash);

  if (!params.myId || !params.peerId || !params.secret) {
    return false;
  }

  return true;
}

export function parseRoomParams(str: string) {
  const value: RoomParams = {
    peerId: "",
    myId: "",
    secret: "",
  };

  const myIdMatch = str.match(/m:([^;]+)/);
  const peerIdMatch = str.match(/p:([^;]+)/);
  const secretMatch = str.match(/s:([^;]+)/);

  if (myIdMatch) {
    value.myId = myIdMatch[1] ?? "";
  }
  if (peerIdMatch) {
    value.peerId = peerIdMatch[1] ?? "";
  }
  if (secretMatch) {
    value.secret = secretMatch[1] ?? "";
  }

  return value;
}

export function stringifyRoomParams(value: RoomParams) {
  return `m:${value.myId};p:${value.peerId};s:${value.secret}`;
}

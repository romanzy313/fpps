export type RoomParams = {
  peerId: string;
  myId: string;
  secret: string;
};

export function isValidRoomHash(hash: string) {
  const params = parseRoomParams(hash);

  return params !== null;
}

export function parseRoomParams(str: string) {
  const myIdMatch = str.match(/m:([^;]+)/);
  const peerIdMatch = str.match(/p:([^;]+)/);
  const secretMatch = str.match(/s:([^;]+)/);

  if (
    !myIdMatch ||
    !myIdMatch[1] ||
    !peerIdMatch ||
    !peerIdMatch[1] ||
    !secretMatch ||
    !secretMatch[1]
  ) {
    return null;
  }

  return {
    myId: myIdMatch[1],
    peerId: peerIdMatch[1],
    secret: secretMatch[1],
  };
}

export function stringifyRoomParams(value: RoomParams) {
  return `m:${value.myId};p:${value.peerId};s:${value.secret}`;
}

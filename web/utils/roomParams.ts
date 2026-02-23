import { nanoid } from "nanoid";

export type RoomParams = {
  peerId: string;
  myId: string;
  secret: string;
};

export function parseRoomParams(str: string): RoomParams | null {
  // remove the hash if present
  const hashIndex = str.indexOf("#");
  if (hashIndex !== -1) {
    str = str.substring(hashIndex + 1);
  }

  // assert this with typescript
  function isValid(match: RegExpMatchArray | null) {
    // return match && match[1];
    return match && match[1] && match[1].length === 20;
  }

  const myIdMatch = str.match(/m:([^;]+)/);
  const peerIdMatch = str.match(/p:([^;]+)/);
  const secretMatch = str.match(/s:([^;]+)/);

  if (!isValid(myIdMatch) || !isValid(peerIdMatch) || !isValid(secretMatch)) {
    return null;
  }

  return {
    myId: myIdMatch![1]!,
    peerId: peerIdMatch![1]!,
    secret: secretMatch![1]!,
  };
}

export function generateRoomParams(): RoomParams {
  const myId = nanoid(20);
  const peerId = nanoid(20);
  const secret = nanoid(20);

  return {
    myId,
    peerId,
    secret,
  };
}

export function stringifyRoomParams(value: RoomParams) {
  return `m:${value.myId};p:${value.peerId};s:${value.secret}`;
}

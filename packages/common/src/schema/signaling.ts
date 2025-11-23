// re-exported from lib.dom.d.ts
// TODO: include this in tsconfig instead
interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

// peer to peer singaling payloads
export type P2PSignalingPayload =
  | {
      type: "offer";
      sdp: string;
    }
  | {
      type: "answer";
      sdp: string;
    }
  | {
      type: "ice-candidate";
      candidate: RTCIceCandidateInit;
    };

export function parseP2PSignalingPayload(
  base64Str: string,
  _secret: string,
): P2PSignalingPayload {
  const json = JSON.parse(atob(base64Str));

  return json as P2PSignalingPayload;
}

export function serializeP2PSignalingPayload(
  payload: P2PSignalingPayload,
  _secret: string,
): string {
  const json = JSON.stringify(payload);

  return btoa(json);
}

// peer to peer singaling payloads
export type P2PSignalingPayload =
  | {
      type: "video-offer" | "video-answer";
      name: string;
      target: string;
      sdp: string;
    }
  | {
      type: "new-ice-candidate";
      target: string;
      candidate: string;
    };

export function parseP2PSignalingPayload(
  base64Str: string,
): P2PSignalingPayload {
  const json = JSON.parse(atob(base64Str));

  return json as P2PSignalingPayload;
}

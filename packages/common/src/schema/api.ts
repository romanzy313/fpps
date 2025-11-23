import {
  parseP2PSignalingPayload,
  serializeP2PSignalingPayload,
  type P2PSignalingPayload,
} from "./signaling";

// api signaling data
export type ApiSignalingRequest =
  | {
      type: "message";
      thisUser: string; // uuid of the sender
      forUser: string; // uuid of the reciever
      payloads: string[]; // base64 encoded, encrypted signaling payload
    }
  | { type: "poll"; thisUser: string }; // type: inbox?

export type SignalingResponse = {
  payloads: string[];
};

// TODO: make this zod safe
export function parseApiSignalingRequest(json: unknown): ApiSignalingRequest {
  return json as ApiSignalingRequest;
}

export function serializeApiSignalingPollRequest({
  myId,
}: {
  myId: string;
}): string {
  const data: ApiSignalingRequest = {
    type: "poll",
    thisUser: myId,
  };

  return JSON.stringify(data);
}

export function serializeApiSignalingMessageRequest(values: {
  myId: string;
  peerId: string;
  secret: string;
  payloads: P2PSignalingPayload[];
}): string {
  const data: ApiSignalingRequest = {
    type: "message",
    thisUser: values.myId,
    forUser: values.peerId,
    payloads: values.payloads.map((payload) =>
      serializeP2PSignalingPayload(payload, values.secret),
    ),
  };

  return JSON.stringify(data);
}

export function parseApiSignalingResponse(
  json: unknown,
  secret: string,
): P2PSignalingPayload[] {
  const response = json as SignalingResponse;

  const out = response.payloads.map((payload) =>
    parseP2PSignalingPayload(payload, secret),
  );

  return out;
}

// api signaling data
export type ApiSignalingRequest =
  | {
      type: "message";
      thisUser: string; // uuid of the sender
      forUser: string; // uuid of the reciever
      payload: string; // base64 encoded, encrypted signaling payload
    }
  | { type: "poll"; thisUser: string }; // type: inbox?

// TODO: make this zod safe
export function parseApiSignalingRequest(json: unknown): ApiSignalingRequest {
  return json as ApiSignalingRequest;
}

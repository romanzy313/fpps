export async function apiRead(req: ReadDTO): Promise<ResponseDTO> {
  const res = await fetch(`/api/signaling/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  return parseResponse(res);
}

export async function apiSend(req: SendDTO): Promise<ResponseDTO> {
  const res = await fetch(`/api/signaling/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  return parseResponse(res);
}

type SendDTO = {
  me: string;
  peer: string;
  payloads: string[];
};

type ReadDTO = {
  me: string;
};

type ResponseDTO = {
  payloads: string[];
};

type ErrorDTO = {
  error: string;
};

async function parseResponse(res: Response): Promise<ResponseDTO> {
  const json: unknown = await res.json();

  if (!res.ok) {
    throw new Error((json as ErrorDTO).error);
  }

  return json as ResponseDTO;
}

// peer to peer singaling payloads
export type SignalingPayload =
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

function parseP2PSignalingPayload(
  base64Str: string,
  secret: string,
): SignalingPayload {
  if (secret) {
    throw new Error("Encryption is not implemented yet");
  }

  const json = JSON.parse(atob(base64Str));

  return json as SignalingPayload;
}

function serializeP2PSignalingPayload(
  payload: SignalingPayload,
  secret: string,
): string {
  if (secret) {
    throw new Error("Encryption is not implemented yet");
  }

  const json = JSON.stringify(payload);

  return btoa(json);
}

type ApplicationKnownError =
  | "webrtc_disabled"
  | "server_error"
  | "connection_interrupted";

export type ApplicationError =
  | {
      fatal: boolean;
      type: ApplicationKnownError;
    }
  | {
      fatal: true;
      unhandledMessage: string;
    };

const translation: Record<ApplicationKnownError, string> = {
  webrtc_disabled: "WebRTC is diabled in your browser",
  server_error: "Server error",
  connection_interrupted: "Connection to peer was interrupted",
} as const;

export function applicationErrorToText(value: ApplicationError): string {
  if (!value.fatal) {
    return translation[value.type];
  }

  if ("type" in value) {
    return translation[value.type];
  }

  return `Unexpected error: ${value.unhandledMessage}`;
}

export function convertError(err: unknown): ApplicationError {
  if (err instanceof Error) {
    if (
      err.name === "ReferenceError" &&
      err.message.includes("RTCPeerConnection")
    ) {
      return {
        fatal: true,
        type: "webrtc_disabled",
      };
    }
    if (err.name === "ApiError") {
      return {
        fatal: true,
        type: "server_error",
      };
    }
    if (err.message === "connection_interrupted") {
      return {
        fatal: true,
        type: "connection_interrupted",
      };
    }

    console.error("unproccessed error", err);

    return {
      fatal: true,
      unhandledMessage: err.message,
    };
  }

  console.error("really really bad error", err);

  return {
    fatal: true,
    unhandledMessage: `${err}`,
  };
}

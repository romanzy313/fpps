type ApplicationKnownError = "webrtc_disabled";

export type ApplicationError =
  | {
      fatal: boolean;
      message: ApplicationKnownError;
    }
  | {
      fatal: true;
      unhandledMessage: string;
    };

const translation: Record<ApplicationKnownError, string> = {
  webrtc_disabled: "WebRTC is diabled in your browser",
} as const;

export function applicationErrorToText(value: ApplicationError): string {
  if (!value.fatal) {
    return translation[value.message];
  }

  if ("message" in value) {
    return translation[value.message];
  }

  return `Unexpected error ${value.unhandledMessage}`;
}

export function convertError(err: unknown): ApplicationError {
  if (err instanceof Error) {
    if (
      err.name === "ReferenceError" &&
      err.message.includes("RTCPeerConnection")
    ) {
      return {
        fatal: true,
        message: "webrtc_disabled",
      };
    }

    console.error("unproccessed error", { err });

    return {
      fatal: true,
      unhandledMessage: err.message,
    };
  }

  console.error("really really bad error", { err });

  return {
    fatal: true,
    unhandledMessage: `${err}`,
  };
}

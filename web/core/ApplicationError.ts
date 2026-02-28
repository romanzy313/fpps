type ApplicationErrorType =
  | "webrtc_disabled"
  | "server_error"
  | "connection_interrupted"
  | "connection_aborted" // the user closed thier browser
  | "unknown_error";

const translation: Record<
  Exclude<ApplicationErrorType, "unknown_error">,
  string
> = {
  webrtc_disabled: "WebRTC is diabled in your browser",
  server_error: "Server error",
  connection_interrupted: "Connection to peer was interrupted",
  connection_aborted: "Peer closed the connection",
} as const;

export type ApplicationError = FatalError | RestarableError;

export function applicationErrorFromUnknown(cause: unknown): ApplicationError {
  const maybeRestarable = RestarableError.fromUnknown(cause);
  if (maybeRestarable) {
    return maybeRestarable;
  }

  return FatalError.fromUnknown(cause);
}

export class FatalError extends Error {
  constructor(
    message: string,
    private type: ApplicationErrorType,
  ) {
    super(message);
    this.name = "FatalError";
  }

  static fromUnknown(cause: unknown): FatalError {
    if (cause instanceof Error) {
      if (
        cause.name === "ReferenceError" &&
        cause.message.includes("RTCPeerConnection")
      ) {
        return new FatalError(cause.message, "webrtc_disabled");
      }
      if (cause.name === "ApiError") {
        return new FatalError(cause.message, "server_error");
      }

      return new FatalError(cause.message, "unknown_error");
    }

    return new FatalError(String(cause), "unknown_error");
  }

  toString(): string {
    if (this.type === "unknown_error") {
      return `Unknown error: ${this.message}`;
    }
    return translation[this.type];
  }
}

export class RestarableError extends Error {
  constructor(
    message: string,
    private type: ApplicationErrorType,
  ) {
    super(message);
    this.name = "RestarableError";
  }

  static fromUnknown(cause: unknown): RestarableError | null {
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/error_event
    if (cause instanceof RTCError) {
      return new RestarableError(cause.message, "connection_interrupted");
    }

    // if (cause instanceof Error) {
    //   if (
    //     cause.name === "OperationError" &&
    //     cause.message.includes("User-Initiated Abort")
    //   ) {
    //     return new RestarableError(cause.message, "connection_aborted");
    //   }
    // }

    return null;
  }

  toString(): string {
    if (this.type === "unknown_error") {
      return `Unknown error: ${this.message}`;
    }
    return translation[this.type];
  }
}

import { ApplicationError, RestarableError } from "../core";
import { PeerConnectionStatus } from "../core/WebRTC/types";
import { ShareLink } from "./ShareLink";

type Props = {
  status: PeerConnectionStatus;
  shareCode: string;
  error: ApplicationError | null;
};

export function PeerStatus({ status, shareCode, error }: Props) {
  function getText(): string {
    if (error) {
      return "File transfer failure";
    }

    switch (status) {
      case "connected":
        return "Peer is connected";
      case "connecting":
        return "Connecting to peer...";
      case "disconnected":
        return "Waiting for peer";
    }
  }

  function getIndicatorClass(): string {
    if (error) {
      return "peer-status__indicator--error";
    }

    switch (status) {
      case "connected":
        return "peer-status__indicator--connected";
      case "connecting":
        return "peer-status__indicator--connecting";
      case "disconnected":
        return "peer-status__indicator--disconnected";
    }
  }

  function getErrorDetail(): string {
    if (error === null) {
      return "";
    }

    if (error instanceof RestarableError) {
      return "Temporary error, retrying";
    }

    return "Please restart the application";
  }

  return (
    <div className="peer-status">
      <div className="peer-status__content">
        <div className={`peer-status__indicator ${getIndicatorClass()}`}></div>
        <div className="peer-status__text" data-testid="peer-status-text">
          {getText()}
        </div>
      </div>
      {error && (
        <>
          <div className="peer-status__error">{error.toString()}</div>
          {<div>{getErrorDetail()}</div>}
        </>
      )}

      {status === "disconnected" && !error && (
        <div className="peer-status__share">
          <ShareLink code={shareCode} />
        </div>
      )}
    </div>
  );
}

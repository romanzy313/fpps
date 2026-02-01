import { PeerConnectionStatus } from "../core/WebRTC/types";
import { ShareLink } from "./ShareLink";

type Props = {
  status: PeerConnectionStatus;
  shareCode: string;
  error: string;
};

export function PeerStatus({ status, shareCode, error }: Props) {
  function getText(): string {
    switch (status) {
      case "connected":
        return "Peer is connected";
      case "connecting":
        return "Connecting to peer...";
      case "disconnected":
        return "Waiting for peer";
      case "error":
        return "Connection failure";
    }
  }

  function getIndicatorClass(): string {
    switch (status) {
      case "connected":
        return "peer-status__indicator--connected";
      case "connecting":
        return "peer-status__indicator--connecting";
      case "disconnected":
        return "peer-status__indicator--disconnected";
      case "error":
        return "peer-status__indicator--error";
    }
  }

  return (
    <div className="peer-status">
      <div className="peer-status__content">
        <div className={`peer-status__indicator ${getIndicatorClass()}`}></div>
        <div className="peer-status__text">{getText()}</div>
      </div>
      {error && <div className="peer-status__error">{error}</div>}

      {status === "disconnected" && (
        <div className="peer-status__share">
          <ShareLink code={shareCode} />
        </div>
      )}
    </div>
  );
}

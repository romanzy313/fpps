import { PeerConnectionStatus } from "../core/WebRTC/types";

export function PeerStatus({
  status,
  error,
}: {
  status: PeerConnectionStatus;
  error: Error | null;
}) {
  function getText() {
    switch (status) {
      case "connected":
        return "Peer is connected";
      case "connecting":
        return "Connecting to peer...";
      case "disconnected":
        return "Waiting for peer";
      default:
        return "";
    }
  }

  function getIndicatorClass() {
    switch (status) {
      case "connected":
        return "peer-status__indicator--connected";
      case "connecting":
        return "peer-status__indicator--connecting";
      case "disconnected":
        return "peer-status__indicator--disconnected";
      default:
        return "";
    }
  }

  return (
    <div className="peer-status">
      <div className="peer-status__content">
        <div className={`peer-status__indicator ${getIndicatorClass()}`}></div>
        <div className="peer-status__text">{getText()}</div>
      </div>
      {error ? (
        <div className="peer-status__error">ERROR: {error.message}</div>
      ) : null}
    </div>
  );
}

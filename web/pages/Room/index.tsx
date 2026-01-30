import "./style.css";
import { Me } from "../../components/Me";
import { Peer } from "../../components/Peer";
import { config } from "../../config";
import { useRoom } from "../../hooks/useRoom";
import { PeerConnectionStatus } from "../../core/WebRTC/types";

export function Room() {
  const {
    connectionState,
    myFiles,
    peerFiles,
    shareCode,
    addMoreFiles,
    clearFiles,
    startDownload,
    abortDownload,
    abortUpload,
    downloadStatus,
    downloadStats,
    uploadStatus,
    uploadStats,
  } = useRoom();

  return (
    <div className="room-container">
      <script src="/streamsaver/StreamSaver.js"></script>
      <PeerStatus status={connectionState} error={null}></PeerStatus>
      {connectionState !== "connected" ? (
        <Share code={shareCode}></Share>
      ) : null}
      <div className="files-layout">
        <div className="my-files">
          <Me
            peerFiles={myFiles}
            uploadStatus={uploadStatus}
            addMyFiles={addMoreFiles}
            clearFiles={clearFiles}
            transferStats={uploadStats}
            abortUpload={abortUpload}
          ></Me>
        </div>
        <div className="peer-files">
          <Peer
            peerFiles={peerFiles}
            downloadStatus={downloadStatus}
            startDownload={startDownload}
            transferStats={downloadStats}
            abortDownload={abortDownload}
          ></Peer>
        </div>
      </div>
    </div>
  );
}

function Share({ code }: { code: string }) {
  return (
    <div className="share-section">
      <h2 className="share-section__title">Waiting for Peer to Connect</h2>
      <div className="share-section__code-container">
        <div className="share-section__code-label">Share Code</div>
        <div className="share-section__code">{code}</div>
      </div>
      <div className="share-section__link-container">
        <div className="share-section__link-label">Or share this link:</div>
        <a
          href={`${config.appUrl}/room#${code}`}
          className="share-section__link"
        >
          {`${config.appUrl}/room#${code}`}
        </a>
      </div>
    </div>
  );
}

function PeerStatus({
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

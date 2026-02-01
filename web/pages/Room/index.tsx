import "./style.css";

import { Me } from "../../components/Me";
import { Peer } from "../../components/Peer";
import { useRoom } from "../../hooks/useRoom";
import { PeerStatus } from "../../components/PeerStatus";

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
    error,
  } = useRoom();

  return (
    <div className="room-container container">
      <PeerStatus
        status={connectionState}
        error={error}
        shareCode={shareCode}
      ></PeerStatus>
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
      <script src="/streamsaver/StreamSaver.js"></script>
    </div>
  );
}

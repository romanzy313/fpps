import "./style.css";
import { MyFiles } from "../../components/MyFiles";
import { PeerFiles } from "../../components/PeerFiles";
import { config } from "../../config";
import { useRoom } from "../../hooks/useRoom";
import { PeerConnectionStatus } from "~/core/WebRTC/WebRTCPeerChannelManager";

export function Room() {
  // const { value, setValue } = useRoomParams(); // TODO: maybe this is needed to update it?

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
    <div>
      <script src="/streamsaver/StreamSaver.js"></script>
      <PeerStatus status={connectionState} error={null}></PeerStatus>
      {connectionState !== "connected" ? (
        <Share code={shareCode}></Share>
      ) : null}
      <div>
        <div className={"my-files"}>
          <MyFiles
            peerFiles={myFiles}
            uploadStatus={uploadStatus}
            addMyFiles={addMoreFiles}
            clearFiles={clearFiles}
            transferStats={uploadStats}
            abortUpload={abortUpload}
          ></MyFiles>
        </div>
        <div className={"peer-files"}>
          <PeerFiles
            peerFiles={peerFiles}
            downloadStatus={downloadStatus}
            startDownload={startDownload}
            transferStats={downloadStats}
            abortDownload={abortDownload}
          ></PeerFiles>
        </div>
      </div>
    </div>
  );
}

function Share({ code }: { code: string }) {
  return (
    <div>
      <div>
        Invite them with the following code: <b>{code}</b>
      </div>
      <div>
        Or share this link: <i>{`${config.appUrl}/room#${code}`}</i>{" "}
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
        return "Peer is connected.";
      case "connecting":
        return "Peer is connecting.";
      case "disconnected":
        return "Waiting for peer.";
      default:
        return "";
    }
  }

  // switch (status) {
  //   case:
  //     }

  return (
    <div>
      <div>{getText()}</div>
      {error ? <div>ERROR: {error.message}</div> : null}
    </div>
  );
}

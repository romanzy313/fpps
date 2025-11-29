import "./style.css";
import { MyFiles } from "../../components/MyFiles";
import { PeerFiles } from "../../components/PeerFiles";
import { config } from "../../config";
import { useRoom } from "../../hooks/useRoom";

export function Room() {
  // const { value, setValue } = useRoomParams(); // TODO: maybe this is needed to update it?

  const {
    connectionState,
    myFiles,
    peerFiles,
    shareCode,
    addMoreFiles,
    startDownload,
    abortDownload,
    abortUpload,
    downloadStatus,
    downloadStats,
    uploadStatus,
    uploadStats,
    roomParams,
  } = useRoom();

  const isPeerOffline = connectionState === "disconnected";

  return (
    <div>
      <h1>Room</h1>
      <pre>
        <code>
          <div>PeerId: {roomParams.peerId}</div>
          <div>MyId: {roomParams.myId}</div>
          <div>Secret: {roomParams.secret}</div>
        </code>
      </pre>
      {isPeerOffline ? (
        <div>
          <div>Peer is offline</div>
          <div>
            Invite them with the following code: <b>{shareCode}</b>
          </div>
          <div>
            Or share this link:{" "}
            <i>{`${config.appUrl}/room#${shareCode}`}</i>{" "}
          </div>
        </div>
      ) : (
        <div>Peer status: {connectionState}</div>
      )}
      <div>
        <div className={"my-files"}>
          <MyFiles
            peerFiles={myFiles}
            uploadStatus={uploadStatus}
            addMyFiles={addMoreFiles}
            transferStats={uploadStats}
          ></MyFiles>
        </div>
        <div className={"peer-files"}>
          <PeerFiles
            peerFiles={peerFiles}
            downloadStatus={downloadStatus}
            startDownload={startDownload}
            transferStats={downloadStats}
          ></PeerFiles>
        </div>
      </div>
      {/*<div>
        <h2>Test zone</h2>
        <button
          onClick={() =>
            sendMessageToPeer.current!({
              type: "testMessage",
              value: "Something",
            })
          }
        >
          Send something
        </button>
      </div>*/}
    </div>
  );
}

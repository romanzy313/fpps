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
    clearFiles,
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
      <script src="/streamsaver/StreamSaver.js"></script>
      <button
        onClick={async () => {
          const stream = window.streamSaver.createWriteStream("please.txt", {});

          const writer = stream.getWriter();
          // await writer.write(new TextEncoder().encode("please"));
          // await writer.write(new TextEncoder().encode(" work\n"));

          const count = 100_000;

          for (let i = 0; i < count; i++) {
            await writer.write(new TextEncoder().encode("please "));
          }

          await writer.close();
        }}
      >
        Test download
      </button>
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

import { RoomStore } from "../hooks/useRoomStore";
import { JsonDebug } from "./JsonDebug";

type Props = {
  roomStore: RoomStore;
};

export function PeerFiles({ roomStore }: Props) {
  const fileCount = roomStore.state.peerFiles.totalCount;
  const fileSize = roomStore.state.peerFiles.totalSizeBytes;

  function onDownload() {
    alert("starting file download...");
  }

  return (
    <>
      <h2>
        Peer Files ({fileCount} files, {fileSize} bytes)
      </h2>
      <div className="bg-grey" style={{ height: "20rem", overflowY: "auto" }}>
        <div>File browser does here</div>
        <JsonDebug data={roomStore.state.peerFiles} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          gap: "1rem",
          padding: "1rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          disabled={fileCount === 0}
          onClick={() => onDownload()}
        >
          Download {fileCount} files as ZIP
        </button>
      </div>
    </>
  );
}

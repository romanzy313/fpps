import { UseRoom } from "../hooks/useRoom";
import { JsonDebug } from "./JsonDebug";

type Props = {
  room: UseRoom;
};

export function PeerFiles({ room }: Props) {
  const fileCount = room.state.peerFiles.totalCount;
  const fileSize = room.state.peerFiles.totalSizeBytes;

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
        <JsonDebug data={room.state.peerFiles} />
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

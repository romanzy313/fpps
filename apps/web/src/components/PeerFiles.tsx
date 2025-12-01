import { JsonDebug } from "./JsonDebug";
import { FullFilesState } from "../core/Core";
import { TransferStats, TransferStatus } from "../core/PeerChannel";
import { formatFileSize } from "../utils/formatSize";

type Props = {
  peerFiles: FullFilesState;
  transferStats: TransferStats;
  downloadStatus: TransferStatus;
  startDownload: () => void;
};

export function PeerFiles({
  peerFiles,
  downloadStatus,
  transferStats,
  startDownload,
}: Props) {
  const fileCount = peerFiles.totalCount;
  const fileSizeBytes = peerFiles.totalBytes;

  const progress =
    transferStats.totalBytes > 0
      ? transferStats.transferredBytes / transferStats.totalBytes
      : 0;

  return (
    <>
      <h2>
        Peer Files ({fileCount} files, {formatFileSize(fileSizeBytes)})
      </h2>
      <div className="bg-grey" style={{ height: "20rem", overflowY: "auto" }}>
        <div>File browser does here</div>
        <JsonDebug data={peerFiles} />
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
          disabled={fileCount === 0 || downloadStatus === "transfer"}
          onClick={() => startDownload()}
        >
          Download {fileCount} files as ZIP
        </button>
      </div>

      <div>
        <h3>Download state: {downloadStatus}</h3>
        <div>
          <div>
            <span>{transferStats.currentIndex}</span> out of{" "}
            <span>{transferStats.totalFiles}</span> files
          </div>
          <div>
            <span>{formatFileSize(transferStats.transferredBytes)}</span> out of{" "}
            <span>{formatFileSize(transferStats.totalBytes)}</span>
          </div>
          <div>
            Progress: <span>{progress * 100}%</span>
          </div>
        </div>
      </div>
    </>
  );
}

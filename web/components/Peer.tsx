import { FullFilesState } from "../core/Core";
import { TransferStats, TransferStatus } from "../core/PeerChannel";
import { formatFileSize } from "../utils/formatSize";
import { TransferProgress } from "./TransferProgress";

type Props = {
  peerFiles: FullFilesState;
  transferStats: TransferStats;
  downloadStatus: TransferStatus;
  startDownload: () => void;
  abortDownload: () => void;
};

export function Peer({
  peerFiles,
  downloadStatus,
  transferStats,
  startDownload,
  abortDownload,
}: Props) {
  const fileCount = peerFiles.totalCount;
  const fileSizeText = formatFileSize(peerFiles.totalBytes);

  return (
    <>
      <h2>Peer</h2>
      <div>
        {fileCount} files, {fileSizeText}
      </div>
      <div>
        <h3>Download state: {downloadStatus}</h3>
        <TransferProgress stats={transferStats}></TransferProgress>
      </div>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          padding: "1rem",
          alignItems: "center",
        }}
      >
        <div>
          <button
            type="button"
            disabled={fileCount === 0 || downloadStatus === "transfer"}
            onClick={() => startDownload()}
          >
            Download as ZIP
          </button>
        </div>
        <div>
          <button
            type="button"
            disabled={downloadStatus !== "transfer"}
            onClick={() => abortDownload()}
          >
            Stop
          </button>
        </div>
      </div>
    </>
  );
}

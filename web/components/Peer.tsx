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

  function getStatusText(): string {
    if (fileCount === 0) {
      return "Waiting for peer to select files";
    }

    switch (downloadStatus) {
      case "idle":
        return "Waiting to start the download";
      case "transfer":
        return "Downloading...";
      case "done":
        return "Completed";
      case "aborted":
        return "Download stopped";
    }
  }

  return (
    <div className="file-section">
      <div className="file-section__header">
        <h2 className="file-section__title">Peer&apos;s Files</h2>
        <div className="file-section__summary">
          <div className="file-section__summary-item">
            <span className="file-section__summary-label">Files:</span>
            <span className="file-section__summary-value">{fileCount}</span>
          </div>
          <div className="file-section__summary-item">
            <span className="file-section__summary-label">Size:</span>
            <span className="file-section__summary-value">{fileSizeText}</span>
          </div>
        </div>
      </div>

      <div className="transfer-status-text">{getStatusText()}</div>

      <TransferProgress stats={transferStats}></TransferProgress>

      <div className="file-section__actions">
        <div className="actions-row">
          <div className="action-group">
            <label className="action-group__label">Download</label>
            <button
              type="button"
              disabled={fileCount === 0 || downloadStatus === "transfer"}
              onClick={() => startDownload()}
            >
              Download as ZIP
            </button>
          </div>
          <div className="action-group">
            <label className="action-group__label">Stop Transfer</label>
            <button
              className="danger"
              type="button"
              disabled={downloadStatus !== "transfer"}
              onClick={() => abortDownload()}
            >
              Stop Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

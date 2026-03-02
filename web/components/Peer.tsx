import { FullFilesState } from "../core/Core";
import {
  TransferProgress,
  TransferProgressValue,
  TransferStatus,
} from "../core";
import { formatSize } from "../utils/formatSize";
import { TransferProgressDisplay } from "./TransferProgressDisplay";

type Props = {
  peerFiles: FullFilesState;
  downloadStatus: TransferStatus;
  transferSpeed: TransferProgressValue;
  startDownload: () => void;
  abortDownload: () => void;
};

export function Peer({
  peerFiles,
  downloadStatus,
  transferSpeed,
  startDownload,
  abortDownload,
}: Props) {
  const fileCount = peerFiles.totalFiles;
  const fileSizeText = formatSize(peerFiles.totalBytes);

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
      case "error":
        return "Transfer error, please try again";
    }
  }

  return (
    <div className="card file-section">
      <div className="file-section__header">
        <h2 className="file-section__title">Peer's Files</h2>
        <div className="file-section__summary">
          <div className="file-section__summary-item">
            <span className="file-section__summary-label">Files:</span>
            <span
              data-testid="peer-file-count"
              className="file-section__summary-value"
            >
              {fileCount}
            </span>
          </div>
          <div className="file-section__summary-item">
            <span className="file-section__summary-label">Size:</span>
            <span
              data-testid="peer-file-size"
              className="file-section__summary-value"
            >
              {fileSizeText}
            </span>
          </div>
        </div>
      </div>

      <div
        data-testid="peer-transfer-status-text"
        className="transfer-status-text"
      >
        {getStatusText()}
      </div>

      <TransferProgressDisplay
        progress={transferSpeed}
      ></TransferProgressDisplay>

      {/* Spacer to match Me component's upload section height on desktop */}
      <div className="upload-section-spacer"></div>

      <div className="file-section__actions">
        <div className="actions-row">
          <button
            data-testid="start-download-button"
            type="button"
            disabled={fileCount === 0 || downloadStatus === "transfer"}
            onClick={() => startDownload()}
          >
            Download as ZIP
          </button>
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
  );
}

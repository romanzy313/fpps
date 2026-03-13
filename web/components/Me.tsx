import { FullFilesState } from "../core/Core";
import { TransferProgressValue, TransferStatus } from "../core";
import { formatSize } from "../utils/formatSize";
import { TransferProgressDisplay } from "./TransferProgressDisplay";
import { FileUploader } from "./FileUploader";

type Props = {
  peerFiles: FullFilesState;
  uploadStatus: TransferStatus;
  transferSpeed: TransferProgressValue;
  addMyFiles: (files: File[]) => void;
  clearFiles: () => void;
  abortUpload: () => void;
};

export function Me({
  peerFiles,
  uploadStatus,
  transferSpeed,
  addMyFiles,
  clearFiles,
  abortUpload,
}: Props) {
  const fileCount = peerFiles.totalFiles;
  const fileSizeText = formatSize(peerFiles.totalBytes);

  const canUploadFiles = uploadStatus !== "transfer";

  function onFilesSelected(files: File[]) {
    if (!canUploadFiles) {
      return;
    }

    addMyFiles(files);
  }

  function getStatusText(): string {
    if (fileCount === 0) {
      return "No files selected";
    }

    switch (uploadStatus) {
      case "idle":
        return "Waiting for peer to start downloading";
      case "transfer":
        return "Uploading...";
      case "done":
        return "Completed";
      case "aborted":
        return "Upload stopped";
      case "error":
        return "Transfer error, please try again";
    }
  }

  return (
    <div className="card file-section">
      <div className="file-section__header">
        <h2 className="file-section__title">My Files</h2>
        <div className="file-section__summary">
          <div className="file-section__summary-item">
            <span className="file-section__summary-label">Files:</span>
            <span
              data-testid="my-file-count"
              className="file-section__summary-value"
            >
              {fileCount}
            </span>
          </div>
          <div className="file-section__summary-item">
            <span className="file-section__summary-label">Size:</span>
            <span
              data-testid="my-file-size"
              className="file-section__summary-value"
            >
              {fileSizeText}
            </span>
          </div>
        </div>
      </div>
      <div
        data-testid="my-transfer-status-text"
        className="transfer-status-text"
      >
        {getStatusText()}
      </div>

      <TransferProgressDisplay
        progress={transferSpeed}
      ></TransferProgressDisplay>

      <div className="file-section__actions">
        <FileUploader
          canClear={fileCount > 0}
          onClear={clearFiles}
          onSelect={onFilesSelected}
        ></FileUploader>
        <div className="actions-row">
          <button
            className="danger"
            disabled={uploadStatus !== "transfer"}
            onClick={abortUpload}
          >
            Stop Upload
          </button>
        </div>
      </div>
    </div>
  );
}

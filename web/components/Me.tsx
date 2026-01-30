import { FullFilesState } from "../core/Core";
import { TransferStats, TransferStatus } from "../core/PeerChannel";
import { formatFileSize } from "../utils/formatSize";
import { TransferProgress } from "./TransferProgress";

type Props = {
  peerFiles: FullFilesState;
  uploadStatus: TransferStatus;
  transferStats: TransferStats;
  addMyFiles: (files: File[]) => void;
  clearFiles: () => void;
  abortUpload: () => void;
};

export function Me({
  peerFiles,
  uploadStatus,
  transferStats,
  addMyFiles,
  clearFiles,
  abortUpload,
}: Props) {
  const fileCount = peerFiles.totalCount;
  const fileSizeText = formatFileSize(peerFiles.totalBytes);

  const canUploadFiles = uploadStatus !== "transfer";

  function onFilesSelect(fileList: FileList) {
    if (!canUploadFiles) {
      return;
    }

    const files: File[] = [];

    for (const file of fileList) {
      files.push(file);
    }

    addMyFiles(files);
  }

  function getStatusClass() {
    switch (uploadStatus) {
      case "idle":
        return "transfer-status__state--idle";
      case "transfer":
        return "transfer-status__state--transfer";
      case "done":
        return "transfer-status__state--done";
      case "aborted":
        return "transfer-status__state--error";
      default:
        return "transfer-status__state--idle";
    }
  }

  return (
    <div className="file-section">
      <div className="file-section__header">
        <h2 className="file-section__title">My Files</h2>
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

      <div className="transfer-status">
        <div className="transfer-status__title">Upload Status</div>
        <div className={`transfer-status__state ${getStatusClass()}`}>
          {uploadStatus}
        </div>
        <TransferProgress stats={transferStats}></TransferProgress>
      </div>

      <div className="file-section__actions">
        <div className="actions-row">
          <div className="action-group">
            <label className="action-group__label">Upload Folder</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                disabled={!canUploadFiles}
                multiple
                {...({
                  webkitdirectory: true,
                  mozdirectory: true,
                  directory: true,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)}
                onChange={(e) => onFilesSelect(e.currentTarget.files!)}
              />
            </div>
          </div>
          <div className="action-group">
            <label className="action-group__label">Upload Files</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                disabled={!canUploadFiles}
                multiple
                onChange={(e) => onFilesSelect(e.currentTarget.files!)}
              />
            </div>
          </div>
        </div>
        <div className="actions-row">
          <div className="action-group">
            <label className="action-group__label">Actions</label>
            <button
              className="secondary"
              disabled={uploadStatus === "transfer"}
              onClick={clearFiles}
            >
              Clear Files
            </button>
          </div>
          <div className="action-group">
            <label className="action-group__label">Stop Transfer</label>
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
    </div>
  );
}

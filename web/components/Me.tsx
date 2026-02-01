import { useState } from "preact/hooks";
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

  const [isDraggingFolder, setIsDraggingFolder] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // These vibes could be abstracted
  function handleDragOver(e: DragEvent, type: "folder" | "files") {
    e.preventDefault();
    e.stopPropagation();
    if (type === "folder") {
      setIsDraggingFolder(true);
    } else {
      setIsDraggingFiles(true);
    }
  }

  function handleDragLeave(e: DragEvent, type: "folder" | "files") {
    e.preventDefault();
    e.stopPropagation();
    if (type === "folder") {
      setIsDraggingFolder(false);
    } else {
      setIsDraggingFiles(false);
    }
  }

  function handleDrop(e: DragEvent, type: "folder" | "files") {
    e.preventDefault();
    e.stopPropagation();
    if (type === "folder") {
      setIsDraggingFolder(false);
    } else {
      setIsDraggingFiles(false);
    }

    if (!canUploadFiles) {
      return;
    }

    const files = e.dataTransfer?.files;
    if (files) {
      onFilesSelect(files);
    }
  }

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
    }
  }

  return (
    <div className="card file-section">
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

      <div className="transfer-status-text">{getStatusText()}</div>

      <TransferProgress stats={transferStats}></TransferProgress>

      <div className="file-section__actions">
        <div className="actions-row">
          <div className="action-group">
            <label className="action-group__label" htmlFor="upload-folder">
              Upload Folder
            </label>
            <div
              className={`file-input-wrapper ${isDraggingFolder ? "file-input-wrapper--dragging" : ""}`}
              onDragOver={(e) => handleDragOver(e, "folder")}
              onDragLeave={(e) => handleDragLeave(e, "folder")}
              onDrop={(e) => handleDrop(e, "folder")}
            >
              <input
                id="upload-folder"
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
            <label className="action-group__label" htmlFor="upload-files">
              Upload Files
            </label>
            <div
              className={`file-input-wrapper ${isDraggingFiles ? "file-input-wrapper--dragging" : ""}`}
              onDragOver={(e) => handleDragOver(e, "files")}
              onDragLeave={(e) => handleDragLeave(e, "files")}
              onDrop={(e) => handleDrop(e, "files")}
            >
              <input
                id="upload-files"
                type="file"
                disabled={!canUploadFiles}
                multiple
                onChange={(e) => onFilesSelect(e.currentTarget.files!)}
              />
            </div>
          </div>
        </div>
        <div className="actions-row">
          <button
            className="secondary"
            disabled={uploadStatus === "transfer" || peerFiles.totalCount === 0}
            onClick={clearFiles}
          >
            Clear Files
          </button>
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

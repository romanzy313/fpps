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

  return (
    <>
      <h2>Me</h2>
      <div>
        {fileCount} files, {fileSizeText}
      </div>

      <div>
        <h3>Upload state: {uploadStatus}</h3>
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
          <div>Upload folder</div>
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
        <div>
          <div>Upload files</div>
          <input
            type="file"
            disabled={!canUploadFiles}
            multiple
            onChange={(e) => onFilesSelect(e.currentTarget.files!)}
          />
        </div>
        <div>
          <div>Clear files</div>
          <button disabled={uploadStatus === "transfer"} onClick={clearFiles}>
            Clear
          </button>
        </div>
        <div>
          <div>Stop upload</div>
          <button disabled={uploadStatus !== "transfer"} onClick={abortUpload}>
            Stop
          </button>
        </div>
      </div>
    </>
  );
}

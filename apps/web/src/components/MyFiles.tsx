import { JsonDebug } from "./JsonDebug";
import { FullFilesState } from "../core/Core";
import { TransferStats, TransferStatus } from "../core/PeerChannel";
import { formatFileSize } from "../utils/formatSize";

type Props = {
  peerFiles: FullFilesState;
  uploadStatus: TransferStatus;
  transferStats: TransferStats;
  addMyFiles: (files: File[]) => void;
};

export function MyFiles({
  peerFiles,
  uploadStatus,
  transferStats,
  addMyFiles,
}: Props) {
  const fileCount = peerFiles.totalCount;
  const fileSize = peerFiles.totalBytes;

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
      <h2>
        My Files ({fileCount} files, {formatFileSize(fileSize)})
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
      </div>
      <div>
        <h3>Upload state: {uploadStatus}</h3>
        <div>
          <div>
            <span>{transferStats.currentIndex}</span> out of{" "}
            <span>{transferStats.totalFiles}</span> files
          </div>
          <div>
            <span>{formatFileSize(transferStats.transferredBytes)}</span> out of{" "}
            <span>{formatFileSize(transferStats.totalBytes)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

import { useMemo } from "preact/hooks";
import { FileItem } from "../peer/Core";
import { JsonDebug } from "./JsonDebug";

type Props = {
  fileItems: FileItem[];
  startDownload: () => void;
};

export function PeerFiles({ fileItems, startDownload }: Props) {
  const fileCount = useMemo(() => fileItems.length, [fileItems]);
  const fileSizeBytes = useMemo(
    () => fileItems.reduce((acc, item) => acc + item.sizeBytes, 0),
    [fileItems],
  );
  function onDownload() {
    startDownload();
  }

  return (
    <>
      <h2>
        Peer Files ({fileCount} files, {fileSizeBytes} bytes)
      </h2>
      <div className="bg-grey" style={{ height: "20rem", overflowY: "auto" }}>
        <div>File browser does here</div>
        <JsonDebug data={fileItems} />
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

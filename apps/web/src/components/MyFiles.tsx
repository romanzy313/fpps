import { useMemo } from "preact/hooks";
import { FileItem } from "../peer/Core";
import { JsonDebug } from "./JsonDebug";

type Props = {
  fileItems: FileItem[];
  addMyFiles: (files: File[]) => void;
};

export function MyFiles({ fileItems, addMyFiles }: Props) {
  const fileCount = useMemo(() => fileItems.length, [fileItems]);
  const fileSize = useMemo(
    () => fileItems.reduce((acc, item) => acc + item.sizeBytes, 0),
    [fileItems],
  );

  function onFilesSelect(fileList: FileList) {
    const files: File[] = [];

    for (const file of fileList) {
      files.push(file);
    }
    addMyFiles(files);
  }

  return (
    <>
      <h2>
        My Files ({fileCount} files, {fileSize} bytes)
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
        <div>
          <div>Upload folder</div>
          <input
            type="file"
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
            multiple
            onChange={(e) => onFilesSelect(e.currentTarget.files!)}
          />
        </div>
      </div>
    </>
  );
}

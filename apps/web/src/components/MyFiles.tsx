import { UseRoom } from "../hooks/useRoom";
import { RoomStore } from "../hooks/useRoomStore";
import { JsonDebug } from "./JsonDebug";

type Props = {
  room: UseRoom;
};

export function MyFiles({ room }: Props) {
  const fileCount = room.state.myFiles.totalCount;
  const fileSize = room.state.myFiles.totalSizeBytes;

  function onFilesSelect(fileList: FileList) {
    const files: File[] = [];

    for (const file of fileList) {
      files.push(file);
    }
    room.addMyFiles(files);
  }

  return (
    <>
      <h2>
        My Files ({fileCount} files, {fileSize} bytes)
      </h2>
      <div className="bg-grey" style={{ height: "20rem", overflowY: "auto" }}>
        <div>File browser does here</div>
        <JsonDebug data={room.state.myFiles} />
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

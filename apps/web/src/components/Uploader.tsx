import { useFileUpload } from "../hooks/useFileUpload";

export function Uploader() {
  const { state, dispatch } = useFileUpload();

  function onFilesSelect(fileList: FileList) {
    const files: File[] = [];

    for (const file of fileList) {
      files.push(file);
    }
    dispatch({ type: "filesSelected", files });
  }

  return (
    <div>
      <div>
        <h2>State</h2>
        <pre>
          <code>{JSON.stringify(state, null, 2)}</code>
        </pre>
      </div>
      <div>
        <h2>Upload</h2>
        <input
          type="file"
          multiple
          {...({
            webkitdirectory: "",
            mozdirectory: "",
            directory: "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)}
          onChange={(e) => onFilesSelect(e.currentTarget.files!)}
        />
      </div>
    </div>
  );
}

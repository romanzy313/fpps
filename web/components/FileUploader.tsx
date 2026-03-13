import { useRef } from "react";

type Props = {
  onSelect: (files: File[]) => void;
  enabled: boolean;
};

export function FileUploader({ onSelect, enabled }: Props) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  function onFilesSelect(fileList: FileList) {
    if (!enabled) return;
    onSelect(Array.from(fileList));
  }

  function openFilesPicker() {
    if (!enabled) return;
    filesInputRef.current?.click();
  }

  function openFolderPicker() {
    if (!enabled) return;
    folderInputRef.current?.click();
  }

  return (
    <div className="actions-row">
      <div className="action-group">
        <input
          ref={filesInputRef}
          id="upload-files"
          data-testid="upload-files-input"
          type="file"
          disabled={!enabled}
          multiple
          className="file-input file-input--hidden"
          onChange={(e) =>
            e.currentTarget.files && onFilesSelect(e.currentTarget.files)
          }
        />
        <button
          type="button"
          className="secondary"
          disabled={!enabled}
          onClick={openFilesPicker}
        >
          Choose Files
        </button>
      </div>

      <div className="action-group">
        <input
          ref={folderInputRef}
          id="upload-folder"
          type="file"
          disabled={!enabled}
          multiple
          className="file-input file-input--hidden"
          {...({
            webkitdirectory: true,
            mozdirectory: true,
            directory: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)}
          onChange={(e) =>
            e.currentTarget.files && onFilesSelect(e.currentTarget.files)
          }
        />
        <button
          type="button"
          className="secondary"
          disabled={!enabled}
          onClick={openFolderPicker}
        >
          Choose Folder
        </button>
      </div>
    </div>
  );
}

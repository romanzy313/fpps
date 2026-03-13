import { useRef } from "react";

type Props = {
  onSelect: (files: File[]) => void;
  onClear: () => void;
  canClear: boolean;
};

export function FileUploader({ onSelect, onClear, canClear }: Props) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  function onFilesSelect(fileList: FileList) {
    onSelect(Array.from(fileList));
  }

  function openFilesPicker() {
    filesInputRef.current?.click();
  }

  function openFolderPicker() {
    folderInputRef.current?.click();
  }

  return (
    <div className="actions-row">
      <div className="actions-group-grow">
        <div className="action-item">
          <input
            ref={filesInputRef}
            id="upload-files"
            data-testid="upload-files-input"
            tabIndex={-1}
            type="file"
            multiple
            className="file-input--hidden"
            onChange={(e) =>
              e.currentTarget.files && onFilesSelect(e.currentTarget.files)
            }
          />
          <button type="button" className="secondary" onClick={openFilesPicker}>
            Choose Files
          </button>
        </div>

        <div className="action-item">
          <input
            ref={folderInputRef}
            id="upload-folder"
            tabIndex={-1}
            type="file"
            multiple
            className="file-input--hidden"
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
            onClick={openFolderPicker}
          >
            Choose Folder
          </button>
        </div>
      </div>

      {canClear && (
        <div className="action-group-shrink">
          <button className="secondary" onClick={onClear}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

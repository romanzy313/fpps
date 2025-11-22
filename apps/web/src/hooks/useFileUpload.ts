import { useReducer } from "preact/hooks";

type FileUploadEvent =
  | {
      type: "filesSelected";
      files: File[];
    }
  | {
      type: "fileUploaded";
      index: number;
    };

type FileUploadState = {
  totalCount: number;
  totalSizeBytes: number;
  uploadedIndex: number;
  uploadedSizeBytes: number;
  files: {
    path: string;
    name: string;
    sizeBytes: number;
    file: File;
    status: "TODO";
  }[];
};

function fileUploadReducer(
  state: FileUploadState,
  event: FileUploadEvent,
): FileUploadState {
  switch (event.type) {
    case "filesSelected":
      return {
        ...state,
        totalCount: event.files.length,
        totalSizeBytes: event.files.reduce((acc, file) => acc + file.size, 0),
        uploadedIndex: 0,
        uploadedSizeBytes: 0,
        files: event.files.map((file) => ({
          path: file.webkitRelativePath,
          name: file.name,
          sizeBytes: file.size,
          file,
          status: "TODO",
        })),
      };
    case "fileUploaded":
      return {
        ...state,
        uploadedIndex: event.index + 1,
        uploadedSizeBytes:
          state.uploadedSizeBytes + state.files[event.index].sizeBytes,
      };
  }
}

export function useFileUpload() {
  const [state, dispatch] = useReducer(fileUploadReducer, {
    totalCount: 0,
    totalSizeBytes: 0,
    uploadedIndex: 0,
    uploadedSizeBytes: 0,
    files: [],
  });

  return {
    state,
    dispatch,
  };
}

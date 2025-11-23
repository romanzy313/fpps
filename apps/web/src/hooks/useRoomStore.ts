import { useReducer } from "preact/hooks";
import { RoomParams } from "../utils/roomParams";

type FileStatus = "TODO";

type MyFiles = {
  totalCount: number;
  totalSizeBytes: number;
  uploadedIndex: number;
  uploadedSizeBytes: number;
  items: {
    path: string;
    name: string;
    sizeBytes: number;
    file: File;
    status: FileStatus;
  }[];
};
type PeerFiles = {
  totalCount: number;
  totalSizeBytes: number;
  downloadedIndex: number;
  downloadedSizeBytes: number;
  items: {
    path: string;
    name: string;
    sizeBytes: number;
    status: FileStatus;
  }[];
};

export type RoomStoreState = {
  connection: {
    apiError: string;
    peerStatus: "connected" | "connecting" | "disconnected";
    peerError: string;
  };
  room: RoomParams;
  myFiles: MyFiles;
  peerFiles: PeerFiles;
};

function initialState(roomParams: RoomParams): RoomStoreState {
  return {
    connection: {
      apiError: "",
      peerStatus: "disconnected",
      peerError: "",
    },
    room: roomParams,
    myFiles: {
      totalCount: 0,
      totalSizeBytes: 0,
      uploadedIndex: 0,
      uploadedSizeBytes: 0,
      items: [],
    },
    peerFiles: {
      totalCount: 0,
      totalSizeBytes: 0,
      downloadedIndex: 0,
      downloadedSizeBytes: 0,
      items: [],
    },
  };
}

type RoomStoreAction =
  | { type: "peerConnected" }
  | { type: "peerConnecting"; peerId: string }
  | { type: "peerError"; error: string }
  | {
      type: "filesAdded";
      files: File[];
    }
  | {
      type: "fileUploaded";
    };

function roomStoreReducer(
  state: RoomStoreState,
  action: RoomStoreAction,
): RoomStoreState {
  switch (action.type) {
    case "peerConnected":
      return {
        ...state,
        connection: {
          ...state.connection,
          peerStatus: "connected",
          peerError: "",
        },
      };
    case "peerConnecting":
      return {
        ...state,
        connection: {
          ...state.connection,
          peerStatus: "connecting",
          peerError: "",
        },
        room: {
          ...state.room,
          peerId: action.peerId,
        },
      };
    case "peerError":
      return {
        ...state,
        connection: {
          ...state.connection,
          peerStatus: "disconnected",
          peerError: action.error,
        },
      };
    case "filesAdded":
      return {
        ...state, // does this need a deep copy?
        myFiles: {
          totalCount: action.files.length + state.myFiles.totalCount,
          totalSizeBytes: action.files.reduce(
            (acc, file) => acc + file.size,
            state.myFiles.totalSizeBytes,
          ),
          uploadedIndex: state.myFiles.uploadedIndex,
          uploadedSizeBytes: state.myFiles.uploadedSizeBytes,
          items: [
            ...state.myFiles.items,
            ...action.files.map((file) => ({
              path: file.webkitRelativePath.replace("/" + file.name, ""), // TODO: check windows
              name: file.name,
              sizeBytes: file.size,
              file,
              status: "TODO" as const,
            })),
          ],
        },
      };
    case "fileUploaded":
      return {
        ...state,
        myFiles: {
          ...state.myFiles,
          uploadedIndex: state.myFiles.uploadedIndex + 1,
          uploadedSizeBytes:
            state.myFiles.uploadedSizeBytes +
            state.myFiles.items[state.myFiles.uploadedIndex].sizeBytes,
        },
      };
  }
}

// a single store will be used for the whole application
export function useRoomStore(roomParams: RoomParams) {
  console.log("created room store with params", { roomParams });
  const [state, dispatch] = useReducer(
    roomStoreReducer,
    initialState(roomParams),
  );

  return {
    state,
    dispatch,
  };
}

export type RoomStore = ReturnType<typeof useRoomStore>;

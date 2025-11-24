export type PeerMessage =
  | {
      type: "ping";
      value: null;
    }
  | {
      type: "pong";
      value: null;
    }
  | {
      type: "testMessage";
      value: string;
    }
  | {
      type: "filesAdded";
      value: {
        path: string;
        name: string;
        sizeBytes: number;
      }[];
    };

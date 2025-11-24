export type ProtocolType =
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
      type: "testBinary";
      value: Uint8Array;
    };

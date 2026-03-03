import { useEffect } from "preact/hooks";
import {
  canWebRTCUseDirectConnection,
  isWebRTCEnabled,
} from "../core/WebRTC/testWebRTC";
import { Toast } from "../utils/Toast";

export function useTestWebRTC() {
  useEffect(() => {
    console.log("TESTING WEBRTC");
    if (!isWebRTCEnabled()) {
      Toast.error("WebRTC is not enabled. FPPS will not work.", {
        dontAutoDismiss: true,
      });
      return;
    }

    canWebRTCUseDirectConnection().then((ok) => {
      if (!ok) {
        Toast.error(
          "WebRTC direct connection is not supported. You may not be able to connect to other peers.",
          { dontAutoDismiss: true },
        );
      }
    });
  });
}

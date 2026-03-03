export function isWebRTCEnabled() {
  if (typeof RTCPeerConnection === "undefined") {
    return false;
  }

  return true;
}

// returns true if Proxyless (direct) peer connectivity is enabled in the browser.
// Returns false if TURN server is required
export function canWebRTCUseDirectConnection(): Promise<boolean> {
  if (!isWebRTCEnabled) {
    return Promise.resolve(false);
  }

  const pc = new RTCPeerConnection({
    iceServers: [], // no ice servers... is this okay?
  });

  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      pc.close();

      console.info("WebRTC does not work due to timeout");
      resolve(false);
    }, 1000); // smaller timeout is okay without networked ice servers

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        const sdp = pc.localDescription?.sdp;

        // console.log("SDP", { desc: sdp });

        pc.close();
        clearTimeout(timeout);

        if (!sdp) {
          console.info("WebRTC does not work due to missing sdp");

          resolve(false);
          return;
        }

        const candidates = sdp
          .split("\r\n")
          .filter((line) => line.startsWith("a=candidate:"));

        const localCandidates = candidates.filter((candidate) =>
          candidate.includes("typ host"),
        );

        console.info("WebRTC candidate parsed", {
          totalCount: candidates.length,
          localCount: localCandidates.length,
          candidates: candidates,
        });

        if (candidates.length === 0) {
          // No candidates at all: candidate generation was suppressed, maybe?
          resolve(false);
          return;
        }

        resolve(true);
      }
    };

    pc.createDataChannel("test");

    pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    })
      .then((offer) => {
        pc.setLocalDescription(offer);
      })
      .catch((err) => {
        // failed
        console.error("WebRTC does not work due to error", { err });

        pc.close();
        clearTimeout(timeout);

        resolve(false);
      });
  });
}

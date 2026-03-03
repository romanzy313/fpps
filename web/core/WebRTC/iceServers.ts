type IceServers = (RTCIceServer & { provider: string })[];

export const publicGoogleStunServers = ["stun:stun.l.google.com:19302"];
export const devStunServers = ["stun:localhost:3478"];

const localDev = {
  provider: "Local Dev",
  urls: ["stun:localhost:3478"],
};

const iceServers: IceServers = [
  {
    provider: "Google",
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
    ],
  },
  {
    provider: "Mozilla",
    urls: ["stun:stun.services.mozilla.com:3478"],
  },
] as const;

// TODO: allow to exclude servers of the other peer
// TODO: randomize server selection
// TODO: limit to 5 servers (firefox suggests)
export function getIceServers(): IceServers {
  if (import.meta.env.DEV) {
    return [localDev, ...iceServers];
  }
  return iceServers;
}

type IceServersDef = {
  name: string;
  servers: RTCIceServer[];
};

export const publicGoogleStunServers = ["stun:stun.l.google.com:19302"];
export const devStunServers = ["stun:localhost:3478"];

export const iceServersList: IceServersDef[] = [
  {
    name: "Dev" as const,
    servers: [
      {
        urls: ["stun:localhost:3478"],
      },
    ],
  },
  {
    name: "Google" as const,
    servers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  },
] as const;

// this doesnt work well
// type AvailableServers = (typeof iceServersList)[number]["name"];

export function getIceServers(name: string) {
  const result = iceServersList.find((v) => v.name === name);

  if (!result) {
    throw new Error(`Invalid ice server name: ${name}`);
  }

  return result.servers;
}

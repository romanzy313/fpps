import "./style.css";
import { MyFiles } from "../../components/MyFiles";
import { useRoomStore } from "../../hooks/useRoomStore";
import { parseRoomParams, stringifyRoomParams } from "../../utils/roomParams";
import { PeerFiles } from "../../components/PeerFiles";
import { config } from "../../config";
import { useEffect } from "preact/hooks";
import { PeerChannelImpl, devStunServers } from "../../peer/PeerChannel";

export function Room() {
  // const { value, setValue } = useRoomParams(); // TODO: maybe this is needed to update it?

  const roomStore = useRoomStore(
    parseRoomParams(window.location.hash.substring(1)),
  );

  const { state, dispatch } = roomStore;

  const isPeerOffline = state.connection.peerStatus === "offline";

  useEffect(() => {
    const roomParams = parseRoomParams(window.location.hash.substring(1));
    // setup a peer channel here?
    console.log("initializing peer channel");
    const peerChannel = new PeerChannelImpl(
      roomParams,
      {
        onConnectionStateChange(status) {
          switch (status) {
            case "connected":
              dispatch({ type: "peerConnected" });
              break;
            case "connecting":
              dispatch({ type: "peerConnecting" });
              break;
            case "disconnected":
              dispatch({ type: "peerDisconnected" });
              break;
            case "failed":
              // hmmm
              dispatch({
                type: "peerError",
                error: "Connection to peer failed",
              });
              break;
          }
        },
        onDataDrained() {
          console.log("data drained");
        },
        onError(message) {
          console.error("connection error", message);
          dispatch({ type: "peerError", error: message });
        },
        onMessageReceived(message) {
          console.log("message received", message);
        },
      },
      {
        iceServerUris: [devStunServers],
      },
    );
    peerChannel.connect();

    return () => {
      console.log("closing peer channel");
      peerChannel.close();
    };
  }, []);

  function shareValues() {
    const code = stringifyRoomParams({
      myId: state.room.peerId,
      peerId: state.room.myId,
      secret: state.room.secret,
      isInitiator: !state.room.isInitiator,
    });

    return {
      code,
      url: `${config.appUrl}/room#${code}`,
    };
  }

  return (
    <div>
      <h1>Room</h1>
      <pre>
        <code>
          <div>PeerId: {state.room.peerId}</div>
          <div>MyId: {state.room.myId}</div>
          <div>Secret: {state.room.secret}</div>
        </code>
      </pre>
      {isPeerOffline ? (
        <div>
          <div>Peer is offline</div>
          <div>
            Invite them with the following code: <b>{shareValues().code}</b>
          </div>
          <div>
            Or share this link: <i>{shareValues().url}</i>{" "}
          </div>
        </div>
      ) : (
        <div>Peer status: {state.connection.peerStatus}</div>
      )}
      <div>
        <div className={"my-files"}>
          <MyFiles roomStore={roomStore}></MyFiles>
        </div>
        <div className={"peer-files"}>
          <PeerFiles roomStore={roomStore}></PeerFiles>
        </div>
      </div>
    </div>
  );
}

import "./style.css";
import { MyFiles } from "../../components/MyFiles";
// import { useRoomParams } from "../../hooks/useRoomParams";
import { useRoomStore } from "../../hooks/useRoomStore";
import { parseRoomParams } from "../../utils/roomParams";
import { PeerFiles } from "../../components/PeerFiles";

export function Room() {
  // const { value, setValue } = useRoomParams(); // TODO: maybe this is needed to update it?

  const roomStore = useRoomStore(
    parseRoomParams(window.location.hash.substring(1)),
  );
  const { state } = roomStore;

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
      {state.room.peerId ? (
        <div>Peer status: {state.connection.peerStatus}</div>
      ) : (
        <div>Waiting for a peer to connect...</div>
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

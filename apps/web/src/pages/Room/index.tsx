import "./style.css";
import { MyFiles } from "../../components/MyFiles";
import { PeerFiles } from "../../components/PeerFiles";
import { config } from "../../config";
import { useRoom } from "../../hooks/useRoom";

export function Room() {
  // const { value, setValue } = useRoomParams(); // TODO: maybe this is needed to update it?

  const room = useRoom();

  return (
    <div>
      <h1>Room</h1>
      <pre>
        <code>
          <div>PeerId: {room.state.room.peerId}</div>
          <div>MyId: {room.state.room.myId}</div>
          <div>Secret: {room.state.room.secret}</div>
        </code>
      </pre>
      {room.isPeerOffline ? (
        <div>
          <div>Peer is offline</div>
          <div>
            Invite them with the following code: <b>{room.shareCode.current}</b>
          </div>
          <div>
            Or share this link:{" "}
            <i>{`${config.appUrl}/room#${room.shareCode.current}`}</i>{" "}
          </div>
        </div>
      ) : (
        <div>Peer status: {room.state.connection.peerStatus}</div>
      )}
      <div>
        <div className={"my-files"}>
          <MyFiles room={room}></MyFiles>
        </div>
        <div className={"peer-files"}>
          <PeerFiles room={room}></PeerFiles>
        </div>
      </div>
      {/*<div>
        <h2>Test zone</h2>
        <button
          onClick={() =>
            sendMessageToPeer.current!({
              type: "testMessage",
              value: "Something",
            })
          }
        >
          Send something
        </button>
      </div>*/}
    </div>
  );
}

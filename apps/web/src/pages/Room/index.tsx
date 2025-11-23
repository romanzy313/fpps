import "./style.css";
import { Uploader } from "../../components/Uploader";
// import { useRoomParams } from "../../hooks/useRoomParams";
import { useRoomStore } from "../../hooks/useRoomStore";
import { parseRoomParams } from "../../utils/roomParams";

export function Room() {
  // const { value, setValue } = useRoomParams(); // TODO: maybe this is needed to update it?

  const [state, dispatch] = useRoomStore(
    parseRoomParams(window.location.hash.substring(1)),
  );

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
      <Uploader></Uploader>
    </div>
  );
}

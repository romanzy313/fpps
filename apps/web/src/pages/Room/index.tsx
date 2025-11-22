import "./style.css";
import { Uploader } from "../../components/Uploader";
import { useRoomParams } from "../../hooks/useRoomParams";
import { secureId } from "../../utils/secureId";

export function Room() {
  const { value, setValue } = useRoomParams();

  if (!value.myId) {
    setValue({ ...value, myId: secureId() });
  }
  return (
    <div>
      <h1>Room</h1>
      <pre>
        <code>
          <div>PeerId: {value.peerId}</div>
          <div>MyId: {value.myId}</div>
          <div>Secret: {value.secret}</div>
        </code>
      </pre>
      <Uploader></Uploader>
    </div>
  );
}

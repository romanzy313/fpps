import "./style.css";
import { secureId } from "../../utils/secureId";
import { useLocation } from "preact-iso";
import { isValidRoomHash, stringifyRoomParams } from "../../utils/roomParams";

export function Home() {
  const { route } = useLocation();

  function startRoom() {
    const myId = secureId();
    const peerId = secureId();
    const secret = "";

    const hashValue = stringifyRoomParams({
      myId,
      peerId,
      secret,
      isInitiator: true,
    });

    route(`/room#${hashValue}`);
  }

  return (
    <div className="">
      <h1>Some title here</h1>
      <div>Some text too?</div>
      <div>
        <button onClick={startRoom}>Create a room</button>
      </div>
      <div>
        <div>Or enter room code:</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const elem = (e.target as HTMLFormElement)
              .elements[0]! as HTMLInputElement;
            const code = elem.value;

            if (!isValidRoomHash(code)) {
              alert("Given code is invalid!");
              elem.value = "";
              return;
            }
            route(`/room#${code}`);
          }}
        >
          <input type="text" placeholder="Room code" />
          <button type="submit">Join</button>
        </form>
      </div>
    </div>
  );
}

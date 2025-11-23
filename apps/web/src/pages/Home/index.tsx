import "./style.css";
import { useState } from "preact/hooks";
import { apiHealth } from "../../api";
import { config } from "../../config";
import { useRoomParams } from "../../hooks/useRoomParams";
import { secureId } from "../../utils/secureId";
import { useLocation } from "preact-iso";
import { isValidRoomHash, stringifyRoomParams } from "../../utils/roomParams";

export function Home() {
  const [health, setHealth] = useState<boolean | null>(null);
  const [error, setError] = useState("");
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
    <div className="home">
      <h1>Home Page</h1>
      <button
        onClick={async () => {
          const [value, error] = await apiHealth();

          if (error) {
            setError(error);
            setHealth(false);
          } else {
            setError("");
            setHealth(value);
          }
          // const { value, error } = await apiHealth();

          // if (value === true) {
          //   //
          // }

          // if (error) {
          //   setError(error.message);
          //   setHealth(false);
          // } else {
          //   setError("");
          //   setHealth(value);
          // }
        }}
      >
        Check health ({config.apiUrl})
      </button>
      <div>
        ApiServer status:{" "}
        {health === null ? (
          "Unknown"
        ) : health ? (
          "OK"
        ) : (
          <span className="error">{error ?? "Some error..."}</span>
        )}
      </div>

      <div style={{ height: "100px" }}></div>
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
            // TODO: validate the code
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

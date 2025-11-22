import "./style.css";
import { useState } from "preact/hooks";
import { apiHealth } from "../../api";
import { config } from "../../config";
import { useRoomParams } from "../../hooks/useRoomParams";
import { secureId } from "../../utils/secureId";
import { useLocation } from "preact-iso";
import { stringifyRoomParams } from "../../utils/roomParams";

export function Home() {
  const [health, setHealth] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const { route } = useLocation();

  function startRoom() {
    const myId = secureId();
    const secret = "";

    const hashValue = stringifyRoomParams({
      myId,
      peerId: "",
      secret,
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
      <button onClick={startRoom}>Create a room</button>
      <p>Or join a room by using a url</p>
    </div>
  );
}

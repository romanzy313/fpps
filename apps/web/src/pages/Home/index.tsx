import { useState } from "preact/hooks";
import "./style.css";
import { apiHealth } from "../../api";
import { config } from "../../config";

export function Home() {
  const [health, setHealth] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="home">
      <h1>Hello, world</h1>
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
        Health status: {health === null ? "Unknown" : health ? "OK" : "Error"}
      </div>
      {error && <div className={"error"}>{error}</div>}
    </div>
  );
}

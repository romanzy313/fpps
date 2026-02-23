import "./style.css";

import { useLocation } from "preact-iso";
import {
  generateRoomParams,
  parseRoomParams,
  stringifyRoomParams,
} from "../../utils/roomParams";
import { useState } from "preact/hooks";

export default function HomePage() {
  const { route } = useLocation();
  const [joinCode, setJoinCode] = useState("");

  function startRoom() {
    const params = generateRoomParams();
    const hashValue = stringifyRoomParams(params);
    route(`/room#${hashValue}`);
  }

  function onJoin(e: Event) {
    e.preventDefault();
    const rawInput = joinCode.trim();
    if (!rawInput) {
      return;
    }

    const value = parseRoomParams(rawInput);

    if (!value) {
      alert(
        "The room code you entered is invalid. Please check and try again.",
      );
      setJoinCode("");
      return;
    }

    const code = stringifyRoomParams(value);

    route(`/room#${code}`);
  }

  return (
    <div className="home-container container">
      {/* Hero Section */}
      <section className="home-hero">
        <h1 className="home-hero__title">Free Peer-to-Peer File Sharing</h1>
        <p className="home-hero__subtitle">
          Share files directly between browsers. No servers, no limits.
        </p>
        <p className="home-hero__description">
          Create a secure room and transfer files instantly with anyone,
          anywhere. Your files are sent directly from device to device using
          WebRTC technology, ensuring fast, private, and end-to-end encrypted
          transfers.
        </p>
      </section>

      {/* Action Cards */}
      <div className="home-actions">
        {/* Create Room Card */}
        <div className="card home-card">
          <div className="home-card__header">
            <h2 className="home-card__title">Create a New Room</h2>
            <p className="home-card__description">
              Start a new sharing session and invite others to join
            </p>
          </div>
          <div className="home-card__content">
            <button
              className="home-card__button"
              onClick={startRoom}
              data-testid="create-room-button"
            >
              Create Room
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="home-divider">
          <span>Or</span>
        </div>

        {/* Join Room Card */}
        <div className="card home-card">
          <div className="home-card__header">
            <h2 className="home-card__title">Join Existing Room</h2>
            <p className="home-card__description">
              Enter a room code to connect with someone
            </p>
          </div>
          <div className="home-card__content">
            <form className="join-form" onSubmit={onJoin}>
              <input
                id="room-code"
                className="join-form__input"
                type="text"
                placeholder="Paste room code here..."
                autoComplete="off"
                autoCorrect="off"
                // eslint-disable-next-line react/no-unknown-property
                spellcheck={false}
                onInput={(e) =>
                  setJoinCode((e.target as HTMLInputElement).value)
                }
                value={joinCode}
              />
              <button
                className="join-form__button"
                type="submit"
                data-testid="join-room-button"
                disabled={!joinCode}
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

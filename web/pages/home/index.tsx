import "./style.css";

import { useLocation } from "preact-iso";
import {
  generateRoomParams,
  stringifyRoomParams,
} from "../../utils/roomParams";

export default function HomePage() {
  const { route } = useLocation();

  function startRoom() {
    const params = generateRoomParams();
    const hashValue = stringifyRoomParams(params);
    route(`/room#${hashValue}`);
  }

  return (
    <div className="home-container container">
      {/* Hero Section */}
      <section className="home-hero">
        <h1 className="home-hero__title">Free App for File Transfer</h1>
        <p className="home-hero__subtitle">
          Share files directly between browsers. No servers, no limits.
        </p>
        <p className="home-hero__description">
          Create a secure room and transfer files instantly with anyone,
          anywhere. Your files are sent directly from device to device, ensuring
          fast, private, and end-to-end encrypted transfers.
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
              className="home-card__button guide-button"
              onClick={startRoom}
              data-testid="create-room-button"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

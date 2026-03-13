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

      {/* Features */}
      <div className="home-features">
        <div className="home-feature-item">
          <span className="home-feature-item__icon">🔒</span>
          <div className="home-feature-item__content">
            <h3 className="home-feature-item__title">Secure & Private</h3>
            <p className="home-feature-item__description">
              End-to-end encrypted connections. Your files are never stored on
              our servers.
            </p>
          </div>
        </div>
        <div className="home-feature-item">
          <span className="home-feature-item__icon">⚡</span>
          <div className="home-feature-item__content">
            <h3 className="home-feature-item__title">Fast Transfers</h3>
            <p className="home-feature-item__description">
              Direct peer-to-peer connections mean faster transfers with no
              middleman.
            </p>
          </div>
        </div>
        <div className="home-feature-item">
          <span className="home-feature-item__icon">∞</span>
          <div className="home-feature-item__content">
            <h3 className="home-feature-item__title">No Limits</h3>
            <p className="home-feature-item__description">
              Share files of any size with no upload limits or file size
              restrictions.
            </p>
          </div>
        </div>
        <div className="home-feature-item">
          <span className="home-feature-item__icon">🌐</span>
          <div className="home-feature-item__content">
            <h3 className="home-feature-item__title">Browser-Based</h3>
            <p className="home-feature-item__description">
              Works entirely in your browser. No installation or registration
              required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

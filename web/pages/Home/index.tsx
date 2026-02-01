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

  function onJoin(e: Event) {
    e.preventDefault();
    const elem = (e.target as HTMLFormElement).elements[0]! as HTMLInputElement;
    const code = elem.value.trim();

    if (!code) {
      return;
    }

    if (!isValidRoomHash(code)) {
      alert(
        "The room code you entered is invalid. Please check and try again.",
      );
      elem.value = "";
      return;
    }
    route(`/room#${code}`);
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="home-hero">
        <h1 className="home-hero__title">Fast Peer-to-Peer File Sharing</h1>
        <p className="home-hero__subtitle">
          Share files directly between browsers. No servers, no limits.
        </p>
        <p className="home-hero__description">
          Create a secure room and share files instantly with anyone, anywhere.
          Your files are transferred directly using WebRTC technology—fast,
          private, and encrypted end-to-end.
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
            <button className="home-card__button" onClick={startRoom}>
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
              />
              <button className="join-form__button" type="submit">
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="home-features">
        <div className="feature">
          <div className="feature__icon">🔒</div>
          <h3 className="feature__title">Secure</h3>
          <p className="feature__description">End-to-end encrypted</p>
        </div>
        <div className="feature">
          <div className="feature__icon">⚡</div>
          <h3 className="feature__title">Fast</h3>
          <p className="feature__description">Direct peer-to-peer transfers</p>
        </div>
        <div className="feature">
          <div className="feature__icon">🌐</div>
          <h3 className="feature__title">No Limits</h3>
          <p className="feature__description">Share files of any size</p>
        </div>
        <div className="feature">
          <div className="feature__icon">🎯</div>
          <h3 className="feature__title">Simple</h3>
          <p className="feature__description">No signup or installation</p>
        </div>
      </section>
    </div>
  );
}

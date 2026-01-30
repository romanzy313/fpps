import { config } from "../config";

export function ShareCode({ code }: { code: string }) {
  return (
    <div className="share-section">
      <h2 className="share-section__title">Waiting for Peer to Connect</h2>
      <div className="share-section__code-container">
        <div className="share-section__code-label">Share Code</div>
        <div className="share-section__code">{code}</div>
      </div>
      <div className="share-section__link-container">
        <div className="share-section__link-label">Or share this link:</div>
        <a
          href={`${config.appUrl}/room#${code}`}
          className="share-section__link"
        >
          {`${config.appUrl}/room#${code}`}
        </a>
      </div>
    </div>
  );
}

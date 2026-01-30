import { useState } from "preact/hooks";
import { config } from "../config";

export function ShareCode({ code }: { code: string }) {
  const [showCopied, setShowCopied] = useState(false);
  const shareLink = `${config.appUrl}/room#${code}`;

  function copyToClipboard() {
    navigator.clipboard.writeText(shareLink).then(() => {
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    });
  }

  return (
    <div className="share-section">
      <h2 className="share-section__title">Waiting for Peer to Connect</h2>
      {/*<div className="share-section__code-container">
        <div className="share-section__code-label">Share Code</div>
        <div className="share-section__code">{code}</div>
      </div>*/}
      <div className="share-section__link-container">
        <div className="share-section__link-label">
          Share the following link to connect with them directly:
        </div>
        <div
          className="share-section__link-box"
          onClick={copyToClipboard}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              copyToClipboard();
            }
          }}
        >
          {shareLink}
        </div>
      </div>

      <div className={`copy-popup ${showCopied ? "copy-popup--visible" : ""}`}>
        Copied to clipboard!
      </div>
    </div>
  );
}

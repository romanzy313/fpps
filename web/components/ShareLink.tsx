import { getBaseUrl } from "../utils/getBaseUrl";
import { Toast } from "../utils/Toast";

export function ShareLink({ code }: { code: string }) {
  const baseUrl = getBaseUrl();

  const shareLink = `${baseUrl}/room#${code}`;

  function copyToClipboard() {
    navigator.clipboard.writeText(shareLink).then(() => {
      Toast.info("Copied to clipboard");
    });
  }

  return (
    <div>
      <div className="share-section__link-container">
        <div className="share-section__link-label">
          Share this link to exchange files privately
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
          data-testid="share-link-url"
        >
          {shareLink}
        </div>
      </div>
    </div>
  );
}

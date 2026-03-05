import { ExternalLink } from "../utils/ExternalLink";

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__text">
        Created by{" "}
        <ExternalLink href="https://volovoy.com">Roman Volovoy</ExternalLink> •{" "}
        <ExternalLink href="https://github.com/free-app-net/file-transfer">
          Source Code
        </ExternalLink>{" "}
        •{" "}
        <ExternalLink href="https://github.com/free-app-net/file-transfer/blob/main/LICENSE">
          License
        </ExternalLink>
      </p>
    </footer>
  );
}

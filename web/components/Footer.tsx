import { ExternalLink } from "../utils/ExternalLink";

export function Footer() {
  return (
    <footer className="about-footer">
      <p className="about-footer__text">
        Created by{" "}
        <ExternalLink href="https://volovoy.com">Roman Volovoy</ExternalLink> •{" "}
        <ExternalLink href="https://github.com/romanzy313/fpps">
          GitHub
        </ExternalLink>{" "}
        •{" "}
        <ExternalLink href="https://github.com/romanzy313/fpps/blob/main/LICENSE">
          License
        </ExternalLink>
      </p>
    </footer>
  );
}

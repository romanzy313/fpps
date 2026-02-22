import type { JSX } from "preact/jsx-runtime";
import { ExternalLink } from "../../utils/ExternalLink";

const selfHostDocsUrl =
  "https://github.com/romanzy313/fpps?tab=readme-ov-file#self-host";

export const faqs: {
  question: string;
  answer: JSX.Element;
}[] = [
  {
    question: "Is my data secure and private?",
    answer: (
      <>
        <p>
          Yes! All connections use WebRTC's built-in encryption (DTLS and SRTP).
          The files are transferred directly between browsers without passing
          through our servers. We never see, store, or have access to your
          files.
        </p>
        <p>
          The only data that passes through our signaling server is the
          encrypted connection metadata needed to establish the peer-to-peer
          connection. Once connected, everything happens directly between
          browsers.
        </p>
      </>
    ),
  },

  {
    question: "Are there any file size limits?",
    answer: (
      <p>
        No! Unlike traditional file-sharing services, there are no file size
        limits. Since files are transferred directly between peers rather than
        uploaded to a server, you can share files of any size, for free.
      </p>
    ),
  },
  {
    question: "Do I need to create an account or install anything?",
    answer: (
      <p>
        No. This application works entirely in your web browser with no
        registration, sign-up, or installation required. Just create a room,
        share the code, and start transferring files. It's that simple.
      </p>
    ),
  },
  {
    question: "What happens if the connection drops during a transfer?",
    answer: (
      <>
        <p>
          If the connection is lost during a file transfer, the transfer will
          fail. Unfortunately, this is a limitation of the web browsers. You
          will need to restart the transfer.
        </p>
        <p>
          Both peers must remain connected and keep their browser tabs open
          until the transfer completes. Make sure both parties have stable
          internet connections for best results.
        </p>
      </>
    ),
  },
  {
    question: "Can I share files with multiple people at once?",
    answer: (
      <p>
        Currently, each room supports two peers: one person creates the room,
        and another person joins it. This creates a direct one-to-one
        connection. Support for group file sharing is not planned.
      </p>
    ),
  },
  {
    question: "How fast are the transfers?",
    answer: (
      <p>
        Transfer speeds depend on the network quality of you and your peer.
        Since the connections are direct, transfers are typically limited by the
        slower of the two connections. In ideal conditions with fast internet,
        transfers can be very fast, even faster than ordinary cloud file-sharing
        methods.
      </p>
    ),
  },
  {
    question: "Do both people need to keep their browser open?",
    answer: (
      <p>
        Yes. Both peers must keep their browser tabs open and active for the
        connection to remain established and for file transfers to work. If
        either person closes their tab or loses internet connection, the file
        transfer will need to be restarted.
      </p>
    ),
  },
  {
    question: "Which browsers are supported?",
    answer: (
      <>
        <p>
          All modern browsers are supported. However, some privacy-focused
          browsers may have issues with establishing direct peer-to-peer
          connections.
        </p>
        <p>
          <ExternalLink href="https://brave.com/">Brave</ExternalLink> has
          options to disable direct peer connections to prevent IP leaks. To fix
          this, set WebRTC IP Handling policy to <strong>Default</strong>.{" "}
          <ExternalLink href="https://github.com/brave/brave-browser/wiki/WebRTC-Custom-Settings">
            More information
          </ExternalLink>
        </p>
      </>
    ),
  },
  {
    question: "Is the source code available?",
    answer: (
      <p>
        Sure thing! This project is open source and licensed under the{" "}
        <ExternalLink href="https://www.gnu.org/licenses/agpl-3.0.en.html">
          AGPL-3.0 license
        </ExternalLink>
        . You can view, modify, and contribute freely. Community contributions
        are welcome!
      </p>
    ),
  },
  {
    question: "Can I use this for commercial purposes?",
    answer: (
      <>
        <p>
          The application is licensed under the{" "}
          <ExternalLink href="https://www.gnu.org/licenses/agpl-3.0.en.html">
            AGPL-3.0 license
          </ExternalLink>
          , which allows commercial use. Please review the license for details.
        </p>
        <p>
          We highly encourage{" "}
          <ExternalLink href={selfHostDocsUrl}>self-hosting</ExternalLink> the
          application for internal use.
        </p>
      </>
    ),
  },
  {
    question: "How do I self-host this application?",
    answer: (
      <>
        <p>
          FFPS application is distributed as a single executable: download and
          run. You can also run it with Docker. Refer to{" "}
          <ExternalLink href={selfHostDocsUrl}>
            self-hosting instructions
          </ExternalLink>{" "}
          for up-to-date self-hosting instructions.
        </p>
      </>
    ),
  },
  {
    question: "What data do you collect?",
    answer: (
      <>
        <p>Nothing. Never have, never will. That's a promise!</p>
        <p>
          The server does not use a database. It utilizes an in-memory messaging
          to facilitate peer-to-peer connections. Furthermore, the contents of
          these signaling messages are encrypted. There is nothing we can
          collect, and that is by design.
        </p>
      </>
    ),
  },
] as const;

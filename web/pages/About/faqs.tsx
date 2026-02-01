import type { JSX } from "preact/jsx-runtime";

export const faqs: {
  question: string;
  answer: JSX.Element;
}[] = [
  // {
  //   question: "How does peer-to-peer file sharing work?",
  //   answer: (
  //     <>
  //       <p>
  //         This application uses WebRTC (Web Real-Time Communication) technology
  //         to establish direct connections between browsers. When you create a
  //         room, your browser generates a unique room code that contains
  //         connection information. When another person joins with that code,
  //         their browser connects directly to yours—no files are uploaded to any
  //         server.
  //       </p>
  //       <p>
  //         Files are transferred directly from one browser to another in chunks,
  //         allowing for efficient and fast transfers regardless of file size.
  //       </p>
  //     </>
  //   ),
  // },
  {
    question: "Is my data secure and private?",
    answer: (
      <>
        <p>
          Yes! All connections use WebRTC's built-in encryption (DTLS and SRTP).
          Your files are transferred directly between peers without passing
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
        No! Unlike traditional file sharing services, there are no file size
        limits. Since files are transferred directly between peers rather than
        uploaded to a server, you can share files of any size—from small
        documents to multi-gigabyte videos or archives.
      </p>
    ),
  },
  {
    question: "Do I need to create an account or install anything?",
    answer: (
      <p>
        Not at all! This application works entirely in your web browser with no
        registration, sign-up, or installation required. Just create a room,
        share the code, and start transferring files. It's that simple.
      </p>
    ),
  },
  {
    question: "What happens if the connection drops during a transfer?",
    answer: (
      <p>
        If the connection is lost during a file transfer, the transfer will
        fail. You will need to restart the transfer. Both peers must remain
        connected and keep their browser tabs open until the transfer completes.
        Make sure both parties have stable internet connections for best
        results.
      </p>
    ),
  },
  {
    question: "Can I share files with multiple people at once?",
    answer: (
      <p>
        Currently, each room supports two peers—one person creates the room and
        one person joins it. This creates a direct one-to-one connection.
        Support for group file sharing is not planned.
      </p>
    ),
  },
  {
    question: "How fast are the transfers?",
    answer: (
      <p>
        Transfer speeds depend on network quality of you and your peer. Since
        the connections are direct, transfers are typically limited by the
        slower of the two connections. In ideal conditions with fast internet,
        transfers can be very fast—often faster than traditional cloud file
        sharing methods.
      </p>
    ),
  },
  {
    question: "Do both people need to keep their browser open?",
    answer: (
      <p>
        Yes. Both peers must keep their browser tabs open and active for the
        connection to remain established and for file transfers to work. If
        either person closes their tab or loses internet connection, the trasfer
        will need to be restarted.
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
        <p>TODO: talk about the non-proxied UDP setting or something</p>
      </>
    ),
  },
  {
    question: "Is the source code available?",
    answer: (
      <p>
        Yes! This project is open source and licensed under AGPL-3.0. You can
        view, modify, and contribute to the code on GitHub. We welcome
        contributions from the community!
      </p>
    ),
  },
  {
    question: "Can I use this for commercial purposes?",
    answer: (
      <>
        <p>
          The application is licensed under AGPL-3.0, which allows commercial
          use with certain conditions. You're free to use the service for
          business purposes. If you modify and deploy the code, you must also
          release your modifications under AGPL-3.0 and provide source code to
          your users. Please review the license for complete details.
        </p>
        <p>For business use, it is recommended to self-host the application.</p>
      </>
    ),
  },
  {
    question: "How do I self-host this application?",
    answer: (
      <>
        <p>
          This application is disributed as a single binary.You can also run it
          with a docker container.
        </p>
        <p>TODO. Add README link</p>
      </>
    ),
  },
  {
    question: "What data do you collect?",
    answer: (
      <>
        <p>Nothing. Never have, never will. That's a promise!</p>
        <p>
          Our singaling server utilizes in-memory messaging to fasciliate the
          connection between peers. The contents of signaling messages are
          encrypted. There is nothing we can collect, and that is by design.
        </p>
      </>
    ),
  },
] as const;

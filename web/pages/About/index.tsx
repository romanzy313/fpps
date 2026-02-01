import { faqs } from "./faqs";
import "./style.css";

interface FAQItemProps {
  question: string;
  answer: string | preact.ComponentChildren;
  id: string;
}

function FAQItem({ question, answer, id }: FAQItemProps) {
  return (
    <div className="faq-item">
      <input type="checkbox" id={id} className="faq-item__checkbox" />
      <label htmlFor={id} className="faq-item__question">
        <span className="faq-item__question-text">{question}</span>
        <span className="faq-item__icon">▼</span>
      </label>
      <div className="faq-item__answer">
        <div className="faq-item__answer-content">{answer}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-container container">
      {/* Main Content */}
      <div className="about-content">
        <section className="about-section">
          <h2 className="about-section__title">What is FPPS?</h2>
          <p className="about-section__text">
            FPPS stands for <b>Free Peer-to-Peer file Sharing, real name TBD</b>
            . It is a web application that enables direct file sharing between
            browsers using WebRTC technology. Unlike traditional file sharing
            services that require uploading to a server, FPPS creates direct
            peer-to-peer connections, making file transfers fast, private, and
            unlimited.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section__title">How It Works</h2>
          <p className="about-section__text">
            When you create a room, the application generates a unique code
            invisible to us. Share this code with anyone you want to exchange
            files with. When they join using the code, a direct WebRTC
            connection is established between your browsers.
          </p>
          <p className="about-section__text">
            Files are compressed and transferred directly from one browser to
            another. Your files never touch the servers, the server only
            facilitate signaling to establish WebRTC connection. Once connected,
            it's just you and your peer.
          </p>
        </section>

        {/* Features */}
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-card__icon">🔒</div>
            <h3 className="feature-card__title">Secure & Private</h3>
            <p className="feature-card__description">
              End-to-end encrypted connections. Your files are never stored on
              our servers.
            </p>
          </div>
          <div className="feature-card card">
            <div className="feature-card__icon">⚡</div>
            <h3 className="feature-card__title">Fast Transfers</h3>
            <p className="feature-card__description">
              Direct peer-to-peer connections mean faster transfers with no
              middleman.
            </p>
          </div>
          <div className="feature-card card">
            <div className="feature-card__icon">∞</div>
            <h3 className="feature-card__title">No Limits</h3>
            <p className="feature-card__description">
              Share files of any size with no upload limits or file size
              restrictions.
            </p>
          </div>
          <div className="feature-card card">
            <div className="feature-card__icon">🌐</div>
            <h3 className="feature-card__title">Browser-Based</h3>
            <p className="feature-card__description">
              Works entirely in your browser. No installation or registration
              required.
            </p>
          </div>
        </div>

        <section className="about-section">
          <h2 className="about-section__title">Open Source</h2>
          <p className="about-section__text">
            FPPS is open source software licensed under{" "}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.en.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              AGPL-3.0
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/romanzy313/fpps"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="faq-section__title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              id={`faq-${index}`}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <p className="about-footer__text">
          Created by{" "}
          <a
            href="https://volovoy.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Roman Volovoy
          </a>{" "}
          •{" "}
          <a
            href="https://github.com/romanzy313/fpps"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{" "}
          •{" "}
          <a
            href="https://github.com/romanzy313/fpps/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            License
          </a>
        </p>
      </footer>
    </div>
  );
}

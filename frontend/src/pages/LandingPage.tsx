import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../auth/AuthContext";

const STEPS = [
  {
    title: "Upload your case files",
    description: "PDF or DOCX, one file or many — pleadings and exhibits together in a single case.",
  },
  {
    title: "Understand the case",
    description: "Parties, facts, claims, and disputed points extracted into a structured summary.",
  },
  {
    title: "Identify the issues",
    description: "A ranked list of what the court actually has to decide, most central first.",
  },
  {
    title: "Build your arguments",
    description: "Every point paired with the counter-argument opposing counsel is likely to raise, and your rebuttal.",
  },
  {
    title: "Stress-test the case",
    description: "Weaknesses, adverse angles, and likely questions from the bench, surfaced before the hearing does.",
  },
  {
    title: "Prepare the pack",
    description: "A hearing brief, oral-argument outline, and checklist — ready to export.",
  },
];

const FEATURES = [
  {
    icon: "📎",
    title: "Multi-document intake",
    description: "Upload pleadings and exhibits together. Duplicate content across files is detected automatically.",
  },
  {
    icon: "🎯",
    title: "Counter-argument, built in",
    description: "Every argument comes with the opposition's likely response and your rebuttal — not just the point itself.",
  },
  {
    icon: "🔍",
    title: "OCR fallback",
    description: "Scanned filings with no text layer are still read, page by page.",
  },
  {
    icon: "📑",
    title: "Exportable hearing pack",
    description: "Brief, outline, and checklist as a downloadable file — no account, no setup.",
  },
];

const DELIVERABLES = [
  {
    icon: "🧾",
    title: "Case understanding",
    description: "Parties, facts, claims, defenses, and procedural history — structured, not a wall of text.",
  },
  {
    icon: "⚖️",
    title: "Ranked issue list",
    description: "The legal and factual questions before the court, ordered by how central they are.",
  },
  {
    icon: "🗣️",
    title: "Arguments with rebuttals",
    description: "Each argument mapped from issue to facts to conclusion, with the likely counter and your answer to it.",
  },
  {
    icon: "🔥",
    title: "Stress-test report",
    description: "Factual weaknesses, adverse angles, likely objections, and questions the judge may ask.",
  },
  {
    icon: "📋",
    title: "Hearing pack",
    description: "A hearing brief, an oral-argument outline, and a pre-hearing checklist — exportable in one click.",
  },
];

const FAQS = [
  {
    question: "What file formats are supported?",
    answer:
      "PDF and DOCX. You can upload several files at once — pleadings, exhibits, correspondence — and they're analyzed together as one case.",
  },
  {
    question: "Do scanned documents work?",
    answer:
      "Yes. If a PDF has no text layer, each page is OCR'd automatically. Text-based PDFs are read directly.",
  },
  {
    question: "Are my case files stored?",
    answer:
      "No. Files are processed for your request and results are returned in the same response — nothing is saved to a database, and there is no account or history.",
  },
  {
    question: "Is this legal advice?",
    answer:
      "No. PreHearing is a preparation tool for lawyers. Everything it produces is a draft for a qualified lawyer to review, verify, and own.",
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing">
      <header className="site-header">
        <Logo />
        <nav className="site-nav">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#deliverables" className="nav-link">What you get</a>
          <a href="#faq" className="nav-link">FAQ</a>
          {!isAuthenticated && (
            <Link to="/login" className="nav-link">Log in</Link>
          )}
          <Link to="/app" className="nav-cta">
            {isAuthenticated ? "Open app" : "Get started"}
          </Link>
        </nav>
      </header>

      <div className="page-content">
      <section className="hero">
        <p className="hero-eyebrow">AI-assisted hearing preparation</p>
        <h1 className="hero-headline">
          <span className="hero-line hero-line-thin">Intelligence for better prepared</span>
          <span className="hero-line hero-line-bold">Litigation</span>
        </h1>
        <p className="hero-tagline">
          Turn your case file into a hearing-ready argument pack — built, stress-tested, and
          organized before you walk into the room.
        </p>
        <p className="hero-subtext">
          Built for solo and small-firm lawyers who prepare their own hearings and don't have
          hours to spend assembling a brief from scratch.
        </p>
        <div className="hero-actions">
          <Link to="/app" className="cta-button">
            Get Started →
          </Link>
          <a href="#how-it-works" className="cta-secondary">
            See how it works
          </a>
        </div>
        <p className="hero-note">No account needed · Files are never stored</p>
      </section>

      <section className="landing-section" id="how-it-works">
        <h2>How it works</h2>
        <p className="section-lede">
          One upload runs the whole pipeline — from raw documents to a hearing pack.
        </p>
        <ol className="step-grid">
          {STEPS.map((step, index) => (
            <li key={step.title} className="step-card">
              <span className="step-number">{index + 1}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" id="deliverables">
        <h2>What you walk away with</h2>
        <p className="section-lede">
          Five deliverables from a single analysis, each one openable and readable on its own.
        </p>
        <div className="deliverable-grid">
          {DELIVERABLES.map((item) => (
            <div key={item.title} className="deliverable-card">
              <span className="feature-icon" aria-hidden="true">{item.icon}</span>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-description">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Why PreHearing</h2>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <span className="feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="faq">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {FAQS.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary className="faq-question">{faq.question}</summary>
              <p className="faq-answer">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Walk in prepared.</h2>
        <p className="cta-band-text">
          Upload your case file and get a stress-tested argument pack in minutes.
        </p>
        <Link to="/app" className="cta-button">
          Analyze your case →
        </Link>
      </section>
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <Logo />
          <p className="footer-disclaimer">
            PreHearing is a preparation tool, not a law firm, and its output is not legal advice.
            All results should be reviewed and verified by a qualified lawyer.
          </p>
          <p className="footer-copy">© {new Date().getFullYear()} PreHearing</p>
        </div>
      </footer>
    </main>
  );
}

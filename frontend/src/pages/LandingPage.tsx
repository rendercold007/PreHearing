import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

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

export function LandingPage() {
  return (
    <main>
      <header className="site-header">
        <Logo />
      </header>

      <section className="hero">
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
        <Link to="/app" className="cta-button">
          Get Started →
        </Link>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
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
    </main>
  );
}

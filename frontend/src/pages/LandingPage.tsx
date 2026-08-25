import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Citations } from "../components/Citations";
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
    title: "Find the authorities",
    description: "Indian Kanoon is searched per issue, for your position and for the other side's.",
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
    description: "A hearing brief, oral-argument outline, and checklist — exportable as a Word document.",
  },
];

const FEATURES = [
  {
    icon: "📎",
    title: "Multi-document intake",
    description: "Upload pleadings and exhibits together. Duplicate content across files is detected automatically.",
  },
  {
    icon: "🔍",
    title: "OCR fallback",
    description: "Scanned filings with no text layer are still read, page by page.",
  },
  {
    icon: "📚",
    title: "Indian case law search",
    description: "Authorities come from live Indian Kanoon search — for your position and against it.",
  },
  {
    icon: "🗂️",
    title: "Case history",
    description: "Every analysis is saved to your account. Reopen yesterday's case in full, or delete it.",
  },
  {
    icon: "📝",
    title: "Word export",
    description: "The hearing pack downloads as an editable .docx — brief, arguments with citations, checklist.",
  },
  {
    icon: "🎯",
    title: "Counter-argument, built in",
    description: "Every argument comes with the opposition's likely response and your rebuttal — not just the point itself.",
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
    icon: "📚",
    title: "Authorities per issue",
    description: "Judgments found for each issue, each one linking out to the full text on Indian Kanoon.",
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
    description: "A hearing brief, an oral-argument outline, and a pre-hearing checklist — exportable to Word.",
  },
];

const HONESTY = [
  {
    title: "Every fact points back to your file",
    description:
      "Facts and supporting facts carry the document and page they came from, so you can check any line against the original in seconds.",
  },
  {
    title: "It cannot invent a citation",
    description:
      "Authorities are never written by the model. It picks by number from results returned by Indian Kanoon, and any pick outside that list is discarded before you see it.",
  },
  {
    title: "Every authority links to the judgment",
    description:
      "No paraphrase stands alone. Open the full text on Indian Kanoon and read it yourself before you rely on it.",
  },
  {
    title: "Exports say what they are",
    description:
      "The Word document opens with an AI-generated notice — so nothing leaves your desk without saying what it is.",
  },
];

const LIMITS = [
  "It is not legal advice, and it does not replace your judgment. Every output is a draft for you to verify and own.",
  "Case law search covers Indian judgments via Indian Kanoon. Other jurisdictions are not supported.",
  "It reads what you upload. Facts that live only in your head, or in a file you didn't attach, won't appear.",
  "It does not file anything, track deadlines, or manage your matters.",
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
      "The documents you upload are read in memory to produce the analysis and are not kept afterwards. The analysis itself is saved to your account so you can reopen it from your case history, and you can delete any case permanently from that page.",
  },
  {
    question: "Do I need an account?",
    answer:
      "Yes. Analyses are tied to your account so your case history is yours alone — no other account can read or export your cases. Signing up takes an email and a password.",
  },
  {
    question: "Which jurisdiction does it cover?",
    answer:
      "Case law search runs against Indian Kanoon, so authorities are Indian judgments. The document reading, issue analysis, and argument drafting are not jurisdiction-specific, but the citations are.",
  },
  {
    question: "Is this legal advice?",
    answer:
      "No. PreHearing is a preparation tool for lawyers. Everything it produces is a draft for a qualified lawyer to review, verify, and own.",
  },
];

const SAMPLE_CITATION = [{ source_document: "plaint.pdf", location: "page 4" }];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing">
      <header className="site-header">
        <Logo />
        <nav className="site-nav">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#sample" className="nav-link">Sample output</a>
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
          <a href="#sample" className="cta-secondary">
            See a sample output
          </a>
        </div>
        <p className="hero-note">
          Every fact cited to your file · Authorities from Indian Kanoon, never invented
        </p>
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

      <section className="landing-section" id="sample">
        <h2>What an argument looks like</h2>
        <p className="section-lede">
          Not a summary — a point you can stand up and make, with the answer to the obvious
          objection already in hand.
        </p>
        <div className="sample-card">
          <p className="sample-label">Issue 1 · Whether the termination notice was validly served</p>
          <h3 className="sample-point">
            The notice was validly served under the terms of the lease.
          </h3>

          <p className="sample-heading">Supporting fact</p>
          <p className="sample-fact">
            The notice was couriered to the registered address on 3 March and delivery was
            acknowledged the following day.
            <Citations citations={SAMPLE_CITATION} />
          </p>

          <p className="sample-heading">Authority</p>
          <p className="sample-authority">
            A judgment on what constitutes valid service — with its court and year, linking to the
            full text on Indian Kanoon.
          </p>

          <div className="sample-counter">
            <p className="sample-heading">Anticipated counter-argument</p>
            <p>Service was addressed to a premises the respondent had already vacated.</p>
            <p className="sample-heading">Rebuttal</p>
            <p>
              No change of address was communicated as the lease requires, so service at the
              registered address stands.
            </p>
          </div>
        </div>
        <p className="sample-note">
          Illustrative example, not a real case. In the app the citation chip and the authority both
          come from your own file and from live search — and every argument is built this way.
        </p>
      </section>

      <section className="landing-section" id="deliverables">
        <h2>What you walk away with</h2>
        <p className="section-lede">
          Six deliverables from a single analysis, each one openable and readable on its own.
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

      <section className="landing-section" id="honesty">
        <h2>How we keep it honest</h2>
        <p className="section-lede">
          A tool that makes up a citation is worse than no tool at all. This one is built so it
          can't.
        </p>
        <ul className="honesty-list">
          {HONESTY.map((item) => (
            <li key={item.title} className="honesty-item">
              <h3 className="honesty-title">{item.title}</h3>
              <p className="honesty-description">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section" id="limits">
        <h2>What it doesn't do</h2>
        <p className="section-lede">
          Worth knowing before you sign up rather than after.
        </p>
        <ul className="limit-list">
          {LIMITS.map((limit) => (
            <li key={limit} className="limit-item">
              {limit}
            </li>
          ))}
        </ul>
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

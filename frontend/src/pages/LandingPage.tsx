import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Citations } from "../components/Citations";
import { useAuth } from "../auth/AuthContext";
import { PLAN_CARDS } from "../data/plans";
import {
  mainPad,
  siteHeader,
  pricingGrid,
  pricingCard,
  pricingCardFeatured,
  pricingBadge,
  pricingName,
  pricingPrice,
  pricingAmount,
  pricingCadence,
  pricingQuota,
  pricingFeatures,
  pricingFeatureItem,
  pricingCta,
} from "../ui";

const NAV_LINK =
  "text-[0.9rem] text-muted no-underline transition-colors hover:text-fg max-[560px]:hidden";
const SECTION = "my-12 scroll-mt-8";
const SECTION_H2 = "mb-8 text-center text-[1.5rem]";
const SECTION_LEDE = "mx-auto mb-8 mt-[-1.5rem] max-w-[560px] text-center text-[0.95rem] text-muted";
const CTA_BUTTON =
  "inline-block rounded-card bg-accent px-[1.6rem] py-3 text-base font-semibold text-gold-ink no-underline transition-[background,transform] hover:-translate-y-0.5 hover:bg-accent-hover";
const CARD_HOVER =
  "rounded-card border border-line bg-surface p-6 transition-all duration-[220ms] hover:-translate-y-1 hover:border-line-hover hover:shadow-card";
const CARD_TITLE = "mb-[0.4rem] mt-0 text-base font-semibold text-fg";
const CARD_DESC = "m-0 text-[0.88rem] leading-[1.55] text-muted";
const SAMPLE_HEADING = "mt-4 mb-1 text-[0.75rem] uppercase tracking-[0.08em] text-muted";

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
      "No. Casper is a preparation tool for lawyers. Everything it produces is a draft for a qualified lawyer to review, verify, and own.",
  },
];

const SAMPLE_CITATION = [{ source_document: "plaint.pdf", location: "page 4" }];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className={mainPad}>
      <header className={siteHeader}>
        <Logo />
        <nav className="flex items-center gap-5">
          <a href="#how-it-works" className={NAV_LINK}>How it works</a>
          <a href="#sample" className={NAV_LINK}>Sample output</a>
          <a href="#deliverables" className={NAV_LINK}>What you get</a>
          <a href="#pricing" className={NAV_LINK}>Pricing</a>
          <a href="#faq" className={NAV_LINK}>FAQ</a>
          {!isAuthenticated && (
            <Link to="/login" className={NAV_LINK}>Log in</Link>
          )}
          <Link
            to="/app"
            className="rounded-full border border-line-hover bg-accent-soft px-4 py-[0.4rem] text-[0.88rem] font-semibold text-accent no-underline transition-colors hover:bg-accent hover:text-gold-ink"
          >
            {isAuthenticated ? "Open app" : "Get started"}
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[960px]">
      <section className="px-4 pt-8 pb-10 text-center">
        <p className="mb-6 inline-block rounded-full border border-line-hover bg-accent-soft px-[0.9rem] py-[0.3rem] text-[0.78rem] font-semibold uppercase tracking-[0.05em] text-accent">
          AI-assisted hearing preparation
        </p>
        <h1 className="gradient-text mb-5 text-[2.5rem] leading-[1.2]">
          <span className="block font-normal">Intelligence for better prepared</span>
          <span className="block font-extrabold">Litigation</span>
        </h1>
        <p className="mx-auto mb-3 max-w-[620px] text-[1.15rem] text-fg">
          Turn your case file into a hearing-ready argument pack — built, stress-tested, and
          organized before you walk into the room.
        </p>
        <p className="mx-auto mb-7 max-w-[560px] text-[0.95rem] text-muted">
          Built for solo and small-firm lawyers who prepare their own hearings and don't have
          hours to spend assembling a brief from scratch.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/app" className={CTA_BUTTON}>
            Get Started →
          </Link>
          <a
            href="#sample"
            className="px-2 py-3 text-[0.95rem] font-semibold text-muted no-underline transition-colors hover:text-accent"
          >
            See a sample output
          </a>
        </div>
        <p className="mt-5 text-[0.82rem] tracking-[0.02em] text-muted">
          Every fact cited to your file · Authorities from Indian Kanoon, never invented
        </p>
      </section>

      <section className={SECTION} id="how-it-works">
        <h2 className={SECTION_H2}>How it works</h2>
        <p className={SECTION_LEDE}>
          One upload runs the whole pipeline — from raw documents to a hearing pack.
        </p>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 p-0">
          {STEPS.map((step, index) => (
            <li key={step.title} className={CARD_HOVER}>
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[0.9rem] font-bold text-accent">
                {index + 1}
              </span>
              <h3 className={CARD_TITLE}>{step.title}</h3>
              <p className={CARD_DESC}>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={SECTION} id="sample">
        <h2 className={SECTION_H2}>What an argument looks like</h2>
        <p className={SECTION_LEDE}>
          Not a summary — a point you can stand up and make, with the answer to the obvious
          objection already in hand.
        </p>
        <div className="mt-6 rounded-card border border-line border-l-[3px] border-l-accent bg-surface p-7 shadow-card">
          <p className="m-0 text-[0.8rem] uppercase tracking-[0.06em] text-accent">Issue 1 · Whether the termination notice was validly served</p>
          <h3 className="mt-2 mb-5 text-[1.25rem] leading-[1.4] tracking-[-0.01em] text-fg">
            The notice was validly served under the terms of the lease.
          </h3>

          <p className={SAMPLE_HEADING}>Supporting fact</p>
          <p className="m-0">
            The notice was couriered to the registered address on 3 March and delivery was
            acknowledged the following day.
            <Citations citations={SAMPLE_CITATION} />
          </p>

          <p className={SAMPLE_HEADING}>Authority</p>
          <p className="m-0 text-muted">
            A judgment on what constitutes valid service — with its court and year, linking to the
            full text on Indian Kanoon.
          </p>

          <div className="mt-5 border-t border-line pt-4">
            <p className={`${SAMPLE_HEADING} mt-0`}>Anticipated counter-argument</p>
            <p className="m-0">Service was addressed to a premises the respondent had already vacated.</p>
            <p className={SAMPLE_HEADING}>Rebuttal</p>
            <p className="m-0">
              No change of address was communicated as the lease requires, so service at the
              registered address stands.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[0.85rem] text-muted">
          Illustrative example, not a real case. In the app the citation chip and the authority both
          come from your own file and from live search — and every argument is built this way.
        </p>
      </section>

      <section className={SECTION} id="deliverables">
        <h2 className={SECTION_H2}>What you walk away with</h2>
        <p className={SECTION_LEDE}>
          Six deliverables from a single analysis, each one openable and readable on its own.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {DELIVERABLES.map((item) => (
            <div
              key={item.title}
              className="rounded-card border border-line border-l-[3px] border-l-accent bg-surface p-6 transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-card"
            >
              <span className="mb-3 block text-[1.6rem]" aria-hidden="true">{item.icon}</span>
              <h3 className={CARD_TITLE}>{item.title}</h3>
              <p className={CARD_DESC}>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION} id="pricing">
        <h2 className={SECTION_H2}>Simple, transparent pricing</h2>
        <p className={SECTION_LEDE}>
          Start free. Upgrade only when your caseload does — every plan runs the full analysis.
        </p>
        <div className={pricingGrid}>
          {PLAN_CARDS.map((plan) => (
            <div
              key={plan.id}
              className={`${pricingCard}${plan.highlight ? ` ${pricingCardFeatured}` : ""}`}
            >
              {plan.highlight && <span className={pricingBadge}>Most popular</span>}
              <h3 className={pricingName}>{plan.name}</h3>
              <p className={pricingPrice}>
                <span className={pricingAmount}>{plan.price}</span>{" "}
                <span className={pricingCadence}>{plan.cadence}</span>
              </p>
              <p className={pricingQuota}>{plan.quota}</p>
              <ul className={pricingFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature} className={pricingFeatureItem}>{feature}</li>
                ))}
              </ul>
              <Link to="/app" className={pricingCta}>
                {plan.id === "free" ? "Get started" : `Choose ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.85rem] text-muted">
          Prices in INR. Paid plans are billed monthly and you can cancel anytime.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={SECTION_H2}>Why Casper</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
          {FEATURES.map((feature) => (
            <div key={feature.title} className={CARD_HOVER}>
              <span className="mb-3 block text-[1.6rem]" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className={CARD_TITLE}>{feature.title}</h3>
              <p className={CARD_DESC}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION} id="honesty">
        <h2 className={SECTION_H2}>How we keep it honest</h2>
        <p className={SECTION_LEDE}>
          A tool that makes up a citation is worse than no tool at all. This one is built so it
          can't.
        </p>
        <ul className="mt-6 grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 p-0">
          {HONESTY.map((item) => (
            <li
              key={item.title}
              className="rounded-card border border-line bg-surface px-6 py-5 transition-colors hover:border-line-hover hover:bg-surface-hover"
            >
              <h3 className="mb-[0.4rem] mt-0 text-base text-accent">{item.title}</h3>
              <p className="m-0 text-[0.92rem] text-muted">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={SECTION} id="limits">
        <h2 className={SECTION_H2}>What it doesn't do</h2>
        <p className={SECTION_LEDE}>
          Worth knowing before you sign up rather than after.
        </p>
        <ul className="mt-6 grid list-none gap-[0.6rem] p-0">
          {LIMITS.map((limit) => (
            <li
              key={limit}
              className="relative pl-[1.6rem] text-muted before:absolute before:left-0 before:text-accent before:content-['—']"
            >
              {limit}
            </li>
          ))}
        </ul>
      </section>

      <section className={SECTION} id="faq">
        <h2 className={SECTION_H2}>Frequently asked questions</h2>
        <div className="mx-auto flex max-w-[720px] flex-col gap-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-card border border-line px-5 py-4 transition-colors open:border-line-hover hover:border-line-hover"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="shrink-0 text-xl font-normal text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 mb-0 text-[0.9rem] leading-[1.6] text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="my-12 mb-4 rounded-card border border-line-hover px-6 py-12 text-center bg-[radial-gradient(ellipse_70%_90%_at_50%_0%,rgba(201,162,78,0.1),transparent_70%),var(--color-surface)]">
        <h2 className="mb-2 text-[1.6rem]">Walk in prepared.</h2>
        <p className="mt-0 mb-6 text-muted">
          Upload your case file and get a stress-tested argument pack in minutes.
        </p>
        <Link to="/app" className={CTA_BUTTON}>
          Analyze your case →
        </Link>
      </section>
      </div>

      <footer className="mt-12 border-t border-line pt-8">
        <div className="mx-auto flex max-w-[960px] flex-col items-center gap-3 text-center">
          <Logo />
          <p className="m-0 max-w-[560px] text-[0.82rem] leading-[1.6] text-muted">
            Casper is a preparation tool, not a law firm, and its output is not legal advice.
            All results should be reviewed and verified by a qualified lawyer.
          </p>
          <p className="m-0 text-[0.78rem] text-muted opacity-70">© {new Date().getFullYear()} Casper</p>
        </div>
      </footer>
    </main>
  );
}

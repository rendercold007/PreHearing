import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../auth/AuthContext";
import { PLAN_CARDS } from "../data/plans";

const PIPELINE = [
  { n: "1", title: "Ingest", desc: "Parse & de-duplicate every page." },
  { n: "2", title: "Understand", desc: "Parties, facts, claims, disputes." },
  { n: "3", title: "Issues", desc: "Ranked by what the court must decide." },
  { n: "4", title: "Research", desc: "Authorities, for and against." },
  { n: "5", title: "Argue", desc: "Each point with counter & rebuttal." },
  { n: "6", title: "Stress-test", desc: "Weaknesses & bench questions." },
  { n: "7", title: "Prepare", desc: "Brief, outline, checklist — exported." },
];

const HONESTY = [
  {
    title: "Every fact points back to your file",
    desc: "Facts carry the document and page they came from — check any line against the original in seconds.",
  },
  {
    title: "It selects, it never writes, citations",
    desc: "The model picks authorities by number from real search results. Invalid picks are discarded in code before you see them.",
  },
  {
    title: "Every authority links to the judgment",
    desc: "No paraphrase stands alone — open the full text on Indian Kanoon and read it before you rely on it.",
  },
  {
    title: "Exports say what they are",
    desc: "The Word document opens with an AI-generated notice — nothing leaves your desk unmarked.",
  },
];

const FAQS = [
  {
    q: "What file formats are supported?",
    a: "PDF and DOCX. You can upload several files at once — pleadings, exhibits, correspondence — and they're analyzed together as one case.",
  },
  {
    q: "Do scanned documents work?",
    a: "Yes. If a PDF has no text layer, each page is OCR'd automatically. Text-based PDFs are read directly.",
  },
  {
    q: "Are my case files stored?",
    a: "The documents you upload are read in memory to produce the analysis and are not kept afterwards. The analysis itself is saved to your account so you can reopen it from your case history — and you can delete any case permanently from that page.",
  },
  {
    q: "Do I need an account?",
    a: "Yes. Analyses are tied to your account so your case history is yours alone — no other account can read or export your cases. Signing up takes an email and a password.",
  },
  {
    q: "Which jurisdiction does it cover?",
    a: "Case law search runs against Indian Kanoon, so authorities are Indian judgments. The document reading, issue analysis, and argument drafting are not jurisdiction-specific, but the citations are.",
  },
  {
    q: "Is this legal advice?",
    a: "No. Casper is a preparation tool for lawyers. Everything it produces is a draft for a qualified lawyer to review, verify, and own.",
  },
];

const MONO = "font-mono";
const CARD_LIFT =
  "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-line-hover hover:shadow-[0_18px_40px_rgba(0,0,0,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const BTN_LIFT =
  "transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0";
const SECTION = "mx-auto max-w-[1200px] px-12 pt-[74px]";
const EYEBROW = `${MONO} mb-3 text-xs uppercase tracking-[0.08em] text-accent`;
const H2 = "font-display text-[40px] font-bold leading-[1.05] tracking-[-0.025em]";
const CHECK = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-[2px] shrink-0 text-accent"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="text-fg">
      {/* Nav — full width, logo hard left */}
      <header className="border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-12 py-[22px]">
          <Logo />
          <nav className={`${MONO} flex items-center gap-7 text-sm text-[#a69c8d]`}>
            <a href="#how" className="hover:text-fg">how it works</a>
            <a href="#sample" className="hover:text-fg">sample</a>
            <a href="#pricing" className="hover:text-fg">pricing</a>
            {!isAuthenticated && (
              <Link to="/login" className={`rounded-[9px] border border-white/[0.14] px-4 py-2 text-fg ${BTN_LIFT}`}>
                Sign in
              </Link>
            )}
            <Link to="/app" className={`rounded-[9px] bg-fg px-[17px] py-[9px] font-bold text-gold-ink ${BTN_LIFT}`}>
              {isAuthenticated ? "Open app" : "Start free"}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 px-12 pt-[72px] pb-[58px] lg:grid-cols-2">
        <div>
          <span className={`${MONO} mb-[26px] inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/[0.08] px-3 py-1.5 text-xs tracking-[0.04em] text-accent`}>
            <span className="h-1.5 w-1.5 rounded-full bg-coral shadow-[0_0_10px_var(--color-coral)]" />
            HEARING PREP · AUTOMATED
          </span>
          <h1 className="mb-[22px] font-display text-[60px] font-bold leading-[1.02] tracking-[-0.03em]">
            Every argument,
            <br />
            already{" "}
            <span className="bg-[linear-gradient(100deg,var(--color-accent),var(--color-coral))] bg-clip-text text-transparent">
              built.
            </span>
          </h1>
          <p className="mb-8 max-w-[470px] text-lg leading-relaxed text-[#c1b8ab]">
            Drop in your case file. Casper reads it, finds the authorities, drafts every argument with
            its counter and rebuttal, and hands you a hearing pack — in minutes.
          </p>
          <div className="mb-[34px] flex flex-wrap items-center gap-[14px]">
            <Link
              to="/app"
              className={`rounded-[11px] bg-[linear-gradient(145deg,var(--color-accent),#e0975a)] px-6 py-[14px] font-bold text-gold-ink shadow-[0_12px_30px_rgba(227,178,79,0.3)] ${BTN_LIFT}`}
            >
              Analyze a case →
            </Link>
            <a href="#sample" className={`rounded-[11px] border border-white/[0.16] px-[22px] py-[14px] font-semibold text-fg ${BTN_LIFT}`}>
              See a live run
            </a>
          </div>
          <div className={`${MONO} flex gap-[26px] text-xs text-[#8f877a]`}>
            <span><span className="text-[15px] text-fg">7</span> · stage pipeline</span>
            <span><span className="text-[15px] text-fg">0</span> · invented citations</span>
            <span><span className="text-[15px] text-fg">2m</span> · avg. run</span>
          </div>
        </div>

        {/* Product window */}
        <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] shadow-[0_40px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-[13px]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a352d]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a352d]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a352d]" />
            <span className={`${MONO} ml-2.5 text-xs text-[#857d70]`}>sharma-v-dda.pdf · analysis</span>
          </div>
          <div className="p-[22px]">
            {/* stepper */}
            <div className="mb-[22px] flex items-center">
              {["c", "c", "c", "a", "o", "o", "o"].map((state, i) => (
                <StepNode key={i} state={state} label={state === "c" ? "✓" : String(i + 1)} last={i === 6} />
              ))}
            </div>
            <p className={`${MONO} mb-2 text-[11px] tracking-[0.03em] text-accent`}>ISSUE 1 · VALIDITY OF SERVICE</p>
            <p className="mb-[14px] font-display text-lg font-semibold leading-snug text-[#f4efe6]">
              The notice was validly served under the terms of the lease.
            </p>
            <div className="mb-4 flex flex-wrap gap-[7px]">
              <span className={`${MONO} rounded-[7px] border border-coral/[0.28] bg-coral/[0.12] px-2.5 py-1 text-[11px] text-coral`}>plaint.pdf · p.4</span>
              <span className={`${MONO} rounded-[7px] border border-accent/[0.28] bg-accent/[0.12] px-2.5 py-1 text-[11px] text-[#f0c98a]`}>AIR 2019 SC 214 ↗</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.03] px-[14px] py-3">
                <p className={`${MONO} mb-[5px] text-[10px] text-[#8f877a]`}>COUNTER</p>
                <p className="text-[12.5px] leading-snug text-[#cbc3b6]">Premises had already been vacated.</p>
              </div>
              <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.03] px-[14px] py-3">
                <p className={`${MONO} mb-[5px] text-[10px] text-coral`}>REBUTTAL</p>
                <p className="text-[12.5px] leading-snug text-[#cbc3b6]">No address change was ever communicated.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-white/[0.06]">
        <div className={`${MONO} mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-12 py-4 text-xs uppercase tracking-[0.04em] text-[#8f877a]`}>
          <span>Built for solo &amp; small-firm advocates</span>
          <span className="text-[#4d473e]">/</span>
          <span>PDF · DOCX · scanned filings</span>
          <span className="text-[#4d473e]">/</span>
          <span>Indian Kanoon authorities</span>
          <span className="text-[#4d473e]">/</span>
          <span>Word &amp; PDF export</span>
        </div>
      </section>

      {/* Bento */}
      <section className="mx-auto max-w-[1200px] px-12 pt-[60px]">
        <div className="grid auto-rows-[172px] grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className={`flex flex-col justify-between rounded-2xl border border-line bg-[linear-gradient(160deg,rgba(227,178,79,0.12),rgba(255,255,255,0.02))] p-[26px] md:row-span-2 ${CARD_LIFT}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <div>
              <h3 className="mb-2 font-display text-[22px] font-semibold">Citations it can't fake</h3>
              <p className="text-sm leading-relaxed text-[#b1a898]">
                Authorities are picked by number from live Indian Kanoon results. Anything outside that
                list is dropped in code before it reaches you — and every one links to the judgment.
              </p>
            </div>
          </div>
          <BentoTile
            icon={<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></>}
            stroke="var(--color-coral)"
            title="Reads any filing"
            desc="PDF, DOCX, many at once — scanned pages OCR'd automatically."
          />
          <BentoTile
            icon={<><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9.5 12 2 2 3.5-4" /></>}
            stroke="var(--color-coral)"
            title="Stress-tested"
            desc="Weak points and bench questions surfaced before the judge finds them."
          />
          <BentoTile
            icon={<><path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><rect x="9" y="2.5" width="6" height="4" rx="1" /></>}
            stroke="var(--color-accent)"
            title="Exports to Word"
            desc="Brief, outline and checklist — editable, and labelled AI-generated."
          />
          <div className={`flex flex-col justify-center rounded-2xl border border-line bg-white/[0.02] p-[22px] ${CARD_LIFT}`}>
            <p className="font-display text-[32px] font-bold text-accent">₹0</p>
            <p className="mt-1 text-[13px] text-[#b1a898]">to start — 2 analyses / month, the full pipeline.</p>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="how" className={`${SECTION} scroll-mt-6`}>
        <p className={EYEBROW}>How it works</p>
        <div className="mb-[46px] flex flex-wrap items-end justify-between gap-6">
          <h2 className={`${H2} max-w-[560px]`}>One upload runs all seven stages.</h2>
          <p className="max-w-[340px] text-[15px] text-[#b1a898]">
            Each stage feeds the next — from raw documents to a hearing pack, in a single pass.
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-[7%] right-[7%] top-[18px] z-0 h-0.5 bg-[linear-gradient(90deg,var(--color-coral),var(--color-accent))]" />
          <div className="relative z-10 grid grid-cols-2 gap-x-1 gap-y-8 sm:grid-cols-4 lg:grid-cols-7">
            {PIPELINE.map((s, i) => (
              <div key={s.n} className="px-1.5 text-center">
                <span
                  className={`${MONO} mb-[14px] inline-flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm font-bold ${
                    i === 6 ? "bg-coral text-[#3a1710]" : "bg-accent text-gold-ink"
                  }`}
                >
                  {s.n}
                </span>
                <h4 className="mb-[5px] font-display text-[15px] font-semibold">{s.title}</h4>
                <p className="text-xs leading-snug text-[#94897a]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Argument anatomy */}
      <section id="sample" className={`${SECTION} scroll-mt-6`}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className={EYEBROW}>The anatomy of one argument</p>
            <h2 className={`${H2} mb-[18px] !text-[38px]`}>Not a summary — a point you can stand up and make.</h2>
            <p className="mb-[22px] text-base leading-[1.62] text-[#b1a898]">
              Every argument maps from issue to facts to conclusion, and arrives with the counter
              opposing counsel will raise — and your answer to it. The facts cite the page they came
              from; the authority links to the judgment.
            </p>
            <p className={`${MONO} border-l-2 border-accent pl-[14px] text-[12.5px] leading-relaxed text-[#8f877a]`}>
              Illustrative example — not a real matter. In the app, the citation and the authority
              come from your own file and from live search.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))] px-8 py-[30px] shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <p className={`${MONO} mb-2.5 text-[11px] tracking-[0.04em] text-accent`}>
              ISSUE 1 · WHETHER THE TERMINATION NOTICE WAS VALIDLY SERVED
            </p>
            <p className="mb-[22px] font-display text-[23px] font-semibold leading-[1.28] text-[#f4efe6]">
              The notice was validly served under the terms of the lease.
            </p>
            <p className={`${MONO} mb-[7px] text-[10.5px] tracking-[0.06em] text-[#8f877a]`}>SUPPORTING FACT</p>
            <p className="mb-[9px] text-[14.5px] leading-relaxed text-[#d8d1c5]">
              Couriered to the registered address on 3 March; delivery acknowledged the next day.
            </p>
            <div className="mb-5 flex flex-wrap gap-[7px]">
              <span className={`${MONO} rounded-[7px] border border-coral/[0.28] bg-coral/[0.12] px-2.5 py-1 text-[11px] text-coral`}>plaint.pdf · p.4</span>
              <span className={`${MONO} rounded-[7px] border border-accent/[0.28] bg-accent/[0.12] px-2.5 py-1 text-[11px] text-[#f0c98a]`}>On valid service — AIR 2019 SC 214 ↗</span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-5">
              <div>
                <p className={`${MONO} mb-1.5 text-[10.5px] tracking-[0.06em] text-[#8f877a]`}>ANTICIPATED COUNTER</p>
                <p className="text-[13.5px] leading-normal text-[#c6bfb2]">The premises had already been vacated by the respondent.</p>
              </div>
              <div>
                <p className={`${MONO} mb-1.5 text-[10.5px] tracking-[0.06em] text-coral`}>REBUTTAL</p>
                <p className="text-[13.5px] leading-normal text-[#c6bfb2]">No change of address was communicated, as the lease required — service stands.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Honesty */}
      <section className={SECTION}>
        <p className={EYEBROW}>How we keep it honest</p>
        <h2 className={`${H2} mb-10 max-w-[620px]`}>
          A tool that invents a citation is worse than none. This one can't.
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {HONESTY.map((item) => (
            <div key={item.title} className={`rounded-2xl border border-line bg-white/[0.02] px-7 py-[26px] ${CARD_LIFT}`}>
              <h3 className="mb-[7px] font-display text-[17px] font-semibold text-accent">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[#b1a898]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`${SECTION} scroll-mt-6`}>
        <p className={EYEBROW}>Pricing</p>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className={H2}>
            Start free. Upgrade when
            <br />
            your caseload does.
          </h2>
          <p className="max-w-[300px] text-[15px] text-[#b1a898]">
            Every plan runs the full seven-stage analysis. Cancel anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          {PLAN_CARDS.map((plan) => {
            const featured = plan.highlight;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-7 transition-transform duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 ${
                  featured
                    ? "border border-accent bg-[linear-gradient(180deg,rgba(227,178,79,0.09),rgba(255,255,255,0.015))] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                    : "border border-line bg-white/[0.02]"
                }`}
              >
                {featured && (
                  <span className={`${MONO} absolute -top-[11px] left-7 rounded-full bg-[linear-gradient(145deg,var(--color-accent),var(--color-coral))] px-[11px] py-1 text-[10.5px] font-bold uppercase tracking-[0.04em] text-gold-ink`}>
                    Most popular
                  </span>
                )}
                <p className={`${MONO} mb-[14px] text-xs uppercase tracking-[0.06em] ${featured ? "text-accent" : "text-[#b1a898]"}`}>{plan.name}</p>
                <p className="mb-0.5">
                  <span className="font-display text-[40px] font-bold text-fg">{plan.price}</span>
                  {plan.id !== "free" && <span className="text-sm text-[#8f877a]"> /mo</span>}
                </p>
                <p className="mb-5 text-[13px] text-[#8f877a]">{plan.quota}</p>
                <div className="mb-[26px] flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <span key={f} className={`flex gap-[9px] text-[13.5px] ${featured ? "text-[#d8d1c5]" : "text-[#c6bfb2]"}`}>
                      {CHECK}
                      {f}
                    </span>
                  ))}
                </div>
                <Link
                  to="/app"
                  className={`mt-auto rounded-[10px] py-3 text-center text-sm font-bold ${BTN_LIFT} ${
                    featured
                      ? "bg-[linear-gradient(145deg,var(--color-accent),#e0975a)] text-gold-ink"
                      : "border border-white/[0.16] font-semibold text-fg"
                  }`}
                >
                  {plan.id === "free" ? "Get started" : `Choose ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>
        <p className={`${MONO} mt-[18px] text-[11.5px] text-[#6f6659]`}>Prices in INR, billed monthly.</p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[820px] px-12 pt-[74px]">
        <h2 className="mb-[34px] text-center font-display text-[32px] font-bold tracking-[-0.02em]">
          Questions, answered
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <details
              key={faq.q}
              open={i === 0}
              className="group rounded-xl border border-white/[0.08] bg-white/[0.02] px-[22px] py-[18px] transition-colors open:border-accent/40 hover:border-line-hover"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <span className="text-[15px] font-semibold">{faq.q}</span>
                <span className="shrink-0 text-[22px] leading-none text-accent transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#b1a898]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-12 pt-[74px] pb-10">
        <div className="rounded-[22px] border border-accent/35 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(227,178,79,0.16),transparent_68%),rgba(255,255,255,0.02)] px-10 py-[62px] text-center">
          <h2 className="mb-3 font-display text-[46px] font-bold tracking-[-0.03em]">Walk in prepared.</h2>
          <p className="mb-[30px] text-[17px] text-[#b1a898]">
            Upload your case file and get a stress-tested argument pack in minutes.
          </p>
          <Link
            to="/app"
            className={`inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(145deg,var(--color-accent),#e0975a)] px-[30px] py-[15px] text-base font-bold text-gold-ink shadow-[0_14px_34px_rgba(227,178,79,0.3)] ${BTN_LIFT}`}
          >
            Analyze your case
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-12 pt-[30px] pb-11">
          <Logo />
          <p className={`${MONO} text-right text-xs text-[#8f877a]`}>
            A preparation tool, not a law firm — output is not legal advice. © {new Date().getFullYear()} Casper
          </p>
        </div>
      </footer>
    </main>
  );
}

function StepNode({ state, label, last }: { state: string; label: string; last: boolean }) {
  const circle =
    state === "c"
      ? "bg-coral text-[#3a1710]"
      : state === "a"
        ? "bg-accent text-gold-ink shadow-[0_0_14px_rgba(227,178,79,0.6)]"
        : "border-[1.5px] border-white/[0.16] text-[#777064]";
  const line =
    state === "c"
      ? "bg-coral"
      : state === "a"
        ? "bg-[linear-gradient(90deg,var(--color-coral),var(--color-accent))]"
        : "bg-white/10";
  return (
    <>
      <span className={`font-mono flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${circle}`}>
        {label}
      </span>
      {!last && <span className={`h-0.5 flex-1 ${line}`} />}
    </>
  );
}

function BentoTile({
  icon,
  stroke,
  title,
  desc,
}: {
  icon: ReactNode;
  stroke: string;
  title: string;
  desc: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-white/[0.02] p-[22px] ${CARD_LIFT}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      <h3 className="mb-[5px] mt-3.5 font-display text-base font-semibold">{title}</h3>
      <p className="text-[13px] leading-snug text-[#b1a898]">{desc}</p>
    </div>
  );
}

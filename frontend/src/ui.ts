// Shared Tailwind class strings for the few patterns that recur across many files —
// keeps the gold primary button, the ghost secondary button, form inputs and the
// alert boxes identical everywhere without re-writing the utility list each time.

export const btnPrimary =
  "bg-accent text-gold-ink rounded-card px-[1.1rem] py-[0.6rem] text-[0.95rem] font-semibold cursor-pointer transition-[color,background-color,transform] duration-150 hover:bg-accent-hover hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent disabled:hover:translate-y-0";

export const btnSecondary =
  "inline-flex items-center px-4 py-[0.55rem] text-[0.9rem] font-semibold text-muted bg-transparent border border-line rounded-card no-underline cursor-pointer transition-[color,background-color,border-color,transform] duration-150 hover:text-fg hover:border-line-hover hover:bg-surface-hover hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-muted disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:translate-y-0";

export const textInput =
  "w-full bg-canvas border border-line rounded-lg px-[0.8rem] py-[0.6rem] text-fg text-[0.95rem] transition-colors focus:outline-none focus:border-accent";

export const dangerAlert = "mt-4 rounded-card bg-danger-bg px-4 py-3 text-danger";

export const warnAlert =
  "my-3 rounded-card border border-warning/40 border-l-[3px] border-l-warning bg-warning-bg px-4 py-3 text-[0.88rem] text-fg";

export const warnAlertTitle = "text-warning font-semibold";

// The surface "card": dark panel, hairline border, rounded corners.
export const surfaceCard = "bg-surface border border-line rounded-card";

// Page chrome shared by the public (non-shell) pages.
export const mainPad = "px-6 pt-7 pb-16";
export const siteHeader = "mb-4 flex flex-wrap items-center justify-between gap-4";
export const pageTitle = "gradient-text mt-2 mb-1 text-[1.6rem] font-bold tracking-[-0.01em]";
export const pageLede = "mb-6 mt-0 text-muted";
export const caseTitle = "font-semibold text-fg no-underline hover:text-accent";
export const caseMeta = "mt-1 mb-0 text-[0.85rem] text-muted";
export const caseEmpty = "mt-6 text-muted";

// Auth / forgot / reset pages.
export const authCard = "w-full max-w-[400px] rounded-card border border-line bg-surface p-6 sm:p-8";
export const authTitle = "gradient-text mb-[0.4rem] mt-0 text-[1.4rem] font-bold";
export const authSubtitle = "mt-0 mb-6 text-[0.9rem] text-muted";
export const authForm = "flex flex-col items-stretch gap-4";
export const authField = "flex flex-col gap-[0.35rem]";
export const authFieldLabel = "text-[0.85rem] font-semibold text-muted";
export const authSwitch = "mt-6 mb-0 text-center text-[0.88rem] text-muted";
export const authLink = "font-semibold text-accent no-underline hover:text-accent-hover";

// Pricing cards — shared by the public landing section and the in-app /pricing page.
export const pricingGrid =
  "mt-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5";
export const pricingCard =
  "relative flex flex-col rounded-card border border-line bg-surface px-6 py-[26px] transition-transform duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0";
export const pricingCardFeatured =
  "border-accent shadow-[0_0_0_1px_var(--color-accent-soft),var(--shadow-card)]";
export const pricingCardCurrent = "border-accent shadow-[0_0_0_1px_var(--color-accent-soft)]";
export const pricingBadge =
  "absolute -top-[11px] left-6 rounded-full bg-accent px-[10px] py-1 text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-black";
export const pricingName = "m-0 text-[1.2rem]";
export const pricingPrice = "mt-3 mb-1";
export const pricingAmount = "text-[1.9rem] font-semibold text-accent";
export const pricingCadence = "text-[0.9rem] text-muted";
export const pricingQuota = "mb-4 mt-0 text-muted";
export const pricingFeatures = "mb-6 mt-0 flex flex-1 list-none flex-col gap-2 p-0";
export const pricingFeatureItem =
  "relative pl-[22px] text-fg before:absolute before:left-0 before:text-accent before:content-['✓']";
export const pricingCta =
  "block rounded-card bg-accent px-[18px] py-[11px] text-center font-semibold text-black no-underline transition-colors hover:bg-accent-hover";

// Content typography — the bare-element styles the modal section pages relied on.
export const h2Title = "mb-3 text-[1.25rem]";
export const h3Sub = "mt-5 mb-2 text-base uppercase tracking-[0.03em] text-muted";
export const ulDisc = "my-1 list-disc pl-5";
export const olDecimal = "my-1 list-decimal pl-5";
export const liItem = "mb-[0.4rem]";
export const emMuted = "not-italic text-[0.9rem] text-muted";
export const linkAccent =
  "text-accent underline underline-offset-2 transition-colors hover:text-accent-hover";

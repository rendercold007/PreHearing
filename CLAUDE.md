# PreHearing

## What this project is

PreHearing takes a lawyer's case file(s) and produces arguments for a hearing.

The target shape is a 7-stage pipeline. All seven stages exist in a first form; the
per-stage notes say what each one still lacks:

| # | Stage | What it does | Tier | Status |
|---|-------|---------------|------|--------|
| 01 | **Ingest** | Parse PDF/DOCX (OCR fallback for scans), segment into page/paragraph chunks, dedup by content hash. | deterministic | **Built** |
| 02 | **Understand** | Extract parties, facts, claims, defenses, procedural history into a structured `CaseUnderstanding`. | cheap/mid | **Built** (uses `mid`) |
| 03 | **Identify issues** | Derive a ranked list of legal/factual issues before the court. | mid | **Built** |
| 04 | **Research** | Search + rerank over case law for real citations. | cheap | **Built, API-search-first** (no vector DB): per issue, `mid` generates keyword queries → Indian Kanoon search API → `mid` reranks hits by numbered index (validated server-side so it can't cite results that don't exist). Requires `INDIANKANOON_API_TOKEN`; without it the stage returns no results and the rest of the pipeline is unaffected. Runs twice: once before argument generation (supporting authorities → Stage 05) and once in adverse mode (queries/rerank flipped to the opponent's position → Stage 06). Both passes are carried on `CaseAnalysis` (`research` / `adverse_research`) and render in the Research card behind a Supporting | Opposing toggle — the adverse pass used to exist only inside the stress-test prompt. Cases saved before `adverse_research` existed load with it defaulted to `[]`. |
| 05 | **Build arguments** | Map issue → proposition → authority → facts → conclusion; each argument also carries the strongest anticipated counter-argument and a rebuttal. | strong | **Built** (arguments are built against the Stage 03 issue list + case facts; supporting facts cited by validated fact number, and Stage 04 authorities attached by validated authority number — `Argument.authorities`) |
| 06 | **Stress-test** | Adverse authorities, factual weaknesses, likely objections, judge questions. | strong | **Built** (stress-tests the actual understanding/issues/arguments already produced; adverse authorities from the flipped Stage 04 run attached per point by validated number — `StressTestPoint.authorities`) |
| 07 | **Prepare** | Assemble hearing brief, oral-argument outline, checklist as an exportable pack. | strong | **Built** (assembled from the Stage 02/03/05/06 outputs already produced; exports as a **Word document** rendered server-side from the saved case — `GET /api/cases/{id}/export.docx`, brief + outline + arguments with their citations and authorities + checklist — alongside the original client-side text download) |

**Citations are built:** key facts and argument supporting-facts carry `Citation`
(source document + page/paragraph) via the `CitedFact` schema. The extractor shows the
LLM numbered chunks and it cites facts by chunk number; the argument generator cites
supporting facts by fact number from the understanding. Both are validated server-side
(invalid indices dropped) so the model cannot invent sources — the same anti-hallucination
trick as the research rerank.

## Scope boundaries

- Build toward the roadmap above, stage by stage. Don't jump ahead to a later stage
  before its prerequisites are actually decided/built.
- Do not add features outside this pipeline (case management, scheduling, billing,
  client CRM, multi-case dashboards, etc.) unless explicitly asked.
- Don't introduce speculative abstractions, plugins, or configurability for
  hypothetical future steps — Stage 04 shipping as a thin API search (no vector DB,
  no embeddings) is the concrete example of this rule in action.
- If a request falls outside this scope, flag it rather than silently expanding the project.

## Tech stack

- **Backend:** FastAPI (Python). One endpoint, `POST /api/analyze`, runs the pipeline and **streams NDJSON**: `{"type":"stage","stage":...,"status":"started"|"done"|"failed"}` events per stage (`failed` means that stage crashed and was skipped — the run continues, and the frontend checklist marks it ✕ rather than ✓), then a final `{"type":"result","analysis":...}` (or `{"type":"error"}` if Understanding fails). Pre-pipeline failures (bad file type, no text, auth) are still plain HTTP errors since they occur before streaming starts. All stage work runs via `run_in_threadpool` so the event loop is never blocked; the two research passes run concurrently, and within each pass the per-issue search+rerank fan out over a `ThreadPoolExecutor`. Package management via `uv`.
- **File parsing:** `pdfplumber` for PDF, `python-docx` for DOCX. Multiple files per case are supported — each is parsed into per-page (PDF) or per-paragraph (DOCX) chunks, then the whole set is deduplicated by content hash (catches the same exhibit uploaded twice). See `DocumentChunk` in `ingest/parser.py`.
- **OCR fallback:** for scanned/image-only PDFs with no text layer, `pdf2image` (needs the `poppler-utils` system package) rasterizes each page and `pytesseract` (needs the `tesseract-ocr` system package) OCRs it, one chunk per page. Only triggers when `pdfplumber` extracts no text — text-based PDFs never touch OCR.
- **LLM:** OpenRouter API (OpenAI-compatible), via the `openai` Python SDK with `base_url="https://openrouter.ai/api/v1"`. **Tiered model config** — three env vars, `OPENROUTER_MODEL_CHEAP` / `OPENROUTER_MODEL_MID` / `OPENROUTER_MODEL_STRONG` — let different stages use different models. Currently: Understand and Identify Issues use `mid`; Research (query gen + rerank, both passes) uses `cheap` — pick a fast model with solid JSON mode; Generate Arguments, Stress-test, and Prepare use `strong`. `complete_json` retries once on API errors or malformed JSON, then raises `LLMError`. Query generation is batched: one LLM call produces queries for all issues in a pass.
- **Research source:** Indian Kanoon search API (`INDIANKANOON_API_TOKEN` env var; stage is skipped without it). No local corpus, embeddings, or vector DB.
- **Guardrails:** uploads are capped by count and size (`max_files` / `max_file_mb` / `max_total_mb` in `Settings`, 413 on breach) — a content-length middleware in `main.py` turns oversized bodies away before Starlette spools them to a temp file, and the analyze route re-checks per file. The extractor sends every chunk in one prompt, so `budget_chunks()` trims the listing to `max_prompt_chars` and the run reports how many pages went unread as a warning rather than failing opaquely. LLM calls carry an explicit `timeout` and `max_tokens`, and the SDK's own retries are disabled (`max_retries=0`) so they no longer multiply with `complete_json`'s; token usage is logged per call. `auth/ratelimit.py` is a **Postgres-backed sliding window** (`rate_limit_hits` table) — by IP on signup/login (each login verify costs 600k pbkdf2 iterations), by user id on `/api/analyze`. State is shared across workers, so the configured allowance is enforced once for the whole deployment rather than once per process. Concurrent checks for the same key are serialized with a `pg_advisory_xact_lock` (different keys never contend) so the count-then-insert can't race; the table is kept bounded by pruning a bucket's expired hits on every check plus an opportunistic global sweep (per-process timer, once/60s, deletes rows older than the largest configured window).
- **Graceful degradation:** if Understand fails the request 502s; any later stage failing is caught (`run_stage` in `api/routes.py`), logged, and reported in a `warnings` list on the response while the rest of the analysis still returns. The stage's live event is also emitted as `"failed"` so the progress checklist doesn't draw a crashed stage as a success. `hearing_prep` is nullable for this reason.
- **Anti-hallucination pattern (used throughout):** the LLM only ever *selects by number* from a server-side list — rerank picks search hits by index, the extractor cites facts by chunk number, the generator cites supporting facts and authorities by number, the stress-tester attaches adverse authorities by number — and invalid indices are dropped in code (`select_by_number` / `flatten_authorities` in `research/researcher.py`), so citations/authorities can't be invented.
- **Frontend:** React + Vite + TypeScript, calling the FastAPI backend as a JSON API. Client-side routed (`react-router-dom`): `/` is a marketing landing page, `/app` is the upload → analyze flow, `/cases` is the saved case history and `/cases/:caseId` reopens one (both auth-gated). A fresh run and a saved case render through the same `AnalysisResult` component, so history is a full second view of the analysis, not a summary. Upload supports multiple files at once; results (understanding, issues, arguments, stress test, prepare) render as a hovering card grid — each card previews its section and opens the full detail in a modal.
- **Auth:** name + email + password accounts (signup collects all three; the name is required and editable later on /profile) with opaque Bearer session tokens (7-day expiry), stored in Postgres (see Persistence). Passwords hashed with stdlib pbkdf2_sha256 — no extra dependencies. `/api/analyze` requires a valid token; the frontend keeps the session in localStorage and gates `/app` behind `/login`. When any API call gets a 401 it calls `clearSession()`, which dispatches a `prehearing:session-cleared` window event — `AuthProvider` listens for it and drops the in-memory session, so an expired token actually redirects to `/login` instead of leaving the app believing it is still signed in.
- **Password reset:** email-based, single-use, expiring links. `POST /api/auth/forgot-password` always returns the same generic 200 (never reveals whether the email has an account), and — if it does — stores a SHA-256 hash of a fresh token in `password_reset_tokens` (superseding any earlier one for that user) and emails the `{APP_BASE_URL}/reset-password?token=…` link. `POST /api/auth/reset-password` validates the token (exists / not used / not expired — TTL `PASSWORD_RESET_TTL_MINUTES`, default 60), sets the new password, marks the token used, and deletes all of that user's sessions (forces re-login everywhere). Both endpoints are IP-rate-limited. Email goes through Resend (`app/email/client.py`, httpx — same thin-wrapper style as `research/kanoon.py`, no SDK); with `RESEND_API_KEY` unset the send is skipped and the link is logged instead, so the flow is exercisable in local dev with no email account. Frontend: `/forgot-password` and `/reset-password` pages (public), a "Forgot your password?" link on the login form, and a success notice surfaced back on `/login` after a reset.
- **Google Sign-In:** ID-token flow via Google Identity Services (no OAuth redirect, no client secret). The browser's GIS button yields a signed Google ID token; the frontend POSTs it to `POST /api/auth/google`, which verifies it with `google-auth` (`app/auth/google.py` — signature against Google's certs, audience == `GOOGLE_CLIENT_ID`, not expired) and requires a **verified** email. It then finds the account by `google_sub`, else links to an existing account with the same (verified) email, else creates a fresh **passwordless** account — and issues a normal session (same `AuthResponse` as login). `users.password_hash` is nullable for these accounts (login guards against a null hash); `users.google_sub` is a unique-where-not-null column. Feature is gated on `GOOGLE_CLIENT_ID`: unset → the endpoint 503s and the frontend hides the button (`VITE_GOOGLE_CLIENT_ID`, same value). GIS script is loaded in `index.html`; `components/GoogleSignInButton.tsx` renders the button on the login + signup pages and calls `AuthContext.loginWithGoogle`.
- **Persistence:** Postgres holds users, sessions, and **case history**. Connection string via the `DATABASE_URL` env var (defaults to the `docker-compose.yml` service at `localhost:5433` — host 5433 to avoid a system Postgres on 5432); access goes through a process-wide `psycopg_pool.ConnectionPool` (psycopg 3), opened at startup and closed on shutdown by the app's `lifespan` — pooling is what makes it safe under multiple workers, and returning connections to the pool on context exit is also what closed the old per-request connection leak. Schema is lean idempotent DDL (`CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) run by `init_db()` at startup — no migration files/tool. Every successful `/api/analyze` run is saved for the user who ran it (`cases` table: title, filenames, warning count, the full `CaseAnalysis` as JSON) and the final result event carries its `case_id`. Saving is best-effort — a failure there adds a warning rather than costing the user the analysis they just waited for. Read back via `GET /api/cases` (summaries, newest first), `GET /api/cases/{id}` (summary + full analysis), `DELETE /api/cases/{id}`; every query is scoped by `user_id`, so one account can never read another's case. The analysis JSON is stored as one blob — nothing queries inside it. Timestamps are `timestamptz`, but the API renders `created_at` as the string `"YYYY-MM-DD HH:MM:SS"` (UTC) so the frontend contract is unchanged.

## Project structure

```
backend/
  pyproject.toml         deps (fastapi, uvicorn, pdfplumber, python-docx, pytesseract, pdf2image, openai, httpx, ...); dev: pytest
  .env.example           OPENROUTER_API_KEY / OPENROUTER_MODEL_CHEAP / _MID / _STRONG / OPENROUTER_BASE_URL / INDIANKANOON_API_TOKEN / DATABASE_URL / CORS_ORIGINS / RESEND_API_KEY / RESEND_FROM / APP_BASE_URL / GOOGLE_CLIENT_ID template
  tests/                 pytest suite (conftest fakes Settings env, gives each test its own throwaway Postgres schema, and clears the rate limiter; LLM + email calls monkeypatched): analyze-route degradation, case-history save/read/ownership, DOCX export contents/scoping, rerank validation, citation resolution, guardrails (upload limits, chunk budget, rate limiting), password-reset flow (token single-use/expiry, session invalidation, no account enumeration), Google sign-in (find/link/create, verification mocked, verified-email + not-configured guards)
  app/
    config.py            Settings (pydantic-settings) with model_for_tier(tier) helper + upload/prompt/LLM/rate-limit guardrail values, loads .env
    main.py               FastAPI app, CORS (allowed origins from the CORS_ORIGINS setting — comma-separated, defaults to the Vite dev origin), content-length limit middleware, mounts router under /api; lifespan opens/closes the DB pool
    api/routes.py         POST /api/analyze — accepts multiple files, streams NDJSON stage events + final result; run_stage() catches per-stage failures into warnings; stages run off the event loop, research passes concurrent; saves the finished analysis to case history and reports its case_id
    ingest/parser.py      DocumentChunk dataclass; parse_documents() — multi-file → per-page/paragraph chunks, deduped by content hash; OCR fallback per page; budget_chunks() trims the listing to what one extractor prompt can carry
    models/schemas.py     Party, Citation, CitedFact, CaseUnderstanding, Issue, Argument, StressTestPoint, OutlinePoint, ChecklistItem, HearingPrep, Authority, IssueResearch, CaseAnalysis (Pydantic)
    llm/client.py          get_client() / complete_json(system_prompt, user_prompt, model) — OpenRouter (OpenAI SDK) wrapper; retries once, raises LLMError on failure
    understand/extractor.py   extract_understanding(chunks, model) -> CaseUnderstanding (facts cite chunk numbers, validated → Citation)
    issues/identifier.py       identify_issues(understanding, model) -> list[Issue]
    research/kanoon.py         search_kanoon(query, token) — Indian Kanoon search API wrapper -> list[Authority]
    research/researcher.py     research_issues(issues, model, adverse=False) -> list[IssueResearch] — one batched query-gen call, then per-issue search+rerank in a ThreadPoolExecutor (adverse=True flips prompts to the opponent's position); per-issue failures skipped; also home of flatten_authorities()/select_by_number()
    arguments/generator.py    generate_arguments(understanding, issues, model) -> list[Argument] (supporting facts selected by validated fact number; carries counter_argument + rebuttal)
    stresstest/tester.py       stress_test(understanding, issues, arguments, adverse_research, model) -> list[StressTestPoint] (adverse authorities attached by validated number)
    prepare/assembler.py       assemble_hearing_prep(understanding, issues, arguments, stress_test, model) -> HearingPrep
    auth/google.py             verify_google_token(credential, client_id) — Google ID-token verification via google-auth (raises ValueError on any failure)
    auth/db.py                 Postgres (psycopg 3) connection pool + schema: users (incl. display name + nullable password_hash + unique google_sub) + sessions + cases + rate_limit_hits + password_reset_tokens tables. get_pool()/get_connection()/init_db()/reset_pool(); DDL is idempotent (CREATE/ALTER ... IF NOT EXISTS), run at startup, incl. columns added after a DB was created
    auth/security.py           pbkdf2_sha256 password hashing + session-token generation + reset-token generation/SHA-256 hashing (stdlib only, no extra deps)
    auth/ratelimit.py          Postgres-backed sliding-window rate limiter (rate_limit_hits table, advisory-locked per key; 429 + Retry-After); reset() is the test hook
    auth/routes.py             POST /api/auth/signup (name + email + password; name required, trimmed, max 80) | /login | /logout | /forgot-password | /reset-password | /google (verify ID token → find/link/create account → session), GET /api/auth/me (email + name + created_at), PATCH /api/auth/me (display name, trimmed, max 80); get_current_user dependency (Bearer token) — /api/analyze requires it
    email/client.py            send_password_reset_email(to, reset_url) via Resend (httpx); no key → link is logged instead of sent (dev)
    cases/store.py             save_case/list_cases/get_case/delete_case over the `cases` table (all scoped by user_id) + build_title() (parties → filenames fallback)
    cases/routes.py            GET /api/cases | GET /api/cases/{id} | GET /api/cases/{id}/export.docx | DELETE /api/cases/{id} — case history for the logged-in user
    export/docx_builder.py     build_hearing_pack(title, analysis) -> .docx bytes (python-docx, in memory) + export_filename() slug

frontend/
  package.json, vite.config.ts, tsconfig.json, index.html (loads the Google Identity Services script), .env.example (VITE_API_BASE_URL / VITE_GOOGLE_CLIENT_ID template)
  src/
    main.tsx              entry point, wraps App in BrowserRouter, imports index.css
    index.css             premium dark/gold theme — cards, modal, hero/landing sections, buttons, alert
    App.tsx                Routes: "/" -> LandingPage, "/login" & "/signup" -> AuthPage, "/forgot-password" -> ForgotPasswordPage, "/reset-password" -> ResetPasswordPage, "/app" -> AnalyzePage, "/cases" -> CasesPage, "/cases/:caseId" -> CaseDetailPage, "/profile" -> ProfilePage (last four wrapped in RequireAuth); all inside AuthProvider
    api/config.ts          API_BASE_URL — single source of truth for the backend base URL, from VITE_API_BASE_URL (defaults to http://localhost:8000/api); imported by the three api/* modules
    api/client.ts          analyzeCaseFiles(files, onStage?) — POSTs files to /api/analyze, reads the NDJSON stream, fires onStage per progress event, returns the final analysis; clears session on 401
    api/auth.ts            signup/login/googleAuth/logout/fetchProfile/updateName/loadSessionProfile (null on 401) + requestPasswordReset/resetPassword + localStorage session helpers
    api/cases.ts           listCases/getCase/deleteCase/downloadCaseExport against /api/cases (Bearer + 401 handling) + formatSavedAt() for the UTC timestamps
    auth/AuthContext.tsx   AuthProvider + useAuth() — session state incl. display name, validates the stored token via /auth/me on load; login/signup/loginWithGoogle set the session; setName keeps the header avatar in sync
    auth/RequireAuth.tsx   route guard — redirects to /login (preserving intended destination) when not authenticated
    types/index.ts         TS mirrors of the backend Pydantic schemas
    components/
      Card.tsx              clickable preview card (icon, title, preview text) used on the results grid
      Dropzone.tsx           drag-and-drop / browse file picker — filters to PDF+DOCX, dedupes by name+size, renders selected files as removable chips
      AppLayout.tsx          signed-in shell: left sidebar (logo + Analyze / Case history nav with active state) that closes via its × and reopens from the ☰ in the top bar — open/closed remembered in localStorage; top bar also holds the account menu. Wraps every authed page
      UserMenu.tsx           avatar button + dropdown (email, Profile, Sign out); closes on outside click or Escape
      Avatar.tsx             initials circle from the display name, falling back to the email (initialsFor())
      AnalysisResult.tsx     result header (case type, parties, counts, Export as Word / Analyze another / Case history) + the six cards and their modals — shared by AnalyzePage (fresh run) and CaseDetailPage (saved case)
      AppHeader.tsx          logged-in header: logo, Analyze / Case history nav, email, sign out
      Citations.tsx          renders a CitedFact's citations as (document, page/paragraph) badge chips
      Logo.tsx               site logo used in headers
      GoogleSignInButton.tsx renders the Google Identity Services button (hidden unless VITE_GOOGLE_CLIENT_ID is set) on the auth pages; on credential → AuthContext.loginWithGoogle → navigate
      Modal.tsx              overlay dialog (closes on backdrop click, close button, or Escape)
    pages/
      LandingPage.tsx        marketing page at "/" — nav, hero, "How it works" steps, sample-argument card, deliverables, feature grid, "How we keep it honest", "What it doesn't do", FAQ, CTA band, footer. Copy must stay true to the built product (it previously claimed no account and no storage)
      AuthPage.tsx           login/signup form (mode prop), used at /login and /signup — signup also asks for the user's full name; login shows a "Forgot your password?" link and a post-reset success notice
      ForgotPasswordPage.tsx request-reset screen at /forgot-password — email input → generic "check your inbox" confirmation
      ResetPasswordPage.tsx  set-new-password screen at /reset-password?token=… — new + confirm password → redirects to /login with a success notice
      ProfilePage.tsx        account page at /profile — avatar, editable display name, email, member-since, saved-case count, recent case history (5 newest, link to all), sign out
      AnalyzePage.tsx        state machine (idle/loading/error/done), owns the API call; on done, renders <AnalysisResult>
      CasesPage.tsx          saved case list (newest first) with open + inline-confirm delete; empty/loading/error states
      CaseDetailPage.tsx     loads one saved case by id and renders <AnalysisResult>
      UploadPage.tsx        "New analysis" screen: Dropzone + submit (blocks an empty submit); during analysis shows a progress bar, elapsed timer, and the live stage checklist (pending ○ / running … / done ✓) with the chosen files still visible
      UnderstandingPage.tsx  renders CaseUnderstanding (also used standalone, inside AnalyzePage's modal)
      IssuesPage.tsx         renders list[Issue] (inside modal)
      ArgumentsPage.tsx      renders list[Argument] (inside modal)
      StressTestPage.tsx     renders list[StressTestPoint] (inside modal)
      ResearchPage.tsx       renders list[IssueResearch] — authorities per issue with Indian Kanoon links (inside modal). Pass-agnostic: AnalysisResult hands it either the supporting or the adverse list
      PreparePage.tsx        renders HearingPrep (brief, outline, checklist) + the client-side "Export as text" download (plain content — the AI-generated notice now lives only in the Word export, `export/docx_builder.py::DISCLAIMER`) (inside modal). The Word export lives in AnalysisResult's header, which fetches it as a blob — it needs the Bearer header, so it can't be a plain link
```

## Status

**Working end-to-end**, verified with a real multi-page case file (both via direct API call and through the browser UI): upload one or more PDF/DOCX files → backend parses + chunks + dedupes them, extracts a structured understanding (`mid`, with per-fact chunk citations), identifies issues (`mid`), generates arguments (`strong`, with counter-arguments, rebuttals, and cited supporting facts), stress-tests the case (`strong`), assembles the hearing brief/outline/checklist (`strong`), and researches authorities per issue via Indian Kanoon (`mid`) — all returned in one response with any per-stage failure listed in `warnings` → frontend renders all six sections as cards, with citation chips on facts and supporting facts.

To run it:
```bash
# system deps for OCR (one-time, needs sudo)
sudo apt-get update && sudo apt-get install -y tesseract-ocr   # poppler-utils usually already present

# Postgres (from the repo root) — the backend's DATABASE_URL default points here
docker compose up -d

# backend
cd backend
cp .env.example .env   # fill in OPENROUTER_API_KEY, OPENROUTER_MODEL_CHEAP/MID/STRONG,
                       # INDIANKANOON_API_TOKEN (optional — Research stage skipped without it),
                       # and DATABASE_URL (defaults to the docker-compose Postgres)
uv sync
uv run uvicorn app.main:app --reload   # init_db() creates the schema on startup

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Known-good model note: DeepSeek V4 Flash did not reliably follow the JSON-mode schema instructions during testing (returned malformed JSON). Currently using a Mistral model for `MID` (Understand) and `openai/gpt-4o` for `STRONG` (Generate Arguments) — both work well. Pick models with solid JSON-mode support.

Tests: `backend/tests/` (pytest, `uv run pytest`) covers the analyze route's graceful
degradation, case-history persistence and per-user scoping, the DOCX export, the research
rerank index-validation, and citation resolution in the
extractor/generator. LLM calls are monkeypatched — no network or API key needed — but the
suite now needs a running **Postgres** (`docker compose up -d`, or point `TEST_DATABASE_URL`
at another database): each test gets its own throwaway schema, created and dropped by the
`temp_db` fixture in `conftest.py`.

Not yet done: deployment setup; parser/LLM-client/auth unit tests (deliberately skipped
as low-churn).

Deferred as pre-launch hardening (deliberately out of MVP scope): application-level
encryption at rest for case content (`cases.analysis`/`title`/`filenames`) — for MVP we
rely on the hosting/managed-Postgres provider's disk encryption; revisit app-level column
encryption before onboarding real client data or when defending against DB-credential-level
access.

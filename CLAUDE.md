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
| 04 | **Research** | Search + rerank over case law for real citations. | cheap | **Built, API-search-first** (no vector DB): per issue, `mid` generates keyword queries → Indian Kanoon search API → `mid` reranks hits by numbered index (validated server-side so it can't cite results that don't exist). Requires `INDIANKANOON_API_TOKEN`; without it the stage returns no results and the rest of the pipeline is unaffected. Runs twice: once before argument generation (supporting authorities → Stage 05) and once in adverse mode (queries/rerank flipped to the opponent's position → Stage 06). Supporting authorities also render in their own Research card. |
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

- **Backend:** FastAPI (Python). One endpoint, `POST /api/analyze`, runs the pipeline and **streams NDJSON**: `{"type":"stage","stage":...,"status":"started"|"done"}` events per stage, then a final `{"type":"result","analysis":...}` (or `{"type":"error"}` if Understanding fails). Pre-pipeline failures (bad file type, no text, auth) are still plain HTTP errors since they occur before streaming starts. All stage work runs via `run_in_threadpool` so the event loop is never blocked; the two research passes run concurrently, and within each pass the per-issue search+rerank fan out over a `ThreadPoolExecutor`. Package management via `uv`.
- **File parsing:** `pdfplumber` for PDF, `python-docx` for DOCX. Multiple files per case are supported — each is parsed into per-page (PDF) or per-paragraph (DOCX) chunks, then the whole set is deduplicated by content hash (catches the same exhibit uploaded twice). See `DocumentChunk` in `ingest/parser.py`.
- **OCR fallback:** for scanned/image-only PDFs with no text layer, `pdf2image` (needs the `poppler-utils` system package) rasterizes each page and `pytesseract` (needs the `tesseract-ocr` system package) OCRs it, one chunk per page. Only triggers when `pdfplumber` extracts no text — text-based PDFs never touch OCR.
- **LLM:** OpenRouter API (OpenAI-compatible), via the `openai` Python SDK with `base_url="https://openrouter.ai/api/v1"`. **Tiered model config** — three env vars, `OPENROUTER_MODEL_CHEAP` / `OPENROUTER_MODEL_MID` / `OPENROUTER_MODEL_STRONG` — let different stages use different models. Currently: Understand and Identify Issues use `mid`; Research (query gen + rerank, both passes) uses `cheap` — pick a fast model with solid JSON mode; Generate Arguments, Stress-test, and Prepare use `strong`. `complete_json` retries once on API errors or malformed JSON, then raises `LLMError`. Query generation is batched: one LLM call produces queries for all issues in a pass.
- **Research source:** Indian Kanoon search API (`INDIANKANOON_API_TOKEN` env var; stage is skipped without it). No local corpus, embeddings, or vector DB.
- **Graceful degradation:** if Understand fails the request 502s; any later stage failing is caught (`run_stage` in `api/routes.py`), logged, and reported in a `warnings` list on the response while the rest of the analysis still returns. `hearing_prep` is nullable for this reason.
- **Anti-hallucination pattern (used throughout):** the LLM only ever *selects by number* from a server-side list — rerank picks search hits by index, the extractor cites facts by chunk number, the generator cites supporting facts and authorities by number, the stress-tester attaches adverse authorities by number — and invalid indices are dropped in code (`select_by_number` / `flatten_authorities` in `research/researcher.py`), so citations/authorities can't be invented.
- **Frontend:** React + Vite + TypeScript, calling the FastAPI backend as a JSON API. Client-side routed (`react-router-dom`): `/` is a marketing landing page, `/app` is the upload → analyze flow, `/cases` is the saved case history and `/cases/:caseId` reopens one (both auth-gated). A fresh run and a saved case render through the same `AnalysisResult` component, so history is a full second view of the analysis, not a summary. Upload supports multiple files at once; results (understanding, issues, arguments, stress test, prepare) render as a hovering card grid — each card previews its section and opens the full detail in a modal.
- **Auth:** email + password accounts with opaque Bearer session tokens (7-day expiry), stored in SQLite (`backend/prehearing.db`, created automatically, gitignored). Passwords hashed with stdlib pbkdf2_sha256 — no extra dependencies. `/api/analyze` requires a valid token; the frontend keeps the session in localStorage and gates `/app` behind `/login`.
- **Persistence:** SQLite (`backend/prehearing.db`) holds users, sessions, and **case history**. Every successful `/api/analyze` run is saved for the user who ran it (`cases` table: title, filenames, warning count, the full `CaseAnalysis` as JSON) and the final result event carries its `case_id`. Saving is best-effort — a failure there adds a warning rather than costing the user the analysis they just waited for. Read back via `GET /api/cases` (summaries, newest first), `GET /api/cases/{id}` (summary + full analysis), `DELETE /api/cases/{id}`; every query is scoped by `user_id`, so one account can never read another's case. The analysis JSON is stored as one blob — nothing queries inside it.

## Project structure

```
backend/
  pyproject.toml         deps (fastapi, uvicorn, pdfplumber, python-docx, pytesseract, pdf2image, openai, httpx, ...); dev: pytest
  .env.example           OPENROUTER_API_KEY / OPENROUTER_MODEL_CHEAP / _MID / _STRONG / OPENROUTER_BASE_URL / INDIANKANOON_API_TOKEN template
  tests/                 pytest suite (conftest fakes Settings env and points the DB at a per-test tmp file; LLM calls monkeypatched): analyze-route degradation, case-history save/read/ownership, DOCX export contents/scoping, rerank validation, citation resolution
  app/
    config.py            Settings (pydantic-settings) with model_for_tier(tier) helper, loads .env
    main.py               FastAPI app, CORS, mounts router under /api
    api/routes.py         POST /api/analyze — accepts multiple files, streams NDJSON stage events + final result; run_stage() catches per-stage failures into warnings; stages run off the event loop, research passes concurrent; saves the finished analysis to case history and reports its case_id
    ingest/parser.py      DocumentChunk dataclass; parse_documents() — multi-file → per-page/paragraph chunks, deduped by content hash; OCR fallback per page
    models/schemas.py     Party, Citation, CitedFact, CaseUnderstanding, Issue, Argument, StressTestPoint, OutlinePoint, ChecklistItem, HearingPrep, Authority, IssueResearch, CaseAnalysis (Pydantic)
    llm/client.py          get_client() / complete_json(system_prompt, user_prompt, model) — OpenRouter (OpenAI SDK) wrapper; retries once, raises LLMError on failure
    understand/extractor.py   extract_understanding(chunks, model) -> CaseUnderstanding (facts cite chunk numbers, validated → Citation)
    issues/identifier.py       identify_issues(understanding, model) -> list[Issue]
    research/kanoon.py         search_kanoon(query, token) — Indian Kanoon search API wrapper -> list[Authority]
    research/researcher.py     research_issues(issues, model, adverse=False) -> list[IssueResearch] — one batched query-gen call, then per-issue search+rerank in a ThreadPoolExecutor (adverse=True flips prompts to the opponent's position); per-issue failures skipped; also home of flatten_authorities()/select_by_number()
    arguments/generator.py    generate_arguments(understanding, issues, model) -> list[Argument] (supporting facts selected by validated fact number; carries counter_argument + rebuttal)
    stresstest/tester.py       stress_test(understanding, issues, arguments, adverse_research, model) -> list[StressTestPoint] (adverse authorities attached by validated number)
    prepare/assembler.py       assemble_hearing_prep(understanding, issues, arguments, stress_test, model) -> HearingPrep
    auth/db.py                 SQLite (backend/prehearing.db, gitignored): users + sessions + cases tables, init_db() called at startup
    auth/security.py           pbkdf2_sha256 password hashing + session-token generation (stdlib only, no extra deps)
    auth/routes.py             POST /api/auth/signup | /login | /logout, GET /api/auth/me; get_current_user dependency (Bearer token) — /api/analyze requires it
    cases/store.py             save_case/list_cases/get_case/delete_case over the `cases` table (all scoped by user_id) + build_title() (parties → filenames fallback)
    cases/routes.py            GET /api/cases | GET /api/cases/{id} | GET /api/cases/{id}/export.docx | DELETE /api/cases/{id} — case history for the logged-in user
    export/docx_builder.py     build_hearing_pack(title, analysis) -> .docx bytes (python-docx, in memory) + export_filename() slug

frontend/
  package.json, vite.config.ts, tsconfig.json, index.html
  src/
    main.tsx              entry point, wraps App in BrowserRouter, imports index.css
    index.css             premium dark/gold theme — cards, modal, hero/landing sections, buttons, alert
    App.tsx                Routes: "/" -> LandingPage, "/login" & "/signup" -> AuthPage, "/app" -> AnalyzePage, "/cases" -> CasesPage, "/cases/:caseId" -> CaseDetailPage (last three wrapped in RequireAuth); all inside AuthProvider
    api/client.ts          analyzeCaseFiles(files, onStage?) — POSTs files to /api/analyze, reads the NDJSON stream, fires onStage per progress event, returns the final analysis; clears session on 401
    api/auth.ts            signup/login/logout/validateSession + localStorage session helpers
    api/cases.ts           listCases/getCase/deleteCase/downloadCaseExport against /api/cases (Bearer + 401 handling) + formatSavedAt() for the UTC timestamps
    auth/AuthContext.tsx   AuthProvider + useAuth() — session state, validates stored token via /auth/me on load
    auth/RequireAuth.tsx   route guard — redirects to /login (preserving intended destination) when not authenticated
    types/index.ts         TS mirrors of the backend Pydantic schemas
    components/
      Card.tsx              clickable preview card (icon, title, preview text) used on the results grid
      AnalysisResult.tsx     the six result cards + their modals for one CaseAnalysis — shared by AnalyzePage (fresh run) and CaseDetailPage (saved case)
      AppHeader.tsx          logged-in header: logo, Analyze / Case history nav, email, sign out
      AiDisclaimer.tsx       "AI-generated, verify before use" banner — results grid, Arguments/StressTest modals, and prepended to the Prepare text export
      Citations.tsx          renders a CitedFact's citations as (document, page/paragraph) badge chips
      Logo.tsx               site logo used in headers
      Modal.tsx              overlay dialog (closes on backdrop click, close button, or Escape)
    pages/
      LandingPage.tsx        marketing page at "/" — nav, hero, "How it works" steps, sample-argument card, deliverables, feature grid, "How we keep it honest", "What it doesn't do", FAQ, CTA band, footer. Copy must stay true to the built product (it previously claimed no account and no storage)
      AuthPage.tsx           login/signup form (mode prop), used at /login and /signup
      AnalyzePage.tsx        state machine (idle/loading/error/done), owns the API call; on done, renders <AnalysisResult>
      CasesPage.tsx          saved case list (newest first) with open + inline-confirm delete; empty/loading/error states
      CaseDetailPage.tsx     loads one saved case by id and renders <AnalysisResult>
      UploadPage.tsx        multi-file picker; during analysis shows the live stage-progress checklist (pending ○ / running … / done ✓)
      UnderstandingPage.tsx  renders CaseUnderstanding (also used standalone, inside AnalyzePage's modal)
      IssuesPage.tsx         renders list[Issue] (inside modal)
      ArgumentsPage.tsx      renders list[Argument] (inside modal)
      StressTestPage.tsx     renders list[StressTestPoint] (inside modal)
      ResearchPage.tsx       renders list[IssueResearch] — authorities per issue with Indian Kanoon links (inside modal)
      PreparePage.tsx        renders HearingPrep (brief, outline, checklist) + "Export as Word (.docx)" (fetches the backend export as a blob — needs the Bearer header, so it can't be a plain link) and the client-side "Export as text" download (inside modal)
```

## Status

**Working end-to-end**, verified with a real multi-page case file (both via direct API call and through the browser UI): upload one or more PDF/DOCX files → backend parses + chunks + dedupes them, extracts a structured understanding (`mid`, with per-fact chunk citations), identifies issues (`mid`), generates arguments (`strong`, with counter-arguments, rebuttals, and cited supporting facts), stress-tests the case (`strong`), assembles the hearing brief/outline/checklist (`strong`), and researches authorities per issue via Indian Kanoon (`mid`) — all returned in one response with any per-stage failure listed in `warnings` → frontend renders all six sections as cards, with citation chips on facts and supporting facts.

To run it:
```bash
# system deps for OCR (one-time, needs sudo)
sudo apt-get update && sudo apt-get install -y tesseract-ocr   # poppler-utils usually already present

# backend
cd backend
cp .env.example .env   # fill in OPENROUTER_API_KEY, OPENROUTER_MODEL_CHEAP/MID/STRONG,
                       # and INDIANKANOON_API_TOKEN (optional — Research stage skipped without it)
uv sync
uv run uvicorn app.main:app --reload

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Known-good model note: DeepSeek V4 Flash did not reliably follow the JSON-mode schema instructions during testing (returned malformed JSON). Currently using a Mistral model for `MID` (Understand) and `openai/gpt-4o` for `STRONG` (Generate Arguments) — both work well. Pick models with solid JSON-mode support.

Tests: `backend/tests/` (pytest, `uv run pytest`) covers the analyze route's graceful
degradation, case-history persistence and per-user scoping, the DOCX export, the research
rerank index-validation, and citation resolution in the
extractor/generator. LLM calls are monkeypatched — the suite runs in under a second with
no network or API key.

Not yet done: deployment setup; parser/LLM-client/auth unit tests (deliberately skipped
as low-churn).

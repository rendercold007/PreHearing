# PreHearing

## What this project is

PreHearing takes a lawyer's case file(s) and produces arguments for a hearing.

The target shape is a 7-stage pipeline. Only some stages are built — this table is the
roadmap, not a claim that all of it exists:

| # | Stage | What it does | Tier | Status |
|---|-------|---------------|------|--------|
| 01 | **Ingest** | Parse PDF/DOCX (OCR fallback for scans), segment into page/paragraph chunks, dedup by content hash. | deterministic | **Built** |
| 02 | **Understand** | Extract parties, facts, claims, defenses, procedural history into a structured `CaseUnderstanding`. | cheap/mid | **Built** (uses `mid`) |
| 03 | **Identify issues** | Derive a ranked list of legal/factual issues before the court. | mid | **Built** |
| 04 | **Research** | Hybrid retrieval + rerank over case law/statutes for real citations. | retrieval/rerank | **Deferred — no legal corpus source decided yet.** Building embeddings/retrieval now would have no real corpus to search, which is exactly the kind of speculative abstraction the scope rule below forbids. Revisit once there's a corpus (own vector DB, or a legal database API). |
| 05 | **Build arguments** | Map issue → proposition → authority → facts → conclusion; each argument also carries the strongest anticipated counter-argument and a rebuttal. | strong | **Built** (arguments are built against the Stage 03 issue list + case facts; no authority-mapping yet since Research isn't built) |
| 06 | **Stress-test** | Adverse authorities, factual weaknesses, likely objections, judge questions. | strong | **Built** (stress-tests the actual understanding/issues/arguments already produced; no adverse-authority citations yet since Research isn't built) |
| 07 | **Prepare** | Assemble hearing brief, oral-argument outline, checklist as an exportable pack. | strong | **Built** (assembled from the Stage 02/03/05/06 outputs already produced; export is a client-side text download, no backend file generation) |

Also **not built yet**: citation fields (which document/page a fact or argument came
from) on the response schemas. The Ingest stage already tracks per-chunk source
document + page/paragraph, specifically so that upgrade is straightforward later —
see `DocumentChunk` in `parser.py`.

## Scope boundaries

- Build toward the roadmap above, stage by stage. Don't jump ahead to a later stage
  (especially Research/Stage 04) before its prerequisites are actually decided/built.
- Do not add features outside this pipeline (case management, scheduling, billing,
  client CRM, multi-case dashboards, etc.) unless explicitly asked.
- Don't introduce speculative abstractions, plugins, or configurability for
  hypothetical future steps — the Research-stage deferral above is the concrete
  example of this rule in action.
- If a request falls outside this scope, flag it rather than silently expanding the project.

## Tech stack

- **Backend:** FastAPI (Python). One endpoint, `POST /api/analyze`, runs the built stages of the pipeline. Package management via `uv`.
- **File parsing:** `pdfplumber` for PDF, `python-docx` for DOCX. Multiple files per case are supported — each is parsed into per-page (PDF) or per-paragraph (DOCX) chunks, then the whole set is deduplicated by content hash (catches the same exhibit uploaded twice). See `DocumentChunk` in `ingest/parser.py`.
- **OCR fallback:** for scanned/image-only PDFs with no text layer, `pdf2image` (needs the `poppler-utils` system package) rasterizes each page and `pytesseract` (needs the `tesseract-ocr` system package) OCRs it, one chunk per page. Only triggers when `pdfplumber` extracts no text — text-based PDFs never touch OCR.
- **LLM:** OpenRouter API (OpenAI-compatible), via the `openai` Python SDK with `base_url="https://openrouter.ai/api/v1"`. **Tiered model config** — three env vars, `OPENROUTER_MODEL_CHEAP` / `OPENROUTER_MODEL_MID` / `OPENROUTER_MODEL_STRONG` — let different stages use different models. Currently: Understand and Identify Issues both use `mid`; Generate Arguments and Stress-test both use `strong`. `cheap` is provisioned but has no consumer yet.
- **Frontend:** React + Vite + TypeScript, calling the FastAPI backend as a JSON API. Client-side routed (`react-router-dom`): `/` is a marketing landing page, `/app` is the upload → analyze flow. Upload supports multiple files at once; results (understanding, issues, arguments, stress test, prepare) render as a hovering card grid — each card previews its section and opens the full detail in a modal.
- **Persistence:** none for now. Each case is processed synchronously and results are returned in the response — no database, no stored history. Add persistence only when there's an explicit need to save/revisit past cases.

## Project structure

```
backend/
  pyproject.toml         deps (fastapi, uvicorn, pdfplumber, python-docx, pytesseract, pdf2image, openai, ...)
  .env.example           OPENROUTER_API_KEY / OPENROUTER_MODEL_CHEAP / _MID / _STRONG / OPENROUTER_BASE_URL template
  app/
    config.py            Settings (pydantic-settings) with model_for_tier(tier) helper, loads .env
    main.py               FastAPI app, CORS, mounts router under /api
    api/routes.py         POST /api/analyze — accepts multiple files, runs the built pipeline stages
    ingest/parser.py      DocumentChunk dataclass; parse_documents() — multi-file → per-page/paragraph chunks, deduped by content hash; OCR fallback per page
    models/schemas.py     Party, CaseUnderstanding, Issue, Argument, StressTestPoint, OutlinePoint, ChecklistItem, HearingPrep, CaseAnalysis (Pydantic)
    llm/client.py          get_client() / complete_json(system_prompt, user_prompt, model) — thin OpenRouter (OpenAI SDK) wrapper, model chosen by the caller
    understand/extractor.py   extract_understanding(text, model) -> CaseUnderstanding
    issues/identifier.py       identify_issues(understanding, model) -> list[Issue]
    arguments/generator.py    generate_arguments(understanding, issues, model) -> list[Argument] (each Argument also carries counter_argument + rebuttal)
    stresstest/tester.py       stress_test(understanding, issues, arguments, model) -> list[StressTestPoint]
    prepare/assembler.py       assemble_hearing_prep(understanding, issues, arguments, stress_test, model) -> HearingPrep

frontend/
  package.json, vite.config.ts, tsconfig.json, index.html
  src/
    main.tsx              entry point, wraps App in BrowserRouter, imports index.css
    index.css             premium dark/gold theme — cards, modal, hero/landing sections, buttons, alert
    App.tsx                Routes: "/" -> LandingPage, "/app" -> AnalyzePage
    api/client.ts          analyzeCaseFiles(files) — POSTs multiple files to /api/analyze
    types/index.ts         TS mirrors of the backend Pydantic schemas
    components/
      Card.tsx              clickable preview card (icon, title, preview text) used on the results grid
      Modal.tsx              overlay dialog (closes on backdrop click, close button, or Escape)
    pages/
      LandingPage.tsx        marketing page at "/" — hero, "How it works" steps, feature grid, CTA into /app
      AnalyzePage.tsx        state machine (idle/loading/error/done), owns the API call; on done, renders the result-section card grid and opens each section's page component in a Modal
      UploadPage.tsx        multi-file picker, shows loading/error state
      UnderstandingPage.tsx  renders CaseUnderstanding (also used standalone, inside AnalyzePage's modal)
      IssuesPage.tsx         renders list[Issue] (inside modal)
      ArgumentsPage.tsx      renders list[Argument] (inside modal)
      StressTestPage.tsx     renders list[StressTestPoint] (inside modal)
      PreparePage.tsx        renders HearingPrep (brief, outline, checklist) + client-side "Export as text" download (inside modal)
```

## Status

**Working end-to-end**, verified with a real multi-page case file (both via direct API call and through the browser UI): upload one or more PDF/DOCX files → backend parses + chunks + dedupes them, calls `mid` to extract a structured understanding, calls `mid` again to identify issues, calls `strong` to generate arguments (with counter-arguments and rebuttals) against those issues, calls `strong` again to stress-test the case, calls `strong` a final time to assemble the hearing brief/outline/checklist, returns all five in one response → frontend renders understanding, issues, arguments, stress test, and the Prepare pack.

To run it:
```bash
# system deps for OCR (one-time, needs sudo)
sudo apt-get update && sudo apt-get install -y tesseract-ocr   # poppler-utils usually already present

# backend
cd backend
cp .env.example .env   # fill in OPENROUTER_API_KEY, OPENROUTER_MODEL_CHEAP/MID/STRONG
uv sync
uv run uvicorn app.main:app --reload

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Known-good model note: DeepSeek V4 Flash did not reliably follow the JSON-mode schema instructions during testing (returned malformed JSON). Currently using a Mistral model for `MID` (Understand) and `openai/gpt-4o` for `STRONG` (Generate Arguments) — both work well. Pick models with solid JSON-mode support.

Not yet done: Stage 04 (see roadmap table above), citation fields on the response schemas, automated tests, deployment setup.

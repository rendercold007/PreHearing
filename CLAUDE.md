# PreHearing

## What this project is

PreHearing takes a lawyer's case file and produces arguments for a hearing. That is the entire scope.

Pipeline:

1. **Ingest** — accept a case file (document(s) provided by the lawyer) as input.
2. **Understand** — parse and comprehend the case file's facts, claims, and relevant details.
3. **Generate arguments** — produce arguments the lawyer can use in the hearing, based on that understanding.

## Scope boundaries

- Do not add features beyond ingest → understand → generate arguments (e.g. no case management, scheduling, billing, client CRM, document drafting beyond arguments, multi-case dashboards, etc.) unless the user explicitly asks.
- Keep the pipeline simple and linear. Don't introduce speculative abstractions, plugins, or configurability for hypothetical future steps.
- If a request falls outside this scope, flag it rather than silently expanding the project.

## Tech stack

- **Backend:** FastAPI (Python). Exposes a small REST API for upload, understanding, and argument generation. Package management via `uv`.
- **File parsing:** `pypdf`/`pdfplumber` for PDF, `python-docx` for DOCX/DOC. Text is extracted locally and passed to the LLM — one uniform path for both formats, rather than relying on a provider's native document ingestion.
- **OCR fallback:** for scanned/image-only PDFs with no text layer, `pdf2image` (needs the `poppler-utils` system package) rasterizes each page and `pytesseract` (needs the `tesseract-ocr` system package) OCRs it. Only triggers when `pdfplumber` extracts no text — text-based PDFs never touch OCR.
- **LLM:** OpenRouter API (OpenAI-compatible), accessed via the `openai` Python SDK with `base_url="https://openrouter.ai/api/v1"` and an OpenRouter API key. Model is set via an `OPENROUTER_MODEL` env var (no default picked yet) so it can be changed without code changes. Used for both the "understand" step (structured extraction of facts/claims/parties) and the "generate arguments" step.
- **Frontend:** React + Vite + TypeScript, calling the FastAPI backend as a JSON API. Three screens: upload case file, view extracted understanding, view generated arguments.
- **Persistence:** none for now. Each case file is processed synchronously and results are returned in the response — no database, no stored history. Add persistence only when there's an explicit need to save/revisit past cases.

## Project structure

```
backend/
  pyproject.toml         deps (fastapi, uvicorn, pypdf, pdfplumber, python-docx, openai, ...)
  .env.example           OPENROUTER_API_KEY / OPENROUTER_MODEL / OPENROUTER_BASE_URL template
  app/
    config.py            Settings (pydantic-settings), loads .env
    main.py               FastAPI app, CORS, mounts router under /api
    api/routes.py         POST /api/analyze — the one endpoint, runs the full pipeline
    ingest/parser.py      extract_text() — PDF (pdfplumber, OCR fallback via pdf2image+pytesseract) / DOCX (python-docx) → plain text
    models/schemas.py     Party, CaseUnderstanding, Argument, CaseAnalysis (Pydantic)
    llm/client.py          get_client() / complete_json() — thin OpenRouter (OpenAI SDK) wrapper
    understand/extractor.py   extract_understanding(text) -> CaseUnderstanding
    arguments/generator.py    generate_arguments(understanding) -> list[Argument]

frontend/
  package.json, vite.config.ts, tsconfig.json, index.html
  src/
    main.tsx              entry point, imports index.css
    index.css             basic styling (cards, buttons, alert)
    App.tsx                state machine (idle/loading/error/done), owns the API call
    api/client.ts          analyzeCaseFile() — POSTs file to /api/analyze
    types/index.ts         TS mirrors of the backend Pydantic schemas
    pages/
      UploadPage.tsx        file picker, shows loading/error state
      UnderstandingPage.tsx  renders CaseUnderstanding
      ArgumentsPage.tsx      renders list[Argument]
```

## Status

**Working end-to-end**, verified manually through the browser: upload a PDF/DOCX → backend parses it, calls the LLM to extract a structured understanding, calls the LLM again to generate arguments, returns both in one response → frontend renders all three screens.

To run it:
```bash
# system deps for OCR (one-time, needs sudo)
sudo apt-get update && sudo apt-get install -y tesseract-ocr   # poppler-utils usually already present

# backend
cd backend
cp .env.example .env   # fill in OPENROUTER_API_KEY and OPENROUTER_MODEL
uv sync
uv run uvicorn app.main:app --reload

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Known-good model note: DeepSeek V4 Flash did not reliably follow the JSON-mode schema instructions during testing (returned malformed JSON). Models with solid JSON-mode support (e.g. `openai/gpt-4o-mini`, `google/gemini-2.0-flash-001`) worked correctly. Pick `OPENROUTER_MODEL` accordingly.

Not yet done: no automated tests, no deployment setup.

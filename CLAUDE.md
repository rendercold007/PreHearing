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
- **LLM:** OpenRouter API (OpenAI-compatible), accessed via the `openai` Python SDK with `base_url="https://openrouter.ai/api/v1"` and an OpenRouter API key. Model is set via an `OPENROUTER_MODEL` env var (no default picked yet) so it can be changed without code changes. Used for both the "understand" step (structured extraction of facts/claims/parties) and the "generate arguments" step.
- **Frontend:** React + Vite + TypeScript, calling the FastAPI backend as a JSON API. Three screens: upload case file, view extracted understanding, view generated arguments.
- **Persistence:** none for now. Each case file is processed synchronously and results are returned in the response — no database, no stored history. Add persistence only when there's an explicit need to save/revisit past cases.

## Status

Tech stack decided (see above). No code has been scaffolded yet.

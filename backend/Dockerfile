# PreHearing backend — FastAPI served by uvicorn.
# Persistent container (not serverless): streams NDJSON for minutes, keeps a psycopg
# pool + threadpool + rate-limit sweep timer alive across requests.
FROM python:3.12-slim

# uv (fast, lockfile-driven installs) copied from its official image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# System packages for the OCR fallback on scanned PDFs:
#   tesseract-ocr  -> pytesseract
#   poppler-utils  -> pdf2image (rasterizes pages)
RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0

# 1) Install dependencies as their own cached layer (no app source yet), from the
#    lockfile so the image is reproducible.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# 2) Copy the app source and install the project itself.
COPY app ./app
RUN uv sync --frozen --no-dev

# Put the project venv on PATH so `uvicorn` resolves without `uv run`.
ENV PATH="/app/.venv/bin:$PATH"

# Local `docker run` default; Railway/most PaaS inject their own $PORT.
EXPOSE 8000

# Shell form so ${PORT} expands at runtime (defaults to 8000 when unset).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

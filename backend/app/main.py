from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.auth.db import init_db, reset_pool
from app.auth.routes import router as auth_router
from app.cases.routes import router as cases_router
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Open the pool and ensure the schema exists before serving requests; close the
    # pool cleanly on shutdown so connections are returned to Postgres.
    init_db()
    yield
    reset_pool()


app = FastAPI(title="PreHearing", lifespan=lifespan)


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    """Reject an oversized upload before the body is read.

    The per-file checks in the analyze route run after FastAPI has already parsed the
    multipart body — by then Starlette has spooled anything over 1 MB to a temp file.
    This is the only place that can turn the bytes away at the door.
    """
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit():
        settings = get_settings()
        if int(content_length) > settings.max_total_bytes:
            return JSONResponse(
                status_code=413,
                content={
                    "detail": (
                        f"Upload is too large — the limit is "
                        f"{settings.max_total_mb:g} MB per analysis."
                    )
                },
            )
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(cases_router, prefix="/api")

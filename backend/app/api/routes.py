import asyncio
import json
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.arguments.generator import generate_arguments
from app.auth.ratelimit import check_rate_limit
from app.auth.routes import CurrentUser, get_current_user
from app.cases.store import save_case
from app.billing.store import increment_usage, quota_status
from app.config import get_settings
from app.ingest.parser import UnsupportedFileType, budget_chunks, parse_documents
from app.issues.identifier import identify_issues
from app.models.schemas import CaseAnalysis
from app.prepare.assembler import assemble_hearing_prep
from app.stresstest.tester import stress_test
from app.understand.extractor import extract_understanding
from app.research.researcher import research_issues

logger = logging.getLogger(__name__)

router = APIRouter()


def _event(payload: dict) -> str:
    return json.dumps(payload) + "\n"


def enforce_upload_limits(files: list[UploadFile], settings) -> None:
    """Reject oversized uploads before any parsing or LLM work happens.

    Note this runs after FastAPI has already parsed the multipart body (Starlette
    spools anything over 1 MB to a temp file), so it bounds the pipeline rather than
    the upload itself — main.py's content-length middleware is what stops the bytes
    at the door.
    """
    if len(files) > settings.max_files:
        raise HTTPException(
            status_code=413,
            detail=f"Too many files — {len(files)} uploaded, {settings.max_files} is the limit.",
        )

    total = 0
    for upload in files:
        size = upload.size or 0
        total += size
        if size > settings.max_file_bytes:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"{upload.filename or 'A file'} is {size / 1024 / 1024:.1f} MB — "
                    f"the limit is {settings.max_file_mb:g} MB per file."
                ),
            )

    if total > settings.max_total_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"These files total {total / 1024 / 1024:.1f} MB — "
                f"the limit is {settings.max_total_mb:g} MB per analysis."
            ),
        )


@router.post("/analyze")
async def analyze_case(
    files: list[UploadFile] = File(...),
    user: CurrentUser = Depends(get_current_user),
) -> StreamingResponse:
    settings = get_settings()
    # Keyed by user, not IP — one account should not be able to run up an unbounded
    # LLM bill, and every caller here is authenticated anyway.
    check_rate_limit(
        f"analyze:{user.id}", settings.analyze_rate_limit, settings.analyze_rate_window_seconds
    )
    quota = await run_in_threadpool(quota_status, user.id)
    if quota["remaining"] <= 0:
        raise HTTPException(
            status_code=402,
            detail=(
                f"You've used all {quota['limit']} analyses on the {quota['plan']} "
                f"plan this month. Upgrade your plan to run more."
            )
        )
    enforce_upload_limits(files, settings)

    raw_files = [(f.filename, await f.read()) for f in files]
    filenames = [name for name, _ in raw_files if name]

    try:
        chunks = await run_in_threadpool(parse_documents, raw_files)
    except UnsupportedFileType as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not chunks:
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

    # The extractor sends every chunk in one prompt, so the case has to fit inside it.
    chunks, dropped_chunks = budget_chunks(chunks, settings.max_prompt_chars)

    async def stream():
        warnings: list[str] = []
        failed: set[str] = set()

        if dropped_chunks:
            # Say it out loud — a silently truncated case file is worse than a slow one.
            warnings.append(
                f"This case file is larger than one analysis can process, so "
                f"{dropped_chunks} page{'' if dropped_chunks == 1 else 's'} at the end "
                f"were not read. Split the file and analyse it in parts for full coverage."
            )

        async def run_stage(name: str, stage: str, fn, fallback):
            try:
                return await run_in_threadpool(fn)
            except Exception:
                logger.exception("%s stage failed", name)
                failed.add(stage)
                warnings.append(
                    f"{name} failed and was skipped. The rest of the analysis is unaffected."
                )
                return fallback

        def stage_done(stage: str) -> str:
            """A stage that fell back to its default reports "failed", not "done" —
            otherwise the client draws a crashed stage exactly like a successful one."""
            status = "failed" if stage in failed else "done"
            return _event({"type": "stage", "stage": stage, "status": status})

        # Understanding is the foundation — without it nothing downstream is meaningful.
        yield _event({"type": "stage", "stage": "understanding", "status": "started"})
        try:
            understanding = await run_in_threadpool(
                extract_understanding, chunks, settings.model_for_tier("mid")
            )
        except Exception:
            logger.exception("Understanding stage failed")
            yield _event(
                {
                    "type": "error",
                    "detail": "The analysis service failed to read the case. Please try again.",
                }
            )
            return
        yield _event({"type": "stage", "stage": "understanding", "status": "done"})

        yield _event({"type": "stage", "stage": "issues", "status": "started"})
        issues = await run_stage(
            "Issue identification",
            "issues",
            lambda: identify_issues(understanding, model=settings.model_for_tier("mid")),
            [],
        )
        yield stage_done("issues")

        # Both research passes only need the issue list, so they run concurrently.
        cheap = settings.model_for_tier("cheap")
        yield _event({"type": "stage", "stage": "research", "status": "started"})
        yield _event({"type": "stage", "stage": "adverse_research", "status": "started"})
        research_task = asyncio.ensure_future(
            run_stage("Research", "research", lambda: research_issues(issues, model=cheap), [])
        )
        adverse_task = asyncio.ensure_future(
            run_stage(
                "Adverse research",
                "adverse_research",
                lambda: research_issues(issues, model=cheap, adverse=True),
                [],
            )
        )
        research = await research_task
        adverse_research = await adverse_task
        yield stage_done("research")
        yield stage_done("adverse_research")

        yield _event({"type": "stage", "stage": "arguments", "status": "started"})
        arguments = await run_stage(
            "Argument Generation",
            "arguments",
            lambda: generate_arguments(
                understanding, issues, research, model=settings.model_for_tier("strong")
            ),
            [],
        )
        yield stage_done("arguments")

        yield _event({"type": "stage", "stage": "stress_test", "status": "started"})
        stress_test_points = await run_stage(
            "Stress Test",
            "stress_test",
            lambda: stress_test(
                understanding, issues, arguments, adverse_research,
                model=settings.model_for_tier("strong"),
            ),
            [],
        )
        yield stage_done("stress_test")

        yield _event({"type": "stage", "stage": "prepare", "status": "started"})
        hearing_prep = await run_stage(
            "Hearing Prep",
            "prepare",
            lambda: assemble_hearing_prep(
                understanding, issues, arguments, stress_test_points,
                model=settings.model_for_tier("strong"),
            ),
            None,
        )
        yield stage_done("prepare")

        analysis = CaseAnalysis(
            understanding=understanding,
            issues=issues,
            arguments=arguments,
            stress_test=stress_test_points,
            hearing_prep=hearing_prep,
            research=research,
            adverse_research=adverse_research,
            warnings=warnings,
        )

        # Saved to case history so the user can revisit this run later. A failure here
        # must not cost them the analysis they just waited for.
        try:
            case_id = await run_in_threadpool(save_case, user.id, analysis, filenames)
        except Exception:
            logger.exception("Saving the case failed")
            case_id = None
            analysis.warnings.append(
                "This analysis could not be saved to your case history."
            )

        try:
            await run_in_threadpool(increment_usage, user.id)
        except Exception:
            logger.exception("Recording analysis usage failed")        

        yield _event(
            {"type": "result", "analysis": analysis.model_dump(), "case_id": case_id}
        )

    return StreamingResponse(stream(), media_type="application/x-ndjson")

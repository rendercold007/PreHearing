import asyncio
import json
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.arguments.generator import generate_arguments
from app.auth.routes import CurrentUser, get_current_user
from app.config import get_settings
from app.ingest.parser import UnsupportedFileType, parse_documents
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


@router.post("/analyze")
async def analyze_case(
    files: list[UploadFile] = File(...),
    user: CurrentUser = Depends(get_current_user),
) -> StreamingResponse:
    raw_files = [(f.filename, await f.read()) for f in files]

    try:
        chunks = await run_in_threadpool(parse_documents, raw_files)
    except UnsupportedFileType as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not chunks:
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

    settings = get_settings()

    async def stream():
        warnings: list[str] = []

        async def run_stage(name: str, fn, fallback):
            try:
                return await run_in_threadpool(fn)
            except Exception:
                logger.exception("%s stage failed", name)
                warnings.append(
                    f"{name} failed and was skipped. The rest of the analysis is unaffected."
                )
                return fallback

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
            lambda: identify_issues(understanding, model=settings.model_for_tier("mid")),
            [],
        )
        yield _event({"type": "stage", "stage": "issues", "status": "done"})

        # Both research passes only need the issue list, so they run concurrently.
        cheap = settings.model_for_tier("cheap")
        yield _event({"type": "stage", "stage": "research", "status": "started"})
        yield _event({"type": "stage", "stage": "adverse_research", "status": "started"})
        research_task = asyncio.ensure_future(
            run_stage("Research", lambda: research_issues(issues, model=cheap), [])
        )
        adverse_task = asyncio.ensure_future(
            run_stage(
                "Adverse research", lambda: research_issues(issues, model=cheap, adverse=True), []
            )
        )
        research = await research_task
        adverse_research = await adverse_task
        yield _event({"type": "stage", "stage": "research", "status": "done"})
        yield _event({"type": "stage", "stage": "adverse_research", "status": "done"})

        yield _event({"type": "stage", "stage": "arguments", "status": "started"})
        arguments = await run_stage(
            "Argument Generation",
            lambda: generate_arguments(
                understanding, issues, research, model=settings.model_for_tier("strong")
            ),
            [],
        )
        yield _event({"type": "stage", "stage": "arguments", "status": "done"})

        yield _event({"type": "stage", "stage": "stress_test", "status": "started"})
        stress_test_points = await run_stage(
            "Stress Test",
            lambda: stress_test(
                understanding, issues, arguments, adverse_research,
                model=settings.model_for_tier("strong"),
            ),
            [],
        )
        yield _event({"type": "stage", "stage": "stress_test", "status": "done"})

        yield _event({"type": "stage", "stage": "prepare", "status": "started"})
        hearing_prep = await run_stage(
            "Hearing Prep",
            lambda: assemble_hearing_prep(
                understanding, issues, arguments, stress_test_points,
                model=settings.model_for_tier("strong"),
            ),
            None,
        )
        yield _event({"type": "stage", "stage": "prepare", "status": "done"})

        analysis = CaseAnalysis(
            understanding=understanding,
            issues=issues,
            arguments=arguments,
            stress_test=stress_test_points,
            hearing_prep=hearing_prep,
            research=research,
            warnings=warnings,
        )
        yield _event({"type": "result", "analysis": analysis.model_dump()})

    return StreamingResponse(stream(), media_type="application/x-ndjson")

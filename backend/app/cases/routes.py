from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from app.auth.routes import CurrentUser, get_current_user
from app.cases.store import delete_case, get_case, list_cases
from app.export.docx_builder import build_hearing_pack, export_filename
from app.export.pdf_builder import build_hearing_pack_pdf, export_filename_pdf
from app.models.schemas import CaseAnalysis

router = APIRouter(prefix="/cases")


class CaseSummary(BaseModel):
    id: int
    title: str
    filenames: list[str]
    warning_count: int
    created_at: str


class CaseDetail(CaseSummary):
    analysis: CaseAnalysis


@router.get("", response_model=list[CaseSummary])
async def list_saved_cases(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return await run_in_threadpool(list_cases, user.id)


@router.get("/{case_id}", response_model=CaseDetail)
async def read_saved_case(
    case_id: int, user: CurrentUser = Depends(get_current_user)
) -> dict:
    case = await run_in_threadpool(get_case, user.id, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@router.get("/{case_id}/export.docx")
async def export_saved_case(
    case_id: int, user: CurrentUser = Depends(get_current_user)
) -> Response:
    case = await run_in_threadpool(get_case, user.id, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    content = await run_in_threadpool(build_hearing_pack, case["title"], case["analysis"])
    return Response(
        content=content,
        media_type=DOCX_MEDIA_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{export_filename(case["title"])}"'
        },
    )


@router.get("/{case_id}/export.pdf")
async def export_saved_case_pdf(
    case_id: int, user: CurrentUser = Depends(get_current_user)
) -> Response:
    case = await run_in_threadpool(get_case, user.id, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    content = await run_in_threadpool(build_hearing_pack_pdf, case["title"], case["analysis"])
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{export_filename_pdf(case["title"])}"'
        },
    )


@router.delete("/{case_id}", status_code=204)
async def delete_saved_case(
    case_id: int, user: CurrentUser = Depends(get_current_user)
) -> None:
    if not await run_in_threadpool(delete_case, user.id, case_id):
        raise HTTPException(status_code=404, detail="Case not found.")

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

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

router = APIRouter()

@router.post("/analyze", response_model=CaseAnalysis)
async def analyze_case(
    files: list[UploadFile] = File(...),
    user: CurrentUser = Depends(get_current_user),
) -> CaseAnalysis:
    raw_files = [(f.filename,await f.read()) for f in files]

    try:
        chunks = parse_documents(raw_files)
    except UnsupportedFileType as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not chunks:
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

    case_text = "\n\n".join(
        f"[{chunk.source_document} - {chunk.location}]\n {chunk.text}" for chunk in chunks
    )    
    
    settings = get_settings()
    understanding = extract_understanding(case_text,model=settings.model_for_tier("mid"))
    issues = identify_issues(understanding, model=settings.model_for_tier("mid"))
    arguments = generate_arguments(understanding, issues,  model=settings.model_for_tier("strong"))
    stress_test_points = stress_test(understanding, issues, arguments, model=settings.model_for_tier("strong"))
    hearing_prep = assemble_hearing_prep(
        understanding, issues, arguments, stress_test_points, model=settings.model_for_tier("strong"))
    research = research_issues(issues, model=settings.model_for_tier("mid")) 

    return CaseAnalysis(
        understanding=understanding,
        issues=issues,
        arguments=arguments,
        stress_test=stress_test_points,
        hearing_prep=hearing_prep,
        research=research,
    )

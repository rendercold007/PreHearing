from fastapi import APIRouter, File, HTTPException, UploadFile

from app.arguments.generator import generate_arguments
from app.ingest.parser import UnsupportedFileType, extract_text
from app.models.schemas import CaseAnalysis
from app.understand.extractor import extract_understanding

router = APIRouter()

@router.post("/analyze", response_model=CaseAnalysis)
async def analyze_case(file: UploadFile = File(...)) -> CaseAnalysis:
    content = await file.read()

    try:
        case_text = extract_text(file.filename, content)
    except UnsupportedFileType as exc:
        raise HTTPException(stauts_code=400, detail=str(exc)) from exc

    if not case_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

    understanding = extract_understanding(case_text)
    arguments = generate_arguments(understanding)

    return CaseAnalysis(understanding=understanding, arguments=arguments)        

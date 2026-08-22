import io
from pathlib import Path

import pdfplumber
from docx import Document

class UnsupportedFileType(ValueError):
    pass


def extract_text(filename: str, content: bytes) -> str:
    """Extract raw texr from a case file. Supports PDF and DOCX."""
    suffix = Path(filename).suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(content)

    if suffix == ".docx":
        return _extract_docx(content)

    raise UnsupportedFileType(f"Unsupported file type: {suffix or 'unknown'}")


def _extract_pdf(content: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)

def _extract_docx(content: bytes) -> str:
    document = Document(io.BytesIO(content))
    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]  
    return "\n\n".join(paragraphs)
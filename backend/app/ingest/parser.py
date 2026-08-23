import io
from pathlib import Path

import pdfplumber
import pytesseract
from docx import Document
from pdf2image import convert_from_bytes

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
    text = _extract_pdf_text_layer(content)
    if text.strip():
        return text
    return _extract_pdf_via_ocr(content)


def _extract_pdf_text_layer(content: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def _extract_pdf_via_ocr(content: bytes) -> str:
    """Fallback for scanned/image-only PDFs with no text layer."""
    images = convert_from_bytes(content)
    text_parts = [pytesseract.image_to_string(image) for image in images]
    return "\n\n".join(part for part in text_parts if part.strip())

def _extract_docx(content: bytes) -> str:
    document = Document(io.BytesIO(content))
    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]  
    return "\n\n".join(paragraphs)
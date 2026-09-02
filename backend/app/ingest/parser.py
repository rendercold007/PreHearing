import hashlib
import io
from dataclasses import dataclass
from pathlib import Path

import pdfplumber
import pytesseract
from docx import Document
from pdf2image import convert_from_bytes, pdfinfo_from_bytes

class UnsupportedFileType(ValueError):
    pass


@dataclass
class DocumentChunk:
    source_document: str
    location: str
    text: str

    @property
    def content_hash(self) -> str:
        return hashlib.sha256(self.text.strip().encode("utf-8")).hexdigest()

def parse_documents(files: list[tuple[str, bytes]]) -> list[DocumentChunk]:
    """Parse multiple case files into deduplicated chunks"""
    all_chunks: list[DocumentChunk] = []
    for filename, content in files:
        all_chunks.extend(_parse_file(filename,content))
    return _dedupe(all_chunks)

def budget_chunks(
    chunks: list[DocumentChunk], max_chars: int
) -> tuple[list[DocumentChunk], int]:
    """Trim the chunk list to what one extractor prompt can carry.

    The whole listing goes into a single LLM call, so an oversized case file would
    otherwise be rejected by the provider and surface as a generic stage failure.
    Returns the chunks that fit and how many were dropped, so the caller can tell
    the user their document was truncated rather than silently analysing part of it.
    """
    kept: list[DocumentChunk] = []
    used = 0
    for index, chunk in enumerate(chunks):
        # Mirrors the per-chunk framing extract_understanding adds around the text.
        cost = len(chunk.text) + len(chunk.source_document) + len(chunk.location) + 16
        if kept and used + cost > max_chars:
            return kept, len(chunks) - index
        used += cost
        kept.append(chunk)
    return kept, 0


def _dedupe(chunks: list[DocumentChunk]) -> list[DocumentChunk]:
    seen_hashes: set[str] = set()
    deduped: list[DocumentChunk] = []
    for chunk in chunks:
        if chunk.content_hash in seen_hashes:
            continue
        seen_hashes.add(chunk.content_hash)
        deduped.append(chunk)
    return deduped

def _parse_file(filename: str, content: bytes) -> list[DocumentChunk]:
    suffix = Path(filename).suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf_chunks(filename, content)

    if suffix == ".docx":
        return _extract_docx_chunks(filename, content) 

    raise UnsupportedFileType(f"Unsupported file type: {suffix or 'unknown'}")

def _extract_pdf_chunks(filename: str, content: bytes) -> list[DocumentChunk]:
    chunks = _extract_pdf_text_layer_chunks(filename, content)
    if chunks:
        return chunks
    return _extract_pdf_ocr_chunks(filename, content)

def _extract_pdf_text_layer_chunks(filename: str, content: bytes) -> list[DocumentChunk]:
    chunks = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page_number , page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text and page_text.strip():

                chunks.append(
                DocumentChunk(
                    source_document=filename,
                    location=f"page {page_number}",
                    text=page_text,
                )
            )
    return chunks

# OCR rasterizes each page into an uncompressed image; converting a whole scanned
# filing at once holds every page's bitmap in memory simultaneously and OOM-kills the
# container on large documents. Convert one page at a time so peak memory is ~one page
# regardless of length, and use a modest DPI that keeps each page's footprint small
# while staying legible for tesseract.
_OCR_DPI = 150


def _extract_pdf_ocr_chunks(filename: str, content: bytes) -> list[DocumentChunk]:
    """fallback from scanned/image-only PDFs with no text layer."""
    chunks = []
    page_count = pdfinfo_from_bytes(content)["Pages"]
    for page_number in range(1, page_count + 1):
        # first_page/last_page keeps pdftoppm from decoding the whole file per call;
        # each iteration converts and OCRs exactly one page, then lets it be freed.
        images = convert_from_bytes(
            content,
            dpi=_OCR_DPI,
            first_page=page_number,
            last_page=page_number,
        )
        if not images:
            continue
        page_text = pytesseract.image_to_string(images[0])
        if page_text.strip():
            chunks.append(
                DocumentChunk(
                    source_document=filename,
                    location=f"page {page_number}",
                    text=page_text,
                )
            )
    return chunks


def _extract_docx_chunks(filename: str, content: bytes) -> list[DocumentChunk]:
    document = Document(io.BytesIO(content))
    chunks = []
    paragraph_number = 0
    for paragraph in document.paragraphs:
        if not paragraph.text.strip():
            continue
        paragraph_number += 1
        chunks.append(
            DocumentChunk(
                source_document=filename,
                location=f"paragraph {paragraph_number}",
                text=paragraph.text,
            )
        )
    return chunks           

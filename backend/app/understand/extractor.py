from app.ingest.parser import DocumentChunk
from app.llm.client import complete_json
from app.models.schemas import CaseUnderstanding, CitedFact, Citation

_SYSTEM_PROMPT = """You are a legal analyst preparing a lawyer's case file for a hearing.
The case file is given as numbered excerpts, each labelled [n] with its source document
and page/paragraph. Read them and extract a structured understanding of the case.

Respond with a single JSON object with exactly these keys:
- "case_type": string, e.g. "civil", "criminal", "family"
- "parties": list of objects with "name" and "role" (e.g. "plaintiff", "defendant")
- "key_facts": list of objects, the material facts of the case, each with:
  - "text": string, the fact itself
  - "chunks": list of integers, the excerpt numbers [n] where this fact appears
- "claims": list of strings, the claims or charges being made
- "disputed_points": list of strings, points of fact or law that the parties disagree on
- "summary": string, a concise narrative summary of the case

Only use information present in the case file. Do not invent facts, and only cite
excerpt numbers that actually appear in the input."""


def _resolve_fact(item, chunks: list[DocumentChunk]) -> CitedFact | None:
    if isinstance(item, str):
        return CitedFact(text=item.strip()) if item.strip() else None
    if not isinstance(item, dict):
        return None
    text = str(item.get("text", "")).strip()
    if not text:
        return None

    citations: list[Citation] = []
    seen: set[int] = set()
    raw_chunks = item.get("chunks")
    for index in raw_chunks if isinstance(raw_chunks, list) else []:
        if isinstance(index, int) and 1 <= index <= len(chunks) and index not in seen:
            seen.add(index)
            chunk = chunks[index - 1]
            citations.append(
                Citation(source_document=chunk.source_document, location=chunk.location)
            )
    return CitedFact(text=text, citations=citations)


def extract_understanding(chunks: list[DocumentChunk], model: str) -> CaseUnderstanding:
    listing = "\n\n".join(
        f"[{i}] ({chunk.source_document}, {chunk.location})\n{chunk.text}"
        for i, chunk in enumerate(chunks, start=1)
    )
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=listing,
        model=model,
    )

    raw_facts = result.get("key_facts")
    facts = [
        fact
        for item in (raw_facts if isinstance(raw_facts, list) else [])
        if (fact := _resolve_fact(item, chunks)) is not None
    ]
    result["key_facts"] = [fact.model_dump() for fact in facts]
    return CaseUnderstanding.model_validate(result)

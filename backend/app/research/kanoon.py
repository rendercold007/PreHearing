import re
import httpx

from app.models.schemas import Authority

SEARCH_URL = "https://api.indiankanoon.org/search/"

def _strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


def search_kanoon(query: str, token: str, max_results: int = 8) -> list[Authority]:
    response = httpx.post(
        SEARCH_URL,
        params={"formInput": query, "pagenum": 0},
        headers={"Authorization": f"Token {token}"},
        timeout=30,
    )
    response.raise_for_status()
    docs = response.json().get("docs", [])[:max_results]

    return [
        Authority(
            doc_id=str(doc["tid"]),
            title=_strip_tags(doc.get("title", "")),
            court=doc.get("docsource", ""),
            date=doc.get("publishdate", ""),
            url=f"https://indiankanoon.org/doc/{doc['tid']}/",
            snippet=_strip_tags(doc.get("headline", "")),
        )
        for doc in docs
        if doc.get("tid")
    ]
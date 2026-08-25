import json
import logging
import time
from functools import lru_cache

from openai import OpenAI, OpenAIError

from app.config import get_settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """LLM call failed after retries (API error or unparseable JSON)."""

@lru_cache
def get_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        timeout=settings.llm_timeout_seconds,
        # complete_json already owns the retry policy; leaving the SDK's own retries on
        # would multiply with it (2 x 3 x the timeout before a stage gives up).
        max_retries=0,
    )

def complete_json(system_prompt: str, user_prompt: str, model: str, attempts: int = 2) -> dict:
    """Call the llm and parse its response as JSON. Retries once on API errors
    or malformed JSON before giving up with LLMError."""
    client = get_client()
    settings = get_settings()
    last_error : Exception | None = None
    
    for attempt in range(attempts):
        try:
            
            response = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                max_tokens=settings.llm_max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )

            # Nothing else measures spend, so log what each call cost in tokens.
            usage = getattr(response, "usage", None)
            if usage is not None:
                logger.info(
                    "llm call model=%s prompt_tokens=%s completion_tokens=%s",
                    model,
                    getattr(usage, "prompt_tokens", "?"),
                    getattr(usage, "completion_tokens", "?"),
                )

            content = response.choices[0].message.content
            parsed = json.loads(content)
            if not isinstance(parsed, dict):
                raise json.JSONDecodeError("expected a JSON object", content or "", 0)
            return parsed
        except (OpenAIError, json.JSONDecodeError) as exc:
            last_error = exc
            logger.warning(
                "llm call failed (attempt %s/%s, model=%s): %s", attempt + 1, attempts, model, exc
            )
            if attempt < attempts-1:
                time.sleep(1.5)
    raise LLMError(f"LLM call failed after {attempts} attempts: {last_error}") from last_error                
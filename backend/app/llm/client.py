import json 
import time
from functools import lru_cache

from openai import OpenAI, OpenAIError

from app.config import get_settings

class LLMError(Exception):
    """LLM call failed after retries (API error or unparseable JSON)."""

@lru_cache
def get_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )

def complete_json(system_prompt: str, user_prompt: str, model: str, attempts: int = 2) -> dict:
    """Call the llm and parse its response as JSON. Retries once on API errors
    or malformed JSON before giving up with LLMError."""
    client = get_client()   
    last_error : Exception | None = None
    
    for attempt in range(attempts):
        try:
            
            response = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            ) 

            content = response.choices[0].message.content
            parsed = json.loads(content)
            if not isinstance(parsed, dict):
                raise json.JSONDecodeError("expected a JSON object", content or "", 0)
            return parsed
        except (OpenAIError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt < attempts-1:
                time.sleep(1.5)
    raise LLMError(f"LLM call failed after {attempts} attempts: {last_error}") from last_error                
import json 
from functools import lru_cache

from openai import OpenAI

from app.config import get_settings

@lru_cache
def get_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )

def complete_json(system_prompt: str, user_prompt: str) -> dict:
    """Call the llm and parse its response as JSON"""
    settings = get_settings()
    client = get_client()   

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    ) 

    content = response.choices[0].message.content
    return json.loads(content)
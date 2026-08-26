from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

Tier = Literal["cheap", "mid", "strong"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openrouter_api_key: str
    openrouter_model_cheap: str
    openrouter_model_mid: str
    openrouter_model_strong: str
    indiankanoon_api_token: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Postgres connection string. Defaults to the local docker-compose service so a
    # fresh checkout runs against `docker compose up` with no extra configuration.
    database_url: str = "postgresql://prehearing:prehearing@localhost:5433/prehearing"

    # Browser origins allowed to call the API (CORS), comma-separated. Defaults to the
    # local Vite dev server; set to the deployed frontend's origin(s) in production.
    cors_origins: str = "http://localhost:5173"

    # Upload guardrails. Without these a single request can read an unbounded number
    # of bytes into memory before anything else runs.
    max_files: int = 20
    max_file_mb: float = 25
    max_total_mb: float = 60

    # How much document text one analysis may send to the extractor. The whole chunk
    # listing goes into a single prompt, so this is the real ceiling on a run.
    max_prompt_chars: int = 240_000

    # LLM call limits. The SDK defaults to a 600s timeout and its own retries, which
    # multiply with complete_json's — a single stage could hang for the best part of
    # an hour.
    llm_timeout_seconds: float = 120
    llm_max_tokens: int = 8000

    # Requests allowed per window, per client. Auth is keyed by IP, analysis by user.
    auth_rate_limit: int = 10
    auth_rate_window_seconds: int = 60
    analyze_rate_limit: int = 5
    analyze_rate_window_seconds: int = 3600

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_file_bytes(self) -> int:
        return int(self.max_file_mb * 1024 * 1024)

    @property
    def max_total_bytes(self) -> int:
        return int(self.max_total_mb * 1024 * 1024)

    def model_for_tier(self, tier: Tier) -> str:
        return {
            "cheap": self.openrouter_model_cheap,
            "mid": self.openrouter_model_mid,
            "strong": self.openrouter_model_strong,
        }[tier]


@lru_cache
def get_settings() -> Settings:
    return Settings()

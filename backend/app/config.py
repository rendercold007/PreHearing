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
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    def model_for_tier(self, tier: Tier) -> str:
        return {
            "cheap": self.openrouter_model_cheap,
            "mid": self.openrouter_model_mid,
            "strong": self.openrouter_model_strong,
        }[tier]


@lru_cache
def get_settings() -> Settings:
    return Settings()

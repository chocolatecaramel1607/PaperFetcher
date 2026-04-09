import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite+aiosqlite:///./paperfetcher.db"

    # JWT
    secret_key: str = "paperfetcher-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Paper sources
    semantic_scholar_base_url: str = "https://api.semanticscholar.org/graph/v1"
    arxiv_base_url: str = "https://export.arxiv.org/api"
    pubmed_base_url: str = "https://www.ebi.ac.uk/europepmc/webservices/rest"

    # Source priority (comma-separated)
    paper_sources: str = "semantic_scholar,arxiv,pubmed"

    # Scheduling
    daily_fetch_hour: int = 8
    daily_fetch_minute: int = 0

    # Request settings
    request_timeout: int = 30
    max_papers_per_domain: int = 20

    model_config = {"env_file": os.path.join(os.path.dirname(__file__), "..", ".env")}


settings = Settings()

import os
from pathlib import Path

from pydantic import BaseModel


def _load_env_file(dotenv_path: str = ".env") -> None:
    """Load key-value pairs from a .env file into os.environ if not already set."""
    env_file = Path(dotenv_path)
    if not env_file.is_file():
        return
    with env_file.open(encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, _, value = stripped.partition("=")
            key = key.strip()
            value = value.strip().strip("'\"")
            if key and key not in os.environ:
                os.environ[key] = value


_load_env_file()


def _default_database_url() -> str:
    db_path = Path(__file__).resolve().parents[2] / "detective_ai.db"
    return f"sqlite:///{db_path}"


def _default_log_file() -> str:
    log_path = Path(__file__).resolve().parents[2] / "logs" / "detective_ai.log"
    return str(log_path)


class Settings(BaseModel):
    """Core settings for DetectiveAI engine."""

    app_name: str = os.getenv("APP_NAME", "DetectiveAI")
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    api_v1_prefix: str = "/api/v1"
    database_url: str = os.getenv("DATABASE_URL", _default_database_url())

    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_file: str = os.getenv("LOG_FILE", _default_log_file())

    # Lamatic AgentKit Settings
    lamatic_endpoint: str | None = os.getenv("LAMATIC_ENDPOINT")
    lamatic_project_id: str | None = os.getenv("LAMATIC_PROJECT_ID")
    lamatic_api_key: str | None = os.getenv("LAMATIC_API_KEY")
    lamatic_flow_id: str | None = os.getenv("LAMATIC_FLOW_ID")
    lamatic_suspect_flow_id: str | None = os.getenv("LAMATIC_SUSPECT_FLOW_ID")
    lamatic_evidence_flow_id: str | None = os.getenv("LAMATIC_EVIDENCE_FLOW_ID")
    lamatic_solution_flow_id: str | None = os.getenv("LAMATIC_SOLUTION_FLOW_ID")


settings = Settings()

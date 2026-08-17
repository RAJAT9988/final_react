from app.core.configs.base_config import BaseConfig


class AppConfig(BaseConfig):
    """Global application configuration."""

    PROJECT_NAME: str = "FastAPI Modular Monolith"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "atomo_db"

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/atomo_db"


app_config = AppConfig()

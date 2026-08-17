from fastapi import FastAPI

from app.core.configs.app_config import app_config
from app.core.routers import api_router

app = FastAPI(
    title=app_config.PROJECT_NAME,
    debug=app_config.DEBUG,
)

app.include_router(api_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

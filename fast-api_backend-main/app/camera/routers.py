from fastapi import APIRouter

from app.camera.routes.v1.camera import router as camera_router

router_v1 = APIRouter(prefix="/v1")

router_v1.include_router(camera_router)

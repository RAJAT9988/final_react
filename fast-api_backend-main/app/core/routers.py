from fastapi import APIRouter

from app.company.routers import router_v1 as company_router_v1
from app.device.routers import router_v1 as device_router_v1
from app.camera.routers import router_v1 as camera_router_v1
from app.user_management.routers import router_v1 as user_management_router_v1

api_router = APIRouter()
api_router.include_router(company_router_v1)
api_router.include_router(user_management_router_v1)
api_router.include_router(device_router_v1)
api_router.include_router(camera_router_v1)

from fastapi import APIRouter

from app.user_management.routes.v1.auth import router as auth_router
from app.user_management.routes.v1.profile import router as profile_router
from app.user_management.routes.v1.role import router as role_router
from app.user_management.routes.v1.user import router as user_router

router_v1 = APIRouter(prefix="/v1")

router_v1.include_router(auth_router)
router_v1.include_router(profile_router)
router_v1.include_router(user_router)
router_v1.include_router(role_router)

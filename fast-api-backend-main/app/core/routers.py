from fastapi import APIRouter

from app.auth import router_v1 as auth_router_v1
from app.company import router_v1 as company_router_v1

router_v1 = APIRouter()
router_v1.include_router(auth_router_v1)
router_v1.include_router(company_router_v1)

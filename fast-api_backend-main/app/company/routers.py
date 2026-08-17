from fastapi import APIRouter

from app.company.routes.v1.address import router as address_router
from app.company.routes.v1.company import router as company_router
from app.company.routes.v1.company_branch import router as branch_router
from app.company.routes.v1.country import router as country_router

router_v1 = APIRouter(prefix="/v1")

router_v1.include_router(company_router)
router_v1.include_router(branch_router)
router_v1.include_router(address_router)
router_v1.include_router(country_router)

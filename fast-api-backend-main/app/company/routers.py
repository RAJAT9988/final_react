from fastapi import APIRouter

from app.company.routes.v1 import company, company_branch, address


router_v1 = APIRouter()
router_v1.include_router(company.router, prefix='/company', tags=['company'])
router_v1.include_router(company_branch.router, prefix='/company-branch', tags=['company-branch'])
router_v1.include_router(address.router, prefix='/address', tags=['address'])
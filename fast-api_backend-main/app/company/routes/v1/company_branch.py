import uuid
from typing import List
from fastapi import APIRouter, status

from app.company.dependencies.services import CompanyBranchServiceDep
from app.company.schemas.company_branch import (
    CompanyBranchCreate,
    CompanyBranchDTO,
    CompanyBranchUpdate,
)
from app.core.deps import DBSessionDep

router = APIRouter(tags=["Company Branches"])


@router.get("/companies/{company_id}/branches", response_model=List[CompanyBranchDTO])
async def list_branches_by_company(
    company_id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyBranchServiceDep,
) -> List[CompanyBranchDTO]:
    return await service.list_branches_by_company(db=db, company_id=company_id)


@router.post(
    "/companies/{company_id}/branches",
    response_model=CompanyBranchDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_company_branch(
    company_id: uuid.UUID,
    branch_in: CompanyBranchCreate,
    db: DBSessionDep,
    service: CompanyBranchServiceDep,
) -> CompanyBranchDTO:
    # ensure payload company_id matches path parameter
    branch_in.company_id = company_id
    return await service.create_branch(db=db, obj_in=branch_in)


@router.get("/branches/{id}", response_model=CompanyBranchDTO)
async def get_branch(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyBranchServiceDep,
) -> CompanyBranchDTO:
    return await service.get_by_id(db=db, branch_id=id)


@router.patch("/branches/{id}", response_model=CompanyBranchDTO)
async def update_branch(
    id: uuid.UUID,
    branch_in: CompanyBranchUpdate,
    db: DBSessionDep,
    service: CompanyBranchServiceDep,
) -> CompanyBranchDTO:
    return await service.update_branch(db=db, branch_id=id, obj_in=branch_in)


@router.delete("/branches/{id}", response_model=CompanyBranchDTO)
async def delete_branch(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyBranchServiceDep,
) -> CompanyBranchDTO:
    return await service.delete_branch(db=db, branch_id=id)

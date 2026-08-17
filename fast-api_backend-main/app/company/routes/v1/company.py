import uuid
from typing import List
from fastapi import APIRouter, status

from app.company.dependencies.services import CompanyServiceDep
from app.company.schemas.company import CompanyCreate, CompanyDTO, CompanyUpdate
from app.core.deps import DBSessionDep

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=List[CompanyDTO])
async def list_companies(
    db: DBSessionDep,
    service: CompanyServiceDep,
    skip: int = 0,
    limit: int = 100,
) -> List[CompanyDTO]:
    return await service.list_companies(db=db, skip=skip, limit=limit)


@router.post("", response_model=CompanyDTO, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_in: CompanyCreate,
    db: DBSessionDep,
    service: CompanyServiceDep,
) -> CompanyDTO:
    return await service.create_company(db=db, obj_in=company_in)


@router.get("/{id}", response_model=CompanyDTO)
async def get_company(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyServiceDep,
) -> CompanyDTO:
    return await service.get_by_id(db=db, company_id=id)


@router.patch("/{id}", response_model=CompanyDTO)
async def update_company(
    id: uuid.UUID,
    company_in: CompanyUpdate,
    db: DBSessionDep,
    service: CompanyServiceDep,
) -> CompanyDTO:
    return await service.update_company(db=db, company_id=id, obj_in=company_in)


@router.delete("/{id}", response_model=CompanyDTO)
async def delete_company(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyServiceDep,
) -> CompanyDTO:
    return await service.delete_company(db=db, company_id=id)

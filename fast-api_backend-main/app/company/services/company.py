import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.events import CompanyCreated, CompanyDeleted
from app.company.exceptions import CompanyNotFoundException
from app.company.repositories.company import CompanyRepository
from app.company.schemas.company import CompanyCreate, CompanyDTO, CompanyUpdate


class CompanyService:
    """Service handling Company business logic and transaction boundaries."""

    def __init__(self, company_repo: CompanyRepository) -> None:
        self.company_repo = company_repo

    async def get_by_id(self, db: AsyncSession, company_id: uuid.UUID) -> CompanyDTO:
        company = await self.company_repo.get_by_id(db, company_id)
        if not company:
            raise CompanyNotFoundException(company_id)
        return CompanyDTO.model_validate(company)

    async def list_companies(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[CompanyDTO]:
        companies = await self.company_repo.get_active_companies(
            db, skip=skip, limit=limit
        )
        return [CompanyDTO.model_validate(c) for c in companies]

    async def create_company(
        self, db: AsyncSession, obj_in: CompanyCreate
    ) -> CompanyDTO:
        company = await self.company_repo.create(db, obj_in.model_dump())
        dto = CompanyDTO.model_validate(company)
        # Event instance ready for dispatch
        _event = CompanyCreated(
            company_id=dto.company_id, company_name=dto.company_name
        )
        return dto

    async def update_company(
        self, db: AsyncSession, company_id: uuid.UUID, obj_in: CompanyUpdate
    ) -> CompanyDTO:
        company = await self.company_repo.get_by_id(db, company_id)
        if not company:
            raise CompanyNotFoundException(company_id)
        updated = await self.company_repo.update(
            db, company, obj_in.model_dump(exclude_unset=True)
        )
        return CompanyDTO.model_validate(updated)

    async def delete_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> CompanyDTO:
        company = await self.company_repo.get_by_id(db, company_id)
        if not company:
            raise CompanyNotFoundException(company_id)
        deleted = await self.company_repo.soft_delete(db, company)
        dto = CompanyDTO.model_validate(deleted)
        _event = CompanyDeleted(company_id=dto.company_id)
        return dto

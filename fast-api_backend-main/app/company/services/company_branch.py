import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.events import CompanyBranchCreated
from app.company.exceptions import (
    CompanyBranchNotFoundException,
    CompanyNotFoundException,
)
from app.company.repositories.company import CompanyRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.schemas.company_branch import (
    CompanyBranchCreate,
    CompanyBranchDTO,
    CompanyBranchUpdate,
)


class CompanyBranchService:
    """Service handling CompanyBranch business logic."""

    def __init__(
        self,
        branch_repo: CompanyBranchRepository,
        company_repo: CompanyRepository,
    ) -> None:
        self.branch_repo = branch_repo
        self.company_repo = company_repo

    async def get_by_id(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> CompanyBranchDTO:
        branch = await self.branch_repo.get_by_id(db, branch_id)
        if not branch:
            raise CompanyBranchNotFoundException(branch_id)
        return CompanyBranchDTO.model_validate(branch)

    async def list_branches_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[CompanyBranchDTO]:
        company = await self.company_repo.get_by_id(db, company_id)
        if not company:
            raise CompanyNotFoundException(company_id)
        branches = await self.branch_repo.get_by_company_id(db, company_id)
        return [CompanyBranchDTO.model_validate(b) for b in branches]

    async def create_branch(
        self, db: AsyncSession, obj_in: CompanyBranchCreate
    ) -> CompanyBranchDTO:
        company = await self.company_repo.get_by_id(db, obj_in.company_id)
        if not company:
            raise CompanyNotFoundException(obj_in.company_id)
        branch = await self.branch_repo.create(db, obj_in.model_dump())
        dto = CompanyBranchDTO.model_validate(branch)
        _event = CompanyBranchCreated(
            branch_id=dto.branch_id, company_id=dto.company_id
        )
        return dto

    async def update_branch(
        self, db: AsyncSession, branch_id: uuid.UUID, obj_in: CompanyBranchUpdate
    ) -> CompanyBranchDTO:
        branch = await self.branch_repo.get_by_id(db, branch_id)
        if not branch:
            raise CompanyBranchNotFoundException(branch_id)
        updated = await self.branch_repo.update(
            db, branch, obj_in.model_dump(exclude_unset=True)
        )
        return CompanyBranchDTO.model_validate(updated)

    async def delete_branch(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> CompanyBranchDTO:
        branch = await self.branch_repo.get_by_id(db, branch_id)
        if not branch:
            raise CompanyBranchNotFoundException(branch_id)
        deleted = await self.branch_repo.soft_delete(db, branch)
        return CompanyBranchDTO.model_validate(deleted)

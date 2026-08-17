import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.company_branch import CompanyBranch
from app.core.db.base_repository import BaseRepository


class CompanyBranchRepository(BaseRepository[CompanyBranch]):
    """Repository for CompanyBranch entity operations."""

    def __init__(self) -> None:
        super().__init__(CompanyBranch)

    async def get_by_id(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> Optional[CompanyBranch]:
        stmt = select(CompanyBranch).where(
            CompanyBranch.branch_id == branch_id,
            CompanyBranch.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_company_id(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[CompanyBranch]:
        stmt = select(CompanyBranch).where(
            CompanyBranch.company_id == company_id,
            CompanyBranch.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

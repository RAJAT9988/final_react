import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.company import Company
from app.core.db.base_repository import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    """Repository for Company entity operations."""

    def __init__(self) -> None:
        super().__init__(Company)

    async def get_by_id(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> Optional[Company]:
        stmt = select(Company).where(
            Company.company_id == company_id, Company.is_deleted.is_(False)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_active_companies(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[Company]:
        stmt = (
            select(Company)
            .where(Company.is_deleted.is_(False))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

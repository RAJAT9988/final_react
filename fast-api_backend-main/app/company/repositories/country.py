import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.country import Country
from app.core.db.base_repository import BaseRepository


class CountryRepository(BaseRepository[Country]):
    """Repository for Country entity operations."""

    def __init__(self) -> None:
        super().__init__(Country)

    async def get_by_id(
        self, db: AsyncSession, country_id: uuid.UUID
    ) -> Optional[Country]:
        stmt = select(Country).where(Country.country_id == country_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(
        self, db: AsyncSession, country_name: str
    ) -> Optional[Country]:
        stmt = select(Country).where(Country.country_name == country_name)
        result = await db.execute(stmt)
        return result.scalars().first()

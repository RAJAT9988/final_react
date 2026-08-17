import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.address import Address
from app.core.db.base_repository import BaseRepository


class AddressRepository(BaseRepository[Address]):
    """Repository for Address entity operations."""

    def __init__(self) -> None:
        super().__init__(Address)

    async def get_by_id(
        self, db: AsyncSession, address_id: uuid.UUID
    ) -> Optional[Address]:
        stmt = select(Address).where(
            Address.address_id == address_id, Address.is_deleted.is_(False)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

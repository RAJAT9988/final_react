import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.state import State
from app.core.db.base_repository import BaseRepository


class StateRepository(BaseRepository[State]):
    """Repository for State entity operations."""

    def __init__(self) -> None:
        super().__init__(State)

    async def get_by_id(self, db: AsyncSession, state_id: uuid.UUID) -> Optional[State]:
        stmt = select(State).where(State.state_id == state_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_country(
        self, db: AsyncSession, country_id: uuid.UUID
    ) -> List[State]:
        stmt = select(State).where(State.country_id == country_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

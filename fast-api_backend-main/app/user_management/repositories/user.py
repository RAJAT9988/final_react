import uuid
from typing import Any, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.user_management.models.user import User


class UserRepository(BaseRepository[User]):
    """Repository for User entity operations."""

    def __init__(self) -> None:
        super().__init__(User)

    async def get_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        stmt = select(User).where(User.user_id == user_id, User.is_deleted.is_(False))
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        stmt = select(User).where(
            User.email == email.lower(), User.is_deleted.is_(False)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_by_company(
        self,
        db: AsyncSession,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        stmt = (
            select(User)
            .where(User.company_id == company_id, User.is_deleted.is_(False))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def count_by_company(self, db: AsyncSession, company_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(User)
            .where(User.company_id == company_id, User.is_deleted.is_(False))
        )
        result = await db.execute(stmt)
        return int(result.scalar_one())

    async def list_all(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[User]:
        stmt = select(User).where(User.is_deleted.is_(False)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_reset_token_hash(
        self, db: AsyncSession, token_hash: str
    ) -> Optional[User]:
        stmt = select(User).where(
            User.password_reset_token_hash == token_hash,
            User.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def update_including_none(
        self, db: AsyncSession, db_obj: User, obj_in: dict[str, Any]
    ) -> User:
        """Like update(), but None values are written (needed to clear secrets)."""
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

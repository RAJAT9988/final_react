import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.user_management.models.refresh_token import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for hashed refresh tokens and family revocation."""

    def __init__(self) -> None:
        super().__init__(RefreshToken)

    async def get_by_token_hash(
        self, db: AsyncSession, token_hash: str
    ) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_active_by_user(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> List[RefreshToken]:
        now = datetime.now(timezone.utc)
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > now,
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def revoke_family(self, db: AsyncSession, family_id: uuid.UUID) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id)
            .values(revoked=True)
        )
        await db.execute(stmt)
        await db.flush()

    async def revoke_all_for_user(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .values(revoked=True)
        )
        await db.execute(stmt)
        await db.flush()

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.repositories.refresh_token import RefreshTokenRepository
from app.user_management.security import hash_token
from tests.user_management.conftest import create_user


@pytest.mark.asyncio
async def test_refresh_token_revoke_family(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    user = await create_user(db_session, company_id, email="tok@example.com")
    repo = RefreshTokenRepository()
    family_id = uuid.uuid4()
    raw = "refresh-token-value"
    created = await repo.create(
        db_session,
        {
            "user_id": user.user_id,
            "family_id": family_id,
            "token_hash": hash_token(raw),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            "revoked": False,
        },
    )
    found = await repo.get_by_token_hash(db_session, hash_token(raw))
    assert found is not None
    assert found.id == created.id

    active = await repo.list_active_by_user(db_session, user.user_id)
    assert len(active) == 1

    await repo.revoke_family(db_session, family_id)
    reused = await repo.get_by_token_hash(db_session, hash_token(raw))
    assert reused is not None
    assert reused.revoked is True

    await repo.revoke_all_for_user(db_session, user.user_id)
    assert await repo.list_active_by_user(db_session, user.user_id) == []

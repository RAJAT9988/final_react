import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.repositories.user import UserRepository
from app.user_management.security import hash_password
from app.user_management.seed import ROLE_OWNER
from tests.user_management.conftest import create_user


@pytest.mark.asyncio
async def test_user_repository_crud(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    repo = UserRepository()
    user = await create_user(
        db_session, company_id, email="repo@example.com", role_id=ROLE_OWNER
    )
    assert user.user_id is not None
    assert user.is_deleted is False

    fetched = await repo.get_by_id(db_session, user.user_id)
    assert fetched is not None
    assert fetched.email == "repo@example.com"

    by_email = await repo.get_by_email(db_session, "repo@example.com")
    assert by_email is not None
    assert by_email.user_id == user.user_id

    assert await repo.count_by_company(db_session, company_id) == 1
    listed = await repo.list_by_company(db_session, company_id)
    assert len(listed) == 1

    deleted = await repo.soft_delete(db_session, fetched)
    assert deleted.is_deleted is True
    assert await repo.get_by_id(db_session, user.user_id) is None


@pytest.mark.asyncio
async def test_user_repository_reset_token_and_clear(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    repo = UserRepository()
    user = await create_user(db_session, company_id, email="reset@example.com")
    updated = await repo.update(
        db_session,
        user,
        {"password_reset_token_hash": hash_password("x")[:64]},
    )
    found = await repo.get_by_reset_token_hash(
        db_session, updated.password_reset_token_hash or ""
    )
    assert found is not None
    cleared = await repo.update_including_none(
        db_session, found, {"password_reset_token_hash": None}
    )
    assert cleared.password_reset_token_hash is None

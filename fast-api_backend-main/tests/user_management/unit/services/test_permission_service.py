import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.exceptions import UserNotFoundException
from app.user_management.seed import ROLE_ADMIN, ROLE_VIEWER
from tests.user_management.conftest import build_permission_service, create_user


@pytest.mark.asyncio
async def test_permission_service_has_permission(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    service = build_permission_service()
    admin = await create_user(
        db_session, company_id, email="perm-admin@example.com", role_id=ROLE_ADMIN
    )
    viewer = await create_user(
        db_session, company_id, email="perm-view@example.com", role_id=ROLE_VIEWER
    )
    assert await service.has_permission(db_session, admin.user_id, "add_user") is True
    assert (
        await service.has_permission(db_session, admin.user_id, "remove_user") is False
    )
    assert await service.has_permission(db_session, viewer.user_id, "add_user") is False


@pytest.mark.asyncio
async def test_permission_service_user_not_found(
    db_session: AsyncSession, rbac: None
) -> None:
    service = build_permission_service()
    with pytest.raises(UserNotFoundException):
        await service.has_permission(db_session, uuid.uuid4(), "add_user")

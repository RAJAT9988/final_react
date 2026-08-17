import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.repositories.role_permission import RolePermissionRepository
from app.user_management.seed import ROLE_ADMIN, ROLE_OWNER, ROLE_VIEWER


@pytest.mark.asyncio
async def test_role_permission_matrix(db_session: AsyncSession, rbac: None) -> None:
    repo = RolePermissionRepository()
    assert await repo.is_allowed(db_session, ROLE_OWNER, "remove_user") is True
    assert await repo.is_allowed(db_session, ROLE_ADMIN, "remove_user") is False
    assert await repo.is_allowed(db_session, ROLE_ADMIN, "add_user") is True
    assert await repo.is_allowed(db_session, ROLE_VIEWER, "add_user") is False
    mappings = await repo.list_by_role(db_session, ROLE_OWNER)
    assert len(mappings) == 50

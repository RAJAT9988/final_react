import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.repositories.permission import PermissionRepository


@pytest.mark.asyncio
async def test_permission_repository_catalog(
    db_session: AsyncSession, rbac: None
) -> None:
    repo = PermissionRepository()
    permissions = await repo.list_all(db_session)
    assert len(permissions) == 50
    add_user = await repo.get_by_name(db_session, "add_user")
    assert add_user is not None
    assert add_user.module == "User"
    by_id = await repo.get_by_id(db_session, add_user.permission_id)
    assert by_id is not None
    assert by_id.name == "add_user"

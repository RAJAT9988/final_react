import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.repositories.role import RoleRepository
from app.user_management.seed import ROLE_OWNER


@pytest.mark.asyncio
async def test_role_repository_list_and_get(
    db_session: AsyncSession, rbac: None
) -> None:
    repo = RoleRepository()
    roles = await repo.list_all(db_session)
    assert [role.role_name for role in roles] == [
        "owner",
        "admin",
        "operator",
        "viewer",
    ]
    owner = await repo.get_by_id(db_session, ROLE_OWNER)
    assert owner is not None
    assert owner.role_name == "owner"
    by_name = await repo.get_by_name(db_session, "admin")
    assert by_name is not None
    assert by_name.role_id == 2

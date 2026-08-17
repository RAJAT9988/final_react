import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.exceptions import RoleNotFoundException
from app.user_management.seed import ROLE_OWNER
from tests.user_management.conftest import build_role_service


@pytest.mark.asyncio
async def test_role_service_list_and_permissions(
    db_session: AsyncSession, rbac: None
) -> None:
    service = build_role_service()
    roles = await service.list_roles(db_session)
    assert len(roles) == 4
    owner = await service.get_role_permissions(db_session, ROLE_OWNER)
    assert owner.role_name == "owner"
    assert len(owner.permissions) == 50
    assert all(item.is_allowed for item in owner.permissions)


@pytest.mark.asyncio
async def test_role_service_not_found(db_session: AsyncSession, rbac: None) -> None:
    service = build_role_service()
    with pytest.raises(RoleNotFoundException):
        await service.get_role(db_session, 99)

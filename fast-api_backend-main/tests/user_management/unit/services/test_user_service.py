import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.exceptions import (
    InvalidRoleAssignmentException,
    UserAlreadyExistsException,
    UserNotFoundException,
)
from app.user_management.schemas.user import UserCreate, UserUpdate
from app.user_management.seed import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OWNER
from tests.user_management.conftest import (
    build_user_service,
    create_user,
    user_dto_for,
)


@pytest.mark.asyncio
async def test_user_service_add_and_get(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    service = build_user_service()
    owner = await create_user(db_session, company_id, email="owner@example.com")
    actor = await user_dto_for(db_session, owner)

    created = await service.add_user(
        db_session,
        actor,
        company_id,
        UserCreate(
            name="Op",
            email="op@example.com",
            password="Password123",
            role_id=ROLE_OPERATOR,
        ),
    )
    assert created.email == "op@example.com"
    assert created.role_name == "operator"

    fetched = await service.get_by_id(db_session, created.user_id)
    assert fetched.user_id == created.user_id


@pytest.mark.asyncio
async def test_user_service_admin_cannot_assign_owner(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    service = build_user_service()
    admin = await create_user(
        db_session, company_id, email="admin@example.com", role_id=ROLE_ADMIN
    )
    actor = await user_dto_for(db_session, admin)
    with pytest.raises(InvalidRoleAssignmentException):
        await service.add_user(
            db_session,
            actor,
            company_id,
            UserCreate(
                name="Bad",
                email="bad@example.com",
                password="Password123",
                role_id=ROLE_OWNER,
            ),
        )


@pytest.mark.asyncio
async def test_user_service_duplicate_email(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    service = build_user_service()
    owner = await create_user(db_session, company_id, email="dup@example.com")
    actor = await user_dto_for(db_session, owner)
    with pytest.raises(UserAlreadyExistsException):
        await service.add_user(
            db_session,
            actor,
            company_id,
            UserCreate(
                name="Dup",
                email="dup@example.com",
                password="Password123",
                role_id=ROLE_OPERATOR,
            ),
        )


@pytest.mark.asyncio
async def test_user_service_update_and_not_found(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    service = build_user_service()
    owner = await create_user(db_session, company_id, email="upd@example.com")
    actor = await user_dto_for(db_session, owner)
    updated = await service.update_user(
        db_session, actor, owner.user_id, UserUpdate(name="New Name")
    )
    assert updated.name == "New Name"

    import uuid

    with pytest.raises(UserNotFoundException):
        await service.get_by_id(db_session, uuid.uuid4())

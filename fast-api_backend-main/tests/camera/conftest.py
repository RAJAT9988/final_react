import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.camera.repositories.camera import CameraRepository
from app.camera.services.camera import CameraService
from app.user_management.schemas.user import UserDTO
from tests.user_management.conftest import (  # noqa: F401
    build_auth_service,
    create_user,
    rbac,
)


class FakeDeviceGateway:
    def __init__(
        self,
        existing_ids: set[uuid.UUID] | None = None,
        company_id: uuid.UUID | None = None,
    ) -> None:
        self.existing_ids = existing_ids or set()
        self.company_id = company_id or uuid.uuid4()

    async def get_company_device(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> Any:
        if company_device_id not in self.existing_ids:
            raise RuntimeError(f"company_device {company_device_id} not found")
        return type(
            "CompanyDeviceDTO",
            (),
            {
                "company_device_id": company_device_id,
                "company_id": self.company_id,
            },
        )()

    async def get_devices_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> list[Any]:
        if company_id != self.company_id:
            return []
        return [
            type(
                "DeviceDTO",
                (),
                {
                    "current_assignment": type(
                        "Assignment",
                        (),
                        {
                            "company_device_id": assignment_id,
                            "company_id": company_id,
                        },
                    )()
                },
            )()
            for assignment_id in self.existing_ids
        ]


def build_camera_service(
    device_gateway: FakeDeviceGateway | None = None,
) -> CameraService:
    gateway = device_gateway or FakeDeviceGateway()
    return CameraService(camera_repo=CameraRepository(), device_gateway=gateway)


def make_actor(company_id: uuid.UUID, *, role_name: str = "owner") -> UserDTO:
    now = datetime.now(timezone.utc)
    return UserDTO(
        user_id=uuid.uuid4(),
        company_id=company_id,
        name="Camera Actor",
        email="camera.actor@example.com",
        role_id=1,
        status="active",
        mfa_enabled=False,
        role_name=role_name,
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )


async def auth_header(
    db_session: AsyncSession, email: str, password: str = "Password123"
) -> dict[str, str]:
    tokens = await build_auth_service().login(db_session, email, password)
    return {"Authorization": f"Bearer {tokens.access_token}"}

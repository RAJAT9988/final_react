import uuid
from datetime import date, datetime, timezone
from typing import Any, Tuple

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.gateway import CompanyGateway
from app.company.models.company import Company
from app.company.models.company_branch import CompanyBranch
from app.company.repositories.company import CompanyRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.services.company import CompanyService
from app.company.services.company_branch import CompanyBranchService
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.repositories.device_camera_assignment import (
    DeviceCameraAssignmentRepository,
)
from app.device.repositories.device_health import DeviceHealthRepository
from app.device.repositories.device_model_subscription import (
    DeviceModelSubscriptionRepository,
)
from app.device.schemas.device import DeviceCreate
from app.device.services.company_device import CompanyDeviceService
from app.device.services.device import DeviceService
from app.device.services.device_camera_assignment import DeviceCameraAssignmentService
from app.device.services.device_health import DeviceHealthService
from app.device.services.device_model_subscription import DeviceModelSubscriptionService
from app.user_management.schemas.user import UserDTO
from tests.user_management.conftest import (  # noqa: F401
    build_auth_service,
    create_user,
    rbac,
)


def build_company_gateway() -> CompanyGateway:
    return CompanyGateway(
        company_service=CompanyService(CompanyRepository()),
        branch_service=CompanyBranchService(
            CompanyBranchRepository(), CompanyRepository()
        ),
    )


def build_device_service() -> DeviceService:
    return DeviceService(
        device_repo=DeviceRepository(),
        company_device_repo=CompanyDeviceRepository(),
        company_gateway=build_company_gateway(),
    )


def build_company_device_service() -> CompanyDeviceService:
    return CompanyDeviceService(
        company_device_repo=CompanyDeviceRepository(),
        device_repo=DeviceRepository(),
        company_gateway=build_company_gateway(),
    )


def build_health_service() -> DeviceHealthService:
    return DeviceHealthService(
        health_repo=DeviceHealthRepository(),
        company_device_repo=CompanyDeviceRepository(),
        device_repo=DeviceRepository(),
    )


def build_subscription_service() -> DeviceModelSubscriptionService:
    return DeviceModelSubscriptionService(
        subscription_repo=DeviceModelSubscriptionRepository(),
        company_device_repo=CompanyDeviceRepository(),
        device_repo=DeviceRepository(),
    )


def build_assignment_service() -> DeviceCameraAssignmentService:
    return DeviceCameraAssignmentService(
        assignment_repo=DeviceCameraAssignmentRepository(),
        company_device_repo=CompanyDeviceRepository(),
        device_repo=DeviceRepository(),
    )


async def create_company_and_branch(
    db: AsyncSession,
) -> Tuple[Company, CompanyBranch]:
    company = await CompanyRepository().create(db, {"company_name": "Device Co"})
    branch = await CompanyBranchRepository().create(
        db,
        {"company_id": company.company_id, "branch_name": "HQ"},
    )
    return company, branch


def make_actor(
    company_id: uuid.UUID,
    *,
    role_name: str = "owner",
    email: str = "actor@example.com",
) -> UserDTO:
    role_id = {"owner": 1, "admin": 2, "operator": 3, "viewer": 4}.get(role_name, 1)
    now = datetime.now(timezone.utc)
    return UserDTO(
        user_id=uuid.uuid4(),
        company_id=company_id,
        name="Actor",
        email=email,
        role_id=role_id,
        status="active",
        mfa_enabled=False,
        role_name=role_name,
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )


def device_create_payload(
    branch_id: uuid.UUID,
    *,
    serial_no: str = "ATM-TST-0001",
    mac_id: str = "AA:BB:CC:00:00:01",
    device_name: str = "Test Device",
    ip: str = "192.168.1.10",
    dns_name: str | None = None,
) -> DeviceCreate:
    return DeviceCreate(
        device_name=device_name,
        ip=ip,
        dns_name=dns_name,
        serial_no=serial_no,
        mac_id=mac_id,
        manufacturing_date=date(2026, 2, 10),
        branch_id=branch_id,
    )


class FakeCameraGateway:
    def __init__(self, existing_ids: set[uuid.UUID] | None = None) -> None:
        self.existing_ids = existing_ids or set()

    async def get_camera(self, db: AsyncSession, camera_id: uuid.UUID) -> Any:
        if camera_id not in self.existing_ids:
            raise RuntimeError(f"camera {camera_id} not found")
        return type("CameraDTO", (), {"camera_id": camera_id})()


async def auth_header(
    db_session: AsyncSession, email: str, password: str = "Password123"
) -> dict[str, str]:
    tokens = await build_auth_service().login(db_session, email, password)
    return {"Authorization": f"Bearer {tokens.access_token}"}


@pytest_asyncio.fixture
async def company_branch(
    db_session: AsyncSession,
) -> Tuple[Company, CompanyBranch]:
    return await create_company_and_branch(db_session)

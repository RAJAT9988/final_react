from typing import Annotated

from fastapi import Depends

from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.repositories.device_camera_assignment import (
    DeviceCameraAssignmentRepository,
)
from app.device.repositories.device_health import DeviceHealthRepository
from app.device.repositories.device_model_subscription import (
    DeviceModelSubscriptionRepository,
)


def get_device_repository() -> DeviceRepository:
    return DeviceRepository()


def get_company_device_repository() -> CompanyDeviceRepository:
    return CompanyDeviceRepository()


def get_device_health_repository() -> DeviceHealthRepository:
    return DeviceHealthRepository()


def get_device_model_subscription_repository() -> DeviceModelSubscriptionRepository:
    return DeviceModelSubscriptionRepository()


def get_device_camera_assignment_repository() -> DeviceCameraAssignmentRepository:
    return DeviceCameraAssignmentRepository()


DeviceRepositoryDep = Annotated[DeviceRepository, Depends(get_device_repository)]
CompanyDeviceRepositoryDep = Annotated[
    CompanyDeviceRepository, Depends(get_company_device_repository)
]
DeviceHealthRepositoryDep = Annotated[
    DeviceHealthRepository, Depends(get_device_health_repository)
]
DeviceModelSubscriptionRepositoryDep = Annotated[
    DeviceModelSubscriptionRepository,
    Depends(get_device_model_subscription_repository),
]
DeviceCameraAssignmentRepositoryDep = Annotated[
    DeviceCameraAssignmentRepository,
    Depends(get_device_camera_assignment_repository),
]

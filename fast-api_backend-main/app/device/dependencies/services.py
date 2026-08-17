from typing import Annotated

from fastapi import Depends

from app.company.gateway import CompanyGatewayDep
from app.device.dependencies.repositories import (
    CompanyDeviceRepositoryDep,
    DeviceCameraAssignmentRepositoryDep,
    DeviceHealthRepositoryDep,
    DeviceModelSubscriptionRepositoryDep,
    DeviceRepositoryDep,
)
from app.device.services.company_device import CompanyDeviceService
from app.device.services.device import DeviceService
from app.device.services.device_camera_assignment import DeviceCameraAssignmentService
from app.device.services.device_health import DeviceHealthService
from app.device.services.device_model_subscription import DeviceModelSubscriptionService


def get_device_service(
    device_repo: DeviceRepositoryDep,
    company_device_repo: CompanyDeviceRepositoryDep,
    company_gateway: CompanyGatewayDep,
) -> DeviceService:
    return DeviceService(
        device_repo=device_repo,
        company_device_repo=company_device_repo,
        company_gateway=company_gateway,
    )


def get_company_device_service(
    company_device_repo: CompanyDeviceRepositoryDep,
    device_repo: DeviceRepositoryDep,
    company_gateway: CompanyGatewayDep,
) -> CompanyDeviceService:
    return CompanyDeviceService(
        company_device_repo=company_device_repo,
        device_repo=device_repo,
        company_gateway=company_gateway,
    )


def get_device_health_service(
    health_repo: DeviceHealthRepositoryDep,
    company_device_repo: CompanyDeviceRepositoryDep,
    device_repo: DeviceRepositoryDep,
) -> DeviceHealthService:
    return DeviceHealthService(
        health_repo=health_repo,
        company_device_repo=company_device_repo,
        device_repo=device_repo,
    )


def get_device_model_subscription_service(
    subscription_repo: DeviceModelSubscriptionRepositoryDep,
    company_device_repo: CompanyDeviceRepositoryDep,
    device_repo: DeviceRepositoryDep,
) -> DeviceModelSubscriptionService:
    return DeviceModelSubscriptionService(
        subscription_repo=subscription_repo,
        company_device_repo=company_device_repo,
        device_repo=device_repo,
    )


def get_device_camera_assignment_service(
    assignment_repo: DeviceCameraAssignmentRepositoryDep,
    company_device_repo: CompanyDeviceRepositoryDep,
    device_repo: DeviceRepositoryDep,
) -> DeviceCameraAssignmentService:
    return DeviceCameraAssignmentService(
        assignment_repo=assignment_repo,
        company_device_repo=company_device_repo,
        device_repo=device_repo,
    )


DeviceServiceDep = Annotated[DeviceService, Depends(get_device_service)]
CompanyDeviceServiceDep = Annotated[
    CompanyDeviceService, Depends(get_company_device_service)
]
DeviceHealthServiceDep = Annotated[
    DeviceHealthService, Depends(get_device_health_service)
]
DeviceModelSubscriptionServiceDep = Annotated[
    DeviceModelSubscriptionService, Depends(get_device_model_subscription_service)
]
DeviceCameraAssignmentServiceDep = Annotated[
    DeviceCameraAssignmentService, Depends(get_device_camera_assignment_service)
]

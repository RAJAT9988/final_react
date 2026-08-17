from typing import Annotated

from fastapi import Depends

from app.camera.dependencies.repositories import CameraRepositoryDep
from app.camera.services.camera import CameraService
from app.device.gateway import DeviceGatewayDep


def get_camera_service(
    camera_repo: CameraRepositoryDep,
    device_gateway: DeviceGatewayDep,
) -> CameraService:
    return CameraService(camera_repo=camera_repo, device_gateway=device_gateway)


CameraServiceDep = Annotated[CameraService, Depends(get_camera_service)]

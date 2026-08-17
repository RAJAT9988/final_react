import uuid
from abc import ABC, abstractmethod
from typing import Annotated, List

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.camera.dependencies.services import CameraServiceDep
from app.camera.schemas.camera import CameraDTO


class CameraGatewayInterface(ABC):
    """Abstract sync interface for cross-module access to camera data."""

    @abstractmethod
    async def get_camera(self, db: AsyncSession, camera_id: uuid.UUID) -> CameraDTO:
        pass

    @abstractmethod
    async def get_camera_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[CameraDTO]:
        pass

    @abstractmethod
    async def get_cameras_by_company_device(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> List[CameraDTO]:
        pass


class CameraGateway(CameraGatewayInterface):
    """Concrete cross-module Gateway delegating to camera services."""

    def __init__(self, camera_service: CameraServiceDep) -> None:
        self.camera_service = camera_service

    async def get_camera(self, db: AsyncSession, camera_id: uuid.UUID) -> CameraDTO:
        return await self.camera_service.get_by_id(db, camera_id)

    async def get_camera_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[CameraDTO]:
        return await self.camera_service.list_cameras(db, skip=skip, limit=limit)

    async def get_cameras_by_company_device(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> List[CameraDTO]:
        return await self.camera_service.list_by_company_device(db, company_device_id)


def get_camera_gateway(camera_service: CameraServiceDep) -> CameraGateway:
    return CameraGateway(camera_service=camera_service)


CameraGatewayDep = Annotated[CameraGateway, Depends(get_camera_gateway)]

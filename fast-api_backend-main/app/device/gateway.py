import uuid
from abc import ABC, abstractmethod
from typing import Annotated, List

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.dependencies.services import (
    CompanyDeviceServiceDep,
    DeviceServiceDep,
)
from app.device.schemas.company_device import CompanyDeviceDTO
from app.device.schemas.device import DeviceDTO


class DeviceGatewayInterface(ABC):
    """Abstract sync interface for cross-module access to device data."""

    @abstractmethod
    async def get_device(self, db: AsyncSession, device_id: uuid.UUID) -> DeviceDTO:
        pass

    @abstractmethod
    async def get_device_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[DeviceDTO]:
        pass

    @abstractmethod
    async def get_devices_by_branch(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> List[DeviceDTO]:
        pass

    @abstractmethod
    async def get_devices_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[DeviceDTO]:
        pass

    @abstractmethod
    async def get_company_device(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> CompanyDeviceDTO:
        pass

    @abstractmethod
    async def get_current_company_device(
        self, db: AsyncSession, device_id: uuid.UUID
    ) -> CompanyDeviceDTO:
        pass


class DeviceGateway(DeviceGatewayInterface):
    """Concrete cross-module Gateway delegating to device services."""

    def __init__(
        self,
        device_service: DeviceServiceDep,
        company_device_service: CompanyDeviceServiceDep,
    ) -> None:
        self.device_service = device_service
        self.company_device_service = company_device_service

    async def get_device(self, db: AsyncSession, device_id: uuid.UUID) -> DeviceDTO:
        return await self.device_service.get_by_id(db, device_id)

    async def get_device_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[DeviceDTO]:
        return await self.device_service.list_devices(db, skip=skip, limit=limit)

    async def get_devices_by_branch(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> List[DeviceDTO]:
        return await self.device_service.list_devices_by_branch(db, branch_id)

    async def get_devices_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[DeviceDTO]:
        return await self.device_service.list_devices_by_company(db, company_id)

    async def get_company_device(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> CompanyDeviceDTO:
        return await self.company_device_service.get_by_id(db, company_device_id)

    async def get_current_company_device(
        self, db: AsyncSession, device_id: uuid.UUID
    ) -> CompanyDeviceDTO:
        return await self.company_device_service.get_current_by_device_id(db, device_id)


def get_device_gateway(
    device_service: DeviceServiceDep,
    company_device_service: CompanyDeviceServiceDep,
) -> DeviceGateway:
    return DeviceGateway(
        device_service=device_service,
        company_device_service=company_device_service,
    )


DeviceGatewayDep = Annotated[DeviceGateway, Depends(get_device_gateway)]

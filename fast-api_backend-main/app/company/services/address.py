import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.exceptions import AddressNotFoundException
from app.company.repositories.address import AddressRepository
from app.company.schemas.address import AddressCreate, AddressDTO, AddressUpdate


class AddressService:
    """Service handling Address business logic."""

    def __init__(self, address_repo: AddressRepository) -> None:
        self.address_repo = address_repo

    async def get_by_id(self, db: AsyncSession, address_id: uuid.UUID) -> AddressDTO:
        address = await self.address_repo.get_by_id(db, address_id)
        if not address:
            raise AddressNotFoundException(address_id)
        return AddressDTO.model_validate(address)

    async def create_address(
        self, db: AsyncSession, obj_in: AddressCreate
    ) -> AddressDTO:
        address = await self.address_repo.create(db, obj_in.model_dump())
        return AddressDTO.model_validate(address)

    async def update_address(
        self, db: AsyncSession, address_id: uuid.UUID, obj_in: AddressUpdate
    ) -> AddressDTO:
        address = await self.address_repo.get_by_id(db, address_id)
        if not address:
            raise AddressNotFoundException(address_id)
        updated = await self.address_repo.update(
            db, address, obj_in.model_dump(exclude_unset=True)
        )
        return AddressDTO.model_validate(updated)

    async def delete_address(
        self, db: AsyncSession, address_id: uuid.UUID
    ) -> AddressDTO:
        address = await self.address_repo.get_by_id(db, address_id)
        if not address:
            raise AddressNotFoundException(address_id)
        deleted = await self.address_repo.soft_delete(db, address)
        return AddressDTO.model_validate(deleted)

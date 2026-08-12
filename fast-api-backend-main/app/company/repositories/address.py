from app.company.models.address import Address, Country, State
from app.company.schemas.address import (
    AddressCreateDTO,
    AddressUpdateRequest,
    CountryCreateDTO,
    CountryUpdateRequest
)
from app.core.db import BaseRepository
from uuid import UUID

class AddressRepository(
    BaseRepository[
        Address,
        AddressCreateDTO,
        AddressUpdateRequest,
    ]
):
    async def get_by_branch(self, company_branch_id: UUID) -> Address | None:
        result = await self._db.execute(
            Address.select_not_deleted().where(
                Address.company_branch_id == company_branch_id
            )
        )
        return result.scalars().first()

    async def create(self, data: AddressCreateDTO) -> Address:
        modified = data.model_copy()
        return await super().create(modified)

    async def update(self, model: Address, data:AddressUpdateRequest) -> Address:
        modified = data.model_copy()
        return await super().update(model=model, data=modified)


class CountryRepository(BaseRepository[Country, CountryCreateDTO, CountryUpdateRequest]):
    async def list_by_country(self, country_id) -> Country:
            result = await self._db.execute(
                Country.select_not_deleted().where(
                    Country.id== country_id
                )
            )
            return result.scalars().all()

    async def get_by_country_name(self, country_name: str) -> Country | None:
            result = await self._db.execute(
                Country.select_not_deleted().where(
                    Country.country_name == country_name
                )
            )
            return result.scalars().first()
    
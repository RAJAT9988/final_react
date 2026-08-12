from app.company.repositories.address import AddressRepository, CountryRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.models.address import Address
from app.company.schemas.address import AddressCreateDTO, AddressUpdateRequest
from app.company.exceptions import CompanyBranchNotFoundException, AddressNotFoundException
from uuid import UUID

class AddressService:
    def __init__(self, address_repo: AddressRepository, branch_repo: CompanyBranchRepository):
        self.repository = address_repo
        self._branch_repo = branch_repo

    async def register_address(self, address_data: AddressCreateDTO) -> Address:
        # branch = await self._branch_repo.get(address_data.company_branch_id)
        # if branch is None:
        #     raise CompanyBranchNotFoundException()

        address = await self.repository.create(address_data)
        await self.repository.commit()
        return address

    async def get_list(self, params, schema):
            return await self.repository.get_list(params, schema)

    async def get(self, address_id: UUID) -> Address | None:
        return await self.repository.get(address_id)

    async def get_by_branch(self, company_branch_id: UUID) -> Address | None:
        return await self.repository.get_by_branch(company_branch_id)

    async def update(self, address_id: UUID, address_data: AddressUpdateRequest) -> Address:
        address = await self.repository.get(address_id)
        if address is None:
            raise AddressNotFoundException()

        address = await self.repository.update(model=address, data=address_data)
        await self.repository.commit()
        return address

    async def delete(self, address_id: UUID) -> Address | None:
        address = await self.repository.get(address_id)
        if address is None:
            return None

        await self.repository.delete(model=address)
        await self.repository.commit()
        return address

class CountryService:
    def __init__(self, country_repo: CountryRepository):
        self.repository = country_repo

    async def get_list(self, params, schema):
        return await self.repository.get_list(params, schema)
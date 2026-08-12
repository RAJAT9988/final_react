import pytest
from unittest.mock import Mock
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.address import Address
from app.company.repositories.address import AddressRepository
from app.company.services.address import AddressService
from app.company.schemas.address import AddressCreateDTO, AddressUpdateRequest
from tests.factories.company import CompanyFactory, CompanyBranchFactory


class TestAddressService:
    @pytest.fixture
    def repo(self, db: AsyncSession) -> AddressRepository:
        return AddressRepository(db=db, model=Address)

    @pytest.fixture
    def service(self, repo: AddressRepository) -> AddressService:
        return AddressService(address_repo=repo, branch_repo=Mock())

    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db
        CompanyBranchFactory._meta.sqlalchemy_session = db

    async def test_register_address(self, service: AddressService) -> None:
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)

        dto = AddressCreateDTO(
            company_branch_id=branch.id,
            country_id=1,
            state_id=1,
            city='Gandhinagar',
            area='Siddhraj Z Square',
            landmark='Opp Landmark',
            postal_code='387002',
            lattitude='22.3456',
            longitude='72.6789',
        )

        address = await service.register_address(dto)

        assert address.id is not None
        assert address.company_branch_id == branch.id
        assert address.city == 'Gandhinagar'

    async def test_update_address(self, service: AddressService) -> None:
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)

        dto = AddressCreateDTO(
            company_branch_id=branch.id,
            country_id=1,
            state_id=1,
            city='Gandhinagar',
            area='Siddhraj Z Square',
            landmark='Opp Landmark',
            postal_code='387002',
            lattitude='22.3456',
            longitude='72.6789',
        )
        address = await service.register_address(dto)

        update_data = AddressUpdateRequest(area='New Area')
        updated = await service.update(address.id, update_data)

        assert updated.area == 'New Area'

    async def test_delete_address(self, service: AddressService) -> None:
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)

        dto = AddressCreateDTO(
            company_branch_id=branch.id,
            country_id=1,
            state_id=1,
            city='Gandhinagar',
            area='Siddhraj Z Square',
            landmark='Opp Landmark',
            postal_code='387002',
            lattitude='22.3456',
            longitude='72.6789',
        )
        address = await service.register_address(dto)

        deleted = await service.delete(address.id)

        assert deleted is not None
        assert deleted.is_deleted()
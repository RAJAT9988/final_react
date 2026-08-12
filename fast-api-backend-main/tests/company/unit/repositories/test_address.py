import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.company.models.address import Address, Country, State
from app.company.repositories.address import AddressRepository, CountryRepository
from app.company.schemas.address import AddressCreateDTO, AddressUpdateRequest, CountryCreateDTO
from tests.factories.company import CompanyFactory, CompanyBranchFactory


class TestAddressRepository:
    @pytest.fixture
    def repo(self, db: AsyncSession) -> AddressRepository:
        return AddressRepository(db=db, model=Address)

    @pytest.fixture
    def country_repo(self, db: AsyncSession) -> CountryRepository:
        return CountryRepository(db=db, model=Country)

    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db
        CompanyBranchFactory._meta.sqlalchemy_session = db

    async def test_create(self, repo: AddressRepository) -> None:
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

        address = await repo.create(dto)
        await repo.commit()

        assert address.id is not None
        assert address.company_branch_id == branch.id
        assert address.city == 'Gandhinagar'

    async def test_get_by_branch(self, repo: AddressRepository) -> None:
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
        await repo.create(dto)
        await repo.commit()

        address = await repo.get_by_branch(branch.id)
        assert address is not None
        assert address.company_branch_id == branch.id

    async def test_update(self, db: AsyncSession, repo: AddressRepository) -> None:
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
        address = await repo.create(dto)
        await repo.commit()

        update_data = AddressUpdateRequest(area='New Area')
        updated = await repo.update(model=address, data=update_data)
        await repo.commit()

        assert updated.area == 'New Area'

        persisted = await db.get(Address, address.id)
        assert persisted is not None
        assert persisted.area == 'New Area'

    async def test_get_by_country_name(self, country_repo: CountryRepository, db: AsyncSession) -> None:
        country = Country(country_name='India')
        db.add(country)
        await db.commit()

        found = await country_repo.get_by_country_name('India')
        assert found is not None
        assert found.country_name == 'India'
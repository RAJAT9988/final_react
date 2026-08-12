import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.company.models.company import Company
from app.company.repositories.company import CompanyRepository
from app.company.schemas.company import CompanyCreateDTO, CompanyUpdateRequest
from tests.factories.company import CompanyFactory


class TestCompanyRepository:
    @pytest.fixture
    def repo(self, db: AsyncSession) -> CompanyRepository:
        return CompanyRepository(db=db, model=Company)

    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db

    async def test_get_by_company_name(self, repo: CompanyRepository) -> None:
        company = await CompanyFactory.create(company_name='TestCo')
        result = await repo.get_by_company_name('TestCo')

        assert result is not None
        assert result.id == company.id
        assert result.company_name == 'TestCo'

    async def test_get_by_email(self, repo: CompanyRepository) -> None:
        company = await CompanyFactory.create(contact_person_email='hello@test.com')
        result = await repo.get_by_email('hello@test.com')

        assert result is not None
        assert result.id == company.id

    async def test_create(self, db: AsyncSession, repo: CompanyRepository) -> None:
        dto = CompanyCreateDTO(
            company_name='TestCo',
            contact_person_name='Alice',
            contact_person_email='alice@test.com',
            contact_person_phone='1234567890',
            contact_person_designation='CEO',
            company_description='Test company',
        )
        company = await repo.create(dto)
        await repo.commit()

        assert company.id is not None
        assert company.contact_person_email == 'alice@test.com'

        fetched = await db.get(Company, company.id)
        assert fetched is not None
        assert fetched.company_name == 'TestCo'

    async def test_update(self, db: AsyncSession, repo: CompanyRepository) -> None:
        company = await CompanyFactory.create(company_name='OldName')
        dto = CompanyUpdateRequest(company_name='NewName')
        updated = await repo.update(model=company, data=dto)
        await repo.commit()

        assert updated.company_name == 'NewName'

        fetched = await db.get(Company, company.id)
        assert fetched is not None
        assert fetched.company_name == 'NewName'
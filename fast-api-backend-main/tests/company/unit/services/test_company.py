import pytest
from unittest.mock import Mock
from sqlalchemy.ext.asyncio import AsyncSession
from app.company.repositories.company import CompanyRepository
from app.company.services.company import CompanyService
from app.company.schemas.company import CompanyCreateDTO, CompanyUpdateDTO
from app.company.models.company import Company
from app.company.exceptions import CompanyAlreadyExistsException
from tests.factories.company import CompanyFactory


class TestCompanyService:
    @pytest.fixture
    def company_repo(self, db: AsyncSession) -> CompanyRepository:
        return CompanyRepository(db=db, model=Company)

    @pytest.fixture
    def company_service(self, company_repo: CompanyRepository) -> CompanyService:
        return CompanyService(
            company_repo=company_repo,
            company_branch_repo=Mock(),
            address_repo=Mock(),
            events=Mock(),
        )

    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db

    async def test_register_company(self, company_service: CompanyService) -> None:
        dto = CompanyCreateDTO(
            company_name='TestCo',
            contact_person_name='Alice',
            contact_person_email='alice@test.com',
            contact_person_phone='1234567890',
            contact_person_designation='CEO',
            company_description='Test company',
        )
        company = await company_service.register_company(dto)

        assert company.id is not None
        assert company.company_name == 'TestCo'

    async def test_register_duplicate_company_raises(self, company_service: CompanyService) -> None:
        await CompanyFactory.create(company_name='TestCo')

        dto = CompanyCreateDTO(
            company_name='TestCo',
            contact_person_name='Alice',
            contact_person_email='alice2@test.com',
            contact_person_phone='1234567890',
            contact_person_designation='CEO',
            company_description='Test company',
        )

        with pytest.raises(CompanyAlreadyExistsException):
            await company_service.register_company(dto)

    async def test_update(self, db: AsyncSession, company_service: CompanyService) -> None:
        company = await CompanyFactory.create(company_name='OldCo')
        dto = CompanyUpdateDTO(company_name='NewCo')

        updated = await company_service.update(company.id, company=company, company_data=dto)

        assert updated.company_name == 'NewCo'

        fetched = await db.get(Company, company.id)
        assert fetched.company_name == 'NewCo'

    async def test_delete(self, db: AsyncSession, company_service: CompanyService) -> None:
        company = await CompanyFactory.create()
        deleted = await company_service.delete(company.id)

        assert deleted is not None
        assert deleted.is_deleted()
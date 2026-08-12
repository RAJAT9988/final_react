import pytest
from unittest.mock import Mock
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.services.company_branch import CompanyBranchService
from app.company.models.company_branch import CompanyBranch
from app.company.schemas.company_branch import CompanyBranchCreateDTO, CompanyBranchUpdateRequest
from app.company.models.company import Company
from tests.factories.company import CompanyFactory, CompanyBranchFactory


class TestCompanyBranchService:
    @pytest.fixture
    def branch_repo(self, db: AsyncSession) -> CompanyBranchRepository:
        return CompanyBranchRepository(db=db, model=CompanyBranch)

    @pytest.fixture
    def service(self, branch_repo: CompanyBranchRepository) -> CompanyBranchService:
        return CompanyBranchService(
            branch_repo=branch_repo,
            company_repo=Mock(),
            events=Mock(),
        )

    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db
        CompanyBranchFactory._meta.sqlalchemy_session = db

    async def test_register_branch(self, service: CompanyBranchService) -> None:
        company = await CompanyFactory.create()
        dto = CompanyBranchCreateDTO(
            company_id=company.id,
            branch_name='Branch1',
            branch_contact_person_name='Bob',
            branch_contact_person_email='bob@test.com',
            branch_contact_person_phone='1234567890',
            branch_contact_person_designation='Manager',
        )

        branch = await service.register_branch(company.id, dto)

        assert branch.id is not None
        assert branch.branch_name == 'Branch1'
        assert branch.company_id == company.id

    async def test_update_branch(self, service: CompanyBranchService) -> None:
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)

        dto = CompanyBranchUpdateRequest(branch_name='BranchUpdated')
        updated = await service.update(branch.id, branch_data=dto)

        assert updated.branch_name == 'BranchUpdated'

    async def test_delete_branch(self, service: CompanyBranchService) -> None:
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)

        deleted = await service.delete(branch.id)

        assert deleted is not None
        assert deleted.is_deleted()
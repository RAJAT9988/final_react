import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.models.company_branch import CompanyBranch
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.schemas.company_branch import CompanyBranchCreateDTO, CompanyBranchUpdateRequest
from tests.factories.company import CompanyFactory, CompanyBranchFactory


class TestCompanyBranchRepository:
    @pytest.fixture
    def repo(self, db: AsyncSession) -> CompanyBranchRepository:
        return CompanyBranchRepository(db=db, model=CompanyBranch)

    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db
        CompanyBranchFactory._meta.sqlalchemy_session = db

    async def test_list_by_company(self, repo: CompanyBranchRepository) -> None:
        company = await CompanyFactory.create()
        await CompanyBranchFactory.create(company_id=company.id)
        await CompanyBranchFactory.create(company_id=company.id)

        branches = await repo.list_by_company(company.id)
        assert len(branches) == 2
        assert all(branch.company_id == company.id for branch in branches)

    async def test_create(self, repo: CompanyBranchRepository) -> None:
        company = await CompanyFactory.create()
        dto = CompanyBranchCreateDTO(
            company_id=company.id,
            branch_name='Branch1',
            branch_contact_person_name='Bob',
            branch_contact_person_email='bob@test.com',
            branch_contact_person_phone='1234567890',
            branch_contact_person_designation='Manager',
        )

        branch = await repo.create(dto)
        await repo.commit()

        assert branch.id is not None
        assert branch.branch_name == 'Branch1'
        assert branch.company_id == company.id

    async def test_update(self, db: AsyncSession, repo: CompanyBranchRepository) -> None:
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)
        dto = CompanyBranchUpdateRequest(branch_name='BranchUpdated')

        updated = await repo.update(model=branch, data=dto)
        await repo.commit()

        assert updated.branch_name == 'BranchUpdated'

        fetched = await db.get(CompanyBranch, branch.id)
        assert fetched is not None
        assert fetched.branch_name == 'BranchUpdated'
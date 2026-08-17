import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.repositories.company import CompanyRepository


@pytest.mark.asyncio
async def test_company_repository_crud(db_session: AsyncSession):
    repo = CompanyRepository()

    # Create
    company = await repo.create(
        db_session,
        {
            "company_name": "Acme Corp",
            "contact_person_name": "John Doe",
            "contact_person_email": "john@acme.com",
        },
    )
    assert company.company_id is not None
    assert company.company_name == "Acme Corp"
    assert company.is_deleted is False

    # Get by ID
    fetched = await repo.get_by_id(db_session, company.company_id)
    assert fetched is not None
    assert fetched.company_name == "Acme Corp"

    # Soft Delete
    soft_deleted = await repo.soft_delete(db_session, fetched)
    assert soft_deleted.is_deleted is True

    # Get by ID should now be None
    after_delete = await repo.get_by_id(db_session, company.company_id)
    assert after_delete is None

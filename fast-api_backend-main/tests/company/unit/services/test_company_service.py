import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.exceptions import CompanyNotFoundException
from app.company.repositories.company import CompanyRepository
from app.company.schemas.company import CompanyCreate
from app.company.services.company import CompanyService


@pytest.mark.asyncio
async def test_company_service_create_and_get(db_session: AsyncSession):
    repo = CompanyRepository()
    service = CompanyService(company_repo=repo)

    create_dto = CompanyCreate(
        company_name="TechCorp",
        contact_person_name="Jane Smith",
        contact_person_email="jane@techcorp.com",
    )
    created = await service.create_company(db_session, create_dto)
    assert created.company_name == "TechCorp"
    assert created.company_id is not None

    fetched = await service.get_by_id(db_session, created.company_id)
    assert fetched.company_name == "TechCorp"


@pytest.mark.asyncio
async def test_company_service_not_found(db_session: AsyncSession):
    repo = CompanyRepository()
    service = CompanyService(company_repo=repo)

    fake_id = uuid.uuid4()
    with pytest.raises(CompanyNotFoundException):
        await service.get_by_id(db_session, fake_id)

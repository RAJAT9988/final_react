import pytest
from unittest.mock import Mock
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient
from fastapi import status as http_status
from cerberus import Validator
from sqlalchemy import select
from sqlalchemy.sql.functions import count
from app.core.api import ResponseStatus
from app.core.configs import app_config


from app.company.repositories.company import CompanyRepository
from app.company.services.company import CompanyService
from app.company.models.company_branch import CompanyBranch
from app.company.schemas.company import CompanyCreateDTO, CompanyUpdateDTO
from tests.factories.company import CompanyFactory, CompanyBranchFactory
from app.core.db import ListParams


class TestCompanyBranchRoter:
    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db
        CompanyBranchFactory._meta.sqlalchemy_session = db
    
    async def test_register_branch(self, client: AsyncClient, db: AsyncSession) -> None:
        company = await CompanyFactory.create()

        response = await client.post(
            f'{app_config.API_V1_STR}/company-branch/register-branch',
            json={
                "company_id": str(company.id),
                "branch_name": "Gandhinagar",
                "branch_contact_person_name": "Pratik Parmar",
                "branch_contact_person_email": "new@atomo.in",
                "branch_contact_person_phone": "9898704070",
                "branch_contact_person_designation": "CEO",
            },
        )
        body = response.json()
        assert response.status_code == http_status.HTTP_200_OK
        assert body['code'] == ResponseStatus.SUCCESS.value
            
        schema = {
                "code": {'type': 'integer'},
                "message": {'type': 'string'},
                "data": {
                    'type': 'dict',
                    'schema': {
                    "company_id": {'type': 'string', 'regex': '^[0-9a-fA-F-]{36}$'},
                    "branch_name":  {'type': 'string'},
                    "branch_contact_person_name":  {'type': 'string'},
                    "branch_contact_person_email": {'type': 'string', 'regex': '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'},
                    "branch_contact_person_phone":  {'type': 'string'},
                    "branch_contact_person_designation":  {'type': 'string'},
                    "id":{'type': 'string', 'regex': '^[0-9a-fA-F-]{36}$'},
                    },
                },
                }

        assert Validator(schema, allow_unknown=True).validate(body)
        result = await db.execute(select(count()).select_from(CompanyBranch).where(CompanyBranch.branch_contact_person_email =='new@atomo.in'))
        assert result.scalar_one() == 1

        
            


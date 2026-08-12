import pytest
from unittest.mock import Mock
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient
from fastapi import status as http_status
from cerberus import Validator
from sqlalchemy import select
from sqlalchemy.sql.functions import count


from app.company.repositories.company import CompanyRepository
from app.company.services.company import CompanyService
from app.company.models.company import Company
from app.company.schemas.company import CompanyCreateDTO, CompanyUpdateDTO
from tests.factories.company import CompanyFactory
from app.core.db import ListParams
from app.core.api import ResponseStatus
from app.core.configs import app_config


class TestCompanyRouter:
    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        CompanyFactory._meta.sqlalchemy_session = db

    async def test_register_company(self, client: AsyncClient, db: AsyncSession) -> None:
        response = await client.post(
            f'{app_config.API_V1_STR}/company/register-company',
            json={
                "company_name": "Atomo Innovation",
                "contact_person_name": "Pratik Parmar",
                "contact_person_email": "hello@atomo.in",
                "contact_person_phone": "9898704070",
                "contact_person_designation": "CEO",
                "company_description": "innovation company"
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
                "id": {'type': 'string', 'regex': '^[0-9a-fA-F-]{36}$'},
                "company_name":  {'type': 'string'},
                "contact_person_name":  {'type': 'string'},
                "contact_person_email": {'type': 'string', 'regex': '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'},
                "contact_person_phone":  {'type': 'string'},
                "contact_person_designation":  {'type': 'string'},
                "company_description":  {'type': 'string'},
                "status_id": {'type': 'integer'},
                },
            },
            }

        assert Validator(schema).validate(body)
        result = await db.execute(select(count()).select_from(Company).where(Company.contact_person_email =='hello@atomo.in'))
        assert result.scalar_one() == 1

    
        


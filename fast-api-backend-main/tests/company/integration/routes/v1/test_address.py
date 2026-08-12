import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count
from httpx import AsyncClient
from fastapi import status as http_status
from app.core.api import ResponseStatus
from app.core.configs import app_config
from app.company.models.address import Address, Country, State
from tests.factories.company import CompanyFactory, CompanyBranchFactory


class TestCompanyAddressRouter:
    @pytest.fixture(autouse=True)
    def init_factories(self, db: AsyncSession) -> None:
        # Bind the async DB session to the factories so FactoryBoy can persist records.
        CompanyFactory._meta.sqlalchemy_session = db
        CompanyBranchFactory._meta.sqlalchemy_session = db

    async def test_register_branch_address(self, client: AsyncClient, db: AsyncSession) -> None:
        # Create a company and branch to attach the address to.
        company = await CompanyFactory.create()
        branch = await CompanyBranchFactory.create(company_id=company.id)

        # Create lookup data for country/state before calling the address endpoint.
        country = Country(country_name='India')
        db.add(country)
        await db.flush()

        state = State(state_name='Gujarat', country_id=country.id)
        db.add(state)
        await db.commit()

        response = await client.post(
            f'{app_config.API_V1_STR}/address/branches/{branch.id}/addresses',
            json={
                "country_id": country.id,
                "state_id": state.id,
                "city": "Gandhinagar",
                "area": "Siddhraj Z Square",
                "landmark": "Opp Landmark",
                "postal_code": "387002",
                "lattitude": "22.3456",
                "longitude": "72.6789",
            },
        )

        body = response.json()

        # Verify the endpoint returned a successful response.
        assert response.status_code == http_status.HTTP_200_OK
        assert body["code"] == ResponseStatus.SUCCESS.value

        # Ensure the created address payload contains an ID.
        assert "id" in body["data"]

        # Confirm the address was persisted in the database.
        result = await db.execute(
            select(count()).select_from(Address).where(Address.country_id == country.id)
        )
        assert result.scalar_one() == 1

    async def test_get_countries_and_states(self, client: AsyncClient, db: AsyncSession) -> None:
        # Create country and state records for the GET endpoints.
        country = Country(country_name='India')
        db.add(country)
        await db.flush()

        state = State(state_name='Gujarat', country_id=country.id)
        db.add(state)
        await db.commit()

        # Call the countries list endpoint and verify the country exists in response.
        response = await client.get(f'{app_config.API_V1_STR}/address/countries')
        assert response.status_code == http_status.HTTP_200_OK
        body = response.json()
        assert body["code"] == ResponseStatus.SUCCESS.value
        assert any(item["id"] == country.id for item in body["data"])

        # Call the states-by-country endpoint and verify the response contains the created state.
        response = await client.get(f'{app_config.API_V1_STR}/address/countries/{country.id}/states')
        assert response.status_code == http_status.HTTP_200_OK
        body = response.json()
        assert body["code"] == ResponseStatus.SUCCESS.value
        assert body["data"][0]["id"] == state.id
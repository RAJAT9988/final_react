# Antigravity Execution & Decision Log

## Project Setup & Company Module Implementation Log

### 1. Configuration & Foundation Files Created
- `pyproject.toml` — Poetry dependencies (`fastapi`, `sqlalchemy 2.0`, `psycopg3`, `alembic`, `pydantic-settings`, `aiocache`, `fastapi-events`, `structlog`, `pytest`).
- `.sample.env` & `.env` — Environment configuration for PostgreSQL async engine connection.
- `docker-compose.yml` — Container definition for PostgreSQL 16.
- `alembic.ini` & `migrations/env.py` — Migration autogenerate runner.
- `app/core/configs/base_config.py` & `app/core/configs/app_config.py` — Settings classes.
- `app/core/db/base_model.py` — `BaseModel` and `SoftDeleteMixin`.
- `app/core/db/session.py` — Async engine & session factory (`get_db_session`).
- `app/core/db/base_repository.py` — Generic CRUD base repository.
- `app/core/deps.py` — Shared `DBSessionDep` injection dependency.
- `app/core/models.py` — Central model registry for Alembic discovery.
- `app/core/routers.py` & `app/main.py` — Central API router registration.

### 2. Company Module Files Created (`app/company/`)
- `app/company/exceptions.py` — Domain exceptions (`CompanyNotFoundException`, `CompanyBranchNotFoundException`, `AddressNotFoundException`, `CountryNotFoundException`, `StateNotFoundException`, `CompanyHasActiveDevicesException`).
- `app/company/models/` — ORM Models with UUID PKs (`Country`, `State`, `Address`, `Company`, `CompanyBranch`).
- `app/company/repositories/` — Repositories (`CountryRepository`, `StateRepository`, `AddressRepository`, `CompanyRepository`, `CompanyBranchRepository`).
- `app/company/schemas/` — Pydantic DTOs for Create, Update, Response, and Gateway.
- `app/company/services/` — Business logic & transaction boundaries (`CountryService`, `StateService`, `AddressService`, `CompanyService`, `CompanyBranchService`).
- `app/company/dependencies/` — DI providers (`repositories.py`, `services.py`).
- `app/company/routes/v1/` — REST API handlers (`country.py`, `address.py`, `company.py`, `company_branch.py`).
- `app/company/routers.py` — Combined v1 router.
- `app/company/gateway.py` — `CompanyGatewayInterface`, `CompanyGateway`, `CompanyGatewayDep`.
- `app/company/events.py` — Domain events (`CompanyCreated`, `CompanyDeleted`, `CompanyBranchCreated`).
- `app/company/__init__.py` — Sanctioned public exports (`CompanyGateway`, `CompanyGatewayDep`, `router_v1`, `CompanyDTO`, `CompanyBranchDTO`, `AddressDTO`).

### 3. Test Suite Created (`tests/`)
- `tests/conftest.py` — SQLite async in-memory test engine & AsyncClient fixture.
- `tests/company/unit/repositories/test_company_repository.py` — Repository unit tests.
- `tests/company/unit/services/test_company_service.py` — Service unit tests.
- `tests/company/integration/routes/v1/test_company_routes.py` — Route integration tests.

### 4. Dependency & Version Audit
- No new third-party packages were added beyond the standard stack specified in `pyproject.toml`.

### 5. Architectural Decisions Log
- **Primary Keys**: UUID primary keys (`uuid.uuid4`) implemented across all entities per user request.
- **Auth**: Option A (open/unauthenticated endpoints) implemented for now. Added follow-up task for company creation authorization pass when RBAC is wired.
- **Delete Behavior**: Option A (Block Deletion if active devices exist) selected.
- **Address Ownership**: Option A (1:1 Exclusive Address Ownership) selected.
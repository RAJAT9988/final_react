# Company Module Specification

> Module: `app/company`
> Status: To be built
> Related: `AGENTS.md`, `specifications.md`

---

## 1. Overview

The `company` module manages company records and their organizational
structure: branches and addresses, plus the shared location reference data
(`country`, `state`, `city`) that addresses attach to. It follows the
standard module convention from `AGENTS.md`: routes → services →
repositories → models, wired through `dependencies/services.py` and
`dependencies/repositories.py`, with no module-specific `config.py`,
`security.py`, or `emails/`.

Entity relationships:
- `Company` has many `company_branch` records.
- `company_branch` belongs to a `Company` and references one `Address`
  (via `address_id`).
- `Address` belongs to a `Company` and/or a `company_branch`, references
  `country` and `state` (`state` references `country`), and stores `city`
  as a plain text field (no separate `city` reference table).

No authentication is required for this module's endpoints at this stage —
there is no `CurrentUser`/`ActiveUser` dependency on any route yet. Treat
all endpoints below as open/unauthenticated until an auth requirement is
explicitly added.

---

## 2. Functional Specifications

### 2.1 User Stories

- As a user, I can create a new company with contact person details.
- As a user, I can view a list of companies.
- As a user, I can view a single company's details.
- As a user, I can update a company's details.
- As a user, I can delete a company.
- As a user, I can add a branch to a company, with its own address.
- As a user, I can view, update, and delete a company branch.
- As a user, I can attach and manage an address (with country, state,
  city as free text, and geo-coordinates) for a company or branch.
- As another module (e.g. `device`), I can look up basic company/branch
  info through the company Gateway without querying the `company` tables
  directly.

### 2.2 Features

| Feature | Description |
|---|---|
| Company CRUD | Create, read, update, delete company records, including contact person details |
| Company Branch CRUD | Create, read, update, delete branches, each linked to a parent company and an address |
| Address CRUD | Create, read, update, delete addresses with full geo hierarchy (country → state → city) and coordinates |
| Location reference data | Read-only(ish) lookup of `country`, `state`, `city` for address forms |
| List views | Paginated/sortable/filterable listing for companies via `ListParams` |
| Cross-module access | Other modules read company/branch data via `CompanyGateway` + DTOs, never the ORM models directly |
| Domain events | Company/branch lifecycle events available for other modules to react to (see §3.4) |
| Soft delete | `is_deleted` / `is_system_record` flags on every table — records are soft-deleted, not hard-deleted |

### 2.3 Data Model

| Entity | Key fields | Relationships |
|---|---|---|
| `Company` | company_id (PK), company_name, contact_person_designation, contact_person_name, contact_person_email, contact_person_mobile_no, company_description, audit fields | Has many `company_branch` |
| `company_branch` | branch_id (PK), company_id (FK), branch_name, address_id (FK),branch_contact_person_designation, branch_contact_person_name, branch_contact_person_email, branch_contact_person_mobile_no, audit fields | Belongs to `Company`; belongs to `Address` |
| `Address` | address_id (PK), country_id (FK), state_id (FK), company_id (FK), branch_id (FK), city (text), area, locality, landmark, street, postal_code, latitude, longitude, audit fields | Belongs to `Company` and/or `company_branch`; references `country`/`State` |
| `country` | country_id (PK), country_name | Has many `State` |
| `State` | state_id (PK), country_id (FK), state_name | Belongs to `country` |

> Audit fields follow the repo-wide convention: `created_at`, `created_by`,
> `updated_at`, `updated_by`, `is_system_record` (bool), `is_deleted`
> (bool) — from `BaseModel`/`SoftDeleteMixin`.
>
> No separate `city` table — `city` is stored as a plain text field
> directly on `Address`, same as `area`/`locality`/`landmark`/`street`.

---

## 3. Interfaces

### 3.1 REST API (`app/company/routes/v1/`)

> Confirm exact paths/methods against `app/company/routes/v1/company.py`,
> `company_branch.py`, `address.py` — endpoints below follow the CRUD +
> `ListParams` convention used elsewhere in the app.

| Method | Path | Description |
|---|---|---|
| GET | `/companies` | Paginated/sortable/filterable list of companies |
| POST | `/companies` | Create a company |
| GET | `/companies/{id}` | Get a single company |
| PATCH | `/companies/{id}` | Update a company |
| DELETE | `/companies/{id}` | Soft-delete a company |
| GET | `/companies/{company_id}/branches` | List branches for a company |
| POST | `/companies/{company_id}/branches` | Create a branch under a company |
| GET | `/branches/{id}` | Get a single branch |
| PATCH | `/branches/{id}` | Update a branch |
| DELETE | `/branches/{id}` | Soft-delete a branch |
| GET | `/addresses/{id}` | Get a single address |
| POST | `/addresses` | Create an address |
| PATCH | `/addresses/{id}` | Update an address |
| DELETE | `/addresses/{id}` | Delete an address |
| GET | `/countries` | List countries (reference data) |
| GET | `/countries/{id}/states` | List states for a country |

### 3.2 DI Wiring (`app/company/dependencies/`)

Per `AGENTS.md` module convention, repositories and services are wired as
FastAPI dependencies here rather than instantiated inline in routes:

| File | Exposes (indicative) |
|---|---|
| `dependencies/repositories.py` | `CompanyRepositoryDep`, `CompanyBranchRepositoryDep`, `AddressRepositoryDep` |
| `dependencies/services.py` | `CompanyServiceDep`, `CompanyBranchServiceDep`, `AddressServiceDep` |

### 3.3 Exposed Dependencies (`app/company/__init__.py`)

| Export | Type | Purpose |
|---|---|---|
| `CompanyGateway` | DI dependency (Gateway) | The only sanctioned way other modules read company/branch/address data |
| `CompanyDTO` / `CompanyBranchDTO` / `AddressDTO` | Pydantic DTOs (`schemas/`) | Cross-module-safe representations |
| `router_v1` | APIRouter | Registered centrally in `app.core.routers` |

### 3.4 Gateway Interface (`gateway.py`)

```python
class CompanyGatewayInterface(ABC):
    async def get_company(self, company_id: int) -> CompanyDTO: ...
    async def get_company_list(self, params: ListParams) -> PaginatedResult[CompanyDTO]: ...
    async def get_branch(self, branch_id: int) -> CompanyBranchDTO: ...
    async def get_branches_by_company(self, company_id: int) -> list[CompanyBranchDTO]: ...
```

### 3.5 Events (`events.py`)

| Event | Dispatched when | Payload (indicative) |
|---|---|---|
| `CompanyCreated` | A company is created | `company_id`, `company_name` |
| `CompanyDeleted` | A company is soft-deleted | `company_id` |
| `CompanyBranchCreated` | A branch is created | `branch_id`, `company_id` |

> `device` module's `company_device` assignment and `DeviceGateway` should
> not require listening to these directly (assignment is explicit), but a
> `CompanyDeleted` listener in `device` may be needed to decide what
> happens to devices assigned to a deleted company — see Open Questions.

---

## 4. Non-Functional Requirements

- No authentication is enforced on this module's endpoints currently — no
  `CurrentUser`/`ActiveUser` dependency, no `policies.py`. Revisit once
  the `auth` module's role/permission system is wired up across the app.
- Deletes are soft (`is_deleted`), consistent with the rest of the schema
  — never hard-delete a `Company`/`company_branch`/`Address` row.
- `country`/`state` are effectively static reference data — cache these
  lookups (`app.core.services.cache`) rather than hitting the DB on every
  address form load.

---

## 5. Open Questions

- What happens to a company's `device` fleet (`company_device`,
  `Device.company_id`) when the company is deleted — cascade soft-delete,
  block deletion, or leave orphaned? Needs a decision before `device`
  module's `CompanyDeleted` handling is implemented.
- When/whether authentication and role-based access (`auth` module's
  `Roles`/`Role_permission`) get applied to this module's endpoints.
- Whether `Address` records are shared/reused across companies/branches,
  or always created 1:1 per owner (affects delete-cascade behavior).
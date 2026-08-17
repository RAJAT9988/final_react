# Project Specification: FastAPI Modular Monolith Starter Kit

> Repository: [Atomo-innovation/fast-api-backend](https://github.com/Atomo-innovation/fast-api-backend)
> Document version: 2.0 — 2026-08-11
> Status: Living document — update as the architecture evolves
> Related: `AGENTS.md` (rules for AI agents), `<module>_module_specs.md` (per-module functional specs), ER diagram

---

## 1. Overview

This project is a backend built on [FastAPI](https://fastapi.tiangolo.com),
following **Layered Architecture** and **Modular Monolith** principles. It
started from a starter-kit foundation (DB access, auth, caching, queues,
mail, events, logging) and is being built out into a device/camera AI
analytics platform — see §6 Module Index.

## 2. Goals / Non-Goals

### 2.1 Goals

- A consistent, layered structure that scales from a small module to a
  large one without needing a rewrite.
- Loosely coupled modules — cross-module calls only through a Gateway
  (sync) or Events (async) — so any module could later be extracted into
  its own service with minimal disruption elsewhere.
- Shared framework concerns (DB, cache, queue, mail, logging) solved once
  in `app/core`, reused by every module.

### 2.2 Non-Goals

- Not a production-hardened deployment yet — no production deployment
  spec exists (see §9).
- Not a rigid framework — the module convention is a starting point,
  adapted per module as needed (e.g. `company` has no `config.py` or
  `emails/`, because it doesn't need them).
- Not maximally abstracted by design: no DI container (uses FastAPI's
  built-in DI), no ORM-abstraction layer over SQLAlchemy — see §4.2 for
  the reasoning.

---

## 3. Tech Stack

| Concern | Technology |
|---|---|
| Web framework | FastAPI |
| Database | PostgreSQL |
| DB driver | psycopg3 |
| ORM | SQLAlchemy 2.0+ (async) |
| Migrations | Alembic |
| Rate limiting | fastapi-limiter (backed by Redis) |
| Event dispatch | fastapi-events |
| Caching | aiocache (backed by Redis) |
| Task queue | Taskiq + Taskiq-Redis |
| Email | aiosmtplib, Jinja2 templates |
| Logging | structlog |
| Auth | PyJWT, PassLib |
| Package manager | **Poetry** |
| Local run | `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| Linting / formatting | Ruff |
| Type checking | mypy |
| Testing | pytest, pytest-asyncio, Factory Boy, Faker, Coverage.py, HTTPX |

---

## 4. Architecture

### 4.1 Layering

```
Route (API layer)
  → Policy (access control, where implemented)
  → Service (business logic, transaction boundary)
    → Repository (data access)
      → Model (SQLAlchemy ORM)
```

Cross-cutting, shared via `app/core`: **Gateway** (sync cross-module
calls), **Events/Listeners** (async cross-module communication),
**Cache**, **Queue**, **Mail**, **Log**, **Config**.

### 4.2 Database Layer

- `app.core.db.base_model.BaseModel` — base class all models inherit.
- `app.core.db.base_model.SoftDeleteMixin` — opt-in soft-delete
  (`is_deleted` flag); deletes are soft across the schema, never hard.
- `app.core.db.base_repository.BaseRepository` — generic CRUD plus
  filtered/sorted/paginated list retrieval (`ListParams`, `PaginatedResult`).
- `app.core.db.session` — async engine/session setup, exposed via
  `DBSessionDep` (`app.core.deps`).
- Every model must be imported into `app/core/models.py` so Alembic can
  discover it for autogeneration.

**Design decision:** `AsyncSession` is passed into services rather than
hidden entirely inside repositories. Deliberate, because:
1. SQLAlchemy isn't expected to be swapped out — a full DB-abstraction
   layer isn't worth the complexity.
2. PostgreSQL is expected to remain the datastore long-term.
3. It enables service-level transaction management — combining calls
   across multiple repositories in one transaction.

### 4.3 Module Structure

Every module lives at `app/<module_name>/`, with one file per entity inside
`models/`, `repositories/`, `schemas/`, `services/`, and DI wiring split
into `dependencies/repositories.py` + `dependencies/services.py`. Full
breakdown in `AGENTS.md` → Project Structure.

### 4.4 API Layer

- Routes grouped with `APIRouter` under `app/<module>/routes/v<n>/<entity>.py`.
- Each module has one top-level router (`routers.py`) combining its
  versioned route groups, registered centrally in `app.core.routers`.
- `app.core.api.list_params_builder.ListParamsBuilder` parses/validates
  list-query params (`sort`, `filters`, pagination) via `ListParams` /
  `SortParam` / `FilterParam`, which modules extend to constrain
  sortable/filterable fields.
- `app.core.api.controlled_rate_limiter.ConfigurableRateLimiter` wraps
  `fastapi-limiter`, globally toggleable per environment.

### 4.5 Configuration

- Global config via `app.core.configs.app.app_config`.
- A module may define its own `config.py`, extending
  `app.core.configs.base_config.BaseConfig` — only when it needs
  module-specific settings (e.g. `auth` does; `company` currently doesn't).
- Sourced from env files: `.sample.env` (documented, committed) →
  `.env` (local, gitignored) → `.test.env` (test overrides, gitignored).

### 4.6 Dependency Injection

FastAPI's built-in DI is used directly — no third-party DI container.
Each module wires its own repositories/services as dependencies in
`dependencies/repositories.py` / `dependencies/services.py`.

### 4.7 Policies (Access Control)

- Convention (where implemented): a policy is a plain async function
  (e.g. `can_update(user: ActiveUser)`) that raises (e.g.
  `ActionNotAllowed`) or returns `True`, used via `Depends(can_update)`.
- **Not yet implemented on every module** — e.g. `company` currently has
  no policy checks or auth requirement at all. Confirm per-module in its
  `*_module_specs.md` rather than assuming this pattern is active
  everywhere.

### 4.8 Gateways (Sync Cross-Module Communication)

- Every module exposes one entry point for other modules: `gateway.py`.
- Pattern: abstract `<Module>GatewayInterface` → concrete
  `<Module>Gateway` (delegates to the module's own services) → exposed as
  a FastAPI dependency → exported from `__init__.py` alongside DTOs,
  events, and the router. Nothing else crosses a module boundary.
- Gateways return DTOs, never raw ORM models.
- Benefit: extracting a module into its own service later only requires
  changing the Gateway's implementation (e.g. HTTP instead of in-process).

### 4.9 Events (Async Cross-Module Communication)

- Built on `fastapi-events`. Convention: `events.py` (dispatched) +
  `listeners.py` (consumed) per module.
- Events extend `app.core.services.events.base_event.BaseEvent` and
  declare `__event_name__`.
- Listeners use the `@listener(EventClass)` decorator; every module's
  `listeners.py` must be imported into `app.core.listeners`.
- Dispatched via `EventsServiceDep`.

### 4.10 Supporting Services (Provider Pattern)

Each core service under `app/core/services/<name>/` is:
`base_service.py` (interface) + `service.py` (what consumers import) +
`providers/<impl>/` (concrete backend). Swap a backend by adding a new
`providers/` folder — never bend `service.py`'s interface to fit one
provider.

| Service | Current provider | Key API |
|---|---|---|
| **Cache** | aiocache (Redis) | `@cached(ttl=..., key_builder=...)`; `CacheServiceDep` |
| **Queue** | Taskiq (Redis) | `@queued` + `BaseTask`; `QueueServiceDep.push(task, data)` |
| **Mail** | aiosmtplib | `BaseTemplate` + `emails/views/*.html`; `MailServiceDep.send(...)` / `.queue(...)` |
| **Log** | structlog | Singleton `logger`; e.g. `await logger.a_info(...)` |
| **Events** | fastapi-events | See §4.9 |

---

## 5. Module Convention

| Path | Purpose |
|---|---|
| `__init__.py` | Only file other modules may import from |
| `routers.py` + `routes/v<n>/<entity>.py` | HTTP layer |
| `models/<entity>.py` | SQLAlchemy models |
| `schemas/<entity>.py` | Pydantic DTOs / request-response models |
| `services/<entity>.py` | Business logic, transaction boundaries |
| `repositories/<entity>.py` | Data access, extends `BaseRepository` |
| `dependencies/repositories.py`, `dependencies/services.py` | DI wiring |
| `gateway.py` | Sync cross-module entry point |
| `events.py` / `listeners.py` | Async cross-module communication |
| `config.py`, `security.py`, `emails/`, `policies.py` | Added only if the module needs them |
| `exceptions.py` | Module-specific exceptions |

Full detail: `AGENTS.md` → Project Structure & Module Convention.

---

## 6. Module Index

| Module | Status | Owns (from ER diagram) | Spec |
|---|---|---|---|
| `auth` | Implemented | User, Roles, user_role, Role_permission, permission | `auth_module_specs.md` |
| `company` | Implemented (no auth yet) | Company, company_branch, Address, country, State | `company_module_specs.md` |
| `device` | Design / to be built | Device, device_health, Device camera assignment, device_model_subscription, company_device | `device_module_specifications.md` |
| `camera` | Planned | Camera | — |
| `ai_model` | Planned | Models, Features, model_feature | — |
| `event` | Planned | Event, Alerts_rule, alert_event | — |
| `notification` | Planned | Notification | — |
| `report` | Planned | Report | — |
| `face_recognition` | Planned | person, face_cluster, vector_store, cluster_photo, face_photo | — |
| `audit` | Planned | Logs | — |

---

## 7. Entity Overview

High-level relationships across modules (full field lists live in each
module's spec):

- **`auth`** is the identity source of truth. `User` is referenced by
  `created_by`/`updated_by` audit fields across the entire schema, and by
  RBAC (`Roles` → `user_role` → `Role_permission` → `permission`).
- **`company`** is the org/tenant boundary. `Company` → `company_branch`
  → `Address` (which also carries `country`/`state`). Devices, cameras,
  and most downstream entities are scoped to a `company_id`.
- **`device`** sits under `company` (`Device.company_id`,
  `company_device`) and owns `device_health`, `License`, master/slave
  `Device Link`, and — via `Device camera assignment` — links a `Camera`
  and a `device_model_subscription` (an `ai_model` subscription) to run
  on that device.
- **`camera`** belongs to a `Device` and a `Company`.
- **`ai_model`** (`Models`/`Features`) is the catalog of detection models
  (person/face/fire-safety) that devices subscribe to.
- **`event`** captures detections (`Event`) against an `Alerts_rule`,
  producing `alert_event` records, which **`notification`** delivers and
  **`report`** aggregates over time.
- **`face_recognition`** is a specialization used by `event`/`ai_model`
  for person identification: `person` ↔ `face_cluster` ↔ `vector_store`
  (embeddings) ↔ `cluster_photo`/`face_photo`.
- **`audit`** (`Logs`) records `user_id` + entity/action changes across
  the system.

> This section is a map, not a schema — see the ER diagram and each
> module's `*_module_specs.md` for exact fields and foreign keys.

---

## 8. Development Environment & Tooling

### 8.1 Setup

1. `poetry install`
2. Copy `.sample.env` to `.env` and fill in configuration values
   (PostgreSQL, Redis, SMTP, etc. — no Docker required).
3. `poetry run alembic upgrade head`
4. `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### 8.2 Common Commands

| Task | Command |
|---|---|
| Install deps | `poetry install` |
| Run app | `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| Create a migration | `poetry run alembic revision --autogenerate -m "..."` |
| Apply migrations | `poetry run alembic upgrade head` |
| Lint (check / fix) | `poetry run ruff check .` / `poetry run ruff check --fix .` |
| Format | `poetry run ruff format .` |
| Type check | `poetry run mypy .` |
| Run all tests | `poetry run pytest` |
| Run one test file | `poetry run pytest tests/auth/unit/repositories/test_user.py` |
| Coverage | `poetry run coverage run -m pytest && poetry run coverage report` |

Ruff and mypy configuration live in `pyproject.toml`.

### 8.3 Testing Conventions

- `.test.env` overrides `.env` for the test environment.
- Tests mirror `app/` 1:1 under `tests/<module>/unit/{repositories,services}/`
  and `tests/<module>/integration/routes/v1/`.
- Model factories must inherit
  `tests.factories.async_alchemy_factory.AsyncSQLAlchemyModelFactory`.
- `tests.utils.login_user` helper logs a user in for integration tests
  (relevant once auth is enforced across modules — see §9).

---

## 9. Open Items / Known Trade-offs

- No DI container — relies entirely on FastAPI's built-in DI (deliberate,
  §4.6).
- No dedicated abstraction layer over SQLAlchemy (deliberate, §4.2).
- **`company` (and any newly built module) has no authentication or
  policy enforcement yet** — every endpoint is currently open. This needs
  a decision on when/how `auth`'s `CurrentUser`/`ActiveUser` and RBAC get
  applied across modules, before any of this goes further than local dev.
- No production deployment spec exists yet.
- `policies.py` is a documented convention but not confirmed to exist in
  every implemented module — verify per-module rather than assuming.
- Several planned modules (`camera`, `ai_model`, `event`, `notification`,
  `report`, `face_recognition`, `audit`) exist only as ER-diagram entities
  — no code, specs, or cross-module event contracts defined yet.
- Cascade/delete behavior across module boundaries (e.g. what happens to
  a `device` when its `company` is deleted) is not yet decided — tracked
  per-module in each `*_module_specs.md`'s Open Questions.

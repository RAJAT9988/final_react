# AGENTS.md

> Standard for AI coding agents (Claude Code, Cursor, Copilot, Antigravity,
> etc.) working on any Atomo FastAPI project. This file is written against
> `fast-api-backend` (the modular monolith starter kit) — when applied to a
> new Atomo FastAPI project, module names and the exact tree will differ,
> but the conventions, boundaries, and workflow should not.

## Tech Stack

FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL (psycopg3) · Alembic ·
Redis (cache, queue, rate limiting) · Taskiq · aiosmtplib + Jinja2 ·
structlog · PyJWT + PassLib · Poetry · Ruff · mypy · pytest

## Architecture

Layered Architecture inside a Modular Monolith:

```
Route → Policy → Service (transaction boundary) → Repository → Model
```

Cross-cutting: **Gateway** (sync cross-module calls), **Events/Listeners**
(async cross-module communication), **Cache**, **Queue**, **Mail**,
**Log**, **Config** — all shared via `app/core`.

## Project Structure

```
<project-root>/
├── app/
│   ├── main.py                    # FastAPI app creation & wiring
│   ├── backend_pre_start.py       # Pre-start checks (e.g. DB ready)
│   ├── initial_data.py            # Seed data script
│   │
│   ├── <module_name>/             # One folder per business module, e.g. auth, company, device
│   │   ├── __init__.py             # ONLY file other modules may import from
│   │   ├── routers.py              # Combines routes/v1/* into one router
│   │   ├── gateway.py               # Sync cross-module entry point
│   │   ├── events.py                # Domain events this module dispatches
│   │   ├── exceptions.py            # Module-specific exceptions
│   │   ├── config.py                # Optional — module config (extends BaseConfig)
│   │   ├── security.py              # Optional — module-specific security helpers
│   │   ├── dependencies/
│   │   │   ├── repositories.py      # DI providers for this module's repositories
│   │   │   └── services.py          # DI providers for this module's services
│   │   ├── models/                  # One file per entity
│   │   ├── repositories/            # One file per entity, extends BaseRepository
│   │   ├── schemas/                 # One file per entity — Pydantic DTOs
│   │   ├── services/                # One file per entity — business logic
│   │   ├── routes/v1/               # One file per entity/resource
│   │   └── emails/                  # Optional — templates.py + views/*.html
│   │
│   └── core/                      # Shared framework code — no business logic
│       ├── deps.py                 # Shared DI (DBSessionDep, etc.)
│       ├── routers.py              # Registers every module's router
│       ├── models.py               # Imports every module's models/ (for Alembic)
│       ├── listeners.py            # Imports every module's listeners
│       ├── tasks.py                # Imports every module's tasks
│       ├── exception_handlers.py
│       ├── middlewares.py
│       ├── api/                    # ListParamsBuilder, RateLimiter, pagination schemas
│       ├── configs/                # BaseConfig, app_config
│       ├── db/                     # BaseModel, SoftDeleteMixin, BaseRepository, session
│       └── services/                # cache, events, log, mail, queue —
│           └── <name>/              #   each: base_service.py + service.py
│               ├── base_service.py  #   (interface + consumer import)
│               ├── service.py       #   + providers/<impl>/ (concrete backend)
│               └── providers/<impl>/
│
├── docker/db/init_scripts/        # DB init SQL (used only for local Postgres container)
├── migrations/versions/           # Alembic migrations
├── tests/
│   ├── conftest.py
│   ├── utils.py
│   ├── factories/                 # Shared/base factories (AsyncSQLAlchemyModelFactory)
│   ├── <module_name>/             # Mirrors app/<module_name>/ 1:1
│   │   ├── factories/
│   │   ├── unit/{repositories,services}/
│   │   └── integration/routes/v1/
│   └── core/unit/{api,db,services/<name>/providers/<impl>/}
│
├── .sample.env                    # Documents every env var — committed
├── .env / .test.env               # Local/test config — gitignored, never committed
├── alembic.ini
├── pyproject.toml                 # Deps + Ruff + mypy + pytest config
├── poetry.lock
├── LICENSE
└── README.md
```

## Module Convention

- Every module lives at `app/<module_name>/`. Add pieces only as needed —
  don't scaffold `config.py`, `security.py`, or `emails/` for a module that
  has no use for them.
- **One file per entity** inside `models/`, `repositories/`, `schemas/`,
  and `services/` (e.g. `models/company_branch.py`, not entities bundled
  into one file).
- Register new models in `app/core/models.py` (Alembic autogenerate depends
  on it) and new listeners/tasks in `app/core/listeners.py` /
  `app/core/tasks.py`.
- **A module is only reachable through its `__init__.py` exports.** Never
  import another module's `services/`, `repositories/`, or other internals
  directly. Cross-module calls go through `gateway.py` (sync,
  request/response) or `events.py` + listeners (async, fire-and-forget).
- Gateways return DTOs (`schemas/`), never raw ORM models — no module
  should see another module's SQLAlchemy models.
- Core services (`cache`, `events`, `log`, `mail`, `queue`) follow the
  **provider pattern**: `base_service.py` defines the interface,
  `service.py` is what consumers import, and `providers/<impl>/` holds the
  concrete backend (e.g. `cache/providers/aiocache/`). Swap a backend by
  adding a new provider folder — never bend `service.py`'s interface to
  fit one specific provider.
- Tests mirror `app/` 1:1: `tests/<module_name>/unit/{repositories,services}/`
  and `tests/<module_name>/integration/routes/v1/`. Every new file under
  `app/` gets a matching test file.
- Run `alembic revision --autogenerate -m "..."` for every schema change —
  never hand-edit the database, and never ship a model change without a
  migration.

## Coding Style

- `snake_case` for variables, functions, and file names.
- `PascalCase` for class names (`UserService`, `CompanyGateway`).
- PEP 8, enforced by Ruff — `pyproject.toml` is the source of truth for
  config; don't hand-tune formatting to disagree with it.
- Type hints on every function signature — the codebase is `mypy`-checked.
- `async def` for anything touching the DB, Redis, network, or file I/O —
  the whole stack is async (SQLAlchemy async, aiosmtplib, aiocache, Taskiq).
- Descriptive names over abbreviations; avoid single-letter variables
  outside trivial loop counters.
- Docstrings on public functions/classes, especially in `services/`,
  `gateway.py`, and `policies` — explain *why*, not just *what*.
- Comment only where code isn't self-explanatory — don't restate the code.
- Route handlers stay thin: validation + delegation only. Business logic
  belongs in `services/`.
- Never pass raw ORM models across a module boundary — always a DTO from
  `schemas/`.

## Boundaries

**Always ask first:**
- Before changing a model's schema and generating/applying a migration off
  it — confirm the intended change before running
  `alembic revision --autogenerate`.
- Before `alembic upgrade head` / `downgrade` against any non-disposable
  database.
- Before deleting/squashing existing migrations, or editing one that's
  already been applied outside your local machine.
- Before adding, removing, or upgrading a dependency in `pyproject.toml` /
  `poetry.lock`.
- Before changing anything in `app/core/` — shared by every module, so the
  blast radius is the whole app.
- Before modifying `.sample.env`, `alembic.ini`, `pyproject.toml` tool
  config (Ruff/mypy/pytest), or CI config.
- Before force-pushing, rewriting git history, or pushing directly to
  `main`.
- Before deleting files, dropping tables, or truncating data of any kind.

**Never do, under any circumstances:**
- Never commit real secrets, API keys, passwords, or tokens — not in code,
  `.env`, a migration, a test fixture, or a commit message. Only
  `.sample.env` (placeholder values) is committed; `.env`/`.test.env` stay
  local and gitignored.
- Never hardcode credentials or connection strings — read them from
  `app.core.configs.app_config` or a module's `config.py`, sourced from
  env vars.
- Never log sensitive data (passwords, tokens, subscription/license keys,
  full card numbers, etc.), even at debug level.
- Never disable or weaken auth, rate limiting, or a `policies.py` check to
  "make a test pass" or unblock a feature — fix the actual issue.
- Never bypass `gateway.py` to reach into another module's internals, even
  temporarily.
- Never commit code that fails `ruff check`, `mypy`, or `pytest`.

## Tools & Commands

**Environment**
- `poetry install` — install dependencies
- `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` — run locally

**Database**
- `poetry run alembic revision --autogenerate -m "<message>"` — create a migration
- `poetry run alembic upgrade head` — apply migrations

**Lint / format / type-check** (must pass before committing)
- `poetry run ruff check .` / `poetry run ruff check --fix .`
- `poetry run ruff format .`
- `poetry run mypy .`

**Testing** (must pass before committing)
- `poetry run pytest` — all tests
- `poetry run pytest -v -s` — verbose
- `poetry run pytest tests/<module_name>/unit/...` — one file/dir
- `poetry run coverage run -m pytest && poetry run coverage report` — coverage

**Git**
- `git commit -am "<message>"` — Conventional Commits only:
  `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`, `refactor: ...`
- `git push` — after lint, type-check, and tests all pass

## Definition of Done (per change)

1. Code follows the Module Convention and Coding Style above.
2. `ruff format .`, `ruff check --fix .`, `mypy .` all clean.
3. Tests added/updated in the mirrored `tests/` path; `pytest` passes.
4. Migration generated and reviewed for any model change.
5. No secrets, hardcoded config, or cross-module internal imports introduced.
6. Commit message follows Conventional Commits.
# FastAPI Modular Monolith Backend

Backend service built on FastAPI following Layered Architecture and Modular Monolith principles.

## Quick Start

1. Install dependencies:
   ```bash
   poetry install
   ```

2. Run database migrations:
   ```bash
   poetry run alembic revision --autogenerate -m "add company module tables"
   poetry run alembic upgrade head
   ```

3. Start server:
   ```bash
   poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Optional device + camera sample data (Postgres only, after upgrade):
   ```bash
   psql "$DATABASE_URL" -f docs/seed_device_camera_sample_data.sql
   ```
   Requires existing company/branch/user IDs documented at the top of that file.
   SQLite pytest uses equivalent Python inserts, not this SQL.

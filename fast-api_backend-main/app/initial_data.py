"""Startup seed for global RBAC catalog rows."""

import asyncio

from app.core.db.session import async_session_factory
from app.user_management.seed import seed_roles_and_permissions


async def init() -> None:
    async with async_session_factory() as session:
        await seed_roles_and_permissions(session)
        await session.commit()


def main() -> None:
    asyncio.run(init())


if __name__ == "__main__":
    main()

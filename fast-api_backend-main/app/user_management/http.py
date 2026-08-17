from functools import wraps
from typing import Any, Callable, Coroutine, TypeVar

from fastapi import HTTPException

from app.user_management.exceptions import UserManagementException

F = TypeVar("F", bound=Callable[..., Coroutine[Any, Any, Any]])


def handle_user_management_errors(func: F) -> F:
    """Map domain exceptions to HTTPException without a core handler."""

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except UserManagementException as exc:
            raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    return wrapper  # type: ignore[return-value]

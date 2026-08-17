from functools import wraps
from typing import Any, Callable, Coroutine, TypeVar

from fastapi import HTTPException

from app.device.exceptions import DeviceModuleException

F = TypeVar("F", bound=Callable[..., Coroutine[Any, Any, Any]])


def handle_device_errors(func: F) -> F:
    """Map domain exceptions to HTTPException without a core handler."""

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except DeviceModuleException as exc:
            raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
        except Exception as exc:
            status_code = getattr(exc, "status_code", None)
            if isinstance(status_code, int):
                raise HTTPException(status_code=status_code, detail=str(exc)) from exc
            raise

    return wrapper  # type: ignore[return-value]

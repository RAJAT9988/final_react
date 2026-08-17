from typing import Any

from app.camera.gateway import CameraGateway, CameraGatewayDep
from app.camera.schemas.camera import CameraDTO

__all__ = [
    "CameraGateway",
    "CameraGatewayDep",
    "CameraDTO",
    "router_v1",
]


def __getattr__(name: str) -> Any:
    """Lazy-load router so gateway imports stay cycle-free."""
    if name == "router_v1":
        from app.camera.routers import router_v1

        return router_v1
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

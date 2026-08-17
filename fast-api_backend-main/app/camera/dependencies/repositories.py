from typing import Annotated

from fastapi import Depends

from app.camera.repositories.camera import CameraRepository


def get_camera_repository() -> CameraRepository:
    return CameraRepository()


CameraRepositoryDep = Annotated[CameraRepository, Depends(get_camera_repository)]

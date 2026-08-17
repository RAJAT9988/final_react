import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RefreshTokenDTO(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    family_id: uuid.UUID
    expires_at: datetime
    revoked: bool

    model_config = ConfigDict(from_attributes=True)

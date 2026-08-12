from pydantic import EmailStr

from app.core.services.events import BaseEvent

class CompanyCreated(BaseEvent):
    __event_name__ = 'company_created'

    id: int
    company_name: str
    email: EmailStr

class CompanyDeleted(BaseEvent):
    __event_name__ = 'company_deleted'

    id: int
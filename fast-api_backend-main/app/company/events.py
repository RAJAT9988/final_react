import uuid
from dataclasses import dataclass


@dataclass
class CompanyCreated:
    __event_name__ = "company.created"
    company_id: uuid.UUID
    company_name: str


@dataclass
class CompanyDeleted:
    __event_name__ = "company.deleted"
    company_id: uuid.UUID


@dataclass
class CompanyBranchCreated:
    __event_name__ = "company_branch.created"
    branch_id: uuid.UUID
    company_id: uuid.UUID

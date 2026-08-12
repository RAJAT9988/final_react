import factory
from app.company.models import Company, CompanyBranch, Address
from tests.factories.async_alchemy_factory import AsyncSQLAlchemyModelFactory

class CompanyFactory(AsyncSQLAlchemyModelFactory):
    class Meta:
        model = Company

    company_name = factory.Faker('company')
    contact_person_name = factory.Faker('name')
    contact_person_email = factory.Faker('email')
    contact_person_phone = factory.Faker('phone_number')
    contact_person_designation = factory.Faker('job')
    company_description = factory.Faker('catch_phrase')

class CompanyBranchFactory(AsyncSQLAlchemyModelFactory):
    class Meta:
        model = CompanyBranch

class CompanyAddressFactory(AsyncSQLAlchemyModelFactory):
    class Meta:
        model = Address

    
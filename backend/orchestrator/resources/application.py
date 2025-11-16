import dataclasses
from datetime import datetime

from orchestrator.clients.db.schema import Application as ApplicationDAO
from orchestrator.resources.types import ApplicationStatus, Country


@dataclasses.dataclass
class Application:
    id: str
    key: str
    applicant_name: str
    amount: float
    monthly_income: float
    declared_debts: float
    country: Country
    status: ApplicationStatus
    loan_purpose: str
    created_at: datetime
    updated_at: datetime

    @property
    def dti(self) -> float:
        return self.declared_debts / self.monthly_income

    @classmethod
    def from_dao(cls, application_dao: ApplicationDAO) -> "Application":
        return cls(
            id=str(application_dao.id),
            key=application_dao.key,
            applicant_name=application_dao.applicant_name,
            amount=float(application_dao.amount),
            monthly_income=float(application_dao.monthly_income),
            declared_debts=float(application_dao.declared_debts),
            country=Country(application_dao.country),
            loan_purpose=application_dao.loan_purpose,
            status=application_dao.status,
            created_at=application_dao.created_at,
            updated_at=application_dao.updated_at,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "key": self.key,
            "applicantName": self.applicant_name,
            "amount": self.amount,
            "monthlyIncome": self.monthly_income,
            "declaredDebts": self.declared_debts,
            "country": self.country.value,
            "loanPurpose": self.loan_purpose,
            "status": self.status.value,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

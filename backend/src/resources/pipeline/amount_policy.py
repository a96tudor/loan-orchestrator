import dataclasses

from backend.src.resources.application import Application
from backend.src.resources.pipeline.pipeline import PipelineStep
from backend.src.resources.types import (
    Country,
    LoanApplicationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


@dataclasses.dataclass
class LoanCapForCountry:
    country: Country
    cap_amount: float

    def is_applicable(self, application_country: Country) -> bool:
        return self.country == application_country

    def to_dict(self):
        return {
            "country": self.country.value,
            "cap_amount": self.cap_amount,
        }


class LoanCaps(list):
    def __init__(self, caps: list[LoanCapForCountry], other: float):
        super().__init__(caps)
        self.other = other

    def get_cap_for_country(self, country: Country) -> float:
        for cap in self:
            if cap.is_applicable(country):
                return cap.cap_amount
        return self.other

    def to_dicts(self) -> list[dict]:
        result = [cap.to_dict() for cap in self]
        result.append({"country": "OTHER", "cap_amount": self.other})

        return result


class AmountPoliciesRule(PipelineStep):
    def __init__(
        self,
        loan_caps: LoanCaps,
        pass_scenario: PipelineStep | LoanApplicationResult,
        fail_scenario: PipelineStep | LoanApplicationResult,
    ):
        super().__init__(
            PipelineStepType.AMOUNT_POLICY_RULE, pass_scenario, fail_scenario
        )
        self.loan_caps = loan_caps

    def __evaluate(self, application: Application) -> PipelineStepEvaluationResult:
        cap_amount = self.loan_caps.get_cap_for_country(application.country)

        if application.amount <= cap_amount:
            return PipelineStepEvaluationResult.PASS
        else:
            return PipelineStepEvaluationResult.FAIL

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update({"loan_caps": self.loan_caps.to_dicts()})

        return result

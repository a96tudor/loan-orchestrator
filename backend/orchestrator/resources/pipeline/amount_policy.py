from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.loan_cap import LoanCaps
from orchestrator.resources.pipeline.pipeline import PipelineStep
from orchestrator.resources.types import (
    LoanApplicationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


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
        result.update({"loanCaps": self.loan_caps.to_dicts()})

        return result

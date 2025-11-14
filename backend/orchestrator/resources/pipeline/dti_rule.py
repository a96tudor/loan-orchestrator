from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.pipeline import PipelineStep
from orchestrator.resources.types import (
    LoanApplicationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class DTIRule(PipelineStep):
    def __init__(
        self,
        max_dti: float,
        pass_scenario: PipelineStep | LoanApplicationResult,
        fail_scenario: PipelineStep | LoanApplicationResult,
    ):
        super().__init__(PipelineStepType.DTI_RULE, pass_scenario, fail_scenario)
        self.max_dti = max_dti

    def __evaluate(self, application: Application) -> PipelineStepEvaluationResult:
        dti_value = application.declared_debts / application.monthly_income

        if dti_value < self.max_dti:
            return PipelineStepEvaluationResult.PASS
        else:
            return PipelineStepEvaluationResult.FAIL

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update({"max_dti": self.max_dti})

        return result

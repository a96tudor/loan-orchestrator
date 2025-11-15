from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import (
    EvaluationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class DTIRule(PipelineStep):
    def __init__(
        self,
        max_dti: float,
        pass_scenario: PipelineStep | EvaluationResult,
        fail_scenario: PipelineStep | EvaluationResult,
    ):
        super().__init__(PipelineStepType.DTI_RULE, pass_scenario, fail_scenario)
        self.max_dti = max_dti

    def _evaluate(self, application: Application) -> PipelineStepEvaluationResult:
        dti_value = application.declared_debts / application.monthly_income

        if dti_value < self.max_dti:
            return PipelineStepEvaluationResult.PASS
        else:
            return PipelineStepEvaluationResult.FAIL

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update({"maxDTI": self.max_dti})

        return result

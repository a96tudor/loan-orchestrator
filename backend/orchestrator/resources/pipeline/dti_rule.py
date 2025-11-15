from typing import Optional, Tuple

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

    def _evaluate(
        self, application: Application
    ) -> Tuple[PipelineStepEvaluationResult, Optional[float]]:
        dti_value = application.dti

        if dti_value < self.max_dti:
            return PipelineStepEvaluationResult.PASS, dti_value
        else:
            return PipelineStepEvaluationResult.FAIL, dti_value

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update({"maxDTI": self.max_dti})

        return result

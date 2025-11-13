from backend.src.resources.application import Application
from backend.src.resources.pipeline.pipeline import PipelineStep
from backend.src.resources.types import (
    LoanApplicationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class RiskScoringRule(PipelineStep):
    def __init__(
        self,
        min_risk_score: float,
        pass_scenario: PipelineStep | LoanApplicationResult,
        fail_scenario: PipelineStep | LoanApplicationResult,
    ):
        super().__init__(
            PipelineStepType.RISK_SCORING_RULE, pass_scenario, fail_scenario
        )
        self.min_risk_score = min_risk_score

    def __evaluate(self, application: Application) -> PipelineStepEvaluationResult:
        # TODO: Replace with real risk scoring logic
        risk_score = 100

        if risk_score >= self.min_risk_score:
            return PipelineStepEvaluationResult.PASS
        else:
            return PipelineStepEvaluationResult.FAIL

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update({"min_risk_score": self.min_risk_score})

        return result

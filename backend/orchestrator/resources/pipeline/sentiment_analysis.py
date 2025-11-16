from typing import Optional

from pyutils.helpers.errors import Error

from orchestrator.clients.openai.client import (
    AvailableOpenAIModels,
    OpenAIClassificationResult,
    OpenAIClient,
)
from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import (
    EvaluationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class SentimentAnalysisCheckError(Error):
    _extension_details = {
        "category": "server",
        "code": "SentimentAnalysisCheckError",
        "severity": "error",
    }

    def __init__(self, message: str):
        super().__init__(f"SentimentAnalysisStepError: {message}")


class SentimentAnalysisStep(PipelineStep):
    def __init__(
        self,
        pass_scenario: PipelineStep | EvaluationResult,
        fail_scenario: PipelineStep | EvaluationResult,
        flow_node_id: str,
        model: Optional[AvailableOpenAIModels] = AvailableOpenAIModels.GPT_4O_MINI,
    ):
        super().__init__(
            type=PipelineStepType.SENTIMENT_ANALYSIS_RULE,
            pass_scenario=pass_scenario,
            fail_scenario=fail_scenario,
            flow_node_id=flow_node_id,
        )

        self.__open_ai_client = OpenAIClient()
        self.__model = model

    def _evaluate(
        self,
        application: Application,
    ) -> tuple[PipelineStepEvaluationResult, Optional[float]]:
        result = self.__open_ai_client.classify_risk(
            model=self.__model, text=application.loan_purpose
        )

        if result == OpenAIClassificationResult.RISKY:
            return (
                PipelineStepEvaluationResult.FAIL,
                OpenAIClassificationResult.RISKY.value,
            )
        elif result == OpenAIClassificationResult.NOT_RISKY:
            return (
                PipelineStepEvaluationResult.PASS,
                OpenAIClassificationResult.NOT_RISKY.value,
            )
        else:
            raise SentimentAnalysisCheckError(
                f"Failed to classify the sentiment of the loan purpose: "
                f"{application.loan_purpose}"
            )

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update(
            {
                "model": self.__model.value,
            }
        )

        return result

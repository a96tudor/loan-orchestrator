import abc
from time import time
from typing import Optional, Tuple, Union

from orchestrator.resources.application import Application
from orchestrator.resources.types import (
    EvaluationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class PipelineStep(abc.ABC):
    def __init__(
        self,
        type: PipelineStepType,
        pass_scenario: Union[EvaluationResult, "PipelineStep"],
        fail_scenario: Union[EvaluationResult, "PipelineStep"],
    ):
        self.pass_scenario = pass_scenario
        self.fail_scenario = fail_scenario
        self.type = type

        self.evaluated: bool = False
        self.evaluation_result: Optional[EvaluationResult] = None
        self.evaluation_result_value: Optional[float] = None
        self.evaluation_duration: float = 0.0

    @abc.abstractmethod
    def _evaluate(
        self, application: Application
    ) -> Tuple[PipelineStepEvaluationResult, Optional[float]]:
        raise NotImplementedError("This method should be implemented by subclasses")

    def __timed_evaluation(self, application: Application) -> EvaluationResult:
        start_time = time()
        result, result_value = self._evaluate(application)
        end_time = time()

        self.evaluation_duration = end_time - start_time
        self.evaluated = True
        self.evaluation_result = result
        self.evaluation_result_value = result_value

        return result

    def execute(self, application: Application) -> EvaluationResult:
        eval_result = self.__timed_evaluation(application)

        if eval_result == PipelineStepEvaluationResult.PASS:
            next_step = self.pass_scenario
        else:
            next_step = self.fail_scenario

        if isinstance(next_step, PipelineStep):
            return next_step.execute(application)
        else:
            return next_step

    def to_dict(self) -> dict:
        if isinstance(self.pass_scenario, PipelineStep):
            pass_scenario_dict = self.pass_scenario.to_dict()
        else:
            pass_scenario_dict = self.pass_scenario.value
        if isinstance(self.fail_scenario, PipelineStep):
            fail_scenario_dict = self.fail_scenario.to_dict()
        else:
            fail_scenario_dict = self.fail_scenario.value

        return {
            "type": self.type.value,
            "passScenario": pass_scenario_dict,
            "failScenario": fail_scenario_dict,
        }

    def get_evaluation_result(self) -> Optional[dict]:
        if not self.evaluated:
            return None

        if isinstance(self.pass_scenario, PipelineStep):
            pass_eval_result = self.pass_scenario.get_evaluation_result()
        else:
            pass_eval_result = self.pass_scenario.value

        if isinstance(self.fail_scenario, PipelineStep):
            fail_eval_result = self.fail_scenario.get_evaluation_result()
        else:
            fail_eval_result = self.fail_scenario.value

        return {
            "evaluation_result": self.evaluation_result.value,
            "evaluation_result_value": self.evaluation_result_value,
            "evaluation_duration": self.evaluation_duration,
            "pass_scenario_evaluation": pass_eval_result,
            "fail_scenario_evaluation": fail_eval_result,
        }

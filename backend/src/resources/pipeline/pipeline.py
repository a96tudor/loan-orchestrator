import abc
from typing import Union

from backend.src.resources.types import PipelineStatus, LoanApplicationResult, PipelineStepEvaluationResult
from backend.src.resources.application import Application


class Pipeline:
    def __init__(
        self, name: str, description: str, version: str, status: PipelineStatus,
        root_step: "PipelineStep",
    ):
        self.name = name
        self.description = description
        self.version = version
        self.status = status
        self.root_step = root_step

    def run_on_application(self, application: Application) -> LoanApplicationResult:
        return self.root_step.execute(application)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "status": self.status.value,
            "root_step": self.root_step.to_dict(),
        }


class PipelineStep(abc.ABC):
    def __init__(
        self,
        pass_scenario: Union[LoanApplicationResult, "PipelineStep"],
        fail_scenario: Union[LoanApplicationResult, "PipelineStep"],
    ):
        self.pass_scenario = pass_scenario
        self.fail_scenario = fail_scenario

    @abc.abstractmethod
    def __evaluate(self, application: Application) -> PipelineStepEvaluationResult:
        raise NotImplementedError("This method should be implemented by subclasses")

    def execute(self, application: Application) -> LoanApplicationResult:
        eval_result = self.__evaluate(application)

        if eval_result == PipelineStepEvaluationResult.PASS:
            next_step = self.pass_scenario
        else:
            next_step = self.fail_scenario

        if isinstance(next_step, PipelineStep):
            return next_step.execute(application)
        else:
            return next_step

    @abc.abstractmethod
    def to_dict(self) -> dict:
        raise NotImplementedError("This method should be implemented by subclasses")

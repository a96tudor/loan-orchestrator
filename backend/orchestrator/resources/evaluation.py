from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.pipeline import Pipeline


class Evaluation:
    def __init__(self, application: Application, pipeline: Pipeline):
        self.application = application
        self.pipeline = pipeline

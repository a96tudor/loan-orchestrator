from backend.src.resources.application import Application
from backend.src.resources.pipeline.pipeline import Pipeline


class Evaluation:
    def __init__(self, application: Application, pipeline: Pipeline):
        self.application = application
        self.pipeline = pipeline

from sqlalchemy import Column
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Relationship, declarative_base
from sqlalchemy.types import INTEGER, JSON, NUMERIC, TEXT, DateTime, String

from backend.src.resources.types import (
    ApplicationEvaluationStatus,
    LoanApplicationResult,
    PipelineStatus,
)

__BASE = declarative_base()


class Application(__BASE):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True)
    applicant_name = Column(String(255), nullable=False)

    amount = Column(NUMERIC(12, 2), nullable=False)
    monthly_income = Column(NUMERIC(12, 2), nullable=False)
    declared_debts = Column(NUMERIC(12, 2), nullable=False)
    country = Column(String(100), nullable=False)
    loan_purpose = Column(TEXT, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class Pipeline(__BASE):
    __tablename__ = "pipelines"

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(TEXT, nullable=True)

    status = Column(
        SQLAlchemyEnum(PipelineStatus), nullable=False, default=PipelineStatus.ACTIVE
    )

    current_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pipeline_versions.id"),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    current_version = Relationship("PipelineVersion", foreign_keys=[current_version_id])


class PipelineVersion(__BASE):
    __tablename__ = "pipeline_versions"

    id = Column(UUID(as_uuid=True), primary_key=True)

    version_number = Column(INTEGER, nullable=False)
    steps = Column(JSON, nullable=False)

    previous_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pipeline_versions.id"),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class ApplicationEvaluation(__BASE):
    __tablename__ = "application_evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id"),
        nullable=False,
    )
    pipeline_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pipelines.id"),
        nullable=False,
    )
    pipeline_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pipeline_versions.id"),
        nullable=False,
    )
    status = Column(
        SQLAlchemyEnum(ApplicationEvaluationStatus),
        nullable=False,
        default=ApplicationEvaluationStatus.PENDING,
    )
    result = Column(SQLAlchemyEnum(LoanApplicationResult), nullable=True, default=None)
    details = Column(JSON, nullable=True, default=None)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    application = Relationship("Application", foreign_keys=[application_id])
    pipeline = Relationship("Pipeline", foreign_keys=[pipeline_id])
    pipeline_version = Relationship(
        "PipelineVersion", foreign_keys=[pipeline_version_id]
    )

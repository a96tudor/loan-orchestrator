from typing import List, Optional

from pyutils.config.providers import ConfigProvider
from pyutils.database.sqlalchemy.db_factory import SessionManager
from pyutils.database.sqlalchemy.filters import EqualityFilter, Filter
from pyutils.database.sqlalchemy.joins import Join
from pyutils.database.sqlalchemy.wrapper import DBWrapper as DBWrapperPyUtils
from pyutils.helpers.errors import BadArgumentsError
from sqlalchemy import Column
from sqlalchemy.orm import DeclarativeBase

from orchestrator.clients.db.session_manager import get_session_manager
from orchestrator.utils.config import CONFIG_PROVIDER
from orchestrator.utils.logging import logger


class BaseDBWrapper(DBWrapperPyUtils):
    def __init__(
        self,
        model_class: type(DeclarativeBase),
    ):
        super().__init__(logger)

        self.model_class = model_class

    @property
    def session_manager(self) -> SessionManager:
        return get_session_manager()

    @property
    def _config_secret_route(self) -> [str]:
        return ["db", "secrets"]

    @property
    def _config_provider(self) -> ConfigProvider:
        return CONFIG_PROVIDER

    def _create_and_upsert(self, **kwargs) -> DeclarativeBase:
        """Create or update a model instance."""
        model = self._create_and_upsert_model(self.model_class, **kwargs)

        return model

    def _get_model_by_id(self, model_id: str) -> Optional[DeclarativeBase]:
        if not model_id:
            raise BadArgumentsError("Model ID must be provided.")

        return self._get_model(
            filters=[EqualityFilter(self.model_class.id, model_id)],
            error_message=f"Model with ID {model_id} not found.",
            at_least_one_filter=True,
            return_type=self.GetResultType.ONE_OR_NONE,
        )

    def _get_model(
        self,
        filters: List[Filter],
        columns: Optional[List[Column]] = None,
        joins: Optional[List[Join]] = None,
        order_by: Optional[dict] = None,
        error_message: Optional[str] = None,
        at_least_one_filter: Optional[bool] = False,
        limit: Optional[int] = None,
        return_type: Optional[DBWrapperPyUtils.GetResultType] = (
            DBWrapperPyUtils.GetResultType.FIRST
        ),
    ):
        return self._get_with_filters(
            self.model_class,
            filters=filters,
            columns=columns,
            joins=joins,
            order_by=order_by,
            error_message=error_message,
            at_least_one_filter=at_least_one_filter,
            limit=limit,
            return_type=return_type,
        )

import threading
from typing import Dict, Optional

from flask import g, has_app_context
from pyutils.config.providers import YAMLConfigProvider
from pyutils.database.sqlalchemy.db_factory import SessionManager

from backend.src.utils.logging import logger

# Global session manager pool - keyed by thread ID for persistence across requests
_SESSION_MANAGER_POOL: Dict[int, SessionManager] = {}
_POOL_LOCK = threading.Lock()

__CONFIG_SECRET_ROUTE = ["db", "secrets"]
__CONFIG_PROVIDER = YAMLConfigProvider("config/settings.yaml")

with __CONFIG_PROVIDER.provide(__CONFIG_SECRET_ROUTE).unlock() as config:
    __DB_NAME = config.secret.get("database", "loan-orchestrator")
    __SCHEMA = config.secret.get("schema", "public")


def get_session_manager(
    expire_on_commit: Optional[bool] = False,
) -> Optional[SessionManager]:
    """
    Get or create a session manager for the current thread.
    Each thread maintains its own session manager instance.
    """
    thread_id = threading.current_thread().ident

    # First, try to get from Flask's application context if available
    if has_app_context() and hasattr(g, "session_manager"):
        logger.info(
            f"Reusing session manager from Flask context for thread {thread_id}"
        )
        return g.session_manager

    # Check the global pool for existing session manager
    with _POOL_LOCK:
        session_manager = _SESSION_MANAGER_POOL.get(thread_id)

        if session_manager is None:
            logger.info(f"Creating NEW session manager for thread {thread_id}")
            session_manager = SessionManager(
                logger=logger,
                config_path=__CONFIG_SECRET_ROUTE,
                provider=__CONFIG_PROVIDER,
                db_name=__DB_NAME,
                expire_on_commit=expire_on_commit,
            )
            # Store in global pool
            _SESSION_MANAGER_POOL[thread_id] = session_manager
        else:
            logger.info(
                f"Reusing EXISTING session manager from pool for thread {thread_id}"
            )

    # Store in Flask context for faster access during this request
    if has_app_context():
        g.session_manager = session_manager

    return session_manager


def teardown():
    """
    Lightweight cleanup that doesn't actually teardown the session.
    Sessions are kept alive across requests within the same thread for performance.
    Only commit any pending transactions to ensure data consistency.
    """
    thread_id = threading.current_thread().ident

    # Try to get session manager from Flask context first
    session_manager = None
    if has_app_context() and hasattr(g, "session_manager"):
        session_manager = g.session_manager
    else:
        # Fallback to global pool
        with _POOL_LOCK:
            session_manager = _SESSION_MANAGER_POOL.get(thread_id)

    if session_manager is None:
        logger.info(f"No session manager found for thread {thread_id} during teardown.")
        return

    logger.info(f"Performing lightweight session cleanup for thread {thread_id}.")

    try:
        # Get the current session and commit any pending transactions
        # but don't close the session - keep it alive for reuse
        session = session_manager.session
        if session and session.is_active:
            session.commit()
            logger.debug("Committed pending transactions, keeping session alive.")
    except Exception as error:  # pragma: no cover - defensive logging
        logger.exception("Failed to commit session transactions.")
        # If commit fails, we should rollback to maintain consistency
        try:
            session = session_manager.session
            if session and session.is_active:
                session.rollback()
                logger.debug("Rolled back failed transaction.")
        except Exception as rollback_error:
            logger.exception(
                f"Failed to rollback session after commit error.: {rollback_error}"
            )
        raise error


def shutdown_session_manager():
    """
    Completely shutdown the session manager for the current thread.
    This should only be called when the thread is terminating or
    when a complete cleanup is needed (e.g., application shutdown).
    """
    thread_id = threading.current_thread().ident

    # Get session manager from global pool
    with _POOL_LOCK:
        session_manager = _SESSION_MANAGER_POOL.get(thread_id)
        if session_manager is None:
            logger.debug(f"No session manager to shutdown for thread {thread_id}.")
            return

        # Remove from pool
        del _SESSION_MANAGER_POOL[thread_id]

    logger.debug(f"Shutting down session manager for thread {thread_id}.")

    shutdown_error: Optional[BaseException] = None

    try:
        session_manager.teardown_session()
    except Exception as error:  # pragma: no cover - defensive logging
        shutdown_error = error
        logger.exception("Failed to teardown database session during shutdown.")

    try:
        session_manager.shutdown_engine()
    except Exception as error:  # pragma: no cover - defensive logging
        if shutdown_error is None:
            shutdown_error = error
        logger.exception("Failed to shutdown database engine.")

    # Session manager already removed from global pool above
    # Also clear from Flask context if present
    if has_app_context() and hasattr(g, "session_manager"):
        delattr(g, "session_manager")

    if shutdown_error is not None:
        raise shutdown_error


def cleanup_dead_threads():
    """
    Clean up session managers for threads that are no longer alive.
    This prevents memory leaks in the global pool.
    """
    import threading

    active_thread_ids = {t.ident for t in threading.enumerate()}

    with _POOL_LOCK:
        dead_thread_ids = set(_SESSION_MANAGER_POOL.keys()) - active_thread_ids

        for thread_id in dead_thread_ids:
            logger.debug(f"Cleaning up session manager for dead thread {thread_id}")
            session_manager = _SESSION_MANAGER_POOL.pop(thread_id, None)
            if session_manager:
                try:
                    session_manager.teardown_session()
                    session_manager.shutdown_engine()
                except Exception as e:
                    logger.exception(f"Error cleaning up dead thread {thread_id}: {e}")

        if dead_thread_ids:
            logger.info(
                f"Cleaned up {len(dead_thread_ids)} dead thread session managers"
            )

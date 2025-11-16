from orchestrator.app.app import APP
from orchestrator.clients.db.session_manager import teardown, shutdown_session_manager

if __name__ == "__main__":
    try:
        APP.run(
            debug=APP.config["DEBUG"],
            host=APP.config["HOST"],
            port=APP.config["PORT"]
        )
    finally:
        teardown()
        shutdown_session_manager()

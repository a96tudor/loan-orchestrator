import functools
import json

from flask import Response

from orchestrator.utils.logging import logger


def run_route_safely(message: str, unwrap_body: bool = True):
    def decorator(route_handler):
        @functools.wraps(route_handler)
        def wrapper(*args, **kwargs):
            try:
                response = route_handler(*args, **kwargs)
                return response
            except KeyError as e:
                if unwrap_body:
                    logger.error(
                        f"Missing required field in request body: {e}", exc_info=True
                    )
                    response = json.dumps(
                        {"error": f"Invalid request body, missing required field: {e}"}
                    )
                    status = 400
                else:
                    logger.error(f"Error processing request: {e}", exc_info=True)
                    response = json.dumps(
                        {"error": f"Internal Server Error - {message}"}
                    )
                    status = 500

                return Response(
                    response=response,
                    status=status,
                    mimetype="application/json",
                )
            except Exception as e:
                logger.error(f"Error processing request: {e}", exc_info=True)
                response = json.dumps({"error": f"Internal Server Error - {message}"})
                return Response(
                    response=response,
                    status=500,
                    mimetype="application/json",
                )

        return wrapper

    return decorator

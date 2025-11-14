from flask import Response, jsonify


def health_check() -> Response:
    """Health check endpoint."""
    return Response(
        response=jsonify({"status": "ok"}).data,
        status=200,
        mimetype="application/json",
    )

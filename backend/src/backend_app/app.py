"""Flask application factory."""

from flask import Flask


def create_app() -> Flask:
    """
    Create and configure the Flask application instance.
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Configuration can be added here
    # app.config.from_object(...)
    
    return app


if __name__ == '__main__' or __name__ == 'backend_app.app':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)


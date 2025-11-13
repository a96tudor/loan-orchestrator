"""Entry point for running the app as a module: python -m backend_app.app"""

from backend_app.app import create_app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)

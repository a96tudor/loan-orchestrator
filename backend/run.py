from orchestrator.app.app import APP

if __name__ == "__main__":
    APP.run(
        debug=APP.config["DEBUG"],
        host=APP.config["HOST"],
        port=APP.config["PORT"]
    )

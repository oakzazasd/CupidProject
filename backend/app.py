import logging

from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS

from cupid.config import load_config
from cupid.errors import AppError, STATUS_BY_CODE, THAI_MESSAGES, classify_exception
from cupid.ratelimit import create_limiters
from cupid.api import create_api_bp

log = logging.getLogger("cupid")


def create_app() -> Flask:
    load_dotenv()
    cfg = load_config()
    limiters = create_limiters(cfg)

    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = max(cfg.max_image_bytes * 2 + 2 * 1024 * 1024, 4 * 1024 * 1024)

    CORS(app, resources={r"/api/*": {"origins": list(cfg.frontend_origins)}}, supports_credentials=False)

    @app.errorhandler(AppError)
    def handle_app_error(err: AppError):
        if err.status >= 500:
            log.warning(
                "[cupid] provider/app error code=%s status=%s path=%s",
                err.code,
                err.status,
                request.path,
            )
        return {"error": {"code": err.code, "message": err.message}}, err.status

    @app.errorhandler(413)
    def handle_too_large(_err):
        e = AppError("image_too_large", 413)
        return {"error": {"code": e.code, "message": e.message}}, 413

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        code = classify_exception(err)
        status = STATUS_BY_CODE.get(code, 500)
        log.error(
            "[cupid] unhandled exception class=%s provider_status=%s code=%s path=%s",
            type(err).__name__,
            getattr(err, "status_code", None),
            code,
            request.path,
        )
        if status >= 500 and code not in ("provider_unavailable", "invalid_provider_response", "network", "timeout"):
            code = "server_error"
            status = 500
        return {"error": {"code": code, "message": THAI_MESSAGES[code]}}, status

    app.register_blueprint(create_api_bp(cfg, limiters))
    return app


if __name__ == "__main__":
    import os

    create_app().run(host="127.0.0.1", port=int(os.getenv("PORT", "5050")), debug=False)

from flask import Blueprint

from cupid.config import AppConfig
from cupid.ratelimit import Limiters


def create_api_bp(cfg: AppConfig, limiters: Limiters) -> Blueprint:
    from cupid.api.routes_analyze import register as reg_analyze
    from cupid.api.routes_chat import register as reg_chat
    from cupid.api.routes_meta import register as reg_meta

    bp = Blueprint("api", __name__)
    reg_meta(bp, cfg, limiters)
    reg_analyze(bp, cfg, limiters)
    reg_chat(bp, cfg, limiters)
    return bp

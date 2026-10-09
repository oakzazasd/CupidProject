from openai import OpenAI

from cupid.errors import AppError, STATUS_BY_CODE, classify_exception


def raise_provider_error(exc: Exception) -> None:
    code = classify_exception(exc)
    raise AppError(code, STATUS_BY_CODE.get(code, 502))


def _extract_content(resp) -> str:
    if isinstance(resp, str) or not hasattr(resp, "choices"):
        raise AppError("invalid_provider_response", 502)
    choices = getattr(resp, "choices", None)
    if not choices:
        return ""
    message = getattr(choices[0], "message", None)
    content = getattr(message, "content", None)
    if not (content or "").strip():
        content = getattr(message, "reasoning_content", None)
    return (content or "").strip()


def get_client(cfg):
    return OpenAI(
        api_key=cfg.api_key,
        base_url=cfg.base_url,
        timeout=cfg.timeout,
        max_retries=cfg.max_retries,
    )


def _select_model(cfg, vision: bool) -> str:
    if not cfg.configured:
        raise AppError("not_configured", 503)
    if vision:
        if not cfg.vision_model:
            raise AppError("vision_not_configured", 400)
        return cfg.vision_model
    return cfg.text_model


def complete(cfg, messages, *, vision: bool = False, max_tokens: int = 800, temperature: float = 0.9) -> str:
    model = _select_model(cfg, vision)
    client = get_client(cfg)
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return _extract_content(resp)
    except AppError:
        raise
    except (AttributeError, TypeError, IndexError, KeyError) as exc:
        raise AppError("invalid_provider_response", 502)
    except Exception as exc:
        raise_provider_error(exc)


def complete_json(cfg, messages, *, vision: bool = False, max_tokens: int = 1600, temperature: float = 0.9) -> str:
    model = _select_model(cfg, vision)
    client = get_client(cfg)
    if cfg.json_mode == "on":
        attempts = (True,)
    elif cfg.json_mode == "off":
        attempts = (False,)
    else:
        attempts = (True, False)
    last_exc: Exception | None = None
    for use_json in attempts:
        kwargs = dict(model=model, messages=messages, max_tokens=max_tokens, temperature=temperature)
        if use_json:
            kwargs["response_format"] = {"type": "json_object"}
        try:
            resp = client.chat.completions.create(**kwargs)
            return _extract_content(resp)
        except AppError:
            raise
        except (AttributeError, TypeError, IndexError, KeyError):
            raise AppError("invalid_provider_response", 502)
        except Exception as exc:
            code = classify_exception(exc)
            if code == "json_mode_unsupported" and len(attempts) > 1:
                last_exc = exc
                continue
            raise AppError(code, STATUS_BY_CODE.get(code, 502))
    raise AppError(classify_exception(last_exc) if last_exc else "server_error")


def build_vision_user_content(text: str, images: list) -> list:
    content: list = [{"type": "text", "text": text}]
    for data_url in images:
        content.append({"type": "image_url", "image_url": {"url": data_url}})
    return content

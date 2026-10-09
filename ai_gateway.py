"""Local, provider-aware AI API gateway used by the desktop shell and Vite proxy.

Keys are accepted per request and are never written by this module. The browser
only calls the same-origin /api endpoints; local model URLs are opened here on
the server side, not directly from browser JavaScript.
"""
from __future__ import annotations

import json
import math
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def _json_request(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: int = 120) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(details)
            message = (parsed.get("error") or {}).get("message") or parsed.get("message") or details
        except (ValueError, AttributeError):
            message = details or exc.reason
        raise RuntimeError(f"API 返回 HTTP {exc.code}: {message[:700]}") from None
    except urllib.error.URLError as exc:
        raise RuntimeError(f"无法连接 API: {exc.reason}") from None
    try:
        return json.loads(raw)
    except ValueError:
        raise RuntimeError("API 返回了无法解析的 JSON 响应") from None


def _endpoint(base_url: str, suffix: str) -> str:
    base = (base_url or "").strip().rstrip("/")
    if not base:
        raise RuntimeError("尚未设置 API 地址")
    if base.endswith(suffix):
        return base
    return f"{base}{suffix}"


def _voice_endpoint(base_url: str, suffix: str) -> str:
    """Use OhMyGPT's versioned audio routes when its bare API host is supplied."""
    base = (base_url or "").strip().rstrip("/")
    parsed = urllib.parse.urlsplit(base)
    if (parsed.hostname or "").lower() == "apic.ohmygpt.com" and parsed.path in ("", "/"):
        base = f"{parsed.scheme}://{parsed.netloc}/v1"
    return _endpoint(base, suffix)


def _messages_for_api(messages: list[dict[str, str]], system_prompt: str) -> list[dict[str, str]]:
    result = []
    for item in messages:
        role = item.get("role", "user")
        if role in ("user", "assistant") and item.get("content"):
            result.append({"role": role, "content": str(item["content"])})
    if not result:
        result.append({"role": "user", "content": "你好"})
    return result


def _gemini_contents(conversation: list[dict[str, str]]) -> list[dict[str, Any]]:
    """Normalize chat history for Gemini's user/model turn requirements."""
    contents: list[dict[str, Any]] = []
    for item in conversation:
        role = "model" if item["role"] == "assistant" else "user"
        text = str(item.get("content") or "")
        if contents and contents[-1]["role"] == role:
            contents[-1]["parts"][0]["text"] += f"\n\n{text}"
        else:
            contents.append({"role": role, "parts": [{"text": text}]})

    # Gemini generateContent requires the final history turn to be from the user.
    # In multi-character chat, previous characters are represented as model turns;
    # ask Gemini to continue from that dialogue instead of sending an invalid tail.
    if contents and contents[-1]["role"] == "model":
        latest_user = next((item["content"] for item in reversed(conversation) if item["role"] == "user"), "")
        continuation = "请结合上方群聊内容继续回应。"
        if latest_user:
            continuation += f"\n请回应用户提出的话题：\n{latest_user}"
        contents.append({"role": "user", "parts": [{"text": continuation}]})
    return contents


def _estimate_tokens(text: str) -> int:
    """Fallback estimate only; the response always labels it as estimated."""
    cjk = sum(1 for char in text if "\u3400" <= char <= "\u9fff")
    other = max(0, len(text) - cjk)
    return max(1, math.ceil(cjk * 1.5 + other / 4))


def _text_from_openai(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(str(part.get("text", "")) for part in content if isinstance(part, dict))
    return ""


def chat_completion(
    *,
    config: dict[str, Any],
    api_key: str,
    messages: list[dict[str, str]],
    system_prompt: str = "",
) -> dict[str, Any]:
    """Call one official provider or a user-configured OpenAI-compatible API."""
    protocol = str(config.get("protocol") or "openai").lower()
    mode = str(config.get("mode") or "official").lower()
    model = str(config.get("model") or "").strip()
    base_url = str(config.get("baseUrl") or "").strip()
    if not model:
        raise RuntimeError("请先填写模型名称")
    if not api_key and mode != "local":
        raise RuntimeError("请先填写此服务的 API Key")

    conversation = _messages_for_api(messages, system_prompt)
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    input_tokens = output_tokens = None
    response_model = model

    if protocol == "anthropic":
        if not api_key:
            raise RuntimeError("Anthropic 官方接口需要 API Key")
        url = _endpoint(base_url, "/messages")
        headers.update({"x-api-key": api_key, "anthropic-version": "2023-06-01"})
        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": int(config.get("maxTokens") or 2048),
            "messages": conversation,
        }
        if system_prompt:
            payload["system"] = system_prompt
        data = _json_request(url, payload, headers)
        blocks = data.get("content") or []
        text = "".join(str(part.get("text", "")) for part in blocks if isinstance(part, dict) and part.get("type") == "text")
        usage = data.get("usage") or {}
        input_tokens = usage.get("input_tokens")
        output_tokens = usage.get("output_tokens")
        response_model = data.get("model") or model

    elif protocol == "gemini":
        if not api_key:
            raise RuntimeError("Gemini 官方接口需要 API Key")
        if not base_url:
            raise RuntimeError("请先填写 Gemini API 地址")
        quoted_model = urllib.parse.quote(model, safe="-_.")
        query = urllib.parse.urlencode({"key": api_key})
        url = f"{base_url.rstrip('/')}/models/{quoted_model}:generateContent?{query}"
        contents = _gemini_contents(conversation)
        payload = {"contents": contents}
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}
        data = _json_request(url, payload, headers)
        candidates = data.get("candidates") or []
        parts = ((candidates[0].get("content") or {}).get("parts") or []) if candidates else []
        text = "".join(str(part.get("text", "")) for part in parts if isinstance(part, dict))
        usage = data.get("usageMetadata") or {}
        input_tokens = usage.get("promptTokenCount")
        output_tokens = usage.get("candidatesTokenCount")
        response_model = model

    else:
        # DeepSeek, OpenAI, Qwen, Kimi, Grok and local Ollama/LM Studio-compatible APIs.
        url = _endpoint(base_url, "/chat/completions")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        payload = {
            "model": model,
            "messages": ([{"role": "system", "content": system_prompt}] if system_prompt else []) + conversation,
            "stream": False,
        }
        data = _json_request(url, payload, headers)
        choices = data.get("choices") or []
        message = (choices[0].get("message") or {}) if choices else {}
        text = _text_from_openai(message.get("content"))
        usage = data.get("usage") or {}
        input_tokens = usage.get("prompt_tokens", usage.get("input_tokens"))
        output_tokens = usage.get("completion_tokens", usage.get("output_tokens"))
        response_model = data.get("model") or model

    if not text:
        raise RuntimeError("API 已响应，但返回内容为空；请检查模型、权限或接口兼容性")

    actual_usage = input_tokens is not None and output_tokens is not None
    if actual_usage:
        input_tokens = max(0, int(input_tokens))
        output_tokens = max(0, int(output_tokens))
        total_tokens = int(usage.get("total_tokens", input_tokens + output_tokens)) if protocol not in ("anthropic", "gemini") else input_tokens + output_tokens
        usage_source = "api"
    else:
        input_tokens = _estimate_tokens(system_prompt + "\n" + "\n".join(m["content"] for m in conversation))
        output_tokens = _estimate_tokens(text)
        total_tokens = input_tokens + output_tokens
        usage_source = "estimated"

    return {
        "text": text,
        "model": response_model,
        "usage": {
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "totalTokens": total_tokens,
            "source": usage_source,
        },
    }


def synthesize_speech(*, api_key: str, base_url: str, text: str, model: str = "tts-1", voice: str = "alloy") -> bytes:
    if not api_key:
        raise RuntimeError("API 语音需要先配置 OpenAI 语音服务 Key")
    if not text.strip():
        raise RuntimeError("没有可播报的文字")
    url = _voice_endpoint(base_url, "/audio/speech")
    input_text = text[:4096]
    is_ohmygpt = (urllib.parse.urlsplit(base_url).hostname or "").lower() == "apic.ohmygpt.com"
    payload = {"model": model, "voice": voice, "input": input_text, "response_format": "mp3"}
    if is_ohmygpt:
        # OhMyGPT documents x-www-form-urlencoded for TTS (not OpenAI's JSON body).
        payload["speed"] = "1"
        data = urllib.parse.urlencode(payload).encode("utf-8")
        content_type = "application/x-www-form-urlencoded"
    else:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        content_type = "application/json"
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": content_type,
            "Accept": "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            audio = response.read()
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(details)
            details = (parsed.get("error") or {}).get("message") or details
        except (ValueError, AttributeError):
            pass
        raise RuntimeError(f"语音 API 返回 HTTP {exc.code}: {details[:500]}") from None
    except urllib.error.URLError as exc:
        raise RuntimeError(f"无法连接语音 API: {exc.reason}") from None
    if not audio:
        raise RuntimeError("语音 API 返回空音频")
    return audio


def transcribe_audio(
    *, api_key: str, base_url: str, audio: bytes, filename: str = "voice.webm",
    content_type: str = "audio/webm", model: str = "whisper-1",
) -> str:
    if not api_key:
        raise RuntimeError("API 语音识别需要先配置 OpenAI 语音服务 Key")
    if not audio:
        raise RuntimeError("录音数据为空")
    if len(audio) > 24 * 1024 * 1024:
        raise RuntimeError("录音超过 24 MB，请缩短录音后再试")

    boundary = "----AITokenPetBoundary7MA4YWxkTrZu0gW"
    fields = [
        ("model", model.encode("utf-8")),
        ("response_format", b"json"),
    ]
    body_parts = []
    for name, value in fields:
        body_parts.extend([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode(),
            value,
            b"\r\n",
        ])
    safe_filename = filename.replace('"', "")[:120] or "voice.webm"
    body_parts.extend([
        f"--{boundary}\r\n".encode(),
        f'Content-Disposition: form-data; name="file"; filename="{safe_filename}"\r\n'.encode(),
        f"Content-Type: {content_type}\r\n\r\n".encode(),
        audio,
        b"\r\n",
        f"--{boundary}--\r\n".encode(),
    ])
    request = urllib.request.Request(
        _voice_endpoint(base_url, "/audio/transcriptions"),
        data=b"".join(body_parts),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(details)
            details = (parsed.get("error") or {}).get("message") or details
        except (ValueError, AttributeError):
            pass
        raise RuntimeError(f"语音识别 API 返回 HTTP {exc.code}: {details[:500]}") from None
    except urllib.error.URLError as exc:
        raise RuntimeError(f"无法连接语音识别 API: {exc.reason}") from None
    text = str(result.get("text") or "").strip()
    if not text:
        raise RuntimeError("语音识别结果为空")
    return text

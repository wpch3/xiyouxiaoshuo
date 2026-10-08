"""Same-origin local HTTP server for the desktop app and Vite development proxy.

Browser code calls relative /api URLs. This process performs local-model and
provider requests, so the browser never has to call a localhost model URL.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from email.parser import BytesParser
from email.policy import default as email_policy
from urllib.parse import urlsplit

from ai_gateway import chat_completion, synthesize_speech, transcribe_audio


def _default_dist_dir() -> Path:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        packaged = Path(sys._MEIPASS) / "dist"
        if (packaged / "index.html").is_file():
            return packaged
    root = Path(__file__).resolve().parent
    for candidate in (root / "app" / "dist", root / "dist"):
        if (candidate / "index.html").is_file():
            return candidate
    return root / "app" / "dist"


class _PetRequestHandler(SimpleHTTPRequestHandler):
    server_version = "AITokenPetLocal/1.0"

    def __init__(self, request, client_address, server):
        self.static_root = Path(server.static_root)
        super().__init__(request, client_address, server, directory=str(self.static_root))

    def log_message(self, fmt: str, *args: Any) -> None:
        # Avoid logging request bodies, query strings, and API keys.
        path = urlsplit(self.path).path
        print(f"[pet-local] {self.client_address[0]} {self.command} {path}")

    def _json(self, status: int, data: dict[str, Any]) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/health":
            self._json(200, {"ok": True, "service": "AI Token Pet local gateway"})
            return
        if path.startswith("/api/"):
            self._json(404, {"error": "Unknown local API route"})
            return
        super().do_GET()

    def _read_request_body(self, max_bytes: int) -> bytes:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid Content-Length")
        if content_length <= 0 or content_length > max_bytes:
            raise ValueError(f"Request must be between 1 byte and {max_bytes} bytes")
        return self.rfile.read(content_length)

    def _check_local_host(self) -> bool:
        host = (self.headers.get("Host", "").split(":", 1)[0]).lower()
        return host in {"127.0.0.1", "localhost"}

    def do_POST(self) -> None:
        path = urlsplit(self.path).path
        if not self._check_local_host():
            self._json(403, {"error": "The local gateway only accepts loopback requests"})
            return

        try:
            if path == "/api/chat":
                body = json.loads(self._read_request_body(2 * 1024 * 1024).decode("utf-8"))
                result = chat_completion(
                    config=body.get("config") or {},
                    api_key=str(body.get("apiKey") or ""),
                    messages=body.get("messages") or [],
                    system_prompt=str(body.get("systemPrompt") or ""),
                )
                self._json(200, result)
                return

            if path == "/api/voice":
                body = json.loads(self._read_request_body(256 * 1024).decode("utf-8"))
                audio = synthesize_speech(
                    api_key=str(body.get("apiKey") or ""),
                    base_url=str(body.get("baseUrl") or ""),
                    text=str(body.get("text") or ""),
                    model=str(body.get("model") or "tts-1"),
                    voice=str(body.get("voice") or "alloy"),
                )
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(len(audio)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(audio)
                return

            if path == "/api/transcribe":
                raw = self._read_request_body(24 * 1024 * 1024)
                content_type = self.headers.get("Content-Type", "")
                envelope = (
                    f"MIME-Version: 1.0\r\nContent-Type: {content_type}\r\n\r\n".encode("utf-8") + raw
                )
                message = BytesParser(policy=email_policy).parsebytes(envelope)
                fields: dict[str, str] = {}
                audio = b""
                filename = "voice.webm"
                audio_type = "audio/webm"
                for part in message.iter_parts():
                    name = part.get_param("name", header="content-disposition")
                    payload = part.get_payload(decode=True) or b""
                    if name == "file":
                        audio = payload
                        filename = part.get_filename() or filename
                        audio_type = part.get_content_type() or audio_type
                    elif name:
                        fields[name] = payload.decode("utf-8", errors="replace")
                transcript = transcribe_audio(
                    api_key=fields.get("apiKey", ""),
                    base_url=fields.get("baseUrl", ""),
                    audio=audio,
                    filename=filename,
                    content_type=audio_type,
                    model=fields.get("model", "whisper-1"),
                )
                self._json(200, {"text": transcript})
                return

            self._json(404, {"error": "Unknown local API route"})
        except (ValueError, TypeError) as exc:
            self._json(400, {"error": f"Invalid request: {exc}"})
        except Exception as exc:
            self._json(502, {"error": str(exc)[:1000]})

    def end_headers(self) -> None:
        if self.path == "/" or self.path.endswith(".html"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def guess_type(self, path: str) -> str:
        content_type = mimetypes.guess_type(path)[0]
        if content_type == "application/javascript":
            return "text/javascript"
        return content_type or "application/octet-stream"


class LocalPetServer:
    def __init__(self, static_root: str | Path | None = None, host: str = "127.0.0.1", port: int = 0):
        self.static_root = Path(static_root or _default_dist_dir()).resolve()
        if not (self.static_root / "index.html").is_file():
            raise FileNotFoundError(f"Built app index not found: {self.static_root / 'index.html'}")
        self.httpd = ThreadingHTTPServer((host, port), _PetRequestHandler)
        self.httpd.daemon_threads = True
        self.httpd.static_root = str(self.static_root)
        self.thread: threading.Thread | None = None

    @property
    def port(self) -> int:
        return int(self.httpd.server_address[1])

    @property
    def url(self) -> str:
        return f"http://127.0.0.1:{self.port}/"

    def start(self) -> None:
        if self.thread and self.thread.is_alive():
            return
        self.thread = threading.Thread(target=self.httpd.serve_forever, name="AITokenPetLocalServer", daemon=True)
        self.thread.start()

    def stop(self) -> None:
        if self.thread and self.thread.is_alive():
            self.httpd.shutdown()
            self.thread.join(timeout=3)
        self.httpd.server_close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the local AI Token Pet gateway and built app.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--static-root", default=str(_default_dist_dir()))
    args = parser.parse_args()
    server = LocalPetServer(args.static_root, args.host, args.port)
    print(f"AI Token Pet local app: {server.url} (static files: {server.static_root})")
    try:
        server.httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.stop()


if __name__ == "__main__":
    main()

import os
import sys
import subprocess
import tempfile
from pathlib import Path
import webview

from local_api_server import LocalPetServer


def get_dist_dir():
    """Find the built Vite bundle in source and PyInstaller builds."""
    if hasattr(sys, "_MEIPASS"):
        packaged = os.path.join(sys._MEIPASS, "dist")
        if os.path.exists(os.path.join(packaged, "index.html")):
            return packaged

    base_dir = os.path.dirname(os.path.abspath(__file__))
    for candidate in (
        os.path.join(base_dir, "app", "dist"),
        os.path.join(base_dir, "dist"),
    ):
        if os.path.exists(os.path.join(candidate, "index.html")):
            return candidate
    return os.path.join(base_dir, "app", "dist")


class DesktopPetAPI:
    def __init__(self, local_server):
        self._main_window = None
        self._pet_window = None
        self._local_server = local_server
        self._workspace_dir = None

    def set_main_window(self, window):
        self._main_window = window

    def spawn_floating_pet(self):
        """Open a separate compact desktop window on the same local app origin."""
        if self._pet_window is not None:
            try:
                self._pet_window.show()
                return
            except Exception:
                self._pet_window = None

        self._pet_window = webview.create_window(
            title="AI Token Pet · 独立桌宠",
            url=self._local_server.url + "#compact",
            width=420,
            height=520,
            resizable=True,
            frameless=True,
            on_top=True,
            transparent=False,
            easy_drag=True,
            js_api=self,
        )

    def close_floating_pet(self):
        if self._pet_window is not None:
            self._pet_window.destroy()
            self._pet_window = None

    def open_main_window(self):
        if self._main_window is not None:
            try:
                self._main_window.show()
                self._main_window.restore()
            except Exception:
                pass

    def choose_workspace(self):
        if self._main_window is None:
            raise RuntimeError("桌面主窗口尚未启动")
        selected = self._main_window.create_file_dialog(
            webview.FOLDER_DIALOG,
            directory=os.path.expanduser("~"),
            allow_multiple=False,
        )
        if not selected:
            return None
        selected_path = selected[0] if isinstance(selected, (list, tuple)) else selected
        candidate = Path(selected_path).expanduser().resolve()
        if not candidate.is_dir():
            raise RuntimeError("所选路径不是文件夹")
        self._workspace_dir = candidate
        return str(candidate)

    def _resolve_workspace_path(self, relative_path):
        if self._workspace_dir is None:
            raise RuntimeError("请先选择工作目录")
        relative = Path(str(relative_path or "").strip())
        if not str(relative) or relative.is_absolute():
            raise RuntimeError("只允许使用工作目录内的相对路径")
        root = self._workspace_dir.resolve()
        target = (root / relative).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            raise RuntimeError("路径不能越出已选择的工作目录") from None
        if target == root:
            raise RuntimeError("请指定工作目录中的文件相对路径")
        return target

    def read_workspace_file(self, relative_path):
        target = self._resolve_workspace_path(relative_path)
        if not target.is_file():
            raise RuntimeError("文件不存在")
        if target.stat().st_size > 2 * 1024 * 1024:
            raise RuntimeError("单个文件最多读取 2 MB")
        content = target.read_text(encoding="utf-8", errors="replace")
        return {"ok": True, "path": str(relative_path), "content": content[:100_000]}

    def write_workspace_file(self, relative_path, content):
        target = self._resolve_workspace_path(relative_path)
        text = str(content or "")
        if len(text.encode("utf-8")) > 2 * 1024 * 1024:
            raise RuntimeError("写入内容超过 2 MB")
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                prefix=f".{target.name}.",
                suffix=".pet-tmp",
                dir=str(target.parent),
                delete=False,
            ) as temporary:
                temporary.write(text)
                temporary_path = Path(temporary.name)
            os.replace(temporary_path, target)
        finally:
            if temporary_path is not None and temporary_path.exists():
                temporary_path.unlink()
        return {"ok": True, "path": str(relative_path), "message": f"已写入工作区文件：{relative_path}"}

    def run_workspace_command(self, command):
        if self._workspace_dir is None:
            raise RuntimeError("请先选择工作目录")
        command = str(command or "").strip()
        if not command or len(command) > 2000:
            raise RuntimeError("命令不能为空，且长度不能超过 2000 字符")
        try:
            result = subprocess.run(
                command,
                cwd=str(self._workspace_dir),
                shell=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=120,
            )
        except subprocess.TimeoutExpired:
            raise RuntimeError("命令超过 120 秒运行时限，已终止等待") from None
        return {
            "ok": result.returncode == 0,
            "returnCode": result.returncode,
            "stdout": result.stdout[-20_000:],
            "stderr": result.stderr[-20_000:],
        }


def main():
    dist_dir = get_dist_dir()
    server = LocalPetServer(static_root=dist_dir, host="127.0.0.1", port=0)
    server.start()

    api = DesktopPetAPI(server)
    window = webview.create_window(
        title="AI Token Pet · 拟人桌面消费伴侣",
        url=server.url,
        js_api=api,
        width=1200,
        height=840,
        resizable=True,
        min_size=(480, 600),
        frameless=False,
        easy_drag=False,
    )
    api.set_main_window(window)

    try:
        webview.start(debug=False)
    finally:
        server.stop()


if __name__ == "__main__":
    main()

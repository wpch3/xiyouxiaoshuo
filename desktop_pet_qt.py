"""原生桌面宠物窗口（PySide6 路线，参考 ds-local-pet / VPet / BongoCat 决策）。

为什么不用 pywebview 小窗：WebView2 的透明/异形窗在多台真机上不稳定（黑边、
透明失效、easy_drag 吞点击）。Qt 的 WA_TranslucentBackground 是 Windows 上
被多个开源桌宠验证过的稳定方案。

本进程只负责"宠物本体"：透明无边框置顶窗 + 分层拆件渲染 + 全局键鼠反应 +
托盘 + 右键菜单。主工作区仍是 Web 应用（desktop_main.py / 浏览器）。

运行：pip install PySide6 后  python desktop_pet_qt.py
"""
from __future__ import annotations

import math
import os
import sys
import threading
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
LAYER_DIR = BASE_DIR / "app" / "public" / "characters" / "deepseek_layers"

# 与 app/src/constants/petRig.js 保持一致的层清单（z 序 / 行为模式）
LAYERS = [
    ("back_hair_l", "sway_bl"),
    ("back_hair_r", "sway_br"),
    ("base_rig", "base"),
    ("iris", "gaze"),
    ("eye_hair", "static"),
    ("eyelids", "blink"),
    ("brows", "brow"),
    ("arm_l", "static"),
    ("arm_r_rest", "static"),
    ("side_hair_l", "sway_l"),
    ("side_hair_r", "sway_r"),
    ("bangs", "sway"),
]
MOUTH_FRAMES = ["mouth_open", "mouth_e", "mouth_i", "mouth_o", "mouth_u"]
RIG_W, RIG_H = 424, 632
BLINK_PERIOD = 4.6
BLINK_HOLD = 0.16


def load_qt():
    from PySide6.QtCore import Qt, QTimer, QPoint, QPointF
    from PySide6.QtGui import QImage, QPainter, QCursor, QIcon, QAction
    from PySide6.QtWidgets import QApplication, QWidget, QMenu, QSystemTrayIcon
    return Qt, QTimer, QPoint, QPointF, QImage, QPainter, QCursor, QIcon, QAction, QApplication, QWidget, QMenu, QSystemTrayIcon


class PetWindow:  # type: ignore[valid-type]
    """透明异形桌宠窗：分层渲染 + 交互。类体在 main() 内动态绑定 Qt 基类。"""


def now_ok(gap):
    """摸头连打节流：上一次眯眼结束后才刷新。"""
    return gap > -0.25


class ActionState:
    """优先级动作状态机（参考 ds-local-pet animation/state_machine.py）。"""

    SPECS = {"idle": (0, True, 0.0), "sleep": (0, True, 0.0),
             "tap": (2, False, 0.4), "pat": (3, False, 0.45)}

    def __init__(self):
        self.current = "idle"
        self.entered = time.time()

    def request(self, target, force=False):
        if target == self.current:
            return False
        c_prio, c_int, _ = self.SPECS[self.current]
        t_prio, _, _ = self.SPECS[target]
        if not force:
            if not c_int and t_prio <= c_prio:
                return False
            if t_prio < c_prio:
                return False
        self.current = target
        self.entered = time.time()
        return True

    def expire(self, now):
        _, _, dur = self.SPECS[self.current]
        if dur and now - self.entered > dur:
            self.current = "idle"
            self.entered = now


class IdleDetector:
    """系统级空闲秒数（参考 ds-local-pet awareness/idle_detector.py，Win32 GetLastInputInfo）。"""

    def __init__(self):
        self._ok = sys.platform == "win32"
        if self._ok:
            import ctypes
            from ctypes import wintypes

            class _LI(ctypes.Structure):
                _fields_ = [("cbSize", wintypes.UINT), ("dwTime", wintypes.DWORD)]

            self._LI = _LI
            self._user32 = ctypes.WinDLL("user32", use_last_error=True)
            self._kernel32 = ctypes.WinDLL("kernel32")
            self._kernel32.GetTickCount.restype = wintypes.DWORD

    def seconds(self):
        if not self._ok:
            return 0.0
        info = self._LI()
        info.cbSize = ctypes.sizeof(self._LI)
        if not self._user32.GetLastInputInfo(ctypes.byref(info)):
            return 0.0
        elapsed = (int(self._kernel32.GetTickCount()) - int(info.dwTime)) & 0xFFFFFFFF
        return elapsed / 1000.0


def install_global_key_hook(on_key):
    """Windows 低级键盘钩子：真实按键驱动宠物反应（BongoCat 式）。"""
    if not sys.platform.startswith("win"):
        return None
    import ctypes
    from ctypes import wintypes

    WH_KEYBOARD_LL = 13
    user32 = ctypes.windll.user32

    @ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_int, ctypes.c_long, ctypes.c_long)
    def callback(code, wparam, lparam):
        if code == 0 and wparam == 0x0100:  # WM_KEYDOWN
            try:
                on_key()
            except Exception:
                pass
        return user32.CallNextHookEx(None, code, wparam, lparam)

    hook = user32.SetWindowsHookExW(WH_KEYBOARD_LL, callback, None, 0)
    thread = threading.Thread(target=user32.GetMessageW, args=(ctypes.byref(wintypes.MSG()), None, 0, 0), daemon=True)
    thread.start()
    return hook, callback


def main() -> int:
    if not LAYER_DIR.exists():
        print("未找到拆件素材目录:", LAYER_DIR)
        return 1
    try:
        (Qt, QTimer, QPoint, QPointF, QImage, QPainter, QCursor, QIcon, QAction,
         QApplication, QWidget, QMenu, QSystemTrayIcon) = load_qt()
    except Exception as exc:  # pragma: no cover
        print("需要 PySide6 才能运行原生桌宠窗：pip install PySide6\n", exc)
        return 1

    images = {}
    for name, _mode in LAYERS:
        path = LAYER_DIR / f"{name}.png"
        if path.exists():
            img = QImage(str(path))
            if not img.isNull() and img.width() > 1:
                images[name] = img
    mouth_imgs = []
    for name in MOUTH_FRAMES:
        path = LAYER_DIR / f"{name}.png"
        if path.exists():
            mouth_imgs.append(QImage(str(path)))

    class Win(QWidget):
        def __init__(self):
            super().__init__(None, Qt.Window | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool)
            self.setAttribute(Qt.WA_TranslucentBackground, True)
            self.setAttribute(Qt.WA_ShowWithoutActivating, True)
            self.scale = 0.55
            self.look = QPointF(0.0, 0.0)
            self.blink_until = 0.0
            self.next_blink = time.time() + 2.0
            self.tap_until = 0.0
            self.drag_offset = None
            self.speak_idx = -1
            self.state = ActionState()
            self.idle = IdleDetector()
            self.last_activity = time.time()
            self.pat_until = 0.0
            self.click_through = False
            self.apply_size()
            self.move_to_bottom_right()
            self.timer = QTimer(self)
            self.timer.setInterval(33)
            self.timer.timeout.connect(self.tick)
            self.timer.start()
            self.key_hook = install_global_key_hook(self.on_global_key)

        def apply_size(self):
            self.pet_w = int(RIG_W * self.scale)
            self.pet_h = int(RIG_H * self.scale)
            self.setFixedSize(self.pet_w, self.pet_h)

        def move_to_bottom_right(self):
            screen = QApplication.primaryScreen().availableGeometry()
            self.move(screen.right() - self.pet_w - 40, screen.bottom() - self.pet_h - 20)

        def on_global_key(self):
            self.last_activity = time.time()
            if self.state.current == "sleep":
                self.state.request("idle", force=True)
                return
            self.state.request("tap", force=True)
            self.tap_until = time.time() + 0.35
            self.next_blink = time.time()

        def tick(self):
            now = time.time()
            self.state.expire(now)
            idle_sec = max(self.idle.seconds(), now - self.last_activity)
            if self.state.current == "sleep":
                if idle_sec < 1.5:
                    self.state.request("idle", force=True)
            elif idle_sec > 90:
                self.state.request("sleep")
            sleeping = self.state.current == "sleep"
            if not sleeping and now > self.next_blink:
                self.blink_until = now + BLINK_HOLD
                self.next_blink = now + BLINK_PERIOD
            # 视线跟随真实光标（全局）+ 缓动
            g = QCursor.pos()
            cx, cy = self.x() + self.pet_w / 2, self.y() + self.pet_h * 0.16
            dx, dy = (g.x() - cx) / max(1.0, self.pet_w), (g.y() - cy) / max(1.0, self.pet_h)
            tx, ty = max(-1.0, min(1.0, dx * 2.2)), max(-1.0, min(1.0, dy * 2.2))
            self.look = QPointF(self.look.x() + (tx - self.look.x()) * 0.2,
                                self.look.y() + (ty - self.look.y()) * 0.2)
            self.update()

        def paintEvent(self, event):  # noqa: N802
            painter = QPainter(self)
            painter.setRenderHint(QPainter.SmoothPixmapTransform, True)
            now = time.time()
            sleeping = self.state.current == "sleep"
            blinking = (now < self.blink_until) or sleeping
            tapping = now < self.tap_until
            patting = now < self.pat_until
            sway = math.sin(now * (0.5 if sleeping else 1.4))
            gaze_x = max(-5.0, min(5.0, self.look.x() * 5.0)) * self.scale / 0.55
            gaze_y = max(-2.5, min(2.5, self.look.y() * 2.5)) * self.scale / 0.55
            hop = -6.0 * self.scale / 0.55 if tapping else (-3.0 * self.scale / 0.55 if patting else 0.0)
            if sleeping:
                hop += math.sin(now * 1.0) * 0.8 * self.scale / 0.55
            for name, mode in LAYERS:
                img = images.get(name)
                if not img:
                    continue
                ox, oy = 0.0, hop
                if mode == "gaze":
                    ox, oy = gaze_x, gaze_y + hop
                elif mode == "blink":
                    if not blinking and not patting:
                        continue
                    if patting and not sleeping:
                        painter.setOpacity(0.55)
                elif mode.startswith("sway"):
                    phase = {"sway": 0.0, "sway_l": 0.7, "sway_r": 1.4, "sway_bl": 2.1, "sway_br": 2.8}.get(mode, 0.0)
                    amp = 0.5 if sleeping else 1.6
                    ox = math.sin(now * (0.6 if sleeping else 1.2) + phase) * amp * self.scale / 0.55
                painter.drawImage(self.layer_rect(ox, oy), img)
                painter.setOpacity(1.0)
            painter.end()

        def layer_rect(self, ox, oy):
            from PySide6.QtCore import QRectF
            return QRectF(ox, oy, self.pet_w, self.pet_h)

        def mousePressEvent(self, event):  # noqa: N802
            self.last_activity = time.time()
            if self.state.current == "sleep":
                self.state.request("idle", force=True)
                return
            if event.button() == Qt.LeftButton:
                self.drag_offset = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
                if event.position().y() < self.pet_h * 0.30:
                    self.state.request("pat", force=True)
                    self.pat_until = time.time() + 0.45
                else:
                    self.state.request("tap", force=True)
                    self.tap_until = time.time() + 0.3

        def mouseMoveEvent(self, event):  # noqa: N802
            self.last_activity = time.time()
            if self.state.current == "pat" and event.buttons() & Qt.LeftButton:
                if event.position().y() < self.pet_h * 0.30 and now_ok(time.time() - self.pat_until):
                    self.pat_until = time.time() + 0.45
            if self.drag_offset is not None:
                self.move(event.globalPosition().toPoint() - self.drag_offset)

        def mouseReleaseEvent(self, event):  # noqa: N802
            self.drag_offset = None

        def wheelEvent(self, event):  # noqa: N802
            self.last_activity = time.time()
            delta = event.angleDelta().y()
            self.scale = max(0.3, min(3.0, self.scale * (1.12 if delta > 0 else 0.9)))
            self.apply_size()

        def contextMenuEvent(self, event):  # noqa: N802
            menu = QMenu(self)
            zoom_in = menu.addAction("放大")
            zoom_out = menu.addAction("缩小")
            zoom_reset = menu.addAction("恢复默认大小")
            menu.addSeparator()
            open_main = menu.addAction("打开主工作区")
            quit_act = menu.addAction("退出桌宠")
            picked = menu.exec(event.globalPos())
            if picked == zoom_in:
                self.scale = min(3.0, self.scale * 1.25)
                self.apply_size()
            elif picked == zoom_out:
                self.scale = max(0.3, self.scale * 0.8)
                self.apply_size()
            elif picked == zoom_reset:
                self.scale = 0.55
                self.apply_size()
            elif picked == open_main:
                import subprocess
                subprocess.Popen([sys.executable, str(BASE_DIR / "desktop_main.py")])
            elif picked == quit_act:
                QApplication.quit()

    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    win = Win()
    win.show()

    tray = QSystemTrayIcon(app)
    icon_path = BASE_DIR / "app" / "public" / "characters" / "deepseek_chibi.png"
    if icon_path.exists():
        tray.setIcon(QIcon(str(icon_path)))
    tray.setToolTip("AI Token Pet 桌面宠物")
    tray_menu = QMenu()
    show_act = tray_menu.addAction("显示/隐藏宠物")
    through_act = tray_menu.addAction("鼠标穿透：关")
    quit_act = tray_menu.addAction("退出")
    tray.setContextMenu(tray_menu)
    show_act.triggered.connect(lambda: win.setVisible(not win.isVisible()))

    def toggle_click_through():
        win.click_through = not win.click_through
        win.setWindowFlag(Qt.WindowTransparentForInput, win.click_through)
        win.show()
        through_act.setText("鼠标穿透：开" if win.click_through else "鼠标穿透：关")

    through_act.triggered.connect(toggle_click_through)
    quit_act.triggered.connect(lambda: QApplication.quit())
    tray.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())

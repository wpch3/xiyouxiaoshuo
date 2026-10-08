"""
AI Token Pet - 桌面独立运行客户端 (Desktop Host)
基于 Python + PyWebView 原生无边框桌面窗口，可无缝打包为 AITokenPet.exe
"""
import os
import sys
import webview

def get_resource_path(relative_path):
    """获取程序运行资源目录（兼容 PyInstaller 打包后的 _MEIPASS 路径与开发源码路径）"""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    # 本地开发环境
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidate1 = os.path.join(base_dir, relative_path)
    if os.path.exists(candidate1):
        return candidate1
    candidate2 = os.path.join(base_dir, 'app', relative_path)
    if os.path.exists(candidate2):
        return candidate2
    return candidate1

class DesktopPetAPI:
    """提供给桌宠前端直接调用的本地系统接口类，由 js_api 注入"""
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def minimize_window(self):
        if self._window:
            self._window.minimize()

    def close_window(self):
        if self._window:
            self._window.destroy()

    def set_always_on_top(self, flag: bool):
        if self._window:
            self._window.on_top = flag

def main():
    dist_index = get_resource_path(os.path.join('dist', 'index.html'))
    
    # 本地如果尚未打包，尝试寻找 app/dist
    if not os.path.exists(dist_index):
        dist_index = get_resource_path(os.path.join('app', 'dist', 'index.html'))

    api = DesktopPetAPI()

    window = webview.create_window(
        title='AI Token Pet · 拟人桌面消费伴侣',
        url=dist_index if os.path.exists(dist_index) else 'http://localhost:5173',
        js_api=api,
        width=1180,
        height=820,
        resizable=True,
        min_size=(420, 640),
        frameless=False,
        easy_drag=True
    )
    
    api.set_window(window)
    webview.start(debug=False)

if __name__ == '__main__':
    main()

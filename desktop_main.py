import os
import sys
import webview

def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidate1 = os.path.join(base_dir, relative_path)
    if os.path.exists(candidate1):
        return candidate1
    candidate2 = os.path.join(base_dir, 'app', relative_path)
    if os.path.exists(candidate2):
        return candidate2
    return candidate1

class DesktopPetAPI:
    def __init__(self):
        self._main_window = None
        self._pet_window = None

    def set_main_window(self, window):
        self._main_window = window

    def spawn_floating_pet(self):
        """真正弹出独立的 Windows 原生桌面置顶悬浮伴侣小窗口（完全独立于主窗口，直接在 Windows 桌面上悬浮）"""
        if self._pet_window is not None:
            return

        dist_index = get_resource_path(os.path.join('dist', 'index.html'))
        if not os.path.exists(dist_index):
            dist_index = get_resource_path(os.path.join('app', 'dist', 'index.html'))

        # 创建独立的置顶、无边框、支持半透明的桌宠子窗口
        self._pet_window = webview.create_window(
            title='AI Token Pet · 独立桌宠',
            url=(dist_index if os.path.exists(dist_index) else 'http://localhost:5173') + '#compact',
            width=380,
            height=340,
            resizable=False,
            frameless=True,
            on_top=True,
            transparent=True,
            easy_drag=True
        )

    def close_floating_pet(self):
        if self._pet_window:
            self._pet_window.destroy()
            self._pet_window = None

def main():
    dist_index = get_resource_path(os.path.join('dist', 'index.html'))
    if not os.path.exists(dist_index):
        dist_index = get_resource_path(os.path.join('app', 'dist', 'index.html'))

    api = DesktopPetAPI()

    window = webview.create_window(
        title='AI Token Pet · 拟人桌面消费伴侣',
        url=dist_index if os.path.exists(dist_index) else 'http://localhost:5173',
        js_api=api,
        width=1200,
        height=840,
        resizable=True,
        min_size=(480, 600),
        frameless=False,
        easy_drag=True
    )
    
    api.set_main_window(window)
    webview.start(debug=False)

if __name__ == '__main__':
    main()

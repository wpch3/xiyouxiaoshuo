# cpp_client（已归档，未启用）

项目早期"C 语言阶段"的 Win32 + WebView2 原生壳：托盘、置顶开关、WebView2 嵌入主 UI。

归档原因（真机实测结论）：
- WebView2 窗口透明（TransparencyKey / 透明背景）在 Windows 真机失效，桌宠出现黑底；
- 不参与任何构建脚本与文档引用，属残留代码；
- 原生透明窗需求已由 desktop_pet_qt.py（PySide6，WA_TranslucentBackground 分层透明）与
  desktop_main.py（pywebview transparent）两条在维护路线覆盖。

如需复活：弃 WebView2，改 Win32 UpdateLayeredWindow 分层窗 + 自绘分层 PNG（参考
vladelaina/BongoCat 的 C+SDL3 架构），并自行重验透明/置顶/穿透三件。

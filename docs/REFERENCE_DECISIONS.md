# 参考项目决策记录（2026-10-10）

用户指定完整参考以下五个开源项目后决策。结论：**主工作区继续走 Web 技术栈；
桌面宠物本体改走原生 Qt 透明窗进程（desktop_pet_qt.py），复用现有分层拆件资产。**

| 项目 | 技术栈 | 采纳 | 不采纳 |
| --- | --- | --- | --- |
| vladelaina/BongoCat | C + SDL3 + OpenGL 原生渲染 | 宠物本体必须原生渲染/原生透明窗的理念；托盘与品牌图标一致性 | 整个 C/SDL 重写（与现有 Web 资产管线不兼容） |
| ayangweb/BongoCat | Rust 核心 + Live2D Cubism + 全局键鼠/手柄钩子 + 各平台权限流 | **全局输入钩子驱动宠物反应**（bongo 模式，已用 ctypes WH_KEYBOARD_LL 实现）；动作可重叠播放的思路 | Live2D Cubism SDK（授权与模型来源重，我们的分层 rig 已等价） |
| QCYTSN/ds-local-pet | PySide6 + 大肥鱼二创精灵 + 状态机(behavior/awareness/dialogue) | **PySide6 WA_TranslucentBackground 透明窗路线**（Windows 实测最稳）；代码/素材授权分离（ASSET_LICENSE）；状态驱动行为 | 直接复用其二创素材（版权）；精灵帧序列（我们已有分层 rig，可控性更强） |
| LorisYounger/VPet | WPF 桌宠平台（状态机/mod/DLC/托盘/睡眠/移动摸头） | 桌宠交互语汇：拖动、点击反应、右键菜单、托盘、缩放贴合窗口；状态机分层（Core/Interface） | WPF/.NET 栈（与 Python+Web 管线不合） |
| moeru-ai/airi | Web/Electron + Live2D/VRM 舞台 + 实时语音 + 自托管 | **主 UI 用 Web 技术栈 + 实时语音方向**被验证；舞台抽象（多渲染后端） | Electron 全包体（我们已有 pywebview 主窗 + Qt 宠物窗的更轻组合） |

## 架构结论
1. `desktop_main.py`（pywebview）= 主工作区窗口（Web UI、API 网关、资料/社交/Agent）。
2. `desktop_pet_qt.py`（PySide6，可选依赖）= 桌面宠物本体：透明无边框置顶异形窗、
   分层拆件实时渲染（视线跟随真实光标、眨眼周期、发丝/后发摆动）、全局按键反应、
   拖动移动、滚轮/菜单缩放（窗口贴合）、右键原生菜单、系统托盘。
3. pywebview 的 `#compact` 小窗保留为**无 PySide6 环境时的回退**。
4. 实时双向语音继续按 airi 路线调研供应商实时音频接口（不引入独立 TTS）。

## 待办（按优先级）
- 口型说话节奏优化（随机帧长+静音间隔，去"对口型"感）。
- 骨骼区批次②：颈补图、衣物分离、腿/鞋、手臂三段+手指。
- Qt 宠物窗：睡眠/久坐提醒状态、拖拽抓取姿态变体（批次③资产就位后接入）。
- 其余 6 角色 ×4 形态批量管线（批次④），Q 版沿用鲸鱼连体衣格式换物种。

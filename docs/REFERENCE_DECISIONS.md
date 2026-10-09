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

## 源码级学习结论（第二轮，浅克隆研读后已删除暂存）

| 仓库 | 源码位置 | 吸收进本项目的机制 |
| --- | --- | --- |
| QCYTSN/ds-local-pet | `animation/state_machine.py`、`awareness/idle_detector.py` | 优先级+可中断+过期的动作状态机（idle/sleep/tap/pat）；Win32 `GetLastInputInfo` 系统空闲检测 → 90s 无输入进睡眠（闭眼+慢摆动+呼吸），任何输入唤醒。已落地 `desktop_pet_qt.py` |
| LorisYounger/VPet | `VPet-Simulator.Core/Display/Main.xaml.cs` TouchHead/TouchBody/TouchArea Locate+Size | 触摸分区语汇：头部区（rig 顶 30%）=摸头（眯眼+小跳+连打节流），身体区=拖动/轻拍。已落地 Qt 窗 |
| vladelaina/BongoCat | `src/platform/windows_layered.c`、`linux.c`、`macos.m` | 分层透明窗 + click-through（指针穿透）开关语汇；托盘提供"鼠标穿透：开/关"（`Qt.WindowTransparentForInput`）。已落地 Qt 窗托盘菜单 |
| ayangweb/bongocat | `crates/bongocat-input`、`bongocat-overlay`、`bongocat-live2d-playback` | 输入→模型→播放→渲染的分层 crate 架构，验证本项 hook→状态机→rig 管线；动作可重叠（tap 与 pat 并存）由状态机优先级表达 |
| moeru-ai/airi | `packages/core-agent/src/voice/{controller,interruption,turn}.ts`、`input/end-detection` | 实时语音=输入(STT+端点检测)→turn→输出音频+interruption(barge-in) 控制器结构；后续实时语音按此四段实现，供应商走 provider 抽象（gemini-audio/minimax/openrouter 等） |

本轮同步优化：Web 口型改"词节奏调度器"（词内随机音素 70-160ms、12% 重音长帧、词间 70% 概率闭口停顿 120-260ms、帧间 60ms 交叉淡化），视线改 rAF 缓动（0.16 系数，直接写 transform 不触发重渲染）。

# native_pet_c：原生桌宠（C 语言版）

用 C 语言重写桌面宠物本体，替代 `desktop_pet_qt.py`（Python/PySide6）。
主工作区（聊天、资料、API 配置）仍是仓库里的 Web 应用，本程序只负责桌面上的宠物窗口。

## 结构

| 文件 | 作用 | 平台 |
| --- | --- | --- |
| `include/pet_core.h`, `src/pet_core.c` | 纯逻辑：动作状态机、睡眠、触摸分区、视线缓动/限幅、眨眼、层绘制参数、缩放几何、口型节奏调度器 | 任意（无 OS 依赖） |
| `tests/test_core.c` | 纯逻辑自检（55 项） | 任意 |
| `src/pet_win32.c` | Win32 分层窗（UpdateLayeredWindow + GDI+ 合成 12 层 PNG）、托盘、右键菜单、全局键盘钩子、拖动、滚轮缩放 | Windows |
| `Makefile` | `make test` / `make win` / `make win-zig` | |
| `build_windows.bat` | Windows 一键构建（MinGW-w64 gcc，或 MSVC cl） | Windows |

素材不复制进仓库：直接读取 `app/public/characters/deepseek_layers/*.png`（与 Web 端、Qt 版共用同一套拆件）。

## 运行

Windows：

```bat
cd native_pet_c
build_windows.bat
build\AITokenPetC.exe
```

可选参数：`--assets <deepseek_layers 目录>`、`--workspace-url <主工作区地址>`（默认 `http://127.0.0.1:8766/`，即 `desktop_main.py` 的本机端口）。

操作说明（与原 Qt 版一致）：

- 左键按住拖动：移动宠物。
- 摸头区（宠物顶部 30%）：摸头动画（眯眼、小跳、按住连续触发）。
- 身体区：轻点（跳动）。
- 滚轮：缩放（0.3x–3.0x，默认 0.55x）。
- 右键：放大 / 缩小 / 恢复默认大小 / 打开主工作区 / 退出。
- 任意键盘输入：宠物轻点反应（全局钩子）。
- 空闲 90 秒：进入睡眠（眼睑闭合、摆动减慢）；任何输入唤醒。
- 托盘图标：显示/隐藏、鼠标穿透开关、退出。点击穿透开启后宠物不再接收鼠标，只能从托盘关闭。

Linux/macOS 沙箱只能跑纯逻辑自检：

```bash
cd native_pet_c && make test
```

## 验证状态

| 项目 | 状态 |
| --- | --- |
| 纯逻辑自检 55/55（状态机、睡眠/唤醒、触摸分区、摸头节流、视线限幅 ±3/±1.5 px、缩放等比、眨眼周期 4.6s/保持 0.16s、口型时序范围、17 张素材存在） | [测试锁] 沙箱实测 |
| `src/pet_win32.c` 交叉编译为 Windows x64 GUI 可执行文件（zig/mingw 头文件，无警告） | [沙箱实测] 编译与链接通过 |
| 窗口实际显示、透明/置顶/无黑边、整窗缩放贴合、托盘、穿透开关、全局键钩、睡眠唤醒 | [需真机] 未在 Windows 上运行 |
| 视线/眨眼/摸头的目视观感（100–150% 无错位、眼球不固定） | [需真机] |
| 召唤主工作区（ShellExecute 打开 8766） | [需真机]，且需先启动 `desktop_main.py` |

## 已知限制 / 待办

1. 托盘图标暂用系统默认图标，尚未从 `deepseek_chibi.png` 生成 `.ico`。
2. 口型调度器已实现并测试，但宠物暂未接入语音；语音（GPT 电话模式）依赖主工作区的实时语音链路，尚未实现。
3. 主工作区通过 `--workspace-url` 打开，尚无双向 IPC（HANDOVER §11 第 5 条提到的 localhost:8766 / 命名管道），后续再接。
4. 每帧对 12 层做双线性缩放，3 倍缩放时的帧率需真机确认；如偏慢，可改为缩放时预计算缓存。
5. `desktop_pet_qt.py` 与 `docs/legacy/cpp_client/` 仍保留作参考，未删除；确认 C 版真机通过后可再决定是否清理。

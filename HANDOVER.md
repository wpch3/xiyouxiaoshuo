# 交接文件（Handover）——致下一个代理：C 语言桌面宠物版本

> 写于 2026-10-10，分支 `arena/948f1ee6-xiyouxiaoshuo`，HEAD=`92b688c`，工作树干净。
> 本文件是**唯一入口**：先读完本文件，再按"必读文档"顺序读仓库文档，再动代码。
> 用户目标变更：**用 C 语言重写桌面宠物软件版本**。本仓库现有实现（Web+Python）作为
> 资产与规格的来源保留；C 版本建议新建目录（如 `native_pet_c/`）或新仓库，**不要**在
> `app/` 里改。

---

## 1. 产品是什么

"AI Token Pet / 拟人桌面消费伴侣"：桌面宠物 + AI 角色聊天 + Token 用量计量/投喂商铺的
拟人化桌面伴侣。7 个 AI 角色 × 4 形态（少女/萝莉/青年女性/Q版），主工作区 + 桌面小窗 +
可选原生桌宠窗三条呈现路线。聊天/资料/记录**只存本机**。API 支持官方 + 本地接口。
语音目标 = GPT 电话模式（语音输入、语音回复与文字同步、可打断/接话），**不要独立 TTS 模块**。

## 2. 仓库地图（当前实现）

| 路径 | 内容 |
| --- | --- |
| `app/` | React+Vite Web 应用（主工作区 UI）。`app/src/components/LiveAnimeModel.jsx`=立绘舞台 v2（clean-room 重写版）；`LayeredPetRig.jsx`=分层 rig 渲染器（口型调度器/视线缓动在此）；`CompactPetStage.jsx`=小窗；`App.jsx`=主布局（左栏已拆角色卡/对话卡/选择卡三卡） |
| `app/public/characters/` | 全部立绘资产。**`deepseek_layers/`** = 小寻少女形态 18 张拆件（13 层+5 口型帧）；`deepseek_chibi.png`=Q 版鲸鱼连体衣原画 |
| `desktop_main.py` | pywebview 桌面壳：主窗+小窗（frameless/transparent/on_top）、`resize_pet_window`、`toggle_click_through`（Win32 WS_EX_TRANSPARENT）、固定端口 8766、存储 `%LOCALAPPDATA%/AITokenPet/webview` |
| `desktop_pet_qt.py` | 可选 PySide6 原生透明桌宠窗：优先级状态机、系统空闲睡眠、摸头/身体触摸分区、全局键钩、托盘、点击穿透、`--selftest` / `--selftest-logic` |
| `scripts/selfcheck_all.sh` | **一键总自检（交付前必须全绿）**：vitest 22 / 构建 / 资产像素 8 / Qt 逻辑 10 |
| `scripts/selfcheck_assets.py` | 眼睛零件像素级自检（限值与度量定义在内） |
| `scripts/ref/orig_base_rig.png` | **原画基准图**（眼睛管线唯一 source of truth，424×632 RGBA） |
| `docs/REFERENCE_DECISIONS.md` | 五参考项目取舍 + 源码级学习结论 |
| `docs/SELFTEST.md` | 三层自检手册与沙箱限制说明 |
| `docs/ASSET_LICENSE.md` | 素材=原创 AI 生成；梗仅借设计语言；不分发二创 |
| `docs/PRODUCT_ROADMAP.md` | 产品路线（含 Q 版鲸鱼决策） |
| `docs/legacy/cpp_client/` | **早期 C++ 阶段遗留**（Win32+WebView2 壳）+ ARCHIVED.md 归档原因 |

运行：`cd app && npm ci && npm run dev`（或 `python desktop_main.py` 真机桌面壳）。
测试：`cd app && npx vitest run --environment jsdom`；自检：`./scripts/selfcheck_all.sh`。

## 3. 眼睛管线（C 版本必须复用的资产与数值）

现状资产已是**终版**：`base_rig.png`（眼白底，仅眼开口内 feather 0.7px 填充）+
`iris.png`（原画虹膜逐像素拷贝 ∩ 实测眼形软掩膜，边缘 1px 羽化）。C 版直接加载这两张 PNG
即可，**不要重做像素手术**。

- 实测眼形椭圆（网格量得，424×632 坐标）：左 `(cx,cy,rx,ry)=(193.0,97.0,11.0,4.0)`；
  右 `(233.0,96.5,10.0,4.5)`。
- 视线偏移限幅：**±3px / ±1.5px**（眼开口物理余量；超出即"错位/变色"观感，历史教训）。
- 眨眼=眼睑层 `eyelids.png` 显示 0.16s、周期 4.6s；口型=5 帧
  `mouth_open/e/i/o/u.png`，节奏调度器规格：词内随机音素 70–160ms、12% 重音长帧 170–230ms、
  词间 70% 概率闭口停顿 120–260ms、帧间 60ms 交叉淡化。
- 层 z 序（底→顶）：back_hair_l0 back_hair_r1 base2 iris4 eye_hair5 eyelids6 brow7
  arm_l8 arm_r_rest9 arm_r_wave10 sway_l11 sway_r12 bangs13（口型帧独立叠于 base 上）。
- 验收度量（`selfcheck_assets.py`）：静止合成 vs 原画边缘能量比 <1.10（实测 1.004）；
  视线极限偏移态无超原画 P99.5×1.25 的极端阶跃边（≤40px）；眼区 bbox 外 0 改动。

## 4. 舞台几何（C 版窗口/缩放的规格）

- 单一缩放源：舞台盒尺寸 = `w = size*(0.9*scale + 0.1)`，`h = size*1.62*0.9*scale + size*0.16`；
  角色层**不再二次缩放**（scale 恒 1），锚定底边中心。任何倍率不裁切、不溢出外部控件。
- 主窗缩放范围 0.7–1.5（键 `pet_scale_v1`）；小窗 0.5–5（键 `pet_compact_scale_v1`），
  小窗窗口尺寸 = 舞台盒 +14px 边距（滚轮 1.12/0.9 步进）。
- C 版对应实现：分层窗客户区 = 舞台盒尺寸；缩放 = 重建分层窗位图尺寸（GDI+ 缩放绘制各层）。

## 5. 原生窗三件套（透明/置顶/穿透）的真机结论

| 路线 | 结论 |
| --- | --- |
| Win32 LWA_COLORKEY 品红键色 | **真机失败**（黑底），禁用 |
| WebView2 透明（cpp_client 路线） | **真机失败**，已归档，见 `docs/legacy/cpp_client/ARCHIVED.md` |
| pywebview `transparent=True` + CSS 透明 + `body.pet-compact-body` class 挂载 | 在维护路线之一（class 挂载曾遗漏导致黑底，已修） |
| PySide6 `WA_TranslucentBackground` 分层透明 | 在维护路线之二，**最稳** |
| 点击穿透 | Win32 `WS_EX_TRANSPARENT`（+`WS_EX_LAYERED`）toggle；Qt 路线托盘有开关；pywebview 路线 `api.toggle_click_through`，恢复=重召唤 |
| 置顶 | `on_top=True` / `WindowStaysOnTopHint` |

**C 版建议**：Win32 `WS_EX_LAYERED` + `UpdateLayeredWindow`（ULW_ALPHA）逐帧合成 18 层 PNG
（参考 vladelaina/BongoCat 的分层渲染思路，但用它的是 SDL3+OpenGL；纯 Win32 GDI+ 亦够），
或 SDL3 路线整体照抄 BongoCat 架构。**不要**在 C 版里嵌 WebView2 做透明窗。

## 6. 状态机与交互规格（从 desktop_pet_qt.py 移植）

- `ActionState`：优先级+可中断+自动过期。SPECS：idle(0,可中断)、sleep(0,可中断)、
  tap(2,不可中断,0.4s)、pat(3,不可中断,0.45s)；高优先级可打断低优先级，force 可越级。
- 睡眠：系统空闲 >90s 进入（Win32 `GetLastInputInfo`；非 Win 回退=本窗最后活动时刻），
  任何输入唤醒；睡眠视觉=眼睑常闭+摆动频率减半+呼吸起伏。
- 触摸分区：rig 顶 30% = 摸头（pat：眯眼 0.55 透明度+小跳 -3px+连打节流 0.25s）；其余=身体
  （tap 跳 -6px + 拖动移窗）。
- 视线：全局光标 → 归一化 → 缓动系数 0.2（Qt）/ Web 端 rAF 0.16 → 限幅见 §3。
- 托盘：图标 `app/public/characters/deepseek_chibi.png`；菜单=显示隐藏/鼠标穿透/退出；
  右键窗菜单=缩放三件/打开主工作区(subprocess desktop_main.py)/退出。

## 7. 用户硬约束（违反即返工，逐条验收）

1. **全项目禁止 emoji**（API 回复展示层 stripEmoji）；图形用高清素材或可缩放资产。
2. 道具必须**真实交互**：锤子/抚摸手在立绘上有点击/拖动反馈（非预制对话）。
3. 7 角色 × 4 形态保留；服装由助手设计；Q 版=原创鲸鱼连体衣（已实装）。
4. 桌宠窗：无边框、透明、置顶、无黑边、整窗滚轮缩放贴合、召唤工作区必须成功。
5. 主窗：原生软件感；分页跳转不滚动整页；缩放=背景静态仅角色放大；聊天记录不得挤走
   形象切换；输入框任何滚动位置可见（sticky）；左栏三卡分离（角色/对话/选择）。
6. 眼睛：像人眼、颜色与原画一致、刘海不切割、100–150% 无区块/缝合/错位；眼球不得固定一层。
7. 非 Q 版禁止史莱姆弹跳与身体整体位移；嘴部"像对口型"感已用词节奏调度器缓解（仍待真机确认）。
8. 语音=GPT 电话模式（可打断/接话、语音与文字同步），不经确认不得换更贵供应商。
9. 聊天/资料/记录存本机；API 官方+本地；Agent 全能力但需权限确认并限范围。
10. 残留清理：多余残留必须去除（防闪退卡顿）；仓库任何时点可直接打包（无冲突标记）。
11. 每轮交付：完整实施+汇报+**真实测试清单**；修复带验证标签（[测试锁]/[沙箱实测]/[需真机]）；
    **不得替用户宣布真机项完成**。
12. 拆件约束：按 Live2D/Spine 指南尽可能细分（批次②待做：颈/衣物/腿鞋/手臂三段+手指；
    ③挥手抓取整帧；④6 角色×4 形态；⑤服装自定义）。

## 8. 死路清单（别再试）

- 眼睛像素手术填充配方（全掩膜填白/chroma 门槛/程序化画虹膜/统一 lash_y 等十余种）→ 终局是
  "AI 重绘零件 + 实测眼形 + 软掩膜"，资产已终版，**直接用**。
- 估参数：任何几何/眼形参数必须网格实测或公式单一来源。
- 双缩放：舞台盒生长 × 角色层再 scale = 平方级裁切（本回合最大回归源）。
- 字符串 replace/正则补丁静默无效：补丁后必须 grep 验证（曾把 `#` 注释写进 JS 对象）。
- WebView2 透明、LWA_COLORKEY、TransparencyKey（同类项目公认但实测失效）。
- jsdom 陷阱：丢 style.clipPath；rAF 在 fake timers 下冻结；import.meta.url 非 file scheme。
- 沙箱限制：无 root（装不了 libGL 等系统库 → PySide6 GUI 层自检只能在真机跑）；无真实浏览器
  （目视项永远标 [需真机]）；PEP 668 → 像素工具用独立 venv（曾为 /tmp/imgenv，易失则重建
  pillow/numpy/scipy）。
- push 被拒 → `git pull --rebase`（--theirs），禁强推；rebase 后 grep 冲突标记+复跑测试。
- 会话固定分支 `arena/948f1ee6-xiyouxiaoshuo`：只 commit/push/PR 到它。

## 9. 五参考项目结论（源码级，详见 docs/REFERENCE_DECISIONS.md）

vladelaina/BongoCat（C+SDL3+OpenGL 原生渲染/托盘）→ C 版渲染架构首选参考；
ayangweb/bongocat（Rust 核+全局键鼠钩子+动作可重叠）→ 全局输入钩子驱动反应；
QCYTSN/ds-local-pet（PySide6+优先级状态机+GetLastInputInfo 空闲检测+素材授权卫生）→ 状态机/睡眠已移植；
LorisYounger/VPet（WPF：TouchHead/TouchBody 分区、状态机、托盘）→ 触摸分区语汇；
moeru-ai/airi（Web+Live2D/VRM+实时语音 controller：STT 端点检测→turn→音频+barge-in）→ 实时语音四段结构。

## 10. 待办 backlog（C 版继承）

批次②拆件（颈/衣物/腿鞋/手臂三段+手指）→ ③挥手/抓取整帧 → ④6 角色×4 形态重绘 → ⑤服装自定义；
实时双向语音（airi 四段）；Gemini 群聊复测；Windows 持久化复测；工作区分类；嘴部自然度真机确认；
Qt 窗睡眠/抓取状态真机确认；用户真机四项（眼睛平移观感/小窗贴合透明置顶/穿透开关/主窗缩放不扰对话卡）。

## 11. 给 C 版代理的最小起步清单

1. 读 §3–§8 与 `docs/legacy/cpp_client/ARCHIVED.md`；
2. 资产直接引用 `app/public/characters/deepseek_layers/*.png` 与 §3 数值，勿重做；
3. 原生窗走 `WS_EX_LAYERED+UpdateLayeredWindow`（或 SDL3），透明/置顶/穿透三件套按 §5；
4. 状态机/睡眠/触摸分区/视线缓动按 §6 移植（desktop_pet_qt.py 有可运行参考实现与自检）；
5. 主工作区 UI 建议继续用本仓库 Web 应用（C 版只做桌宠本体+IPC：localhost:8766 或命名管道），
   勿用 C 重写重 UI；
6. 交付前跑 `./scripts/selfcheck_all.sh` 全绿 + 给真机清单 + 验证标签。

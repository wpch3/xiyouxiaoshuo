# AI Token Pet · 项目接手审计

- 日期：2026-10-08
- 分支：`arena/fd221e64-xiyouxiaoshuo`（基于 `524f5f1`）
- 范围：仓库内全部 76 个受版本控制文件（不含 `node_modules`）
- 性质：整理与诊断。本次没有修改任何业务代码，等你确认方案后再动手。

---

## 0. 结论

1. **界面是完整的，功能大多是假的。** 你列出的 12 项里（动态立绘、互动、小窗口、图片尺寸、服装、年龄形态、小锤子、手抚摸、摸脸、点击互动、对话互动、API 接口），多数要么是死代码（组件写了但没挂载），要么是按钮没有接到数据或素材上。
2. **安全问题，需要立即处理：** Claude、Gemini、Kimi、Grok 的 API Key 会被发送到 DeepSeek 的域名（已逐一实测，见 §4.1）。
3. **打包后的 exe 大概率白屏。** `dist/index.html` 和立绘都用了绝对路径，用本地文件方式加载时全部 404（已在 Chromium 中复现，并验证了修复方法，见 §4.2）。
4. **对话没有接上真实模型。** 没有 Key 时，回复是写死的随机台词，不回答问题。
5. **建议：** 先确定产品边界和架构（§6），再分阶段重建核心模块（§7）。不建议继续在 1665 行的 `App.jsx` 上打补丁。

---

## 1. 仓库状态

- `main` 分支含 `西游小说.zip`。本分支的基底提交 `524f5f1 Delete 西游小说.zip` 已删除它（不是本次会话做的）。仓库名 `xiyouxiaoshuo` 与项目内容（AI Token Pet）不一致。
- `app/public/characters/` 和 `app/dist/characters/` 各有 23 张立绘，每份约 24 MB。`app/dist/` 构建产物已提交进 git。
- 没有测试、没有 lint、没有类型检查。
- `.github/workflows/` 不存在。CI 配置 `ci-scripts/build-exe.yml` 不会被 GitHub 执行。
- 本地复现：`npm ci` 成功；`vite build` 的产物与仓库内 `dist/` 逐字节一致（`index-iBMRZOsw.js`、`index-DufTCVbe.css`）。

---

## 2. 文件清单

| 路径 | 作用 | 状态 | 说明 / 建议 |
|---|---|---|---|
| `README.md` | 项目说明 | 不准确 | 描述了未实现或模拟的功能（真实 API 计量、点击头部、多窗口），需重写。 |
| `.gitignore` | 忽略规则 | 不完整 | 没有忽略 `app/dist/`。 |
| `app/package.json`、`package-lock.json` | 前端依赖 | 正常 | `npm ci` 可复现。 |
| `app/vite.config.js` | Vite 配置 | 需修改 | 缺 `base: './'`；启动时有 ESM 配置警告（缺 `"type": "module"`）。 |
| `app/index.html`、`app/src/main.jsx` | 入口 | 正常 | |
| `app/src/App.jsx`（1665 行） | 主界面、全部状态、模拟数据、对话入口 | 需拆分 | 所有状态集中在一个组件，大量内联样式。 |
| `app/src/components/LiveAnimeModel.jsx` | 当前主舞台立绘 | 在用，功能很少 | 只有整体倾斜和呼吸；无眨眼、无视线、无口型、无点击热区。 |
| `app/src/components/BongoRealDesk.jsx` | 键鼠"Bongo 猫"工作台 | 在用 | 只监听页面内的键盘和鼠标；形态固定为 Q 版。 |
| `app/src/components/BongoPetLive.jsx` | `FloatingDeskPetOverlay` 在用；`BongoPetLive` 未用 | 部分死代码 | 页内浮层，不是系统窗口。 |
| `app/src/components/LiveInteractiveAvatar.jsx` | 摸头、戳脸、身体点击热区、眨眼 | **死代码** | 主界面未引用。包含"身体点击区"，建议删除（见 §6 Q3）。 |
| `app/src/components/Avatars.jsx` | 旧立绘渲染 | **死代码** | 只被 import，未渲染。可删除。 |
| `app/src/components/ClickParticleCanvas.jsx` | 全局点击粒子 | 在用 | 每次点击都触发彩纸，偏吵。 |
| `app/src/constants/characters.js` | 7 个角色的人设、配色、服装、台词、费率、食物、模拟调用 | 在用 | 服装数据没有接到渲染；`low_tokens`、`overfed` 台词定义了但未使用。 |
| `app/src/utils/aiService.js` | 对话服务 | **有严重问题** | 见 §3.9 与 §4.1。 |
| `app/src/utils/soundManager.js` | WebAudio 程序化音效 | 在用 | 没有静音开关。 |
| `app/src/index.css` | 全局样式 | 有重复 | `@keyframes breathing` 定义了两次（L28、L81）。 |
| `app/src/styles/interactive.css` | 互动动效 | 有无效定义 | `characterHappyJump` 没有对应 class；`waveHands` 未用。 |
| `app/public/characters/*.png`（23 张） | 立绘源文件 | 需重做 | 见附录 A。 |
| `app/dist/**` | 构建产物（已入库） | 不应入库 | 与 `public/characters` 重复一份；绝对路径导致本地加载失败。 |
| `desktop_main.py` | pywebview 桌面宿主（exe 入口） | 在用，有缺陷 | 没有处理本地资源的加载方式（见 §4.2）；`#compact` 参数无效（L37）；`transparent=True` 无效（L43），因为页面根元素和 body 都有不透明背景。 |
| `build_windows_exe.bat` | Windows 打包（GBK 编码，CRLF） | 可用 | `app\dist\index.html` 存在时直接跳过前端构建（L31–L34），所以可能打出与源码不一致的产物。 |
| `build_windows_exe.ps1` | 同上（UTF-8 无 BOM） | 与 .bat 重复 | Windows PowerShell 5.1 可能显示乱码，建议改为带 BOM 的 UTF-8。 |
| `ci-scripts/build-exe.yml` | GitHub Actions 配置 | **不生效** | 必须放在 `.github/workflows/` 才会运行。 |
| `cpp_client/CMakeLists.txt`、`include/DesktopPetApp.h`、`src/main.cpp` | C++ WebView2 原生版 | 未完成 | 缺 WebView2 SDK 和 WIL；CMake 未链接 WebView2Loader；窗口是普通标题栏窗口；`Navigate` 传入的是 Windows 路径（L169）。 |
| `tools/generate_avatar_pipeline.sh` | "立绘生成与切图"流水线 | **名不副实** | 不生成图片；会就地修改原图；阈值 240 会把接近白色的像素全部设为透明（L46–L53）；`alpha` 变量未用；注释声称同步到 C++ 端，实际没有。 |

---

## 3. 你列出的功能：逐项审计

### 3.1 动态立绘
- **现状**：主舞台是一张静态 PNG，加整体 2.5D 倾斜（跟随鼠标）和呼吸起伏。情绪只切换滤镜，并加一个 emoji 浮层。
- **已验证**：开心（happy）状态下，`<img>` 的 class 是 `character-happy-jump`，但 CSS 里没有这个 class，`animationName` 为 `none`，所以没有跳跃动画。
- **原因**：`LiveAnimeModel.jsx` L119 引用了不存在的 class；`interactive.css` L56 只定义了 keyframes `characterHappyJump`。`isSpeaking` 传入但未使用（L21）。`App.jsx` 里 LiveAnimeModel 上方的注释声称"实装瞳孔视线跟随、眨眼、张嘴说话"，代码里没有这些实现。
- **建议**：先确定动画方案（§6 Q2），再做动作状态机（idle / listening / thinking / speaking / happy / shy / sad / sleepy / surprised），每个状态有对应素材或动效。

### 3.2 互动（点击、摸头、摸脸、手抚摸）
- **现状**：主舞台上点击立绘**没有任何反应**（已验证：台词不变，状态不变）。只有按钮，如"抚摸安慰""举手高兴"。精简模式下点击 Q 版图才会触发摸头（`BongoRealDesk.jsx` L127）。
- **摸脸**：只存在于死代码 `LiveInteractiveAvatar.jsx`（戳脸热区，L192），主界面没有。
- **手抚摸**：没有手。"猫爪手套"是一个 🐾 emoji 浮层（`LiveAnimeModel.jsx` L184–L199），不跟随鼠标，没有抚摸轨迹。
- **建议**：手掌素材跟随鼠标，按住滑动 = 抚摸（头发轻晃、脸红、爱心粒子）；单击 = 摸头。热区基于归一化后的素材坐标，不要随手覆盖 div。

### 3.3 小窗口
三种"小窗"并存，都不完整：
- **(a) 精简模式**（`App.jsx` L591 分支）：页面中间一张 480px 的卡片，不是系统窗口。
- **(b) 页内浮层** `FloatingDeskPetOverlay`（`BongoPetLive.jsx` L7）：`position: fixed` 的 DOM 元素，只能在网页内部移动，超不出浏览器窗口。
- **(c) pywebview 独立窗口**（`desktop_main.py` L25–L45）：新建第二个窗口，地址带 `#compact`，但应用不读取 hash。**已验证**：打开 `#compact` 显示的仍是完整仪表盘。
- **建议**：桌宠窗口做成独立入口（独立页面或路由），背景透明、无边框、置顶、可拖动，支持点击穿透（非角色区域）、托盘图标、记住位置和大小、DPI 适配。需要在 Windows 上实测。

### 3.4 图片尺寸
- **文件层**：23 张图全部是 800×1400 RGBA PNG，单张 0.7–1.6 MB；两份目录共约 48 MB。
- **形态之间不统一**：同一角色不同形态的主体高度占画布 73%–88%，顶部位置在 84–189 px 之间（例如 `deepseek_mature` 顶部 144 px，`claude_chibi` 顶部 168 px）。切换形态时人物会跳动、忽大忽小。
- **显示层**：主舞台内层写死 280×380（`LiveAnimeModel.jsx` L83–L84），`size` 参数只影响外层容器（L70）。Q 版固定为 230×230（`BongoPetLive.jsx` L252–L253）和 210×210（`BongoRealDesk.jsx` L130–L131），竖版画布靠 `objectFit: contain` 塞进方框。
- **素材残缺**：`deepseek_mature.png` 左缘有一个被截断的第二个人物（放大图已确认）。`qwen.png` 头发外轮廓有浅色毛边（抠图残留）。
- **建议**：统一归一化流水线：裁到主体包围盒 → 统一脚底和头顶锚点 → 统一缩放 → 导出带透明的 WebP → 每张图记录锚点 JSON。dist 不入库。

### 3.5 服装功能
- **现状**：每个角色有 2–3 套服装（`characters.js` 的 `outfits`，如 L21–L25），点击后只改按钮高亮，立绘不变。
- **已验证**：小寻（deepseek）切换到"深海研究水手服"，`<img>` 的 src 仍是 `deepseek.png`。
- **原因**：`selectedOutfit` 状态（`App.jsx` L69）只用于按钮样式（L1026–L1028），从未传给 `LiveAnimeModel`；项目里也没有任何服装图片。
- **建议**：服装是美术量最大的部分。先确定每个角色几套、是否只做演示套装，再决定做法：整套换图（需要重新生成或绘制），还是分层换装（需要分层素材，如 Live2D）。

### 3.6 角色年龄 / 形态（萝莉、少女、青年、Q 版）
- **现状**：UI 有 4 个按钮（`App.jsx` 约 L965–L971）。
- **资源缺 5 张**：`qwen_mature`、`kimi_loli`、`kimi_mature`、`grok_loli`、`grok_mature`。缺图时 `LiveAnimeModel` 的 `onError`（L100–L102）静默回退到 normal 图。**已验证**：kimi 选"萝莉"和"青年女性"，显示的都是 `kimi.png`，用户会以为按钮坏了。
- **风格不一致**：`qwen_loli.png` 与 `qwen.png` 的配色和造型差异很大（画面偏暗）。
- **桌宠窗口无效**：精简模式和浮层永远只用 chibi（`BongoRealDesk.jsx` L79），形态选择对桌宠窗口无效。
- **概念混乱**：Q 版是画风；萝莉、少女、青年是年龄感。两者应分开设计。
- **边界（需你确认，§6 Q3）**：我不会实现"萝莉"（儿童化外形）形态，也不会在任何角色上做身体部位的点击或抚摸反馈。原因是：把儿童化形象放进亲密的身体互动里，风险不可接受。建议：所有角色按成年人设定（人设里写明年龄），形态改为"青年 / 成熟 / 少女风（设定为成年）+ Q 版画风"。现有 `*_loli.png` 建议下线。

### 3.7 小锤子互动
- **现状**：点击"小锤子"后，立绘缩放并变暗，头顶出现一个 🔨 emoji 循环摆动 1.4 秒，然后冒星星。没有击打点、没有受力反馈，锤子是 emoji 而不是素材。
- **原因**：`LiveAnimeModel.jsx` L146–L162；`App.jsx` 中用一串 `setTimeout` 串联状态（约 L826–L848），没有统一的动画时间线。
- **建议**：用 SVG 或 PNG 锤子素材做"举起 → 落下 → 接触 → 回弹 → 晕眩"的时间线，接触瞬间让头部形变和音效同步，只作用于头部。

### 3.8 对话互动（台词）
- **现状**：台词来自 `characters.js` 的 `idle` / `feeding` / `petting` 列表，定时轮换。`low_tokens`、`overfed` 两类台词未使用（已 grep 确认）。
- **已验证**：精简模式下没有对话输入框（输入框数量为 0）。
- **显示问题**：离线回复和手动调用台词里带有 `<think>…</think>` 原文，直接显示在气泡里（`aiService.js` L101；`App.jsx` L310）。
- **建议**：台词由状态机按上下文选择，来源可以是真实 API，也可以是本地规则。推理模型的思维链要隐藏或折叠。

### 3.9 API 对话工作接口
- **无 Key 时**：回复是 4 句写死的台词（`aiService.js` L98–L103），不回答问题。**已验证**：输入"你好"，得到的是写死的"Token 储备非常充足…"。
- **有 Key 时**：deepseek、openai、qwen 的端点地址是对的（L35、L49–L53），但 qwen 请求体里的模型名不对（见 §4.1）。Claude、Gemini、Kimi、Grok 走的是 DeepSeek 的端点（§4.1）。请求失败后静默回退，只打印 `console.warn`（L92–L94）。
- **协议**：Claude 与 Gemini 的原生协议不是 OpenAI 格式。它们各自有原生接口，也有 OpenAI 兼容层，需要在适配层里选择。
- **Key 存储**：明文存在 `localStorage`（L9–L21）。网页直连第三方 API，有跨域和 Key 暴露问题。
- **Token 统计是估算**：`Math.max(fullText.length * 2, totalTokens)`（L90），没有使用接口返回的 `usage`。
- **缺少的基本能力**：没有对话历史、没有取消、没有超时；`onError` 从未被调用，错误不展示给用户。
- **推理模型**：DeepSeek 的推理模型把思维链放在 `delta.reasoning_content`，与正文分开（依据第三方文章中的官方示例）。当前代码只读 `delta.content`。
- **模型名**：DeepSeek 的 `deepseek-chat` / `deepseek-reasoner` 和 base_url `https://api.deepseek.com` 在 2025–2026 年的第三方文档中仍在使用（我没有直接打开官网核对，接入前请以官网为准）。其余模型名（Claude 3.7、GPT-4o、Gemini 1.5、Kimi k1.5、Grok 3、Qwen 2.5）是 2024–2025 年的版本，接入前需要按各家官网逐一核对（我没有逐一核实）。

---

## 4. 其他问题（按严重程度）

### 4.1 【P0 安全】非 DeepSeek 厂商的 Key 会被发送到 DeepSeek 域名
- **原因**：`aiService.js` L35 把默认端点设为 `https://api.deepseek.com/v1/chat/completions`，只有 `openai`（L49–L50）和 `qwen`（L51–L52）会改成各自的端点。其余厂商的 Key 会被当作 Bearer Token 发给 DeepSeek。
- **已验证**（用假 Key，请求被拦截并返回 401，没有真的发出去）：

| 角色 | 配置的 Key 所属厂商 | 实际请求发往 | 请求体中的模型 | 结论 |
|---|---|---|---|---|
| 克劳德 | claude | `api.deepseek.com` | `gpt-4o-mini` | **Key 外发到 DeepSeek** |
| 杰米妮 | gemini | `api.deepseek.com` | `gpt-4o-mini` | **Key 外发到 DeepSeek** |
| 月之小秘 | kimi | `api.deepseek.com` | `gpt-4o-mini` | **Key 外发到 DeepSeek** |
| 格洛克 | grok | `api.deepseek.com` | `gpt-4o-mini` | **Key 外发到 DeepSeek** |
| 通义小问 | qwen | `dashscope.aliyuncs.com` | `gpt-4o-mini` | 模型名不对，预计会失败 |
| 奥米妮 | openai | `api.openai.com` | `gpt-4o-mini` | 端点正确 |
| 小寻 | deepseek | `api.deepseek.com` | `deepseek-chat` | 正确 |

- **建议（热修，改动很小）**：每个 provider 只能发往自己的域名；未适配的厂商直接走离线模式并给出明确提示，不发任何请求。之后再做 §7 的适配层。

### 4.2 【P0】打包 exe 大概率白屏
- **原因 1**：`vite.config.js` 未设置 `base`，`dist/index.html` 引用的是 `/assets/...` 绝对路径。
- **原因 2**：立绘路径也是绝对的 `/characters/...`（`LiveAnimeModel.jsx` L56–L59 等）。
- **已验证**（Chromium 无头浏览器，用 file:// 打开）：
  - 原始 dist：`#root` 为空，JS 和 CSS 都 404。
  - 只改 `base: './'`：页面能渲染，但立绘 404（`naturalWidth` 为 0）。
  - 再把立绘路径改为相对路径：立绘正常加载（`naturalWidth` 为 800），无报错。（这一步是在 /tmp 的临时构建上做的，仓库里没有改动。）
- **仍需验证**：pywebview / WebView2 在 Windows 上的实际加载方式，需要在 Windows 上实测。

### 4.3 【P0】模拟数据冒充真实计量
- `isSimulatingStream` 默认开启（`App.jsx` L154），每 6 秒随机记一笔消耗并扣减余额（L177–L232），不管有没有调用 API。
- 投喂道具标了价格（$0.25 等），点击后直接加余额，没有扣款，也没有支付（`App.jsx` L267–L300；`characters.js` 的 `FOOD_ITEMS` L355–L361）。
- 预算上限和预警阈值只能编辑，没有任何触发逻辑（`budgetLimitUSD` / `quotaWarnPercent` 只出现在 L88–L148 和设置页中）。
- 页脚"WebSocket 监听活跃 / 延迟 42ms"（L1659–L1660）和标题"v2.5 Pro"（L431）都是写死的。
- 费用是输入、输出单价的简单平均（例如 deepseek 的 `avgPricePerToken` = (0.55 + 2.19) / 2 = 1.37 每百万 token），不是按实际输入、输出 token 计算。
- 所有状态刷新即丢失，没有持久化。

### 4.4 【P1】CI 不生效
- `ci-scripts/build-exe.yml` 不在 `.github/workflows/` 下，GitHub 不会执行。
- 打包脚本在 `app\dist\index.html` 存在时跳过前端构建（`build_windows_exe.bat` L31–L34）。当前入库的 dist 与源码一致，但以后很容易过期，而打包时不会发现。

### 4.5 【P1】文案与实现不符
- README 写的"真实 API 计量仪表盘""点击头部摸摸头""多窗口形态切换"，实际都不是真的（见 §3）。
- 页面里有大量"看起来像真的"的状态信息，都是假的（见 §4.3）。

### 4.6 【P2】C++ 原生版不能直接编译
- 缺 WebView2 SDK 和 WIL；CMake 未链接 WebView2Loader；`WS_OVERLAPPEDWINDOW`（L135）是普通窗口；`Navigate` 传的是 Windows 路径（L169），应为 file:/// URI（待实测）。
- 建议：暂时冻结，移入 `legacy/` 或删除（见 §6 Q1）。

### 4.7 【P2】脚本与编码
- `build_windows_exe.bat` 是 GBK 编码（CRLF）。不要用 UTF-8 工具直接保存覆盖。
- `build_windows_exe.ps1` 是无 BOM 的 UTF-8。Windows PowerShell 5.1 可能显示乱码，建议存为带 BOM 的 UTF-8。
- 两份打包脚本功能重复，保留一份即可。

### 4.8 【P2】没有测试
- 没有任何单元测试或端到端测试。建议至少补：适配层的 mock HTTP 测试、Playwright 冒烟测试、素材检查脚本。

---

## 5. 验证记录

环境：Linux 沙箱（没有 Windows，无法运行 pywebview 和 exe）。浏览器为无头 Chromium 131（来自 npm 包 `@sparticuz/chromium`），通过 `playwright-core` 驱动。开发服务器为 `vite`（端口 5173）。测试脚本保存在沙箱的 /tmp 下，没有入库。

| 测试 | 结果 |
|---|---|
| `npm ci` | 成功（23 个包） |
| `vite build` | 成功；产物与仓库 `dist/` 逐字节一致 |
| 形态回退（kimi 选"萝莉"、"青年女性"） | 两次都显示 `kimi.png`，即回退到 normal，无任何提示 |
| 服装切换（deepseek 选"深海研究水手服"） | 立绘不变，只有按钮高亮 |
| 点击主立绘 | 台词不变，无任何反应 |
| 点击"举手高兴" | class 为 `character-happy-jump`，`animationName` 为 `none`（无动画） |
| 点击"小锤子" | 出现 `.prop-hammer-swing`（emoji 🔨） |
| 精简模式 | 对话输入框数量为 0，桌宠组件存在 |
| 无 Key 对话（问"1+1 等于几"） | 显示写死的离线台词，未回答问题；无外部请求 |
| 假 Key 对话（7 个角色，拦截请求，返回 401） | 见 §4.1 |
| 打开 `#compact` | 显示完整仪表盘 |
| file:// 打开原始 dist | `#root` 为空，JS 和 CSS 404 |
| file:// 打开修复后的临时构建 | 页面渲染；立绘需要相对路径（见 §4.2） |
| 立绘素材检查（PIL） | 23 张均为 800×1400 RGBA；主体高度 73%–88%；缺 5 个形态；放大检查发现 `deepseek_mature` 残影 |

---

## 6. 需要你确认的问题

我的默认方案写在每题后面。你没有异议的话，我就按默认执行。

**Q0【紧急】API Key 外发问题（§4.1）**
- 默认：立即热修。每个厂商的 Key 只能发往自己的域名，未适配的厂商走离线提示。改动很小，但会改变行为，需要你同意后动手。

**Q1 产品形态**
- 默认：Windows 桌面软件（pywebview 打包 exe）为主；网页版保留作为开发预览；C++ 原生版冻结。

**Q2 动态立绘方案**
- A. 序列图：每个角色一组表情和动作图，用状态机切换。成本低，建议先做。
- B. Live2D 骨骼模型：效果最好，需要美术或购买模型。Live2D 的 SDK 出版许可门槛，在官方仓库的 LICENSE 中写为年营收 1000 万日元以上（以官网最新条款为准）。
- C. 保持现状（只有整体晃动）。
- 默认：A。

**Q3 年龄与触摸边界**
- 默认：全部角色按成年人设定；取消"萝莉"形态；触摸只保留头部和手掌轻抚；删除身体部位的点击区域（`LiveInteractiveAvatar` 中的身体点击）；现有 `*_loli.png` 下线。

**Q4 API 接入架构**
- A. Python 后端代理，Key 存入系统凭据库（Windows 凭据管理器），网页不接触 Key。推荐。
- B. 保留浏览器直连。快，但 Key 暴露在前端，还会遇到跨域问题。
- 默认：A。先接 DeepSeek 和 OpenAI 兼容类，再接 Claude 和 Gemini。

**Q5 数据的真实性**
- 默认：消耗统计只计算经由桌宠发出的请求，按接口返回的 usage 计算；余额由你手动设定；投喂道具改为"演示道具"，去掉价格标签，不加真实余额。

**Q6 好感度与消费的关系**
- 默认：解绑。好感度不与投喂、消费挂钩，避免诱导用户为了讨好角色而花钱。

**Q7 仓库与历史**
- 默认：不改动 `main`。请确认 `西游小说.zip` 的删除是否有意。仓库名由你决定（我无法改仓库名）。

**Q8 商用与品牌**
- 角色名与形象参考了 Claude、ChatGPT、DeepSeek、Gemini、Grok、Qwen、Kimi 等品牌，以及网络流行的同人设定。
- 默认：按个人使用处理。对外发布前，必须改为原创角色和中性命名。在你确认之前，我不会新增品牌相关的文案或素材。

**Q9 CI 与交付**
- 默认：把 CI 迁到 `.github/workflows/`，每次推送生成 exe 制品；`dist/` 不再入库，改为构建时生成。

**Q10 交互细节（请确认）**
- 手抚摸：手掌素材跟随鼠标，按住滑动 = 抚摸（头发轻晃、脸红、爱心），单击 = 摸头。
- 小锤子：点击按钮触发，有完整的举起、落下、接触、晕眩时间线，只作用于头部。
- 图片尺寸：你说的"图片尺寸"具体指什么？切换形态时跳动、太小、还是被裁切？截图最好。

---

## 7. 建议路线（确认后执行）

- **阶段 0｜止血与基础**：Q0 热修；`base` 与素材路径修复；CI 迁移；`dist/` 出库；删除死代码；假数据改为明确标注"演示"；README 更正。
- **阶段 1｜API 对话**：provider 适配层（OpenAI 兼容类、Anthropic、Gemini）；流式输出、取消、超时、错误展示；对话历史；按 usage 真实计量；Key 存入系统凭据库。
- **阶段 2｜桌宠窗口与交互**：pywebview 透明置顶窗口、托盘、记住位置；动作状态机；手抚摸、摸头、小锤子的完整时间线；全局键鼠计数（只计数，默认关闭）。
- **阶段 3｜素材与动画**：素材流水线（归一化、WebP、锚点、缺失检查、一致性检查）；按 Q2 选定的方案做动画；按 Q3 调整形态。
- **阶段 4｜发布**：测试（适配层 mock、Playwright 冒烟）、崩溃日志、自动更新、代码签名。

---

## 8. AI 桌宠还需要什么（我的建议，按优先级）

**P0：先让现有功能可信**
1. 真实对话与真实计量（按接口返回的 usage 统计，价格表注明日期）。
2. Key 安全存储与后端代理。
3. 打包可用（exe 实测）、CI 生效。
4. 诚实的状态：未标注"演示"的数据不要显示。

**P0：边界与合规**
5. 角色全部为成年人设定；不做儿童化形态；触摸只限头部和手掌。
6. 好感度与消费解绑。
7. 用户数据本地存储，可导出、可删除；全局输入只计数、不记录内容，默认关闭。

**P1：桌面感**
8. 真正的桌面窗口：透明、置顶、拖动、点击穿透、托盘、开机自启、记住位置、多屏与 DPI。
9. 快捷交互：拖文件或文本到桌宠上直接提问；全局快捷键呼出对话框；（可选）截屏提问。
10. 动作状态机：统一的状态源驱动所有动效；待机久了打瞌睡；时间问候。
11. 主动提醒：兑现现有的预算预警（目前是死配置）；余额不足时桌宠说话；久坐提醒。

**P2：陪伴质量**
12. 长期记忆（本地、可管理）；人设一致性（口吻规则）。
13. 语音：TTS 配合口型；STT 语音输入。
14. 更好的动画（Live2D，或完整的序列图）。
15. 测试、崩溃日志、自动更新、代码签名（降低 SmartScreen 拦截）。

---

## 附录 A：立绘素材清单（23 张，两份目录各一份）

尺寸均为 800×1400 RGBA PNG。"主体高/宽"是 alpha > 10 的包围盒占画布的比例；"顶部"是包围盒顶边的 y 坐标（像素）。

| 文件 | 大小（字节） | 主体高 | 主体宽 | 顶部 | 备注 |
|---|---:|---:|---:|---:|---|
| claude.png | 1,046,863 | 88% | 74% | 84 | |
| claude_chibi.png | 1,117,319 | 76% | 90% | 168 | |
| claude_loli.png | 937,384 | 88% | 90% | 85 | 萝莉，建议下线 |
| claude_mature.png | 707,507 | 87% | 90% | 88 | |
| deepseek.png | 964,312 | 88% | 86% | 84 | |
| deepseek_chibi.png | 1,053,092 | 88% | 57% | 84 | |
| deepseek_loli.png | 1,004,939 | 88% | 84% | 84 | 萝莉，建议下线 |
| deepseek_mature.png | 821,319 | 79% | 90% | 144 | **左缘有残影（第二个人物）** |
| gemini.png | 1,120,693 | 88% | 86% | 84 | |
| gemini_chibi.png | 943,685 | 88% | 51% | 84 | |
| gemini_loli.png | 1,105,194 | 88% | 83% | 84 | 萝莉，建议下线 |
| gemini_mature.png | 1,607,707 | 88% | 87% | 84 | 体积最大 |
| grok.png | 1,263,389 | 88% | 88% | 84 | |
| grok_chibi.png | 919,227 | 88% | 56% | 84 | |
| kimi.png | 879,690 | 88% | 74% | 84 | |
| kimi_chibi.png | 1,351,848 | 73% | 90% | 189 | 体积最大的 Q 版 |
| openai.png | 712,006 | 88% | 60% | 84 | |
| openai_chibi.png | 1,113,727 | 88% | 68% | 84 | |
| openai_loli.png | 1,147,276 | 88% | 89% | 84 | 萝莉，建议下线 |
| openai_mature.png | 992,957 | 88% | 86% | 84 | |
| qwen.png | 1,084,467 | 88% | 82% | 84 | 发丝边缘有浅色毛边 |
| qwen_chibi.png | 1,176,780 | 88% | 88% | 84 | |
| qwen_loli.png | 931,582 | 88% | 86% | 84 | 与主形象差异大，需重做 |

**缺失的形态（5 个）**：`qwen_mature`、`kimi_loli`、`kimi_mature`、`grok_loli`、`grok_mature`。

两份目录合计约 48 MB（每份约 24 MB）。

## 9. 热修与进展记录（2026-10-08）

**提交（分支 `arena/fd221e64-xiyouxiaoshuo`，全部为新提交，无 amend、无强推）**

- `fa181be` 热修（Q0）：默认关闭真实 API；限制可发送的端点（离线演示）。
- `62be423` 新增骨骼形变立绘（主舞台）：2D 骨骼 + 网格蒙皮、素材质检与清单工具。
- `a764f42` 边界与路径：删除萝莉形态与身体接触互动；build 使用相对路径（`base: './'`，修复 file:// 白屏）；`#compact` 桌宠窗口（透明背景，隐藏标题栏与底栏，窗口 380×500）。
- `cd601e8` 普通形态 7 张与小寻青年女性重新生成（绿幕抠图 + 质检）；删除质检不通过的旧青年女性图（claude / gemini / openai）；删除 5 张萝莉图。
- `b873045` 重新构建 dist。

**已验证（Chromium，file:// 打开 dist）**

- 无页面错误，无外部网络请求。
- 形态按钮只剩 少女 / 青年女性 / Q 版；页面中没有"萝莉""小锤子""猫爪手套""委屈哭泣""抚摸安慰""摸摸头"等文字。
- 青年女性：小寻可选；月之小秘禁用并显示"待生成"。切换角色时，未就绪的形态会回到少女形态，不再静默显示错图。
- `#compact`：背景透明；桌宠窗口完整显示；桌宠图加载正常。
- 骨骼立绘：7 个普通形态与小寻青年女性在主舞台正常渲染。待机、开心、思考三种姿态已截图检查，修复了三角形接缝与裙摆拉伸。无头浏览器（无 GPU）中约 43 fps，单帧绘制慢时自动降帧。
- 点击角色只触发整体反应（打招呼台词与跳跃），不区分身体部位。

**未完成（下一轮继续）**

1. 青年女性 6 张未生成（claude、openai、gemini、qwen、kimi、grok）。本轮生图次数已达上限（每轮 10 张），这些形态目前显示为"待生成"并禁用。
2. Q 版 7 张全部是旧图，其中 5 张质检不通过（claude、deepseek、gemini、grok、openai）。桌宠窗口仍使用旧 Q 版图，尚未接入骨骼（需要先建 Q 版骨骼模板）。
3. 服装：备选服装 8 套（deepseek 2、claude / openai / gemini / qwen / kimi / grok 各 1），本轮没有生成服装图。备选服装按钮禁用并标注"待生成"；默认服装可用。
4. 话题制造选项（聊天话题芯片）、资料储存区（localStorage）、API 工作区、模拟 Token 数据标注：未做。
5. Windows 打包 exe 未在 Windows 上测试。

**边界决定**

- 不做萝莉（儿童化）形态，不做任何身体部位的点击、摸头、摸脸、手抚摸或小锤子互动。形态为少女 / 青年女性 / Q 版，均按成年人设定。
- 死代码 `LiveInteractiveAvatar.jsx`（含"戳脸"热区）已删除。

**素材规范（新）**

- 生成图 → 纯绿（#00FF00）背景 → `tools/character_assets.py key` 抠图 → `build` 统一为 800×1400（主体高 1180，脚底基线 y=1300）→ `qc` 质检 → `manifest` 导出清单（包围盒 + 网格格子）。
- 只有 `app/src/rig/assetManifest.json` 中的素材才启用骨骼；界面只开放清单中存在的形态与服装，不静默回退。
- 旧的白色阈值脚本 `tools/generate_avatar_pipeline.sh` 不再用于新图。

**勘误**

- 备选服装是 8 套，不是 14 套（服装总数 15 套，其中 7 套为默认）。

**deepseek_mature 裙摆截断**

- 已用新生成的图替换，原图的左侧残影和裙摆硬切问题不再存在。

**下一步建议（按顺序）**

1. 生成青年女性 6 张和服装图，过质检后加入清单。
2. 重新生成 Q 版 7 张，通过质检后接入桌宠骨骼。
3. 话题芯片、资料储存区、API 工作区、模拟数据标注。
4. Windows 上打包测试 exe。

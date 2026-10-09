# 交接文件（HANDOVER）

> 目的：任何接续者（人或另一个代理）读完本文件即可原地继续，不需要猜测历史。
> 最后更新：2026-10-09。会话分支固定为 `arena/948f1ee6-xiyouxiaoshuo`（只提交/推送到它）。

## 0. 一句话现状
桌宠已完成：小寻 DeepSeek 四形态高清透明立绘、少女形态四层拆件 rig（眨眼/口型/刘海）、锤子与抚摸的真实鼠标工具交互、全项目去 Emoji、去预制台词；其余 6 角色 × 4 形态的重绘与拆件、实时语音、工作区分类等未完成。

## 1. 仓库与运行
- 前端：`app/`（Vite + React 19）。`cd app && npm ci && npm run build`；开发：`npm run dev -- --host 0.0.0.0 --port 5173`（vite.config 已含 allowedHosts: true 与 /api 代理到 127.0.0.1:8765）。
- 本机网关：`python local_api_server.py --host 127.0.0.1 --port 8765`（API 转发；前端只调同源 /api）。
- 测试：`cd app && npx vitest run --environment jsdom`（当前 8/8 通过，文件 `app/src/components/LiveAnimeModel.test.jsx`）。
- 图像管线依赖：`python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy`（.venv 已被快照忽略；不要提交）。

## 2. 用户硬性约束（违反即返工）
1. 项目内任何 UI/组件/文案/文档不得出现 Emoji；图形用高清图片或可缩放矢量资产。
2. 道具必须真实交互：选锤子后鼠标变锤子图像、点击立绘有锤击动画；抚摸为按住拖动反馈。不得用预制台词冒充互动。
3. 对话气泡只显示真实 API 回复或连接状态；互动只触发视觉/音效反馈。
4. 保留 7 角色 × 4 形态规划；服装由助手设计；不擅自改用户的程序想法、不偏离范围。
5. 不恢复独立 TTS；实时语音须先确认供应商有双向实时音频接口（电话模式、可打断、文字同步）。
6. API 代码不要无故重构；官方接口与本地 OpenAI-compatible 接口都要支持；数据存本机。
7. 汇报必须区分：已实现 / 自动测试 / 真实 API 测试 / 桌面实机测试；没测过的不得说完成。

## 3. 关键文件地图
- `app/src/components/LiveAnimeModel.jsx`：桌宠舞台（视线跟随、工具光标、锤击/抚摸反馈、rig 挂载点）。
- `app/src/components/LayeredPetRig.jsx` + `app/src/constants/petRig.js`：分层拆件渲染器与清单（z 序、mode: base/sway/blink/talk）。
- `app/src/components/BongoRealDesk.jsx` / `BongoPetLive.jsx`：精简窗与浮动小窗，复用同一舞台与工具坞。
- `app/src/App.jsx`：主界面；互动只改 mood/好感，气泡仅 API 状态；工具坞三按钮（观察/手抚摸/小锤子）。
- `app/src/constants/characters.js`：7 角色配置与 FOOD_ITEMS（image 字段指向 /items/*.svg）；dialogues 字段已删除。
- `app/src/styles/interactive.css`：舞台、工具坞、rig 动画等全部新增样式。
- 素材：`app/public/characters/deepseek_{live,loli_live,mature_live,chibi_live}.png`（真透明）；`app/public/characters/deepseek_layers/`（base_nobangs/bangs/eyelids/mouth_open）；`app/public/{tools,cursors,items}/*.svg`。
- 图像管线脚本：`tools/pet_image_pipeline.py`（去假棋盘 + 定向编辑差异切层 + 验证拼图）。
- 规划：`docs/PRODUCT_ROADMAP.md`（含拆件规范章节）。

## 4. 立绘/拆件生产流程（可复制）
1. `generate_image` 以现有立绘为参考生成同角色变体（全身、透明背景要求写进 prompt；产出常带假棋盘背景）。
2. 去棋盘：灰白低饱和连通域法（脚本内 `decheck`），border 连通 + 羽化去边。
3. 拆件：对同一底图做"仅改某部件"的定向编辑（闭眼/张嘴/去刘海并补图），脚本用差异掩膜+连通域+位置过滤切出部件层；base 层用编辑图回填被遮区域（补图/overpaint）。
4. 验证：脚本输出粉色底四帧拼图（常态/眨眼/说话/组合）人工目检；组件级 jsdom 测试断言层数、src、口型与眨眼驱动。
5. 接入：`petRig.js` 加清单条目；无清单的角色/形态自动回退单张立绘（onError 再回退基础图）。
- 已知坑：scipy `label` 返回 `(lab, n)`，别写反；生成图 color_type=2 无 alpha，棋盘是画进去的像素；编辑图可能与底图有轻微全局漂移，差异覆盖率 >25% 时放弃切层并如实汇报。

## 5. 已完成（含测试证据）
- 小寻四形态高清透明立绘（848×1264，程序去背景，目检干净）。
- 少女形态八层拆件 rig：眨眼、说话口型、虹膜真视线、眉毛情绪、左右侧发反相摆动、刘海摆动；验证拼图四帧无接缝；vitest 9/9。
- 锤子/抚摸真实鼠标工具（光标 SVG + 点击/拖动反馈 + 键盘可达）；工具坞与提示文案。
- 全项目去 Emoji（src 与 README 扫描为零）；食物/标题/切换栏改为 SVG 或 lucide 矢量。
- 预制台词清除：无闲置定时台词、无摸头/投喂台词；气泡仅 API 状态。
- 构建通过；dev 服务器资源 200；提交均在会话分支（最近：拆件 rig、路线图拆件章节、交接文件）。

## 6. 未完成 / 未实测（接续者从这里开始）
1. 拆件深化剩余：后发分段摆动、手臂（大臂/小臂/手掌）挥手与抓取层、腿/鞋、衣服与肉体分离、口腔细分（牙/舌）、眼睛高光独立层。
2. 其余 6 角色 × 4 形态重绘 + 拆件（流程同第 4 节；每批目检+测试+如实汇报）。
3. 实时双向语音（电话模式）：先确认供应商实时音频接口；单次转写不算。
4. Gemini 群聊真实接口复测（此前仅模拟）；桌面持久化需 Windows 实机重启验证。
5. 图像/视频/音乐/代码/综合工作区与按工作区配置模型；链接区仅保存打开、不做云同步（未确认是否要做同步）。
6. 真实浏览器人工验收（沙箱无浏览器）：锤子/抚摸手感、预览观感需用户确认。

## 7. 接续操作守则
- 只在 `arena/948f1ee6-xiyouxiaoshuo` 提交/推送；推送被拒先 `git pull --rebase`，冲突优先保留本会话改动（rebase 中为 `--theirs`）。
- 不 reset/覆盖工作区既有改动；大文件/venv 不进 Git。
- 长脚本先估计耗时：纯 Python 逐像素必超时，用 numpy/scipy；超过 2 分钟的命令拆小或后台。
- 每轮结束前：跑测试 + 构建 + 提交推送 + 按第 2.7 条格式汇报。

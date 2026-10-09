# 自检（Selftest）手册

三层自检，前两层可在无 GUI 的环境（CI/沙箱）跑，第三层需要真实操作系统。

## 1. Web 单元自检（vitest，22 项）

```
cd app && npx vitest run --environment jsdom
```

覆盖：工具交互、拆件层数/z 序、口型词节奏调度（词间闭口停顿、非机械循环、停说即闭）、
视线 rAF 缓动收敛、舞台几何（背景 1.62x 加高、角色锚底 0.9x 缩放、overflow 裁切）、小窗 resize 协议等。

## 2. 资产像素自检（眼睛零件）

```
python scripts/selfcheck_assets.py <原始base图.png> [层目录]
```

依赖 pillow/numpy/scipy（仅开发机）。检查：iris 层=原画虹膜逐像素拷贝；眼区外零改动；
改动仅限眼开口内（环外 0 改动）；150% 静止态边缘能量比 <1.10；alpha 全图一致；
视线极限偏移态（+5/+2、-5/-2、0/+3）不产生超原画 P99.5*1.25 的极端阶跃边（<=40px）。
眼形参数来源：坐标网格人工实测（左 193,97,11,4.0；右 233,96.5,10,4.5），不再估算。
当前实测：静止 ratio 1.001、偏移态 16/6/20 px → OK。

## 3. Qt 桌宠自检

纯逻辑层（不装 PySide6 也能跑）：

```
python desktop_pet_qt.py --selftest-logic
```

覆盖：优先级状态机（idle/sleep/tap/pat 的打断与过期）、空闲检测非 Win 回退、几何换算。实测 10/10 PASS。

GUI 层（需真实系统 + `pip install PySide6`，offscreen 平台自动启用）：

```
python desktop_pet_qt.py --selftest
```

覆盖：绘制路径、摸头分区（头=pat/身体=tap）、状态过期、滚轮缩放与窗口贴合、
90s 空闲进睡眠+绘制、全局键唤醒与 tap、鼠标穿透开关标志。

> 沙箱限制说明：Linux 沙箱无 libGL/libEGL/libxkbcommon/libdbus 系统库且无 root，
> PySide6 导入链断裂（空壳桩库遇 ld.so 版本符号断言），故 GUI 层自检仅在用户机器执行；
> 逻辑层与 Web 层自检已在沙箱实测通过。

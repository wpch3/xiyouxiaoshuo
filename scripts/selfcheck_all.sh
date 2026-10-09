#!/usr/bin/env bash
# 一键总自检：Web 单元 / 构建 / 资产像素 / Qt 逻辑层。全绿才允许提交。
set -e
cd "$(dirname "$0")/.."
echo "== 1/5 Web 单元自检 (vitest)"
(cd app && npx vitest run --environment jsdom 2>&1 | grep -E "Test Files|Tests ")
echo "== 2/5 生产构建"
(cd app && npm run build 2>&1 | tail -1)
echo "== 3/5 资产像素自检（眼睛零件）"
PY=python3
if ! $PY -c "import PIL, numpy, scipy" 2>/dev/null; then PY=/tmp/imgenv/bin/python; fi
$PY scripts/selfcheck_assets.py scripts/ref/orig_base_rig.png | tail -4
echo "== 4/5 Qt 桌宠逻辑层自检"
python3 desktop_pet_qt.py --selftest-logic | tail -1
echo "== 5/5 原生 C 桌宠纯逻辑自检 (native_pet_c)"
if command -v gcc >/dev/null 2>&1; then
  make -s -C native_pet_c test | tail -1
else
  echo "未检测到 gcc，跳过 C 桌宠自检"
fi
echo "== ALL SELFHECKS DONE"

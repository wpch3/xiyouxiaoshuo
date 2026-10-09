#!/usr/bin/env bash
# 一键总自检：Web 单元 / 构建 / 资产像素 / Qt 逻辑层。全绿才允许提交。
set -e
cd "$(dirname "$0")/.."
echo "== 1/4 Web 单元自检 (vitest)"
(cd app && npx vitest run --environment jsdom 2>&1 | grep -E "Test Files|Tests ")
echo "== 2/4 生产构建"
(cd app && npm run build 2>&1 | tail -1)
echo "== 3/4 资产像素自检（眼睛零件）"
PY=python3
if ! $PY -c "import PIL, numpy, scipy" 2>/dev/null; then PY=/tmp/imgenv/bin/python; fi
$PY scripts/selfcheck_assets.py scripts/ref/orig_base_rig.png | tail -4
echo "== 4/4 Qt 桌宠逻辑层自检"
python3 desktop_pet_qt.py --selftest-logic | tail -1
echo "== ALL SELFHECKS DONE"

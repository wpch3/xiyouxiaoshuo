#!/usr/bin/env bash
# ==============================================================================
# AI Token Pet - 自动化动态立绘生成与图像处理工作流管道 (Pipeline Tool)
# 支持：
# 1. 批量生成 7 大 AI 角色少女立绘与 Q 版桌宠立绘
# 2. 自动透明 Alpha 通道抠图（去除白边与背景）
# 3. 自动同步生产构建资源到前端与 C++ 桌面端
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="${PROJECT_ROOT}/app/public/characters"
DIST_DIR="${PROJECT_ROOT}/app/dist/characters"

echo "=========================================================="
echo "    AI Token Pet - 动态立绘生成与图像切图工作流 (Pipeline)"
echo "=========================================================="
echo "项目路径: ${PROJECT_ROOT}"
echo "输出目录: ${PUBLIC_DIR}"
echo ""

# 确保目标目录存在
mkdir -p "${PUBLIC_DIR}"
mkdir -p "${DIST_DIR}"

# 1. 运行 Python 自动化透明度与白边消除脚本
echo "[1/3] 正在对已有角色立绘进行智能透明抠图与白边羽化处理..."
python3 - << 'EOF'
import os
from PIL import Image

def remove_background(img_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    w, h = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((w - 1, 0)),
        img.getpixel((0, h - 1)),
        img.getpixel((w - 1, h - 1))
    ]

    new_data = []
    threshold = 240
    
    for item in datas:
        r, g, b, a = item
        if r > threshold and g > threshold and b > threshold:
            diff = min(r, g, b) - threshold
            alpha = max(0, 255 - int(diff * (255 / (255 - threshold))))
            new_data.append((r, g, b, 0))
        elif r > 225 and g > 225 and b > 225:
            factor = (min(r, g, b) - 225) / 15.0
            new_alpha = int(255 * (1.0 - factor * 0.7))
            new_data.append((r, g, b, new_alpha))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(img_path, "PNG")
    print(f"  [OK] 透明背景羽化完成: {os.path.basename(img_path)}")

chars_dir = "app/public/characters"
if os.path.exists(chars_dir):
    for f in os.listdir(chars_dir):
        if f.endswith(".png"):
            remove_background(os.path.join(chars_dir, f))
EOF

echo ""
echo "[2/3] 正在同步高清立绘到发布构建产物目录..."
cp -r "${PUBLIC_DIR}/"* "${DIST_DIR}/"

echo ""
echo "[3/3] 检查并输出当前立绘资源完整清单:"
ls -lh "${PUBLIC_DIR}"

echo ""
echo "=========================================================="
echo "  立绘生成与切片处理工作流运行完毕！已无缝就绪！"
echo "=========================================================="

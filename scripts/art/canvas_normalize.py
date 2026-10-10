#!/usr/bin/env python3
"""Place an RGBA/RGB image onto the unified canvas defined in config/art_canvas.json.

Usage: python3 scripts/art/canvas_normalize.py IN.png OUT.png [--dx 0 --dy 0]
Images are placed at their own pixel scale (no resampling) so existing alignment is preserved.
"""
import argparse
import json
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = os.path.join(HERE, "..", "..", "config", "art_canvas.json")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--dx", type=int, default=0)
    ap.add_argument("--dy", type=int, default=0)
    a = ap.parse_args()
    cfg = json.load(open(CFG, encoding="utf-8"))
    W, H = cfg["canvas"]["width"], cfg["canvas"]["height"]
    im = Image.open(a.src).convert("RGBA")
    if im.width > W or im.height > H:
        raise SystemExit(f"{a.src} is {im.size}, larger than canvas {W}x{H}")
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(im, (a.dx, a.dy))
    os.makedirs(os.path.dirname(os.path.abspath(a.dst)), exist_ok=True)
    canvas.save(a.dst)
    print(f"{a.dst}: {W}x{H}, placed {im.size} at ({a.dx},{a.dy})")


if __name__ == "__main__":
    main()

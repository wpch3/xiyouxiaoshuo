"""Place the open-mouth sprite onto the head test image at the base mouth anchor.
Clears the original mouth with diffusion fill, then alpha-composites the scaled sprite.
Run: python3 scripts/art/place_mouth.py [out.png]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = 'art/xiaoxun/head/head_test_front.png'
SPRITE = 'art/xiaoxun/head/mouth/mouth_open_single.png'
CX, CY = 440, 508          # mouth centre on base canvas
HW, HH = 38, 17            # clear-ellipse radii (old mouth)
TARGET_W = 64              # scaled sprite width

B = np.asarray(Image.open(BASE).convert('RGB')).astype(np.float32)
H, W = B.shape[:2]

def inpaint(img, hole, iters=60):
    known = (~hole).astype(np.float32); f = img.copy(); f[hole] = 0; w = known.copy()
    for _ in range(iters):
        num = np.stack([ndimage.gaussian_filter(f[..., c] * w, 2) for c in range(3)], -1)
        den = ndimage.gaussian_filter(w, 2)[..., None] + 1e-6
        f = np.where(hole[..., None], num / den, img)
        w = np.where(hole, np.clip(den[..., 0], 0, 1), known)
    return f

yy, xx = np.mgrid[0:H, 0:W]
hole = ((xx - CX) / HW) ** 2 + ((yy - CY) / HH) ** 2 <= 1
filled = inpaint(B, hole)
hs = ndimage.gaussian_filter(hole.astype(np.float32), 2)[..., None]
out = filled * hs + B * (1 - hs)

S = Image.open(SPRITE).convert('RGB')
A = np.asarray(S).astype(np.float32)
m = ndimage.binary_fill_holes(A.max(axis=2) > 30)
ys, xs = np.where(m)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
crop = S.crop((x0, y0, x1 + 1, y1 + 1))
cm = Image.fromarray((m[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8))
th = round(TARGET_W * (y1 - y0 + 1) / (x1 - x0 + 1))
crop = crop.resize((TARGET_W, th), Image.LANCZOS)
cm = cm.resize((TARGET_W, th), Image.LANCZOS)
a = ndimage.gaussian_filter(np.asarray(cm).astype(np.float32) / 255.0, 0.6)
px0, py0 = CX - TARGET_W // 2, CY - th // 2
reg = out[py0:py0 + th, px0:px0 + TARGET_W]
out[py0:py0 + th, px0:px0 + TARGET_W] = reg * (1 - a[..., None]) + np.asarray(crop).astype(np.float32) * a[..., None]

dst = sys.argv[1] if len(sys.argv) > 1 else 'art/xiaoxun/head/mouth/head_open_mouth_try.png'
out8 = np.clip(out, 0, 255).astype(np.uint8)
Image.fromarray(out8).save(dst)
Image.fromarray(out8).crop((330, 380, 550, 580)).resize((660, 600)).save('/tmp/mouth_crop.png')
print('ok', dst)

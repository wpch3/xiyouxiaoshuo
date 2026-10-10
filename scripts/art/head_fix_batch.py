"""Batch fix for head test: mouth-corner residue, eye halos, closed-eye smudges.
Composes: base head -> wider diffusion clear around open eyes/mouth -> closed-eye layer (optional) -> open mouth sprite.
Output: art/xiaoxun/head/composite/head_batch_v2.png (+ crop preview).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

H0 = 'art/xiaoxun/head/head_test_front.png'
OUT = 'art/xiaoxun/head/composite/head_batch_v2.png'
B = np.asarray(Image.open(H0).convert('RGB')).astype(np.float32)
H, W = B.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]

def inpaint(img, hole, iters=80):
    known = (~hole).astype(np.float32); f = img.copy(); f[hole] = 0; w = known.copy()
    for _ in range(iters):
        num = np.stack([ndimage.gaussian_filter(f[..., c] * w, 3) for c in range(3)], -1)
        den = ndimage.gaussian_filter(w, 3)[..., None] + 1e-6
        f = np.where(hole[..., None], num / den, img)
        w = np.where(hole, np.clip(den[..., 0], 0, 1), known)
    return f

def ell(cx, cy, rx, ry):
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1

# 1) one wide clear mask: both eyes (generous) + mouth (wider than before)
hole = ell(344, 402, 46, 24) | ell(536, 402, 46, 24) | ell(440, 508, 50, 22)
filled = inpaint(B, hole)
hs = ndimage.gaussian_filter(hole.astype(np.float32), 3)[..., None]
out = filled * hs + B * (1 - hs)

# 2) closed-eye layer (aligned RGBA) over the eye zone only
L = np.asarray(Image.open('art/xiaoxun/head/parts/eyes_closed_tight.png').convert('RGBA')).astype(np.float32)
a = L[..., 3:4] / 255.0
eye_zone = (ell(344, 402, 46, 24) | ell(536, 402, 46, 24))[..., None]
out = np.where(eye_zone, out * (1 - a) + L[..., :3] * a, out)

# 3) open-mouth sprite at mouth anchor
S = Image.open('art/xiaoxun/head/mouth/mouth_open_single.png').convert('RGB')
A = np.asarray(S).astype(np.float32)
m = ndimage.binary_fill_holes(A.max(axis=2) > 30)
ys, xs = np.where(m); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
TW = 64; th = round(TW * (y1 - y0 + 1) / (x1 - x0 + 1))
crop = S.crop((x0, y0, x1 + 1, y1 + 1)).resize((TW, th), Image.LANCZOS)
cm = Image.fromarray((m[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8)).resize((TW, th), Image.LANCZOS)
am = ndimage.gaussian_filter(np.asarray(cm).astype(np.float32) / 255.0, 0.6)
px, py = 440 - TW // 2, 508 - th // 2
reg = out[py:py + th, px:px + TW]
out[py:py + th, px:px + TW] = reg * (1 - am[..., None]) + np.asarray(crop).astype(np.float32) * am[..., None]

o8 = np.clip(out, 0, 255).astype(np.uint8)
Image.fromarray(o8).save(OUT)
Image.fromarray(o8).crop((240, 300, 640, 560)).resize((800, 520)).save('/tmp/batch_crop.png')
print('ok', OUT)

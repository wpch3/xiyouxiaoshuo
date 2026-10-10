"""Export full-canvas (880x1408) transparent RGBA layers for the xiaoxun girl form.
Layers are written to assets/xiaoxun/layers/<name>.png in draw order (z ascending).
The body base is the blank-face full-body canvas; facial parts are placed at mapped anchors.
Dev-time asset tool only (not part of the desktop pet runtime).
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

CW, CH = 880, 1408
OUT = 'assets/xiaoxun/layers'
BODY = 'art/xiaoxun/body/v1/body_canvas_880x1408.png'
P = 'art/xiaoxun/head/v2/parts/'
EYE_OPEN = 'art/xiaoxun/head/eyes/eye_open_single.png'
EYE_CLOSED = P + 'eye_closed_single_v2.png'
BROW = P + 'brow_single.png'
MOUTH_CLOSED = P + 'mouth_closed_single.png'
MOUTH_OPEN = 'art/xiaoxun/head/mouth/mouth_open_single.png'
S, TX, TY = 0.345, 268.6 + 16, 57.6 + 72

def T(x, y):
    return int(round(x * S + TX)), int(round(y * S + TY))

def sprite_on_canvas(path, width, cx, cy, flip=False, thresh=20):
    Sx = Image.open(path).convert('RGB')
    A = np.asarray(Sx).astype(np.float32)
    m = ndimage.binary_fill_holes(A.max(axis=2) > thresh)
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    crop = Sx.crop((x0, y0, x1 + 1, y1 + 1))
    cm = Image.fromarray((m[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8))
    h = max(1, round(width * (y1 - y0 + 1) / (x1 - x0 + 1)))
    crop = crop.resize((width, h), Image.LANCZOS)
    cm = cm.resize((width, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
    if flip:
        crop = crop.transpose(Image.FLIP_LEFT_RIGHT); cm = cm.transpose(Image.FLIP_LEFT_RIGHT)
    rgba = crop.convert('RGBA'); rgba.putalpha(cm)
    L = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    L.paste(rgba, (cx - width // 2, cy - h // 2), rgba)
    return L

def main():
    os.makedirs(OUT, exist_ok=True)
    layers = []
    layers.append(('body_base', Image.open(BODY).convert('RGBA')))
    specs = [
        ('brow_l', BROW, 70, T(360, 384), False, 20),
        ('brow_r', BROW, 70, T(532, 384), True, 20),
        ('eye_closed_l', EYE_CLOSED, 66, T(360, 410), False, 12),
        ('eye_closed_r', EYE_CLOSED, 66, T(532, 410), True, 12),
        ('eye_open_l', EYE_OPEN, 66, T(360, 410), False, 20),
        ('eye_open_r', EYE_OPEN, 66, T(532, 410), True, 20),
        ('mouth_closed', MOUTH_CLOSED, 64, T(446, 520), False, 20),
        ('mouth_open', MOUTH_OPEN, 64, T(446, 520), False, 20),
    ]
    for name, path, w, (cx, cy), flip, th in specs:
        layers.append((name, sprite_on_canvas(path, max(6, round(w * S)), cx, cy, flip, th)))
    for name, im in layers:
        im.save(f'{OUT}/{name}.png')
        print(name, im.size)

if __name__ == '__main__':
    main()

"""Compose head states on the clean blank-face base (v2).
States: neutral (eyes open, closed smile), blink (eyes closed), talk (eyes open, mouth open).
Each part is a single sprite on black; placed at fixed anchors, scaled to target widths.
Output: art/xiaoxun/head/v2/states/{neutral,blink,talk}.png and states_sheet.png
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

BASE = 'art/xiaoxun/head/v2/head_blank_face.png'
P = 'art/xiaoxun/head/v2/parts/'
EYE_OPEN = 'art/xiaoxun/head/eyes/eye_open_single.png'
EYE_CLOSED = P + 'eye_closed_single_v2.png'
BROW = P + 'brow_single.png'
MOUTH_CLOSED = P + 'mouth_closed_single.png'
MOUTH_OPEN = 'art/xiaoxun/head/mouth/mouth_open_single.png'
OUT = 'art/xiaoxun/head/v2/states'
base = Image.open(BASE).convert('RGBA')

def layer(path, width, cx, cy, flip=False, thresh=20):
    S = Image.open(path).convert('RGB')
    A = np.asarray(S).astype(np.float32)
    m = ndimage.binary_fill_holes(A.max(axis=2) > thresh)
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    crop = S.crop((x0, y0, x1 + 1, y1 + 1))
    cm = Image.fromarray((m[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8))
    h = round(width * (y1 - y0 + 1) / (x1 - x0 + 1))
    crop = crop.resize((width, h), Image.LANCZOS)
    cm = cm.resize((width, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    if flip:
        crop = crop.transpose(Image.FLIP_LEFT_RIGHT); cm = cm.transpose(Image.FLIP_LEFT_RIGHT)
    rgba = crop.convert('RGBA'); rgba.putalpha(cm)
    L = Image.new('RGBA', base.size, (0, 0, 0, 0))
    L.paste(rgba, (cx - width // 2, cy - h // 2), rgba)
    return L

EYE_L, EYE_R = (360, 410), (532, 410)
BROW_L, BROW_R = (360, 384), (532, 384)
MOUTH = (446, 520)

def build(eyes_closed, mouth_open, name):
    img = base.copy()
    for (x, y), flip in [(BROW_L, False), (BROW_R, True)]:
        img.alpha_composite(layer(BROW, 70, x, y, flip))
    eye_src = EYE_CLOSED if eyes_closed else EYE_OPEN
    for (x, y), flip in [(EYE_L, False), (EYE_R, True)]:
        img.alpha_composite(layer(eye_src, 66, x, y, flip, thresh=12 if eyes_closed else 20))
    mouth_src = MOUTH_OPEN if mouth_open else MOUTH_CLOSED
    img.alpha_composite(layer(mouth_src, 64, *MOUTH))
    os.makedirs(OUT, exist_ok=True)
    img.save(f'{OUT}/{name}.png')
    return img

neutral = build(False, False, 'neutral')
blink = build(True, False, 'blink')
talk = build(False, True, 'talk')
sheet = Image.new('RGB', (892 * 3 // 2, 1200 // 2), (255, 255, 255))
for i, im in enumerate([neutral, blink, talk]):
    sheet.paste(im.convert('RGB').resize((446, 600)), (i * 446, 0))
sheet.save(f'{OUT}/states_sheet.png')
print('ok', OUT)

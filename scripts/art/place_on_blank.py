"""Place open-eye (both) and open-mouth sprites onto the clean blank-face head.
Anchors are estimated from the blank head: eyes at y~410, x 360 / 532; mouth at (446, 520).
Output: art/xiaoxun/head/v2/head_eyes_mouth_test.png
"""
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = 'art/xiaoxun/head/v2/head_blank_face.png'
EYE = 'art/xiaoxun/head/eyes/eye_open_single.png'
MOUTH = 'art/xiaoxun/head/mouth/mouth_open_single.png'
OUT = 'art/xiaoxun/head/v2/head_eyes_mouth_test.png'

base = Image.open(BASE).convert('RGBA')

def sprite_layer(path, target_w, cx, cy, flip=False):
    S = Image.open(path).convert('RGB')
    A = np.asarray(S).astype(np.float32)
    m = ndimage.binary_fill_holes(A.max(axis=2) > 30)
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    crop = S.crop((x0, y0, x1 + 1, y1 + 1))
    cm = Image.fromarray((m[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8))
    h = round(target_w * (y1 - y0 + 1) / (x1 - x0 + 1))
    crop = crop.resize((target_w, h), Image.LANCZOS)
    cm = cm.resize((target_w, h), Image.LANCZOS)
    if flip:
        crop = crop.transpose(Image.FLIP_LEFT_RIGHT); cm = cm.transpose(Image.FLIP_LEFT_RIGHT)
    rgba = crop.convert('RGBA')
    rgba.putalpha(cm.filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(0.6)))
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    layer.paste(rgba, (cx - target_w // 2, cy - h // 2), rgba)
    return layer

out = base.copy()
out.alpha_composite(sprite_layer(EYE, 66, 360, 410, False))
out.alpha_composite(sprite_layer(EYE, 66, 532, 410, True))
out.alpha_composite(sprite_layer(MOUTH, 64, 446, 520, False))
out.save(OUT)
out.convert('RGB').crop((260, 330, 620, 580)).resize((720, 500), Image.LANCZOS).save('/tmp/blank_eyes_check.png')
print('ok', base.size)

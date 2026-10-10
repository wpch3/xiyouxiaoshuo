"""Place facial states (eyes, brows, mouth) onto the full-body blank-face image.
Mapping from head-v2 space to body space: scale S, translation (TX, TY), derived from face
top/centre measurements (head face 375..592 / x-centre 459; body face 187..262 / x-centre 427).
Output: art/xiaoxun/body/v1/states/{neutral,blink,talk}.png + sheet.
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

BODY = 'art/xiaoxun/body/v1/body_blank_face_fullbody.png'
P = 'art/xiaoxun/head/v2/parts/'
EYE_OPEN = 'art/xiaoxun/head/eyes/eye_open_single.png'
EYE_CLOSED = P + 'eye_closed_single_v2.png'
BROW = P + 'brow_single.png'
MOUTH_CLOSED = P + 'mouth_closed_single.png'
MOUTH_OPEN = 'art/xiaoxun/head/mouth/mouth_open_single.png'
OUT = 'art/xiaoxun/body/v1/states'
S, TX, TY = 0.345, 268.6, 57.6

base = Image.open(BODY).convert('RGBA')

def T(x, y):
    return int(round(x * S + TX)), int(round(y * S + TY))

def layer(path, width, cx, cy, flip=False, thresh=20):
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
    L = Image.new('RGBA', base.size, (0, 0, 0, 0))
    L.paste(rgba, (cx - width // 2, cy - h // 2), rgba)
    return L

def build(eyes_closed, mouth_open, name):
    img = base.copy()
    for (x, y), flip in [(T(360, 384), False), (T(532, 384), True)]:
        img.alpha_composite(layer(BROW, max(6, round(70 * S)), x, y, flip))
    src = EYE_CLOSED if eyes_closed else EYE_OPEN
    for (x, y), flip in [(T(360, 410), False), (T(532, 410), True)]:
        img.alpha_composite(layer(src, max(6, round(66 * S)), x, y, flip, thresh=12 if eyes_closed else 20))
    msrc = MOUTH_OPEN if mouth_open else MOUTH_CLOSED
    img.alpha_composite(layer(msrc, max(6, round(64 * S)), *T(446, 520)))
    os.makedirs(OUT, exist_ok=True)
    img.save(f'{OUT}/{name}.png')
    return img

ims = [build(False, False, 'neutral'), build(True, False, 'blink'), build(False, True, 'talk')]
sheet = Image.new('RGB', (848 * 3 // 3 * 3 // 3, 1264), (255, 255, 255))
sheet = Image.new('RGB', (848 * 3, 1264), (255, 255, 255))
for i, im in enumerate(ims):
    sheet.paste(im.convert('RGB'), (i * 848, 0))
sheet.resize((848 * 3 // 2, 1264 // 2)).save(f'{OUT}/sheet.png')
ims[0].convert('RGB').crop((330, 120, 520, 280)).resize((760, 640), Image.LANCZOS).save('/tmp/body_face_check.png')
print('ok')

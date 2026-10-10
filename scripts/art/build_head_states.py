"""Build head states on the clean blank-face base (head_blank_face.png, 892x1200).
Outputs:
  art/xiaoxun/head/v2/head_state_open.png   brows + open eyes + open mouth
  art/xiaoxun/head/v2/head_state_closed.png brows + closed eyes + open mouth
  art/xiaoxun/head/v2/head_states_compare.png  side by side preview
Anchors (estimated on the blank base): eye centres (360,410)/(532,410), brow y 388, mouth (446,520).
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

BASE = 'art/xiaoxun/head/v2/head_blank_face.png'
EYE_OPEN = 'art/xiaoxun/head/eyes/eye_open_single.png'
EYE_CLOSED = 'art/xiaoxun/head/eyes/eye_closed_lashes_single.png'
BROW = 'art/xiaoxun/head/eyes/brow_single.png'
MOUTH = 'art/xiaoxun/head/mouth/mouth_open_single.png'
V2 = 'art/xiaoxun/head/v2/'

base = Image.open(BASE).convert('RGBA')

def layer(path, target_w, cx, cy, flip=False, thresh=30):
    S = Image.open(path).convert('RGB')
    A = np.asarray(S).astype(np.float32)
    m = ndimage.binary_fill_holes(A.max(axis=2) > thresh)
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    crop = S.crop((x0, y0, x1 + 1, y1 + 1))
    cm = Image.fromarray((m[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8))
    h = max(1, round(target_w * (y1 - y0 + 1) / (x1 - x0 + 1)))
    crop = crop.resize((target_w, h), Image.LANCZOS)
    cm = cm.resize((target_w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    if flip:
        crop = crop.transpose(Image.FLIP_LEFT_RIGHT); cm = cm.transpose(Image.FLIP_LEFT_RIGHT)
    rgba = crop.convert('RGBA'); rgba.putalpha(cm)
    L = Image.new('RGBA', base.size, (0, 0, 0, 0))
    L.paste(rgba, (cx - target_w // 2, cy - h // 2), rgba)
    return L

brows = [layer(BROW, 74, 360, 388), layer(BROW, 74, 532, 388, flip=True)]
mouth = layer(MOUTH, 64, 446, 520)

def compose(eye_path, name):
    out = base.copy()
    for b in brows:
        out.alpha_composite(b)
    out.alpha_composite(layer(eye_path, 66, 360, 410))
    out.alpha_composite(layer(eye_path, 66, 532, 410, flip=True))
    out.alpha_composite(mouth)
    out.save(V2 + name)
    return out

o = compose(EYE_OPEN, 'head_state_open.png')
c = compose(EYE_CLOSED, 'head_state_closed.png')
cmp_ = Image.new('RGB', (360 * 2 + 20, 250), (255, 255, 255))
for i, im in enumerate([o, c]):
    cmp_.paste(im.convert('RGB').crop((260, 330, 620, 580)), (i * 380, 0))
cmp_.save(V2 + 'head_states_compare.png')
print('ok')

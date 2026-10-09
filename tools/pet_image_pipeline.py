"""桌宠立绘图像管线：去假棋盘背景 + 定向编辑差异切层。

用法（在仓库根目录）：
  python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy
  .venv/bin/python tools/pet_image_pipeline.py            # 从 /home/user/tmp_edits 的三张定向编辑图切层
依赖：pillow / numpy / scipy。输入：app/public/characters/deepseek_live.png 与
/home/user/tmp_edits/deepseek_{eyes_closed,mouth_open,no_bangs}.png（由 generate_image 定向编辑产出）。
输出：app/public/characters/deepseek_layers/{base_nobangs,bangs,eyelids,mouth_open}.png 与验证拼图 /home/user/rig_check.png。
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import label, gaussian_filter
import os

BASE = 'app/public/characters/deepseek_live.png'
OUT = 'app/public/characters/deepseek_layers'

def decheck(path):
    im = Image.open(path)
    if im.mode == 'RGBA':
        a = np.asarray(im)
        if (a[...,3]==0).sum() > 1000:
            return im.convert('RGBA')
    im = im.convert('RGB')
    a = np.asarray(im, dtype=np.int16)
    h, w, _ = a.shape
    mx = a.max(axis=2); mn = a.min(axis=2)
    mask = ((mx-mn) <= 18) & (mn >= 150)
    lab, n = label(mask, structure=np.ones((3,3), int))
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
    reached = np.isin(lab, list(edge))
    near = ((mx-mn) <= 42) & (mn >= 118)
    pad = np.zeros_like(reached)
    pad[1:,:] |= reached[:-1,:]; pad[:-1,:] |= reached[1:,:]
    pad[:,1:] |= reached[:,:-1]; pad[:,:-1] |= reached[:,1:]
    alpha = np.where(reached | (near & pad & ~reached), 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([np.asarray(im, dtype=np.uint8), alpha]), 'RGBA')

base = Image.open(BASE).convert('RGBA')
W, H = base.size
b = np.asarray(base)
brgb = b[...,:3].astype(np.int16); balpha = b[...,3]

def comps(diff, min_size):
    lab, n = label(diff, structure=np.ones((3,3), int))
    out = []
    for i in range(1, n+1):
        ys, xs = np.where(lab == i)
        if len(ys) < min_size: continue
        out.append((i, len(ys), ys.mean()/H, xs.mean()/W, ys.min(), ys.max(), xs.min(), xs.max()))
    return out, lab

def feather(mask, sigma=1.4):
    return np.clip(gaussian_filter(mask.astype(np.float32), sigma), 0, 1)

results = {}
for key, path in [('closed','/home/user/tmp_edits/deepseek_eyes_closed.png'),
                  ('mouth','/home/user/tmp_edits/deepseek_mouth_open.png'),
                  ('nobangs','/home/user/tmp_edits/deepseek_no_bangs.png')]:
    ed = decheck(path)
    if ed.size != (W, H):
        ed = ed.resize((W, H), Image.LANCZOS)
    e = np.asarray(ed)
    ergb = e[...,:3].astype(np.int16); ealpha = e[...,3]
    valid = (balpha > 200) & (ealpha > 200)
    diff = (np.abs(brgb - ergb).sum(axis=2) > 70) & valid
    cov = diff.sum() / max((balpha > 200).sum(), 1)
    cs, lab = comps(diff, 150)
    results[key] = (ed, e, diff, cs, cov)
    print(key, 'size', ed.size, 'diff coverage %.3f' % cov, 'components', len(cs))
    for c in sorted(cs, key=lambda c: -c[1])[:8]:
        print('   comp size %d cy %.2f cx %.2f box y %d-%d x %d-%d' % (c[1], c[2], c[3], c[4], c[5], c[6], c[7]))

closed_ed, closed_e, closed_diff, closed_cs, closed_cov = results['closed']
mouth_ed, mouth_e, mouth_diff, mouth_cs, mouth_cov = results['mouth']
nob_ed, nob_e, nob_diff, nob_cs, nob_cov = results['nobangs']

def union_mask(cs, lab, pick):
    m = np.zeros((H, W), bool)
    for c in cs:
        if pick(c):
            m |= (lab == c[0])
    return m

# eyes: components in upper face band
clab, _ = label(closed_diff, structure=np.ones((3,3), int))
eye_mask = union_mask(closed_cs, clab, lambda c: 0.08 < c[2] < 0.30 and 0.25 < c[3] < 0.75 and c[1] > 200)
# mouth: component below eyes, centered
mlab, _ = label(mouth_diff, structure=np.ones((3,3), int))
mouth_mask = union_mask(mouth_cs, mlab, lambda c: 0.17 < c[2] < 0.36 and 0.38 < c[3] < 0.62 and c[1] > 150)
# bangs: large upper components
nlab, _ = label(nob_diff, structure=np.ones((3,3), int))
bangs_mask = union_mask(nob_cs, nlab, lambda c: c[2] < 0.32 and c[1] > 1500)

print('eye px', int(eye_mask.sum()), 'mouth px', int(mouth_mask.sum()), 'bangs px', int(bangs_mask.sum()))
assert eye_mask.sum() > 500 and mouth_mask.sum() > 200 and bangs_mask.sum() > 3000, 'layer masks too small, edit drift too large'

eyelids = np.dstack([closed_e[...,:3], (feather(eye_mask)*255).astype(np.uint8)])
mouthopen = np.dstack([mouth_e[...,:3], (feather(mouth_mask)*255).astype(np.uint8)])
fb = feather(bangs_mask, 1.8)[..., None]
bangs_rgb = b[...,:3]
bangs = np.dstack([bangs_rgb, (fb[...,0] * (balpha/255.0) * 255).astype(np.uint8)])
nob_rgb = nob_e[...,:3]
base_nb_rgb = (brgb * (1-fb) + nob_rgb * fb).clip(0,255).astype(np.uint8)
base_nb_alpha = np.maximum(balpha, (nob_e[...,3] * fb[...,0]).astype(np.uint8))
base_nb = np.dstack([base_nb_rgb, base_nb_alpha])

Image.fromarray(base_nb, 'RGBA').save(f'{OUT}/base_nobangs.png', optimize=True)
Image.fromarray(bangs, 'RGBA').save(f'{OUT}/bangs.png', optimize=True)
Image.fromarray(eyelids, 'RGBA').save(f'{OUT}/eyelids.png', optimize=True)
Image.fromarray(mouthopen, 'RGBA').save(f'{OUT}/mouth_open.png', optimize=True)
print('layers saved')

# verification montage: reassembled / blink / talk / blink+talk
stack = [Image.fromarray(base_nb,'RGBA'), Image.fromarray(mouthopen,'RGBA'), Image.fromarray(eyelids,'RGBA'), Image.fromarray(bangs,'RGBA')]
def compose(use_mouth, use_eyes):
    canvas = Image.new('RGBA', (W,H), (255,214,232,255))
    canvas.alpha_composite(stack[0])
    if use_mouth: canvas.alpha_composite(stack[1])
    if use_eyes: canvas.alpha_composite(stack[2])
    canvas.alpha_composite(stack[3])
    return canvas.resize((W//3, H//3))
frames = [compose(False,False), compose(False,True), compose(True,False), compose(True,True)]
mont = Image.new('RGB', (sum(f.width for f in frames)+50, frames[0].height), (40,44,60))
x=10
for f in frames:
    mont.paste(f,(x,0)); x+=f.width+10
mont.save('/home/user/rig_check.png')
print('montage saved')

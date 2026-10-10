"""Export the xiaoxun layer set v2 (dev-time asset tool, not part of the pet runtime).
Fixes vs v1:
 - background removed: near-black pixels connected to the canvas border become transparent
   (interior dark lines are kept); the source art was generated on pure black.
 - layers stored at half resolution 440x704 (rig space) to cut per-frame draw cost.
 - iris split from the open eye: eye_white_* (static) and iris_* (gaze-driven).
Output: assets/xiaoxun/layers/<name>.png, all 440x704 RGBA.
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

CW, CH = 880, 1408            # source canvas
RW, RH = 440, 704             # rig space (half)
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

def key_background(img, thresh=28):
    """Make the near-black background transparent (flood from border only)."""
    rgba = np.asarray(img.convert('RGBA')).astype(np.float32)
    dark = rgba[..., :3].max(axis=2) < thresh
    lab, n = ndimage.label(dark)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    bg = np.isin(lab, list(border))
    alpha = rgba[..., 3].copy()
    alpha[bg] = 0
    rgba[..., 3] = alpha
    return Image.fromarray(rgba.astype(np.uint8), 'RGBA')

def sprite_mask_layer(path, width, cx, cy, flip=False, thresh=20):
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
    return rgba, (cx - width // 2, cy - h // 2)

def on_canvas(rgba, xy, size):
    L = Image.new('RGBA', size, (0, 0, 0, 0))
    L.paste(rgba, xy, rgba)
    return L

def eye_split(rgba):
    """Split a full-size open-eye layer into (white, iris) using blue-ness inside the eye."""
    a = np.asarray(rgba).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    blue = (b > r + 25) & (al > 60)
    blue = ndimage.binary_closing(blue, iterations=2)
    lab, n = ndimage.label(blue)
    if n == 0:
        return rgba, Image.new('RGBA', rgba.size, (0, 0, 0, 0))
    sizes = ndimage.sum(blue, lab, range(1, n + 1))
    iris = lab == (int(np.argmax(sizes)) + 1)
    iris = ndimage.binary_fill_holes(iris)
    iris = ndimage.binary_dilation(iris, iterations=1) & (al > 0)
    iris_img = a.copy(); iris_img[..., 3] = np.where(iris, al, 0)
    white_img = a.copy(); white_img[..., 3] = np.where(iris, 0, al)
    return (Image.fromarray(white_img.astype(np.uint8), 'RGBA'),
            Image.fromarray(iris_img.astype(np.uint8), 'RGBA'))

def half(img):
    """Resize RGBA to rig space with premultiplied filtering (no dark fringes)."""
    return img.convert('RGBa').resize((RW, RH), Image.LANCZOS).convert('RGBA')

def main():
    os.makedirs(OUT, exist_ok=True)
    out = {}
    body = key_background(Image.open(BODY))
    out['body_base'] = body
    # eyes: source is 880x1408 canvas; split full-size first, then halve
    eye_l_src, eye_l_xy = sprite_mask_layer(EYE_OPEN, max(6, round(66 * S)), *T(360, 410), False, 20)
    eye_r_src, eye_r_xy = sprite_mask_layer(EYE_OPEN, max(6, round(66 * S)), *T(532, 410), True, 20)
    el = on_canvas(eye_l_src, eye_l_xy, (CW, CH))
    er = on_canvas(eye_r_src, eye_r_xy, (CW, CH))
    wl, il = eye_split(el)
    wr, ir = eye_split(er)
    out['eye_white_l'], out['iris_l'] = wl, il
    out['eye_white_r'], out['iris_r'] = wr, ir
    for name, path, w, (cx, cy), flip, th in [
        ('eye_closed_l', EYE_CLOSED, round(66 * S), T(360, 410), False, 12),
        ('eye_closed_r', EYE_CLOSED, round(66 * S), T(532, 410), True, 12),
        ('brow_l', BROW, round(70 * S), T(360, 384), False, 20),
        ('brow_r', BROW, round(70 * S), T(532, 384), True, 20),
        ('mouth_closed', MOUTH_CLOSED, round(64 * S), T(446, 520), False, 20),
        ('mouth_open', MOUTH_OPEN, round(64 * S), T(446, 520), False, 20),
    ]:
        src, xy = sprite_mask_layer(path, max(6, round(w * S)), cx, cy, flip, th)
        out[name] = on_canvas(src, xy, (CW, CH))
    for name, im in out.items():
        im2 = half(im) if name != 'body_base' else half(im)
        im2.save(f'{OUT}/{name}.png')
        print(name, im2.size)

if __name__ == '__main__':
    main()

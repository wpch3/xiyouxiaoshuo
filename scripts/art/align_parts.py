#!/usr/bin/env python3
"""Align generated head variants to a base head and extract transparent part layers.

Method (no manual landmarks):
1. Foreground mask = any channel > FG_THRESH (the generated art sits on pure black).
2. Search scale + translation that maximizes IoU between the variant mask and the base mask
   (coarse-to-fine grid search on a downsampled mask).
3. Warp the variant onto the base canvas (bilinear).
4. Inside a named region box, pixels that differ from the base by more than DIFF_THRESH become
   the part layer (RGBA, alpha from a soft difference mask, slightly dilated).

Usage:
  python3 scripts/art/align_parts.py --base BASE.png --variant V.png --name mouth_open_a \
      --region x0,y0,x1,y1 --out art/xiaoxun/head/parts
Outputs: <out>/<name>.png (RGBA layer on base canvas), <out>/<name>_aligned.png (aligned variant),
         <out>/<name>_qa.png (overlay for visual check), and printed transform parameters.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

FG_THRESH = 40
DIFF_THRESH = 28


def fg_mask(arr):
    return arr.max(axis=2) > FG_THRESH


def warp(arr, s, dx, dy, out_shape):
    """Scale variant by s about its top-left origin, then translate by (dx, dy). Output canvas = base."""
    h, w = out_shape
    # inverse map: out(y,x) = in((y-dy)/s, (x-dx)/s)
    coords = np.indices((h, w)).astype(np.float32)
    src_y = (coords[0] - dy) / s
    src_x = (coords[1] - dx) / s
    out = np.zeros((h, w, arr.shape[2]), dtype=np.float32)
    for c in range(arr.shape[2]):
        out[..., c] = ndimage.map_coordinates(arr[..., c].astype(np.float32), [src_y, src_x], order=1, mode="constant", cval=0)
    return out


def iou(a, b):
    inter = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return inter / union if union else 0.0


def search_transform(base_mask, var_mask):
    """Coarse-to-fine search of (s, dx, dy) mapping variant mask onto base mask."""
    h, w = base_mask.shape
    best = (0.0, 1.0, 0.0, 0.0)
    # initial guess from bounding boxes
    def bbox(m):
        ys, xs = np.where(m)
        return xs.min(), ys.min(), xs.max(), ys.max()
    bx0, by0, bx1, by1 = bbox(base_mask)
    vx0, vy0, vx1, vy1 = bbox(var_mask)
    s0 = (bx1 - bx0) / max(1, (vx1 - vx0))
    dx0 = bx0 - vx0 * s0
    dy0 = by0 - vy0 * s0
    best = (0.0, s0, dx0, dy0)
    for step_s, step_t, span_s, span_t in [(0.02, 4, 0.12, 40), (0.005, 1, 0.03, 8), (0.001, 0.25, 0.008, 2)]:
        cs, cdx, cdy = best[1], best[2], best[3]
        for s in np.arange(cs - span_s, cs + span_s + 1e-9, step_s):
            for dx in np.arange(cdx - span_t, cdx + span_t + 1e-9, step_t):
                for dy in np.arange(cdy - span_t, cdy + span_t + 1e-9, step_t):
                    # compute on mask only (cheap)
                    m = ndimage.map_coordinates(
                        var_mask.astype(np.float32),
                        [(np.indices((h, w))[0] - dy) / s, (np.indices((h, w))[1] - dx) / s],
                        order=0, mode="constant", cval=0,
                    ) > 0.5
                    v = iou(m, base_mask)
                    if v > best[0]:
                        best = (v, s, dx, dy)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--variant", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--region", required=True, help="x0,y0,x1,y1 on base canvas")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    base = np.asarray(Image.open(args.base).convert("RGB")).astype(np.float32)
    var = np.asarray(Image.open(args.variant).convert("RGB")).astype(np.float32)
    H, W = base.shape[:2]

    # downsample for the search
    f = 4
    bm = fg_mask(base)[::f, ::f]
    vm = fg_mask(var)
    vm_small = vm[::f, ::f]
    score, s_small, dx_small, dy_small = search_transform(bm, vm_small)
    s, dx, dy = s_small, dx_small * f, dy_small * f
    # refine at full resolution around the small-scale solution
    full_base_mask = fg_mask(base)
    best = (0.0, s, dx, dy)
    for ds in np.arange(-0.004, 0.0041, 0.001):
        for ddx in np.arange(-2, 2.1, 1):
            for ddy in np.arange(-2, 2.1, 1):
                ss, xx, yy = s + ds, dx + ddx, dy + ddy
                wm = warp(vm[..., None].astype(np.float32), ss, xx, yy, (H, W))[..., 0] > 0.5
                v = iou(wm, full_base_mask)
                if v > best[0]:
                    best = (v, ss, xx, yy)
    score, s, dx, dy = best

    aligned = warp(var, s, dx, dy, (H, W))
    x0, y0, x1, y1 = [int(v) for v in args.region.split(",")]
    region = np.zeros((H, W), dtype=bool)
    region[y0:y1, x0:x1] = True

    diff = np.abs(aligned - base).max(axis=2)
    mask = (diff > DIFF_THRESH) & region
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_dilation(mask, iterations=2)
    # keep the largest connected components only
    lab, n = ndimage.label(mask)
    if n:
        sizes = ndimage.sum(mask, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > 40])
        mask = keep
    soft = ndimage.gaussian_filter(mask.astype(np.float32), 0.8)
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(aligned, 0, 255).astype(np.uint8)
    rgba[..., 3] = (np.clip(soft, 0, 1) * 255).astype(np.uint8)

    os.makedirs(args.out, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(os.path.join(args.out, f"{args.name}.png"))
    Image.fromarray(np.clip(aligned, 0, 255).astype(np.uint8)).save(os.path.join(args.out, f"{args.name}_aligned.png"))
    qa = np.clip(base * 0.5 + aligned * 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(qa).save(os.path.join(args.out, f"{args.name}_qa.png"))
    info = {"name": args.name, "iou": round(float(score), 4), "scale": round(float(s), 5),
            "dx": round(float(dx), 2), "dy": round(float(dy), 2), "layer_pixels": int(mask.sum())}
    print(json.dumps(info))


if __name__ == "__main__":
    main()

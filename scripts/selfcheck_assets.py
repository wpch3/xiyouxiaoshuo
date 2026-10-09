"""资产自检（开发期工具，不参与打包）：校验眼睛零件的像素级完整性与 150% 缝合度量。

用法：python scripts/selfcheck_assets.py <原始base图> [层目录]
依赖：pillow / numpy / scipy（仅开发机）。

检查项：
1. iris 层像素必须与原始 base 的虹膜区逐像素一致（真零件=原画本体，不重绘）；
2. 眼区 bbox 之外 base 与原始图逐像素一致（填充无溢出）；
3. 眼区内改动仅限虹膜切区 + <=5px 羽化环，且单像素色差 <=3/765（不可见级）；
4. 150% 放大后眼区邻像素边缘能量与原画比值 < 1.10（无区块/缝合）；
5. alpha 通道全图一致。
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

LIMIT_EDGE_RATIO = 1.10
LIMIT_STRAY_DELTA = 3


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python scripts/selfcheck_assets.py <orig_base.png> [layers_dir]")
        return 2
    orig_path = Path(sys.argv[1])
    layers = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(
        "app/public/characters/deepseek_layers")
    orig = np.array(Image.open(orig_path).convert("RGBA"))
    base = np.array(Image.open(layers / "base_rig.png").convert("RGBA"))
    iris = np.array(Image.open(layers / "iris.png").convert("RGBA"))
    H, W = orig.shape[:2]
    ia = iris[..., 3] > 0
    ok = True

    def check(name, cond, detail=""):
        nonlocal ok
        ok = ok and bool(cond)
        print("PASS" if cond else "FAIL", name, detail)

    check("iris_is_exact_copy_of_orig", np.array_equal(orig[..., :3][ia], iris[..., :3][ia]),
          f"({int(ia.sum())} px)")
    ys, xs = np.where(ia)
    y0, y1, x0, x1 = ys.min() - 6, ys.max() + 6, xs.min() - 6, xs.max() + 6
    out_mask = np.ones((H, W), bool)
    out_mask[y0:y1, x0:x1] = False
    dif = np.abs(base[..., :3].astype(int) - orig[..., :3].astype(int)).sum(axis=2)
    check("no_change_outside_eye_bbox", not (dif[out_mask] > 0).any(),
          f"({int((dif[out_mask] > 0).sum())} px)")
    chg = dif > 0
    stray = chg & ~ndimage.binary_dilation(ia, iterations=6)
    stray_max = int(dif[stray].max()) if stray.any() else 0
    check("changes_within_feather_ring", stray_max <= LIMIT_STRAY_DELTA,
          f"(stray {int(stray.sum())} px beyond 6px ring, max delta {stray_max}/765)")
    comp = base.copy()
    comp[..., :3] = np.where(ia[..., None], iris[..., :3], comp[..., :3])
    up = lambda a: np.array(Image.fromarray(a).resize((W * 3 // 2, H * 3 // 2), Image.LANCZOS)).astype(int)
    cu, ou = up(comp), up(orig)
    gy = lambda a: np.abs(np.diff(a[..., :3].sum(axis=2), axis=0))
    gx = lambda a: np.abs(np.diff(a[..., :3].sum(axis=2), axis=1))
    yy0, yy1, xx0, xx1 = y0 * 3 // 2, y1 * 3 // 2, x0 * 3 // 2, x1 * 3 // 2
    ec = gy(cu)[yy0:yy1, xx0:xx1].mean() + gx(cu)[yy0:yy1, xx0:xx1].mean()
    eo = gy(ou)[yy0:yy1, xx0:xx1].mean() + gx(ou)[yy0:yy1, xx0:xx1].mean()
    check("edge_energy_150pct_within_limit", ec / eo < LIMIT_EDGE_RATIO,
          f"(ratio {ec / eo:.3f})")
    check("alpha_unchanged", np.array_equal(base[..., 3], orig[..., 3]))
    soft = int(((iris[..., 3] > 10) & (iris[..., 3] < 245)).sum())
    check("iris_edge_feathered", soft > 8, f"({soft} px soft alpha ring)")
    # 视线极限偏移态：虹膜平移 +-5/+-2.5 后仍无硬切边
    base_img = Image.fromarray(base)
    iris_img = Image.fromarray(iris)
    for sx, sy in ((5, 2), (-5, -2)):
        shifted = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        shifted.paste(iris_img, (sx, sy))
        comp2 = base_img.copy()
        comp2.alpha_composite(shifted)
        cu2 = up(np.array(comp2))
        e2 = gy(cu2)[yy0:yy1, xx0:xx1].mean() + gx(cu2)[yy0:yy1, xx0:xx1].mean()
        check(f"gaze_shift_{sx}_{sy}_no_hard_edge", e2 / eo < 1.35, f"(ratio {e2 / eo:.3f})")
    print("ASSET_SELFTEST", "OK" if ok else "BROKEN")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

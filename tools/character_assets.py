#!/usr/bin/env python3
"""角色立绘素材处理与质检（只依赖 Pillow）。

子命令：
  key   IN OUT            绿幕抠图：去绿边、只保留主体连通块，输出 RGBA PNG（尺寸不变）
  build IN OUT            裁到主体包围盒，按统一高度缩放，放入 800x1400 画布，脚底基线固定
  qc    PATH [PATH ...]   质检：尺寸/通道、是否只有一个主体、是否贴边被截断、是否残留绿色
  manifest OUT PATH ...   质检通过后导出清单（包围盒、骨骼网格格子），供前端骨骼渲染读取

用法示例：
  python3 tools/character_assets.py key raw/normal_deepseek.png /tmp/k.png
  python3 tools/character_assets.py build /tmp/k.png app/public/characters/deepseek.png
  python3 tools/character_assets.py qc app/public/characters/*.png

生成图的流程：生成器输出绿幕图 -> key -> build -> qc。qc 不通过的图不得进入 app/public/characters。
"""
import argparse
import os
import sys
from collections import deque

from PIL import Image, ImageChops

CANVAS_W, CANVAS_H = 800, 1400
TARGET_H = 1180          # 主体高度（像素）
BASE_Y = 1300            # 脚底基线（像素）
MIN_PART_AREA = 3000     # 小于该面积的连通块视为残点，抠图时删除
MAJOR_PART_AREA = 3000   # qc 时超过该面积的连通块计为"主体部件"


def _greenness_lut():
    # 绿度 = G - max(R,B)。绿度 <= 30 视为主体（不透明），>= 110 视为背景（透明），中间线性过渡
    lut = []
    for v in range(256):
        if v <= 30:
            lut.append(255)
        elif v >= 110:
            lut.append(0)
        else:
            lut.append(int(round(255 * (110 - v) / 80)))
    return lut


def largest_components(mask_img, min_area):
    """mask_img: L 模式，255 为前景。返回保留的连通块像素集合列表（按面积降序）。"""
    w, h = mask_img.size
    data = mask_img.tobytes()
    seen = bytearray(w * h)
    comps = []
    for start in range(w * h):
        if data[start] < 128 or seen[start]:
            continue
        q = deque([start])
        seen[start] = 1
        pixels = []
        while q:
            p = q.popleft()
            pixels.append(p)
            x, y = p % w, p // w
            if x > 0 and data[p - 1] >= 128 and not seen[p - 1]:
                seen[p - 1] = 1
                q.append(p - 1)
            if x < w - 1 and data[p + 1] >= 128 and not seen[p + 1]:
                seen[p + 1] = 1
                q.append(p + 1)
            if y > 0 and data[p - w] >= 128 and not seen[p - w]:
                seen[p - w] = 1
                q.append(p - w)
            if y < h - 1 and data[p + w] >= 128 and not seen[p + w]:
                seen[p + w] = 1
                q.append(p + w)
        if len(pixels) >= min_area:
            comps.append(pixels)
    comps.sort(key=len, reverse=True)
    return comps


def key_green(src, dst):
    im = Image.open(src).convert('RGB')
    w0, h0 = im.size
    for cx, cy in [(4, 4), (w0 - 5, 4), (4, h0 - 5), (w0 - 5, h0 - 5)]:
        pr, pg, pb = im.getpixel((cx, cy))
        if pg - max(pr, pb) < 120:
            raise SystemExit(f'抠图前检查失败：角落颜色 {(pr, pg, pb)} 不是绿色背景，请重新生成（不要用白底）')
    r, g, b = im.split()
    max_rb = ImageChops.lighter(r, b)
    gness = ImageChops.subtract(g, max_rb)
    alpha = gness.point(_greenness_lut())
    # 去绿边：G 不超过 max(R,B)
    g2 = ImageChops.darker(g, max_rb)
    out = Image.merge('RGBA', (r, g2, b, alpha))
    # 只保留主体（最大连通块 + 面积达标的块），删除残点
    mask = alpha.point(lambda v: 255 if v >= 128 else 0)
    comps = largest_components(mask, MIN_PART_AREA)
    if not comps:
        raise SystemExit('抠图失败：没有找到主体，请检查背景是否为纯绿色')
    keep_data = bytearray(im.size[0] * im.size[1])
    for pixels in comps:
        for p in pixels:
            keep_data[p] = 255
    keep = Image.frombytes('L', im.size, bytes(keep_data))
    # 把保留区域外的 alpha 清零；保留区域边缘的半透明像素保持原 alpha
    out_alpha = ImageChops.multiply(alpha, keep)
    out.putalpha(out_alpha)
    out.save(dst, 'PNG')
    bbox = out_alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    print(f'key ok: {dst} parts_kept={len(comps)} bbox={bbox}')


def build(src, dst):
    im = Image.open(src).convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v > 8 else 0)
    bbox = a.getbbox()
    if bbox is None:
        raise SystemExit('build 失败：图片是空的')
    crop = im.crop(bbox)
    cw, ch = crop.size
    scale = TARGET_H / ch
    nw, nh = int(round(cw * scale)), TARGET_H
    if nw > CANVAS_W - 40:  # 太宽时按宽度限制
        scale = (CANVAS_W - 40) / cw
        nw, nh = int(round(cw * scale)), int(round(ch * scale))
    resized = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    x = (CANVAS_W - nw) // 2
    y = BASE_Y - nh
    canvas.paste(resized, (x, y), resized)
    canvas.save(dst, 'PNG', optimize=True)
    print(f'build ok: {dst} figure={nw}x{nh} at ({x},{y})')


def qc(paths):
    failed = False
    for p in paths:
        im = Image.open(p)
        problems = []
        if im.size != (CANVAS_W, CANVAS_H):
            problems.append(f'尺寸 {im.size} 不是 {CANVAS_W}x{CANVAS_H}')
        if im.mode != 'RGBA':
            problems.append(f'模式 {im.mode} 不是 RGBA')
        else:
            rgba = im.convert('RGBA')
            alpha = rgba.getchannel('A')
            mask = alpha.point(lambda v: 255 if v >= 128 else 0)
            comps = largest_components(mask, MAJOR_PART_AREA)
            if len(comps) == 0:
                problems.append('没有主体')
            elif len(comps) > 1:
                problems.append(f'有 {len(comps)} 个主体部件（疑似多人/拼图残留）')
            bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
            if bbox:
                x0, y0, x1, y1 = bbox
                if x0 <= 2 or x1 >= CANVAS_W - 2 or y0 <= 2 or y1 >= CANVAS_H - 2:
                    problems.append(f'主体贴到画布边缘 bbox={bbox}（疑似截断）')
                # 背景没抠干净：包围盒左右两条边上大部分像素都不透明（矩形底）
                ad = alpha.load()
                left_op = sum(1 for yy in range(y0, y1) if ad[x0, yy] > 128) / max(1, (y1 - y0))
                right_op = sum(1 for yy in range(y0, y1) if ad[x1 - 1, yy] > 128) / max(1, (y1 - y0))
                if left_op > 0.6 and right_op > 0.6:
                    problems.append('包围盒左右边缘几乎全部不透明（疑似背景未抠除）')
            # 绿色残留：不透明像素中绿度明显偏高
            r, g, b = rgba.convert('RGB').split()
            gness = ImageChops.subtract(g, ImageChops.lighter(r, b))
            green_px = 0
            ga = gness.tobytes()
            aa = alpha.tobytes()
            for i in range(0, len(ga)):
                if ga[i] > 40 and aa[i] > 200:
                    green_px += 1
                    if green_px > 200:
                        break
            if green_px > 200:
                problems.append(f'残留绿色像素 {green_px}+')
        status = 'PASS' if not problems else 'FAIL'
        if problems:
            failed = True
        print(f'{status} {p}' + ('' if not problems else ' :: ' + '；'.join(problems)))
    return 1 if failed else 0


GRID_COLS, GRID_ROWS, GRID_MARGIN = 12, 24, 0.06


def manifest(out_path, paths):
    """为已通过质检的素材导出清单（包围盒 + 骨骼网格中有像素的格子），供前端骨骼渲染使用。"""
    import json
    if qc(paths) != 0:
        raise SystemExit('有素材未通过质检，清单不生成')
    assets = {}
    for p in paths:
        im = Image.open(p).convert('RGBA')
        w, h = im.size
        alpha = im.getchannel('A')
        bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
        x0, y0, x1, y1 = bbox
        bw, bh = x1 - x0, y1 - y0
        ex0, ey0 = x0 - GRID_MARGIN * bw, y0 - GRID_MARGIN * bh
        ew, eh = bw * (1 + 2 * GRID_MARGIN), bh * (1 + 2 * GRID_MARGIN)
        cw, ch = ew / GRID_COLS, eh / GRID_ROWS
        active = set()
        ad = alpha.load()
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                if ad[xx, yy] > 8:
                    i = int((xx - ex0) // cw)
                    j = int((yy - ey0) // ch)
                    if 0 <= i < GRID_COLS and 0 <= j < GRID_ROWS:
                        active.add((i, j))
        # 向四周各扩 1 格，防止形变后露出空洞
        dil = set()
        for i, j in active:
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    ii, jj = i + di, j + dj
                    if 0 <= ii < GRID_COLS and 0 <= jj < GRID_ROWS:
                        dil.add((ii, jj))
        assets[os.path.basename(p)] = {
            'size': [w, h],
            'grid': {'cols': GRID_COLS, 'rows': GRID_ROWS, 'margin': GRID_MARGIN},
            'bbox': [x0, y0, x1, y1],
            'cells': sorted(j * GRID_COLS + i for i, j in dil),
        }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'version': 1, 'grid': {'cols': GRID_COLS, 'rows': GRID_ROWS, 'margin': GRID_MARGIN}, 'assets': assets}, f, ensure_ascii=False, indent=1)
    print(f'manifest ok: {out_path} ({len(assets)} assets)')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    k = sub.add_parser('key')
    k.add_argument('src')
    k.add_argument('dst')
    b = sub.add_parser('build')
    b.add_argument('src')
    b.add_argument('dst')
    q = sub.add_parser('qc')
    q.add_argument('paths', nargs='+')
    m = sub.add_parser('manifest')
    m.add_argument('out')
    m.add_argument('paths', nargs='+')
    args = ap.parse_args()
    if args.cmd == 'key':
        key_green(args.src, args.dst)
    elif args.cmd == 'build':
        build(args.src, args.dst)
    elif args.cmd == 'qc':
        sys.exit(qc(args.paths))
    elif args.cmd == 'manifest':
        manifest(args.out, args.paths)


if __name__ == '__main__':
    main()

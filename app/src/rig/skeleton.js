// 2D 骨骼形变（纯 JS，不依赖 WebGL；素材只做 drawImage，不读取像素，file:// 下也能用）
// 原理：按骨骼对网格顶点做线性蒙皮（权重由顶点到骨骼线段的距离高斯衰减得到），
// 每帧把网格三角形映射到形变后的位置并逐块绘制。
import layout from './rigLayout.json';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// 2x3 仿射矩阵 [a, b, c, d, e, f]：x' = a*x + c*y + e，y' = b*x + d*y + f
const mul = (M, N) => [
  M[0] * N[0] + M[2] * N[1],
  M[1] * N[0] + M[3] * N[1],
  M[0] * N[2] + M[2] * N[3],
  M[1] * N[2] + M[3] * N[3],
  M[0] * N[4] + M[2] * N[5] + M[4],
  M[1] * N[4] + M[3] * N[5] + M[5]
];
const translate = (x, y) => [1, 0, 0, 1, x, y];
const rotate = (rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, s, -s, c, 0, 0];
};

const distToSegment = (px, py, a, b) => {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy;
  let t = len2 > 0 ? ((px - a[0]) * vx + (py - a[1]) * vy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = a[0] + t * vx - px;
  const dy = a[1] + t * vy - py;
  return Math.sqrt(dx * dx + dy * dy);
};

const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * 根据素材的主体包围盒和网格可见格子，建立骨骼网格。
 * asset: { bbox: [x0,y0,x1,y1], cells: number[] }（来自 assetManifest.json）
 */
export function buildRig(asset) {
  const [x0, y0, x1, y1] = asset.bbox;
  const g = asset.grid;
  if (g && (g.cols !== layout.grid.cols || g.rows !== layout.grid.rows)) {
    throw new Error('清单网格与骨骼布局不一致，请重新运行 tools/character_assets.py manifest');
  }
  const bw = x1 - x0;
  const bh = y1 - y0;
  const { cols, rows, margin } = layout.grid;
  const ex0 = x0 - margin * bw;
  const ey0 = y0 - margin * bh;
  const ew = bw * (1 + 2 * margin);
  const eh = bh * (1 + 2 * margin);

  const J = {};
  for (const [name, [u, v]] of Object.entries(layout.joints)) {
    J[name] = [x0 + u * bw, y0 + v * bh];
  }
  const bones = layout.bones.map((b, index) => ({
    id: b.id,
    index,
    parent: b.parent ? layout.bones.findIndex((p) => p.id === b.parent) : -1,
    from: J[b.from],
    to: J[b.to],
    pivot: J[b.pivot],
    sigma: b.sigma * bh,
    // 高度范围 + 可选的横向范围（手臂只影响身体外侧，不拽围裙中间）
    vMask: (v, u) =>
      smooth(b.vmin - b.fade, b.vmin + b.fade, v) *
      (1 - smooth(b.vmax - b.fade, b.vmax + b.fade, v)) *
      (b.hmin != null ? smooth(b.hmin - b.hfade, b.hmin + b.hfade, Math.abs(u - 0.5)) : 1)
  }));

  const nV = (cols + 1) * (rows + 1);
  const restX = new Float32Array(nV);
  const restY = new Float32Array(nV);
  const hairW = new Float32Array(nV);
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      restX[k] = ex0 + (i / cols) * ew;
      restY[k] = ey0 + (j / rows) * eh;
      const u = (restX[k] - x0) / bw;
      const v = (restY[k] - y0) / bh;
      // 两侧头发：从头顶到胸口之间、离中线较远的区域
      hairW[k] = smooth(0.1, 0.22, Math.abs(u - 0.5)) * smooth(-0.02, 0.1, v) * (1 - smooth(0.55, 0.85, v));
    }
  }

  const wIdx = new Uint8Array(nV * 3);
  const wVal = new Float32Array(nV * 3);
  for (let k = 0; k < nV; k++) {
    const px = restX[k];
    const py = restY[k];
    const cand = bones
      .map((b) => ({
        idx: b.index,
        w: Math.exp(-0.5 * (distToSegment(px, py, b.from, b.to) / b.sigma) ** 2) * b.vMask((py - y0) / bh, (px - x0) / bw)
      }))
      .sort((p, q) => q.w - p.w)
      .slice(0, 3);
    const sum = cand.reduce((s, c) => s + c.w, 0);
    for (let m = 0; m < 3; m++) {
      const c = cand[m] || cand[0];
      wIdx[k * 3 + m] = c.idx;
      // 所有权重都为 0（离骨骼很远）时，整块绑定到最近的骨骼
      wVal[k * 3 + m] = sum > 0 ? (cand[m] ? cand[m].w / sum : 0) : m === 0 ? 1 : 0;
    }
  }

  const active = new Set(asset.cells);
  const tris = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (!active.has(j * cols + i)) continue;
      const a = j * (cols + 1) + i;
      const b = a + 1;
      const c = a + (cols + 1);
      const d = c + 1;
      tris.push(a, b, d, a, d, c);
    }
  }

  return {
    bones,
    nV,
    restX,
    restY,
    hairW,
    wIdx,
    wVal,
    tris: Uint32Array.from(tris),
    bw,
    bh,
    view: { x: ex0, y: ey0, w: ew, h: eh }
  };
}

/** 计算每根骨骼的世界变换（父在前）。pose: { rot: {boneId: rad}, trans: {boneId: [dx,dy]} } */
export function worldTransforms(rig, pose) {
  const W = new Array(rig.bones.length);
  for (const b of rig.bones) {
    const rot = pose.rot[b.id] || 0;
    const [tx, ty] = pose.trans[b.id] || [0, 0];
    const [px, py] = b.pivot;
    // 局部：先平移，再绕枢轴旋转
    let L = mul(translate(px, py), rotate(rot));
    L = mul(L, translate(-px, -py));
    L = mul(translate(tx, ty), L);
    W[b.index] = b.parent >= 0 ? mul(W[b.parent], L) : L;
  }
  return W;
}

/** 线性蒙皮 + 头发摆动，写入 dest.x / dest.y */
export function deform(rig, W, hairAmp, hairPhase, dest) {
  const { nV, restX, restY, wIdx, wVal, hairW } = rig;
  for (let k = 0; k < nV; k++) {
    const x = restX[k];
    const y = restY[k];
    let X = 0;
    let Y = 0;
    for (let m = 0; m < 3; m++) {
      const w = wVal[k * 3 + m];
      if (w === 0) continue;
      const M = W[wIdx[k * 3 + m]];
      X += w * (M[0] * x + M[2] * y + M[4]);
      Y += w * (M[1] * x + M[3] * y + M[5]);
    }
    const hw = hairW[k];
    if (hw > 0) X += hairAmp * hw * Math.sin(hairPhase + y * 0.004);
    dest.x[k] = X;
    dest.y[k] = Y;
  }
}

/**
 * 动作参数。t：秒；strength：0~1，表示"高兴"姿态的强度（平滑过渡）。
 * 只使用呼吸、摇摆、看向鼠标、说话点头、高兴举手/跳跃、思考歪头，不涉及任何身体接触动作。
 */
export function makePose(t, { strength, speaking, thinking, look, bh, bw }) {
  const breathe = 0.5 + 0.5 * Math.sin((TAU * t) / 3.8);
  const sway = Math.sin((TAU * t) / 6.5);
  const armSwing = Math.sin((TAU * t) / 3.8);
  const rot = {};
  const trans = {};

  trans.pelvis = [0, -bh * (0.02 * strength * Math.abs(Math.sin((TAU * t) / 0.9)))];
  trans.torso = [0, -bh * 0.0016 * breathe];
  rot.torso = DEG * 0.6 * sway;

  let headDeg = 1.2 * Math.sin((TAU * t) / 5.3 + 0.7);
  headDeg += 4 * (look ? look.x : 0);
  if (speaking) headDeg += 1.0 * Math.sin(TAU * t * 2.2);
  if (thinking) headDeg += 6;
  rot.head = DEG * headDeg;

  rot.upperArmL = DEG * (1.0 * armSwing + 24 * strength);
  rot.upperArmR = -DEG * (1.0 * armSwing + 24 * strength);
  rot.foreArmL = DEG * (0.8 * Math.sin((TAU * t) / 3.8 + 0.5) + 10 * strength);
  rot.foreArmR = -DEG * (0.8 * Math.sin((TAU * t) / 3.8 + 0.5) + 10 * strength);

  return { rot, trans, hairAmp: bw * 0.006 * (1 + 1.2 * strength) };
}

/** 2D 画布中，把包围盒（扩边后）等比放进画布；返回 image 坐标 -> canvas 坐标 的仿射矩阵 */
export function fitBase(view, cw, ch) {
  const s = Math.min(cw / view.w, ch / view.h);
  const ox = (cw - view.w * s) / 2 - view.x * s;
  const oy = (ch - view.h * s) / 2 - view.y * s;
  return [s, 0, 0, s, ox, oy];
}

/**
 * 逐三角形绘制：每个三角形用 clip 限定在形变后的位置，并把原图对应三角形的像素仿射映射过去。
 * 三角形外扩约 1 个画布像素以减少接缝。
 */
export function drawRig(ctx, img, rig, dest, base) {
  const { tris, restX, restY } = rig;
  // 外扩 1 个画布像素（换算到素材坐标），盖住相邻三角形之间的抗锯齿缝隙
  const grow = 1 / (base[0] || 1);
  const X = dest.x;
  const Y = dest.y;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  for (let t = 0; t < tris.length; t += 3) {
    const i0 = tris[t];
    const i1 = tris[t + 1];
    const i2 = tris[t + 2];
    const sx0 = restX[i0];
    const sy0 = restY[i0];
    const sx1 = restX[i1];
    const sy1 = restY[i1];
    const sx2 = restX[i2];
    const sy2 = restY[i2];
    const ex1 = sx1 - sx0;
    const ey1 = sy1 - sy0;
    const ex2 = sx2 - sx0;
    const ey2 = sy2 - sy0;
    const det = ex1 * ey2 - ex2 * ey1;
    if (Math.abs(det) < 1e-6) continue;

    const dx0 = X[i0];
    const dy0 = Y[i0];
    const dx1 = X[i1];
    const dy1 = Y[i1];
    const dx2 = X[i2];
    const dy2 = Y[i2];
    const fx1 = dx1 - dx0;
    const fy1 = dy1 - dy0;
    const fx2 = dx2 - dx0;
    const fy2 = dy2 - dy0;
    const a = (fx1 * ey2 - fx2 * ey1) / det;
    const b = (fy1 * ey2 - fy2 * ey1) / det;
    const c = (-fx1 * ex2 + fx2 * ex1) / det;
    const d = (-fy1 * ex2 + fy2 * ex1) / det;
    const e = dx0 - (a * sx0 + c * sy0);
    const f = dy0 - (b * sx0 + d * sy0);

    // 外扩裁剪区域
    const cx = (dx0 + dx1 + dx2) / 3;
    const cy = (dy0 + dy1 + dy2) / 3;
    const pts = [
      [dx0, dy0],
      [dx1, dy1],
      [dx2, dy2]
    ].map(([px, py]) => {
      const vx = px - cx;
      const vy = py - cy;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      return [px + (vx / len) * grow, py + (vy / len) * grow];
    });

    ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    const minx = Math.max(0, Math.floor(Math.min(sx0, sx1, sx2)) - 1);
    const miny = Math.max(0, Math.floor(Math.min(sy0, sy1, sy2)) - 1);
    const maxx = Math.min(iw, Math.ceil(Math.max(sx0, sx1, sx2)) + 1);
    const maxy = Math.min(ih, Math.ceil(Math.max(sy0, sy1, sy2)) + 1);
    if (maxx > minx && maxy > miny) {
      ctx.drawImage(img, minx, miny, maxx - minx, maxy - miny, minx, miny, maxx - minx, maxy - miny);
    }
    ctx.restore();
  }
}

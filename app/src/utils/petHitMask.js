// 立绘像素判定遮罩：把 rig 所有图层的 alpha 取并集，缩成低分辨率位图。
// 小窗只让不透明像素响应鼠标，角色外的空白区域完全穿透。
// 所有 rig 图层同尺寸（424x632），遮罩与图层同比例。

const MASK_W = 212;
const MASK_H = 316;
const ALPHA_MIN = 24;

const cache = new Map();

const layerSources = (rig) => {
  if (!rig || !Array.isArray(rig.layers)) return [];
  return rig.layers.flatMap((layer) => (layer.frames ? layer.frames : layer.src ? [layer.src] : []));
};

const loadImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = src;
});

/**
 * 构建 rig 的并集遮罩。返回 Promise<{w,h,data}|null>。
 * 环境不支持 canvas（如 jsdom 单测）时返回 null，调用方应视为"全部可点"。
 */
export const buildHitMask = (rig) => {
  const sources = layerSources(rig);
  if (!sources.length) return Promise.resolve(null);
  const key = sources.join('|');
  if (cache.has(key)) return cache.get(key);

  const task = (async () => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = MASK_W;
    canvas.height = MASK_H;
    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    if (!ctx) return null;
    const images = await Promise.all(sources.map(loadImage));
    const data = new Uint8Array(MASK_W * MASK_H);
    images.forEach((image) => {
      if (!image) return;
      ctx.clearRect(0, 0, MASK_W, MASK_H);
      ctx.drawImage(image, 0, 0, MASK_W, MASK_H);
      const pixels = ctx.getImageData(0, 0, MASK_W, MASK_H).data;
      for (let i = 0; i < data.length; i += 1) {
        if (pixels[i * 4 + 3] >= ALPHA_MIN) data[i] = 1;
      }
    });
    return { w: MASK_W, h: MASK_H, data };
  })();

  cache.set(key, task);
  return task;
};

/** u,v 为相对立绘可见矩形的归一化坐标（0..1）。mask 为空时视为可点。 */
export const maskHitAt = (mask, u, v) => {
  if (!mask) return true;
  if (u < 0 || v < 0 || u > 1 || v > 1) return false;
  const x = Math.min(mask.w - 1, Math.floor(u * mask.w));
  const y = Math.min(mask.h - 1, Math.floor(v * mask.h));
  return mask.data[y * mask.w + x] === 1;
};

/**
 * 立绘实际可见矩形（object-fit: contain + object-position: center bottom）。
 * 元素盒子比立绘宽或高时，立绘会留出空白，判定必须以可见部分为准。
 */
export const renderedRigRect = (element, aspect = 424 / 632) => {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;
  const box = element.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return null;
  const height = Math.min(box.height, box.width / aspect);
  const width = height * aspect;
  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + box.height - height,
    width,
    height,
  };
};

import React, { useEffect, useRef, useState } from 'react';
import { buildRig, worldTransforms, deform, makePose, fitBase, drawRig } from '../rig/skeleton';

const TAU = Math.PI * 2;

/**
 * 骨骼动态立绘。
 * - 只用于通过质检的素材（asset 来自 assetManifest.json：包围盒 + 网格格子）。
 * - 画布未就绪、素材加载失败或绘制出错时，保留下面的静态 <img>，并在控制台给出提示。
 * - mood: 'idle' | 'happy' | 'thinking'；look: {x,y}，取值 -1~1，用于头部看向鼠标。
 * - onClick 绑在外层容器上：整体反应，不做任何身体部位的判断。
 */
export const RigPortrait = ({ src, asset, mood = 'idle', speaking = false, look = { x: 0, y: 0 }, onClick, title, alt = '' }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const live = useRef({ mood, speaking, look });
  live.current = { mood, speaking, look };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !asset) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // 画布像素比：默认取设备像素比（最高 2）；绘制慢的机器自动降为 1，保证帧率
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let alive = true;
    let raf = 0;
    let last = 0;
    let strength = 0;
    let budget = 1000 / 30; // 帧间隔上限（ms）
    let avgCost = 0; // 单帧绘制耗时的滑动平均
    let rig = null;
    let dest = null;
    const img = new Image();

    const frame = (now) => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (now - last < budget) return;
      last = now;
      const frameStart = performance.now();
      try {
        const st = live.current;
        strength += ((st.mood === 'happy' ? 1 : 0) - strength) * 0.1;
        const cw = Math.max(1, Math.round(wrap.clientWidth * dpr));
        const ch = Math.max(1, Math.round(wrap.clientHeight * dpr));
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }
        const t = now / 1000;
        const pose = makePose(t, {
          strength,
          speaking: st.speaking,
          thinking: st.mood === 'thinking',
          look: st.look,
          bh: rig.bh,
          bw: rig.bw
        });
        const W = worldTransforms(rig, pose);
        deform(rig, W, pose.hairAmp, (TAU * t) / 2.6, dest);
        const base = fitBase(rig.view, cw, ch);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cw, ch);
        drawRig(ctx, img, rig, dest, base);
        setReady(true);
        // 绘制慢的机器自动降到 15fps，避免占满 CPU
        avgCost = avgCost * 0.9 + (performance.now() - frameStart) * 0.1;
        budget = avgCost > 28 ? 1000 / 15 : 1000 / 30;
        if (avgCost > 22 && dpr > 1) dpr = 1;
      } catch (err) {
        // 任何绘制错误都退回静态图，并停止动画
        alive = false;
        setReady(false);
        console.warn('骨骼立绘已停用，退回静态图：', err);
      }
    };

    img.onload = () => {
      if (!alive) return;
      try {
        rig = buildRig(asset);
        dest = { x: new Float32Array(rig.nV), y: new Float32Array(rig.nV) };
        raf = requestAnimationFrame(frame);
      } catch (err) {
        alive = false;
        console.warn('骨骼网格生成失败，退回静态图：', err);
      }
    };
    img.onerror = () => setReady(false);
    img.src = src;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [src, asset]);

  return (
    <div
      ref={wrapRef}
      onClick={onClick}
      title={title}
      style={{ position: 'relative', width: '100%', height: '100%', cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          display: ready ? 'none' : 'block'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: ready ? 'block' : 'none',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

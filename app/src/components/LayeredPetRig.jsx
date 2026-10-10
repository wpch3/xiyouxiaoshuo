import React, { useEffect, useRef, useState } from 'react';


const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// 分层立绘渲染器：同尺寸透明 PNG 按 z 序叠放，部件级动画
// （眼睑眨眼、嘴部口型、虹膜视线、眉毛情绪），对应 petRig.js 的 layers 清单。
export const LayeredPetRig = ({ rig, isSpeaking = false, look = { x: 0, y: 0 }, mood = 'idle', className = '', fallbackSrc = '' }) => {
  const [isBroken, setIsBroken] = useState(false);
  const [talkIdx, setTalkIdx] = useState(0);
  const rigRef = useRef(null);
  const gazeTargetRef = useRef({ x: 0, y: 0 });

  // 口型节奏调度器：词内随机音素帧（70-160ms）+ 偶发重音长帧 +
  // 词间闭口停顿（120-260ms），交叉淡化过渡，避免机械循环的"对口型"感。
  useEffect(() => {
    if (!isSpeaking) {
      setTalkIdx(-1);
      return undefined;
    }
    let alive = true;
    let timer = 0;
    let prev = 0;
    let leftInWord = 4;
    const script = [1, 2];
    const FR = 5;
    const step = () => {
      if (!alive) return;
      if (script.length) {
        prev = script.shift();
        setTalkIdx(prev);
        timer = window.setTimeout(step, 90 + script.length * 20);
        return;
      }
      if (leftInWord <= 0) {
        leftInWord = 3 + Math.floor(Math.random() * 5);
        if (Math.random() < 0.7) {
          setTalkIdx(-1);
          timer = window.setTimeout(step, 120 + Math.random() * 140);
          return;
        }
      }
      leftInWord -= 1;
      let f = Math.floor(Math.random() * FR);
      if (f === prev) f = (f + 1) % FR;
      prev = f;
      setTalkIdx(f);
      timer = window.setTimeout(step, Math.random() < 0.12 ? 170 + Math.random() * 60 : 70 + Math.random() * 90);
    };
    step();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [isSpeaking]);

  // 视线缓动：rAF 写容器上的 CSS 变量（百分比），所有虹膜层共用，不触发 React 重渲染。
  // 百分比相对于虹膜层自身尺寸，即整张 rig 的宽高，因此限幅以 rig 像素换算后写入。
  useEffect(() => {
    let raf = 0;
    const cur = { ...gazeTargetRef.current };
    const tick = () => {
      cur.x += (gazeTargetRef.current.x - cur.x) * 0.16;
      cur.y += (gazeTargetRef.current.y - cur.y) * 0.16;
      const el = rigRef.current;
      if (el && rig) {
        el.style.setProperty('--gaze-x', `${((cur.x / rig.width) * 100).toFixed(4)}%`);
        el.style.setProperty('--gaze-y', `${((cur.y / rig.height) * 100).toFixed(4)}%`);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [rig]);

  const limit = (rig && rig.gazeLimit) || { x: 1, y: 0.5 };
  const gazeX = clamp((look.x || 0) * limit.x, -limit.x, limit.x);
  const gazeY = clamp((look.y || 0) * limit.y, -limit.y, limit.y);
  gazeTargetRef.current = { x: gazeX, y: gazeY };
  const browShift = mood === 'happy' ? -2.5 : mood === 'hammered' ? 1.5 : 0;

  if (isBroken || !rig || !rig.layers) {
    if (fallbackSrc) return <img className={className} src={fallbackSrc} alt="桌宠立绘" draggable="false" />;
    return null;
  }

  return (
    <div ref={rigRef} className={`pet-rig ${className}`} data-rig-layers={rig.layers.length}>
      {rig.layers.map((layer) => {
        if (layer.mode === 'talk') {
          const active = isSpeaking ? talkIdx : -1;
          return layer.frames.map((src, i) => (
            <img
              key={`${layer.id}-${i}`}
              className="pet-rig-layer pet-rig-talk"
              src={src}
              alt=""
              draggable="false"
              onError={() => setIsBroken(true)}
              style={{ zIndex: layer.z, opacity: i === active ? 1 : 0 }}
            />
          ));
        }
        // 眨眼层由 CSS 动画控制透明度，其余静态层始终可见
        let transform;
        if (layer.mode === 'gaze') transform = 'translate(var(--gaze-x, 0%), var(--gaze-y, 0%))';
        if (layer.mode === 'brow') transform = `translateY(${browShift}px)`;
        const style = { zIndex: layer.z, opacity: 1, transform };
        return (
          <img
            key={layer.id}
            className={`pet-rig-layer pet-rig-${layer.mode}${layer.mode === 'blink' ? ' pet-rig-blink-anim' : ''}`}
            src={layer.src}
            alt=""
            draggable="false"
            onError={() => setIsBroken(true)}
            style={style}
          />
        );
      })}
    </div>
  );
};

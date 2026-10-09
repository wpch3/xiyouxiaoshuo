import React, { useEffect, useRef, useState } from 'react';


const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// 分层立绘渲染器：同尺寸透明 PNG 按 z 序叠放，部件级动画
// （刘海/双侧发摆动、眼睑眨眼、嘴部口型、虹膜视线、眉毛情绪），
// 对应拆件清单 PET_RIGS。
export const LayeredPetRig = ({ rig, isSpeaking = false, look = { x: 0, y: 0 }, mood = 'idle', className = '', fallbackSrc = '' }) => {
  const [isBroken, setIsBroken] = useState(false);
  const [talkIdx, setTalkIdx] = useState(0);
  const gazeRef = useRef(null);
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

  // 视线缓动：rAF 直接写 transform，不触发 React 重渲染
  useEffect(() => {
    let raf = 0;
    const cur = { ...gazeTargetRef.current };
    const tick = () => {
      cur.x += (gazeTargetRef.current.x - cur.x) * 0.16;
      cur.y += (gazeTargetRef.current.y - cur.y) * 0.16;
      if (gazeRef.current) gazeRef.current.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px)`;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const gazeX = clamp((look.x || 0) * 0.7, -5, 5);
  const gazeY = clamp((look.y || 0) * 0.35, -2.5, 2.5);
  gazeTargetRef.current = { x: gazeX, y: gazeY };
  const browShift = mood === 'happy' ? -2.5 : mood === 'hammered' ? 1.5 : 0;

  if (isBroken || !rig || !rig.layers) {
    if (fallbackSrc) return <img className={className} src={fallbackSrc} alt="桌宠立绘" draggable="false" />;
    return null;
  }

  return (
    <div className={`pet-rig ${className}`} data-rig-layers={rig.layers.length}>
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
        const visible = layer.mode === 'base' || layer.mode === 'static'
          || layer.mode.startsWith('sway')
          || layer.mode === 'gaze' || layer.mode === 'brow'
          || layer.mode === 'arm_rest' || layer.mode === 'blink'
          || (layer.mode === 'arm_wave' && mood === 'waving');
        let transform;
        if (layer.mode === 'gaze') transform = `translate(${gazeX}px, ${gazeY}px)`;
        if (layer.mode === 'brow') transform = `translateY(${browShift}px)`;
        const style = { zIndex: layer.z, opacity: visible ? 1 : 0, transform };
        return (
          <img
            ref={layer.mode === 'gaze' ? gazeRef : undefined}
            key={layer.id}
            className={`pet-rig-layer pet-rig-${layer.mode}${layer.mode.startsWith('sway') ? ` pet-rig-${layer.mode}-anim` : ''}${layer.mode === 'blink' ? ' pet-rig-blink-anim' : ''}`}
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

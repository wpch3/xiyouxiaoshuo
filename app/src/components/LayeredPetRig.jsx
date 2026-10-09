import React, { useEffect, useState } from 'react';


const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// 分层立绘渲染器：同尺寸透明 PNG 按 z 序叠放，部件级动画
// （刘海/双侧发摆动、眼睑眨眼、嘴部口型、虹膜视线、眉毛情绪），
// 对应拆件清单 PET_RIGS。
export const LayeredPetRig = ({ rig, isSpeaking = false, look = { x: 0, y: 0 }, mood = 'idle', className = '', fallbackSrc = '' }) => {
  const [isBroken, setIsBroken] = useState(false);
  const [talkIdx, setTalkIdx] = useState(0);

  useEffect(() => {
    if (!isSpeaking) {
      setTalkIdx(0);
      return undefined;
    }
    const timer = window.setInterval(() => setTalkIdx((idx) => idx + 1), 150);
    return () => window.clearInterval(timer);
  }, [isSpeaking]);

  const gazeX = clamp((look.x || 0) * 0.7, -5, 5);
  const gazeY = clamp((look.y || 0) * 0.35, -2.5, 2.5);
  const browShift = mood === 'happy' ? -2.5 : mood === 'hammered' ? 1.5 : 0;

  if (isBroken && fallbackSrc) {
    return <img className={className} src={fallbackSrc} alt="桌宠立绘" draggable="false" />;
  }

  return (
    <div className={`pet-rig ${className}`} data-rig-layers={rig.layers.length}>
      {rig.layers.map((layer) => {
        if (layer.mode === 'talk') {
          const active = isSpeaking ? talkIdx % layer.frames.length : -1;
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
        if (layer.mode === 'gaze' && rig.clip) style.clipPath = rig.clip;
        return (
          <img
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

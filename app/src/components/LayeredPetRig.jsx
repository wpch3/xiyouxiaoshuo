import React, { useEffect, useState } from 'react';


const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// 分层立绘渲染器：同尺寸透明 PNG 按 z 序叠放，部件级动画
// （刘海/双侧发摆动、眼睑眨眼、嘴部口型、虹膜视线、眉毛情绪），
// 对应拆件清单 PET_RIGS。
export const LayeredPetRig = ({ rig, isSpeaking = false, look = { x: 0, y: 0 }, mood = 'idle', className = '', fallbackSrc = '' }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    let blinkTimer;
    let hideTimer;
    const schedule = () => {
      blinkTimer = window.setTimeout(() => {
        setIsBlinking(true);
        hideTimer = window.setTimeout(() => setIsBlinking(false), 150);
        schedule();
      }, 2600 + Math.random() * 2600);
    };
    schedule();
    return () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return undefined;
    }
    const timer = window.setInterval(() => setMouthOpen((open) => !open), 170);
    return () => window.clearInterval(timer);
  }, [isSpeaking]);

  const gazeX = clamp((look.x || 0) * 0.45, -3.2, 3.2);
  const gazeY = clamp((look.y || 0) * 0.35, -2.2, 2.2);
  const browShift = mood === 'happy' ? -2.5 : mood === 'hammered' ? 1.5 : 0;

  if (isBroken && fallbackSrc) {
    return <img className={className} src={fallbackSrc} alt="桌宠立绘" draggable="false" />;
  }

  return (
    <div className={`pet-rig ${className}`} data-rig-layers={rig.layers.length}>
      {rig.layers.map((layer) => {
        const visible = layer.mode === 'base' || layer.mode === 'static'
          || layer.mode.startsWith('sway')
          || layer.mode === 'gaze' || layer.mode === 'brow'
          || layer.mode === 'arm_rest'
          || (layer.mode === 'arm_wave' && mood === 'waving')
          || (layer.mode === 'blink' && isBlinking)
          || (layer.mode === 'talk' && mouthOpen);
        let transform;
        if (layer.mode === 'gaze') transform = `translate(${gazeX}px, ${gazeY}px)`;
        if (layer.mode === 'brow') transform = `translateY(${browShift}px)`;
        return (
          <img
            key={layer.id}
            className={`pet-rig-layer pet-rig-${layer.mode}${layer.mode.startsWith('sway') ? ` pet-rig-${layer.mode}-anim` : ''}`}
            src={layer.src}
            alt=""
            draggable="false"
            onError={() => setIsBroken(true)}
            style={{ zIndex: layer.z, opacity: visible ? 1 : 0, transform }}
          />
        );
      })}
    </div>
  );
};

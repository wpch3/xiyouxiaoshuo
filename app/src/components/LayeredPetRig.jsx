import React, { useEffect, useState } from 'react';

// 分层立绘渲染器：同尺寸透明 PNG 按 z 序叠放，部件级动画
// （刘海摆动 / 眼睑眨眼 / 嘴部口型），对应拆件清单 PET_RIGS。
export const LayeredPetRig = ({ rig, isSpeaking = false, className = '' }) => {
  const [isBlinking, setIsBlinking] = useState(false);
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

  return (
    <div className={`pet-rig ${className}`} data-rig-layers={rig.layers.length}>
      {rig.layers.map((layer) => {
        const visible = layer.mode === 'base'
          || (layer.mode === 'sway')
          || (layer.mode === 'blink' && isBlinking)
          || (layer.mode === 'talk' && mouthOpen);
        return (
          <img
            key={layer.id}
            className={`pet-rig-layer pet-rig-${layer.mode}${layer.mode === 'sway' ? ' pet-rig-sway' : ''}`}
            src={layer.src}
            alt=""
            draggable="false"
            style={{ zIndex: layer.z, opacity: visible ? 1 : 0 }}
          />
        );
      })}
    </div>
  );
};

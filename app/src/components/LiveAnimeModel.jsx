import React, { useState, useEffect, useRef } from 'react';
import { RigPortrait } from './RigPortrait';
import { characterImage, approvedAsset } from '../constants/assets';

/**
 * 主舞台立绘。
 * - 通过质检的素材（app/src/rig/assetManifest.json）使用骨骼动态立绘 RigPortrait：呼吸、摇摆、头部看向鼠标、说话点头、高兴举手跳跃、思考歪头。
 * - 其余素材保持静态显示，不做假动效。
 * - 不做任何身体部位的点击或抚摸反馈。点击只触发整体的反应（onClick）。
 */
export const LiveAnimeModel = ({
  characterId = 'deepseek',
  form = 'normal', // 'normal' (少女) | 'mature' (青年女性) | 'chibi' (Q版)
  mood = 'idle', // 'idle' | 'happy' | 'thinking' | 'sleepy'
  isSpeaking = false,
  size = 340,
  onClick = () => {}
}) => {
  const containerRef = useRef(null);
  // 头部看向鼠标（-1~1）
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.38;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      setLook({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fileName =
    form === 'chibi' ? `${characterId}_chibi.png` : form === 'mature' ? `${characterId}_mature.png` : `${characterId}.png`;
  const src = characterImage(fileName);
  const asset = approvedAsset(fileName);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: size,
        height: size * 1.35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        perspective: '800px',
        overflow: 'visible'
      }}
      className="live-anime-stage"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `rotateY(${look.x * 6}deg) rotateX(${-look.y * 4}deg)`,
          transition: 'transform 0.2s ease-out',
          // 骨骼模式下画布每帧都在变，CSS 滤镜会每帧重算模糊，代价很大，所以改用静态阴影椭圆
          filter: asset ? 'none' : 'drop-shadow(0 15px 30px rgba(0,0,0,0.65))'
        }}
      >
        {asset && (
          <div
            style={{
              position: 'absolute',
              left: '20%',
              right: '20%',
              bottom: '1%',
              height: '7%',
              borderRadius: '50%',
              background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))',
              pointerEvents: 'none'
            }}
          />
        )}
        {asset ? (
          <RigPortrait
            src={src}
            asset={asset}
            mood={mood}
            speaking={isSpeaking}
            look={look}
            onClick={onClick}
            title="点击打个招呼"
            alt={characterId}
          />
        ) : (
          <img
            src={src}
            alt={characterId}
            draggable={false}
            onClick={onClick}
            title="点击打个招呼"
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
          />
        )}
        {mood === 'happy' && (
          <div
            style={{
              position: 'absolute',
              top: '6%',
              right: '8%',
              fontSize: '1.8rem',
              animation: 'floatBob 0.6s infinite alternate',
              pointerEvents: 'none',
              zIndex: 20
            }}
          >
            💖✨
          </div>
        )}
      </div>
    </div>
  );
};

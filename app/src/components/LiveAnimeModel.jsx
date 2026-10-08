import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

/**
 * 真正高可动、物理交互完整的 Live 动画角色驱动模型
 * 修复重点：
 * 1. 彻底移除生硬外浮的 SVG 假眼球圆球！改用二次元原装画面的 2.5D 头部姿态倾斜与视线注视追踪
 * 2. 统一全角色尺寸比例 (所有角色统一对齐，不再出现小寻极小、克劳德极大的错位)
 * 3. 真正可动：
 *    - 自然待机呼吸起伏与物理轻微摇摆
 *    - 举手高兴跳跃与心动特效
 *    - 委屈流泪与抽泣抖动
 *    - 锤子敲打即时受力下沉与眩晕星星
 *    - 猫爪手套温柔抚摸
 */
export const LiveAnimeModel = ({
  characterId = 'deepseek',
  form = 'normal', // 'normal' (少女) | 'loli' (萝莉) | 'mature' (青年女性) | 'chibi' (Q版)
  mood = 'idle', // 'idle' | 'happy' | 'crying' | 'thinking' | 'hammered'
  currentProp = 'none', // 'none' | 'hammer' | 'glove'
  isSpeaking = false,
  size = 340,
  onAction = () => {}
}) => {
  const containerRef = useRef(null);

  // 1. 真实 2.5D 视线与头部倾斜跟随鼠标
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height * 0.38;

      const dx = (e.clientX - eyeCenterX) / (window.innerWidth / 2);
      const dy = (e.clientY - eyeCenterY) / (window.innerHeight / 2);

      // 计算平滑物理视角角度
      setHeadTilt({
        x: Math.max(-1, Math.min(1, dx)) * 10,
        y: Math.max(-1, Math.min(1, dy)) * 6,
        rotY: Math.max(-1, Math.min(1, dx)) * 12, // 左右侧脸微转
        rotX: Math.max(-1, Math.min(1, -dy)) * 8, // 上下微仰头
        rotZ: Math.max(-1, Math.min(1, dx)) * 2.5 // 轻微歪头萌感
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 根据形态解析图像路径
  const getImagePath = () => {
    if (form === 'chibi') return `/characters/${characterId}_chibi.png`;
    if (form === 'loli') return `/characters/${characterId}_loli.png`;
    if (form === 'mature') return `/characters/${characterId}_mature.png`;
    return `/characters/${characterId}.png`;
  };

  const imageSrc = getImagePath();

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
      {/* 2.5D 姿态变换驱动主节点 (跟随鼠标物理侧转与微仰头) */}
      <div
        style={{
          width: '280px',
          height: '380px',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translate3d(${headTilt.x}px, ${headTilt.y}px, 0) rotateX(${headTilt.rotX}deg) rotateY(${headTilt.rotY}deg) rotateZ(${headTilt.rotZ}deg) ${
            mood === 'hammered' ? 'scale(0.92) translateY(14px)' : 'scale(1)'
          }`,
          transition: mood === 'hammered' ? 'transform 0.08s ease-in' : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.3, 1)',
          transformOrigin: 'center 75%'
        }}
      >
        {/* 高清透明统一比例立绘 */}
        <img
          src={imageSrc}
          alt={characterId}
          onError={(e) => {
            // 降级回退
            e.currentTarget.src = `/characters/${characterId}.png`;
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: mood === 'hammered' 
              ? 'brightness(0.85) drop-shadow(0 5px 15px rgba(239, 68, 68, 0.4))' 
              : mood === 'crying'
              ? 'brightness(0.95) drop-shadow(0 10px 25px rgba(59, 130, 246, 0.4))'
              : mood === 'happy'
              ? 'drop-shadow(0 15px 35px rgba(255, 105, 180, 0.55)) brightness(1.05)'
              : 'drop-shadow(0 15px 30px rgba(0,0,0,0.65))',
            pointerEvents: 'none'
          }}
          className={
            mood === 'happy' 
              ? 'character-happy-jump' 
              : mood === 'crying'
              ? 'character-crying-shake'
              : 'character-img-breathing'
          }
        />

        {/* 动态情绪动效：被打哭流泪瀑布 */}
        {mood === 'crying' && (
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: '26%',
              width: '48%',
              height: '30%',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {/* 左泪崩 */}
            <div className="waterfall-tear" style={{ left: 12 }} />
            {/* 右泪崩 */}
            <div className="waterfall-tear" style={{ right: 12 }} />
          </div>
        )}

        {/* 动态道具互动：小锤子砸下 */}
        {currentProp === 'hammer' && (
          <div
            className="prop-hammer-swing"
            style={{
              position: 'absolute',
              top: '8%',
              right: '18%',
              fontSize: '3.2rem',
              pointerEvents: 'none',
              zIndex: 30,
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))'
            }}
          >
            🔨
          </div>
        )}

        {/* 动态道具互动：眩晕星星 (锤击后触发) */}
        {mood === 'hammered' && (
          <div
            style={{
              position: 'absolute',
              top: '12%',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '1.6rem',
              animation: 'spinSlow 2s linear infinite',
              zIndex: 25
            }}
          >
            💫⭐💫
          </div>
        )}

        {/* 动态道具互动：猫爪手套抚摸 */}
        {currentProp === 'glove' && (
          <div
            className="prop-glove-pat"
            style={{
              position: 'absolute',
              top: '16%',
              left: '38%',
              fontSize: '3rem',
              pointerEvents: 'none',
              zIndex: 30,
              filter: 'drop-shadow(0 6px 14px rgba(255,105,180,0.5))'
            }}
          >
            🐾
          </div>
        )}

        {/* 高兴时的举手爱心彩带 */}
        {mood === 'happy' && (
          <div
            style={{
              position: 'absolute',
              top: '10%',
              fontSize: '1.8rem',
              animation: 'floatBob 0.6s infinite alternate',
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

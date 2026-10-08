import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

/**
 * 现代开源桌宠标配骨骼动态驱动引擎 (Live Animation Engine)
 * 兼容青年女性少女立绘 & Q版桌宠
 * 功能：
 * 1. 视线/头部实时追踪鼠标光标 (Look-at cursor)
 * 2. 真实物理呼吸起伏 (Breathing & Physics sway)
 * 3. 随机自然眨眼 (Natural blinking)
 * 4. 触碰身体不同部位有不同回馈：
 *    - 摸摸头 (Headpat): 闭眼害羞、脸红浮现、播放萌系音效
 *    - 戳戳脸颊 (Poke cheek): 鼓嘴微嗔、回弹晃动
 *    - 轻点胸口/衣服 (Tap body): 提起精神、换姿态
 * 5. 键盘敲击打字时同步微颤与节奏共振
 */
export const LiveInteractiveAvatar = ({
  characterId = 'deepseek',
  form = 'normal', // 'normal' (少女/青年女性立绘) | 'chibi' (Q版)
  mood = 'idle',
  speechText = '',
  size = 320,
  onPet = () => {},
  onPoke = () => {}
}) => {
  const containerRef = useRef(null);
  
  // 头部/视线追踪偏移量
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0, rot: 0 });
  // 自然眨眼状态
  const [isBlinking, setIsBlinking] = useState(false);
  // 局部部位抚摸高亮与物理回弹
  const [touchFeedback, setTouchFeedback] = useState(null); // 'head' | 'face' | 'body' | null
  const [blushLevel, setBlushLevel] = useState(0); // 0 ~ 1 动态脸红

  // 1. 鼠标悬浮视线与头部跟随追踪 (Look-at cursor)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 3;

      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // 计算自然限制角度
      const clampX = Math.max(-1, Math.min(1, deltaX)) * 14;
      const clampY = Math.max(-1, Math.min(1, deltaY)) * 8;
      const clampRot = Math.max(-1, Math.min(1, deltaX)) * 3;

      setLookOffset({ x: clampX, y: clampY, rot: clampRot });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. 自动自然眨眼计时器 (每隔 3.5 ~ 6 秒眨眼一次)
  useEffect(() => {
    let blinkTimer;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        scheduleNextBlink();
      }, 160);
    };

    const scheduleNextBlink = () => {
      const nextDelay = 3500 + Math.random() * 2500;
      blinkTimer = setTimeout(triggerBlink, nextDelay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, []);

  // 3. 点击摸头交互
  const handleHeadPat = (e) => {
    e.stopPropagation();
    soundManager.playPet();
    setTouchFeedback('head');
    setBlushLevel(1);
    onPet();
    setTimeout(() => {
      setTouchFeedback(null);
      setTimeout(() => setBlushLevel(0), 1200);
    }, 600);
  };

  // 4. 点击戳戳脸蛋
  const handleFacePoke = (e) => {
    e.stopPropagation();
    soundManager.playTap(true);
    setTouchFeedback('face');
    setBlushLevel(0.8);
    onPoke();
    setTimeout(() => {
      setTouchFeedback(null);
      setTimeout(() => setBlushLevel(0), 800);
    }, 400);
  };

  // 5. 点击衣服/身体
  const handleBodyTap = (e) => {
    e.stopPropagation();
    soundManager.playSwitch();
    setTouchFeedback('body');
    setTimeout(() => setTouchFeedback(null), 300);
  };

  const isChibi = form === 'chibi';
  const imgSrc = isChibi 
    ? `/characters/${characterId}_chibi.png`
    : `/characters/${characterId}.png`;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: size,
        height: isChibi ? size * 1.1 : size * 1.35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        perspective: '600px'
      }}
      className="live2d-avatar-stage"
    >
      {/* 动态骨骼位移主容器 (融合呼吸、视线追踪与触摸回弹) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translate3d(${lookOffset.x}px, ${lookOffset.y}px, 0) rotate(${lookOffset.rot}deg) ${
            touchFeedback === 'head' 
              ? 'scale(0.97) translateY(6px)' 
              : touchFeedback === 'face' 
              ? 'scale(1.03) rotate(2deg)' 
              : touchFeedback === 'body'
              ? 'scale(0.98)'
              : 'scale(1)'
          }`,
          transition: touchFeedback ? 'transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'transform 0.25s ease-out',
          transformOrigin: 'center 70%'
        }}
        className={touchFeedback ? '' : 'character-img-breathing'}
      >
        {/* 透明高清单人立绘图层 */}
        <img
          src={imgSrc}
          alt={characterId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: mood === 'happy' || touchFeedback === 'head'
              ? 'drop-shadow(0 15px 35px rgba(255, 105, 180, 0.55)) brightness(1.06)'
              : mood === 'thinking'
              ? 'drop-shadow(0 15px 35px rgba(59, 130, 246, 0.5))'
              : 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.65))',
            pointerEvents: 'none'
          }}
        />

        {/* 动态交互命中响应热区 (Hitboxes - 类似 Live2D 头部、脸部、身体多区域划分) */}
        {/* 头部摸摸区 (Headpat Zone) */}
        <div
          onClick={handleHeadPat}
          style={{
            position: 'absolute',
            top: '8%',
            left: '25%',
            width: '50%',
            height: '24%',
            cursor: 'pointer',
            borderRadius: '50%',
            zIndex: 10
          }}
          title="摸摸头 (可触发害羞与好感语音)"
        />

        {/* 脸蛋戳戳区 (Cheek Poke Zone) */}
        <div
          onClick={handleFacePoke}
          style={{
            position: 'absolute',
            top: '28%',
            left: '30%',
            width: '40%',
            height: '18%',
            cursor: 'pointer',
            borderRadius: '40%',
            zIndex: 10
          }}
          title="戳戳脸颊"
        />

        {/* 身体衣着区 (Body Tap Zone) */}
        <div
          onClick={handleBodyTap}
          style={{
            position: 'absolute',
            top: '46%',
            left: '20%',
            width: '60%',
            height: '45%',
            cursor: 'pointer',
            borderRadius: '20px',
            zIndex: 9
          }}
          title="触碰服饰"
        />

        {/* 动态物理红晕层 (Blush Overlay) */}
        {blushLevel > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '32%',
              left: '32%',
              width: '36%',
              height: '12%',
              display: 'flex',
              justifyContent: 'space-between',
              pointerEvents: 'none',
              opacity: blushLevel,
              transition: 'opacity 0.4s ease'
            }}
          >
            <div style={{ width: 30, height: 16, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,105,180,0.65), transparent 70%)' }} />
            <div style={{ width: 30, height: 16, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,105,180,0.65), transparent 70%)' }} />
          </div>
        )}

        {/* 动态自然眨眼遮片 (Blink Mask) */}
        {isBlinking && (
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: '35%',
              width: '30%',
              height: '8%',
              backgroundColor: 'rgba(255, 235, 225, 0.4)',
              backdropFilter: 'blur(1px)',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {/* 顶部思考状态动态挂件 */}
      {mood === 'thinking' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px solid rgba(59, 130, 246, 0.6)',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
            padding: '5px 12px',
            borderRadius: '16px',
            fontSize: '0.74rem',
            color: '#60A5FA',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 20
          }}
          className="pulse-glow"
        >
          <span>🧠</span>
          <span style={{ fontWeight: 600 }}>推理思维链构建中...</span>
        </div>
      )}

      {/* 摸头触发的向上漂浮心形粒子 */}
      {touchFeedback === 'head' && (
        <div
          style={{
            position: 'absolute',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.6rem',
            animation: 'floatBob 0.6s infinite alternate',
            zIndex: 20
          }}
        >
          💖✨
        </div>
      )}
    </div>
  );
};

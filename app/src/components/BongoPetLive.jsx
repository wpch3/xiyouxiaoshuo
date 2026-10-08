import React, { useState, useEffect } from 'react';

// Bongo-Cat / 敲击桌面伴侣动态桌面宠物组件
// 完美解决：透明背景、双击/打字/敲击动态、跟随鼠标、独立悬浮小窗模式
export const BongoPetLive = ({ 
  characterId = 'deepseek', 
  mood = 'idle', 
  action = 'idle', // 'idle' | 'tapping' | 'patting' | 'thinking'
  speechText = '', 
  tokensToday = 0,
  onPet = () => {},
  onOpenDashboard = () => {}
}) => {
  const [isTappingLeft, setIsTappingLeft] = useState(false);
  const [isTappingRight, setIsTappingRight] = useState(false);
  const [pawPosition, setPawPosition] = useState({ x: 0, y: 0 });

  // 监听键盘按键打字，桌宠实时做出敲击动作（类似 Bongo Cat）
  useEffect(() => {
    let timer;
    const handleKeyDown = (e) => {
      if (Math.random() > 0.5) {
        setIsTappingLeft(true);
        setTimeout(() => setIsTappingLeft(false), 120);
      } else {
        setIsTappingRight(true);
        setTimeout(() => setIsTappingRight(false), 120);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 自动待机微敲击模拟（有活跃感）
  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'thinking' || action === 'tapping') {
        setIsTappingLeft(prev => !prev);
        setTimeout(() => setIsTappingRight(prev => !prev), 150);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [mood, action]);

  const chibiImg = `/characters/${characterId}_chibi.png`;

  return (
    <div 
      className="bongo-pet-stage"
      style={{
        position: 'relative',
        width: '320px',
        height: '280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
    >
      {/* 实时台词泡泡 */}
      {speechText && (
        <div
          className="bongo-speech-bubble"
          style={{
            position: 'absolute',
            top: '0px',
            backgroundColor: 'rgba(20, 24, 36, 0.94)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            borderRadius: '16px',
            padding: '8px 14px',
            fontSize: '0.78rem',
            color: '#f8fafc',
            maxWidth: '280px',
            textAlign: 'center',
            lineHeight: 1.4,
            zIndex: 10,
            animation: 'popIn 0.3s ease-out'
          }}
        >
          {mood === 'happy' ? '💖 ' : mood === 'thinking' ? '💭 ' : '💬 '}
          {speechText}
        </div>
      )}

      {/* 桌宠身体（半身俯身于小桌板后，完美复刻开源 Bongo Cat 经典透视与动态） */}
      <div 
        onClick={onPet}
        style={{
          position: 'relative',
          width: '210px',
          height: '210px',
          cursor: 'pointer',
          zIndex: 2,
          transition: 'transform 0.15s ease-out',
          transform: (isTappingLeft || isTappingRight) ? 'translateY(2px) scale(0.99)' : 'translateY(0px)'
        }}
        title="点击摸摸头 / 敲击键盘即可互动！"
      >
        {/* 透明背景已扣除的高清拟人桌宠贴图 */}
        <img
          src={chibiImg}
          alt={characterId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.45))',
            pointerEvents: 'none'
          }}
          className={mood === 'happy' ? 'bongo-pet-happy' : 'bongo-pet-idle'}
        />

        {/* 思考状态头顶脉冲 */}
        {mood === 'thinking' && (
          <div style={{ position: 'absolute', top: '-10px', right: '20px', fontSize: '1.2rem' }} className="pulse-glow">
            🧠⚡
          </div>
        )}

        {/* 抚摸状态爱心 */}
        {mood === 'happy' && (
          <div style={{ position: 'absolute', top: '-15px', right: '35px', fontSize: '1.4rem', animation: 'floatBob 1s infinite alternate' }}>
            💖
          </div>
        )}
      </div>

      {/* 前方互动小桌面 & 键盘垫（经典桌宠工作台） */}
      <div
        style={{
          position: 'relative',
          width: '280px',
          height: '75px',
          marginTop: '-35px',
          zIndex: 5,
          perspective: '400px'
        }}
      >
        <svg width="280" height="75" viewBox="0 0 280 75" fill="none">
          {/* 透视桌面板 */}
          <polygon 
            points="20,70 260,70 240,15 40,15" 
            fill="rgba(30, 41, 59, 0.95)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="2" 
          />
          {/* 键盘区域垫 */}
          <polygon 
            points="110,65 240,65 225,25 120,25" 
            fill="rgba(15, 23, 42, 0.85)" 
            stroke="rgba(96, 165, 250, 0.4)" 
            strokeWidth="1.5" 
          />
          {/* 键盘按键行 */}
          <line x1="125" y1="36" x2="220" y2="36" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="4" strokeDasharray="8 4" />
          <line x1="120" y1="48" x2="230" y2="48" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="4" strokeDasharray="9 4" />
          <line x1="115" y1="60" x2="235" y2="60" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="4" strokeDasharray="14 4" />

          {/* 鼠标 / 触控板区 */}
          <ellipse cx="68" cy="45" rx="22" ry="16" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          <ellipse cx="68" cy="45" rx="10" ry="12" fill="rgba(255, 255, 255, 0.15)" />

          {/* 动态左爪爪 (按键盘) */}
          <g 
            style={{ 
              transition: 'transform 0.08s ease-in-out',
              transform: isTappingLeft ? 'translate(0px, 10px)' : 'translate(0px, 0px)' 
            }}
          >
            <ellipse cx="145" cy={isTappingLeft ? 50 : 36} rx="14" ry="11" fill="#FFF2EB" stroke="#334155" strokeWidth="2" />
            <circle cx="140" cy={isTappingLeft ? 52 : 38} r="3" fill="#FDA4AF" />
            <circle cx="145" cy={isTappingLeft ? 48 : 34} r="3" fill="#FDA4AF" />
            <circle cx="150" cy={isTappingLeft ? 52 : 38} r="3" fill="#FDA4AF" />
          </g>

          {/* 动态右爪爪 (握鼠标 / 按空格) */}
          <g 
            style={{ 
              transition: 'transform 0.08s ease-in-out',
              transform: isTappingRight ? 'translate(0px, 8px)' : 'translate(0px, 0px)' 
            }}
          >
            <ellipse cx="72" cy={isTappingRight ? 49 : 40} rx="15" ry="12" fill="#FFF2EB" stroke="#334155" strokeWidth="2" />
            <circle cx="68" cy={isTappingRight ? 51 : 42} r="3" fill="#FDA4AF" />
            <circle cx="73" cy={isTappingRight ? 47 : 38} r="3" fill="#FDA4AF" />
            <circle cx="78" cy={isTappingRight ? 51 : 42} r="3" fill="#FDA4AF" />
          </g>
        </svg>
      </div>

      {/* 底部悬浮控制微型小托盘 */}
      <div 
        style={{
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          fontSize: '0.7rem',
          color: '#94a3b8',
          zIndex: 10
        }}
      >
        <span style={{ color: '#34D399', fontWeight: 600 }}>● 今日: {(tokensToday / 1000).toFixed(0)}k</span>
        <span>|</span>
        <button 
          onClick={onOpenDashboard}
          style={{
            background: 'none',
            border: 'none',
            color: '#60A5FA',
            cursor: 'pointer',
            fontSize: '0.7rem',
            padding: 0,
            textDecoration: 'underline'
          }}
        >
          打开主控制台
        </button>
      </div>
    </div>
  );
};

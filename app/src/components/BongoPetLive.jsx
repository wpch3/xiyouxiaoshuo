import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/soundManager';

// 升级版高交互动感桌宠：包含键盘机械轴敲击音效、爪子起伏、眨眼微动、爱心音浪与点击波纹
export const BongoPetLive = ({ 
  characterId = 'deepseek', 
  mood = 'idle', 
  speechText = '', 
  tokensToday = 0,
  onPet = () => {},
  onOpenDashboard = () => {}
}) => {
  const [isTappingLeft, setIsTappingLeft] = useState(false);
  const [isTappingRight, setIsTappingRight] = useState(false);
  const [petRipples, setPetRipples] = useState([]);
  const [tapCount, setTapCount] = useState(0);

  // 1. 监听全局键盘敲击（用户打字时，桌宠实时做出敲击动作并播放清脆键盘轴音效）
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 忽略功能键
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

      const pickLeft = Math.random() > 0.5;
      if (pickLeft) {
        setIsTappingLeft(true);
        soundManager.playTap(true);
        setTimeout(() => setIsTappingLeft(false), 110);
      } else {
        setIsTappingRight(true);
        soundManager.playTap(false);
        setTimeout(() => setIsTappingRight(false), 110);
      }
      setTapCount(c => c + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. 待机/思考时的自发灵动微敲击
  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'thinking') {
        setIsTappingLeft(true);
        soundManager.playTap(true);
        setTimeout(() => {
          setIsTappingLeft(false);
          setIsTappingRight(true);
          soundManager.playTap(false);
          setTimeout(() => setIsTappingRight(false), 120);
        }, 140);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [mood]);

  // 3. 点击桌宠抚摸：产生动态扩散波纹 + 萌系叮咚音效 + 飘动爱心
  const handlePetClick = (e) => {
    soundManager.playPet();
    onPet();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newId = Date.now();
    setPetRipples(prev => [...prev.slice(-4), { id: newId, x, y }]);
    setTimeout(() => {
      setPetRipples(prev => prev.filter(r => r.id !== newId));
    }, 800);

    // 局部爱心粒子喷发
    try {
      confetti({
        particleCount: 18,
        spread: 60,
        startVelocity: 20,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        },
        colors: ['#FF69B4', '#FDA4AF', '#F43F5E', '#FFFFFF'],
        scalar: 0.85
      });
    } catch (err) {}
  };

  const chibiImg = `/characters/${characterId}_chibi.png`;

  return (
    <div 
      className="bongo-pet-stage"
      style={{
        position: 'relative',
        width: '340px',
        height: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
    >
      {/* 实时台词对话气泡 */}
      {speechText && (
        <div
          className="bongo-speech-bubble"
          style={{
            position: 'absolute',
            top: '0px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
            borderRadius: '18px',
            padding: '8px 16px',
            fontSize: '0.8rem',
            color: '#f8fafc',
            maxWidth: '300px',
            textAlign: 'center',
            lineHeight: 1.45,
            zIndex: 15,
            animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {mood === 'happy' ? '💖 ' : mood === 'thinking' ? '💭 ' : '💬 '}
          {speechText}
        </div>
      )}

      {/* 动态身体立绘 (支持抚摸波纹与点击晃动) */}
      <div 
        onClick={handlePetClick}
        style={{
          position: 'relative',
          width: '230px',
          height: '230px',
          cursor: 'pointer',
          zIndex: 2,
          transition: 'transform 0.12s ease-out',
          transform: (isTappingLeft || isTappingRight) 
            ? 'translateY(2px) scale(0.99)' 
            : mood === 'happy' 
            ? 'translateY(-6px) scale(1.03)' 
            : 'translateY(0px)'
        }}
        title="抚摸脑袋会有可爱音效和爱心！敲键盘桌宠也会同步打字！"
      >
        {/* 透明背景已扣除的高清拟人桌宠贴图 */}
        <img
          src={chibiImg}
          alt={characterId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: mood === 'happy'
              ? 'drop-shadow(0 15px 30px rgba(255, 105, 180, 0.5)) brightness(1.08)'
              : 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))',
            pointerEvents: 'none'
          }}
          className={mood === 'happy' ? 'bongo-pet-happy' : 'bongo-pet-idle'}
        />

        {/* 点击产生的爱心光晕波纹 */}
        {petRipples.map(r => (
          <span
            key={r.id}
            style={{
              position: 'absolute',
              left: r.x - 25,
              top: r.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 105, 180, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              pointerEvents: 'none',
              animation: 'rippleWave 0.75s ease-out forwards'
            }}
          />
        ))}

        {/* 思考状态头顶脉冲 */}
        {mood === 'thinking' && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '-12px', 
              right: '25px', 
              fontSize: '1.3rem',
              filter: 'drop-shadow(0 0 10px #60A5FA)'
            }} 
            className="pulse-glow"
          >
            🧠⚡
          </div>
        )}

        {/* 抚摸状态双爱心 */}
        {mood === 'happy' && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '35px', 
              fontSize: '1.5rem', 
              animation: 'floatBob 0.8s infinite alternate' 
            }}
          >
            💖✨
          </div>
        )}
      </div>

      {/* 前方互动小桌面 & 键盘垫（经典桌宠工作台） */}
      <div
        style={{
          position: 'relative',
          width: '300px',
          height: '80px',
          marginTop: '-38px',
          zIndex: 5,
          perspective: '450px'
        }}
      >
        <svg width="300" height="80" viewBox="0 0 300 80" fill="none">
          {/* 透视桌面底板 */}
          <polygon 
            points="20,76 280,76 258,16 42,16" 
            fill="rgba(30, 41, 59, 0.96)" 
            stroke="rgba(255, 255, 255, 0.25)" 
            strokeWidth="2" 
          />
          {/* 键盘垫底座 */}
          <polygon 
            points="115,70 258,70 242,26 128,26" 
            fill="rgba(15, 23, 42, 0.9)" 
            stroke="rgba(96, 165, 250, 0.45)" 
            strokeWidth="1.8" 
          />
          {/* 机械键盘三排发光按键 */}
          <line x1="135" y1="38" x2="238" y2="38" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="4.5" strokeDasharray="8 4" />
          <line x1="130" y1="50" x2="248" y2="50" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="4.5" strokeDasharray="9 4" />
          <line x1="125" y1="63" x2="252" y2="63" stroke="rgba(96, 165, 250, 0.6)" strokeWidth="4.5" strokeDasharray="16 5" />

          {/* 鼠标区域 */}
          <ellipse cx="74" cy="48" rx="24" ry="17" fill="rgba(255, 255, 255, 0.09)" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
          <ellipse cx="74" cy="48" rx="11" ry="13" fill="rgba(255, 255, 255, 0.16)" />

          {/* 动态左爪爪 (按键盘) */}
          <g 
            style={{ 
              transition: 'transform 0.07s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
              transform: isTappingLeft ? 'translate(0px, 12px)' : 'translate(0px, 0px)' 
            }}
          >
            <ellipse cx="155" cy={isTappingLeft ? 54 : 38} rx="15" ry="12" fill="#FFF4ED" stroke="#1E293B" strokeWidth="2.2" />
            <circle cx="150" cy={isTappingLeft ? 56 : 40} r="3.2" fill="#FB7185" />
            <circle cx="155" cy={isTappingLeft ? 52 : 36} r="3.2" fill="#FB7185" />
            <circle cx="160" cy={isTappingLeft ? 56 : 40} r="3.2" fill="#FB7185" />
          </g>

          {/* 动态右爪爪 (握鼠标 / 快速点击) */}
          <g 
            style={{ 
              transition: 'transform 0.07s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
              transform: isTappingRight ? 'translate(0px, 10px)' : 'translate(0px, 0px)' 
            }}
          >
            <ellipse cx="78" cy={isTappingRight ? 52 : 42} rx="16" ry="13" fill="#FFF4ED" stroke="#1E293B" strokeWidth="2.2" />
            <circle cx="73" cy={isTappingRight ? 54 : 44} r="3.2" fill="#FB7185" />
            <circle cx="78" cy={isTappingRight ? 50 : 40} r="3.2" fill="#FB7185" />
            <circle cx="83" cy={isTappingRight ? 54 : 44} r="3.2" fill="#FB7185" />
          </g>
        </svg>
      </div>

      {/* 底部悬浮信息与展开按钮 */}
      <div 
        style={{
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: '5px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.72rem',
          color: '#cbd5e1',
          zIndex: 10
        }}
      >
        <span style={{ color: '#34D399', fontWeight: 600 }}>● 今日: {(tokensToday / 1000).toFixed(0)}k</span>
        <span style={{ color: '#64748b' }}>|</span>
        <span style={{ color: '#FBBF24' }}>⌨️ 连击: {tapCount}</span>
        <span style={{ color: '#64748b' }}>|</span>
        <button 
          onClick={onOpenDashboard}
          style={{
            background: 'none',
            border: 'none',
            color: '#60A5FA',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 600,
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

import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/soundManager';

/**
 * 经典开源 Bongo Cat 真实键鼠联动工作台
 * 核心修复：
 * 1. 鼠标真正实时联动：鼠标在屏幕移动时，桌宠右爪精确跟随握持鼠标同步微动！
 * 2. 键盘四向精准响应：
 *    - 按 A 键: 左手敲击左侧键盘
 *    - 按 D 键: 左手敲击右侧键盘
 *    - 按 W 键 / 上方向键: 向上抬手击键
 *    - 按 S 键 / 空格键: 向下按压空格长键
 * 3. 机械键盘对应键位发光高亮反馈
 */
export const BongoRealDesk = ({
  characterId = 'deepseek',
  mood = 'idle',
  speechText = '',
  tokensToday = 0,
  onPet = () => {},
  onOpenDashboard = () => {}
}) => {
  // 鼠标右爪位置实时映射 (0 ~ 1 归一化)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  // 键盘各键按下状态
  const [activeKey, setActiveKey] = useState(null); // 'A' | 'D' | 'W' | 'S' | 'SPACE'
  const [tapCombo, setTapCombo] = useState(0);

  // 1. 真实屏幕鼠标位置追踪
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const normX = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      const normY = Math.max(0, Math.min(1, e.clientY / window.innerHeight));
      setMousePos({ x: normX, y: normY });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // 2. 真实物理键盘按键精准映射
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toUpperCase();
      let detected = null;

      if (k === 'A' || e.key === 'ArrowLeft') {
        detected = 'A';
        soundManager.playTap(true);
      } else if (k === 'D' || e.key === 'ArrowRight') {
        detected = 'D';
        soundManager.playTap(false);
      } else if (k === 'W' || e.key === 'ArrowUp') {
        detected = 'W';
        soundManager.playTap(true);
      } else if (k === 'S' || e.key === 'ArrowDown') {
        detected = 'S';
        soundManager.playTap(false);
      } else if (k === ' ' || e.code === 'Space') {
        detected = 'SPACE';
        soundManager.playTap(false);
      } else if (!['SHIFT', 'CONTROL', 'ALT'].includes(k)) {
        // 其他字符键随机敲击
        detected = Math.random() > 0.5 ? 'A' : 'D';
        soundManager.playTap(detected === 'A');
      }

      if (detected) {
        setActiveKey(detected);
        setTapCombo(c => c + 1);
        setTimeout(() => setActiveKey(null), 120);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const chibiImg = `/characters/${characterId}_chibi.png`;

  // 计算鼠标垫上的鼠标与右爪物理偏移 (px)
  const mousePadOffsetX = (mousePos.x - 0.5) * 36;
  const mousePadOffsetY = (mousePos.y - 0.5) * 20;

  return (
    <div
      style={{
        position: 'relative',
        width: '340px',
        height: '310px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        userSelect: 'none'
      }}
      className="bongo-real-desk-stage"
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
          {mood === 'happy' ? '💖 ' : mood === 'crying' ? '😭 ' : '💬 '}
          {speechText}
        </div>
      )}

      {/* 桌宠身体 (半身俯身在工作台后，律动与受力回弹) */}
      <div
        onClick={onPet}
        style={{
          position: 'relative',
          width: '210px',
          height: '210px',
          cursor: 'pointer',
          zIndex: 2,
          transition: 'transform 0.1s ease-out',
          transform: activeKey ? 'translateY(3px) scale(0.99)' : mood === 'happy' ? 'translateY(-6px) scale(1.03)' : 'translateY(0)'
        }}
        title="点击摸摸头！在键盘按 W A S D 或打字，桌宠爪爪精准同步！"
      >
        <img
          src={chibiImg}
          alt={characterId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))',
            pointerEvents: 'none'
          }}
          className={mood === 'happy' ? 'bongo-pet-happy' : 'bongo-pet-idle'}
        />

        {mood === 'happy' && (
          <div style={{ position: 'absolute', top: -15, right: 30, fontSize: '1.4rem' }}>💖✨</div>
        )}
      </div>

      {/* 前方经典透视工作台 (包含精确鼠标垫、键盘按键区与双爪) */}
      <div
        style={{
          position: 'relative',
          width: '320px',
          height: '90px',
          marginTop: '-45px',
          zIndex: 6,
          perspective: '500px'
        }}
      >
        <svg width="320" height="90" viewBox="0 0 320 90" fill="none">
          {/* 桌面大板 */}
          <polygon points="15,86 305,86 280,18 40,18" fill="rgba(30, 41, 59, 0.98)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />

          {/* 左侧键盘区域 */}
          <polygon points="130,78 285,78 270,28 145,28" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1.8" />
          
          {/* 键盘按键与动态发光 */}
          {/* W 键 */}
          <rect x="195" y="34" width="18" height="10" rx="2" fill={activeKey === 'W' ? '#60A5FA' : 'rgba(255,255,255,0.2)'} />
          {/* A 键 */}
          <rect x="175" y="48" width="18" height="10" rx="2" fill={activeKey === 'A' ? '#60A5FA' : 'rgba(255,255,255,0.2)'} />
          {/* S 键 */}
          <rect x="195" y="48" width="18" height="10" rx="2" fill={activeKey === 'S' ? '#60A5FA' : 'rgba(255,255,255,0.2)'} />
          {/* D 键 */}
          <rect x="215" y="48" width="18" height="10" rx="2" fill={activeKey === 'D' ? '#60A5FA' : 'rgba(255,255,255,0.2)'} />
          {/* SPACE 空格大键 */}
          <rect x="175" y="62" width="60" height="10" rx="3" fill={activeKey === 'SPACE' ? '#34D399' : 'rgba(255,255,255,0.3)'} />

          {/* 右侧鼠标垫区域 */}
          <ellipse cx="80" cy="52" rx="32" ry="22" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          
          {/* 鼠标本体 (实时随你鼠标移动偏移) */}
          <g transform={`translate(${mousePadOffsetX}, ${mousePadOffsetY})`}>
            <ellipse cx="80" cy="52" rx="13" ry="16" fill="rgba(15, 23, 42, 0.95)" stroke="#60A5FA" strokeWidth="1.5" />
            <line x1="80" y1="38" x2="80" y2="52" stroke="#60A5FA" strokeWidth="1.5" />
          </g>

          {/* 真实动态左爪爪 (打字键盘打击点精确落在按键上) */}
          <g
            style={{
              transition: 'transform 0.06s ease-out',
              transform: activeKey === 'A' 
                ? 'translate(-10px, 12px)' 
                : activeKey === 'D' 
                ? 'translate(14px, 12px)' 
                : activeKey === 'W'
                ? 'translate(0px, 2px)'
                : activeKey === 'S' || activeKey === 'SPACE'
                ? 'translate(0px, 16px)'
                : 'translate(0px, 0px)'
            }}
          >
            <ellipse cx="195" cy={activeKey ? 50 : 38} rx="16" ry="12" fill="#FFF4ED" stroke="#1E293B" strokeWidth="2.2" />
            <circle cx="190" cy={activeKey ? 52 : 40} r="3" fill="#FB7185" />
            <circle cx="195" cy={activeKey ? 48 : 36} r="3" fill="#FB7185" />
            <circle cx="200" cy={activeKey ? 52 : 40} r="3" fill="#FB7185" />
          </g>

          {/* 真实动态右爪爪 (精确握持在你的鼠标位置上，随光标同步移动！) */}
          <g
            style={{
              transition: 'transform 0.08s ease-out',
              transform: `translate(${mousePadOffsetX}, ${mousePadOffsetY})`
            }}
          >
            <ellipse cx="80" cy="46" rx="16" ry="13" fill="#FFF4ED" stroke="#1E293B" strokeWidth="2.2" />
            <circle cx="75" cy="48" r="3" fill="#FB7185" />
            <circle cx="80" cy="44" r="3" fill="#FB7185" />
            <circle cx="85" cy="48" r="3" fill="#FB7185" />
          </g>
        </svg>
      </div>

      {/* 底部悬浮信息与展开按钮 */}
      <div 
        style={{
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '4px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '0.72rem',
          color: '#cbd5e1',
          zIndex: 10
        }}
      >
        <span style={{ color: '#34D399', fontWeight: 600 }}>● 今日: {(tokensToday / 1000).toFixed(0)}k</span>
        <span style={{ color: '#64748b' }}>|</span>
        <span style={{ color: '#FBBF24' }}>⌨️ 连击: {tapCombo}</span>
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

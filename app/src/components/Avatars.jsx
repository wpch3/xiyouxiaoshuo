import React from 'react';

export const CharacterImage = ({ characterId, mood = 'idle', outfit = 'default', size = 320 }) => {
  const imageMap = {
    deepseek: '/characters/deepseek.png',
    claude: '/characters/claude.png',
    openai: '/characters/openai.png',
    gemini: '/characters/gemini.png',
    qwen: '/characters/qwen.png',
    kimi: '/characters/kimi.png',
    grok: '/characters/grok.png'
  };

  const imgSrc = imageMap[characterId] || imageMap.deepseek;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size * 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible'
      }}
      className="character-container"
    >
      {/* 待机动画图片立绘 */}
      <img
        src={imgSrc}
        alt={characterId}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: mood === 'happy' 
            ? 'drop-shadow(0 15px 30px rgba(255, 215, 0, 0.5)) brightness(1.06)' 
            : mood === 'sleepy'
            ? 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4)) brightness(0.85) grayscale(0.2)'
            : 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.65))',
          transform: mood === 'happy' 
            ? 'scale(1.04) translateY(-8px)' 
            : mood === 'thinking' 
            ? 'scale(0.97)' 
            : mood === 'sleepy'
            ? 'scale(0.96) translateY(5px)'
            : 'scale(1)',
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        className="character-img-breathing"
      />

      {/* 情绪状态挂件 */}
      {mood === 'thinking' && (
        <div
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.35)',
            padding: '4px 12px',
            borderRadius: '14px',
            fontSize: '0.75rem',
            color: '#60A5FA',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          className="pulse-glow"
        >
          <span style={{ fontSize: '0.9rem' }}>🧠</span>
          <span style={{ fontWeight: 600 }}>深度推理中...</span>
        </div>
      )}

      {mood === 'sleepy' && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            fontSize: '1.2rem',
            animation: 'floatBob 2s infinite ease-in-out',
            color: '#94A3B8'
          }}
        >
          💤 Zzz...
        </div>
      )}

      {mood === 'happy' && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            display: 'flex',
            gap: '10px',
            animation: 'floatBob 1s infinite alternate'
          }}
        >
          <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 8px #FF69B4)' }}>💖</span>
          <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 2px 8px #FFD700)' }}>✨</span>
        </div>
      )}
    </div>
  );
};

export const AvatarRenderer = ({ characterId, mood = 'idle', outfit = 'default', size = 300 }) => {
  return <CharacterImage characterId={characterId} mood={mood} outfit={outfit} size={size} />;
};

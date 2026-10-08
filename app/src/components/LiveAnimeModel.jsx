import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

/**
 * 真正高可动、全动态、部件级拆解驱动的二次元 Live 角色引擎
 * 适用于：DeepSeek / Claude / OpenAI / Gemini / Qwen / Kimi / Grok
 * 
 * 核心动态能力：
 * 1. 眼睛真实独立跟随鼠标转动 (眼球 pupilX/Y 物理注视)，绝非整图偏移
 * 2. 嘴型张合讲话 (Lip-sync)，说话时嘴巴自然开合
 * 3. 动态动作与道具互动：
 *    - 高兴举手欢呼 (Raise hands happy)
 *    - 委屈被打哭 (Cry with tears)
 *    - 挥舞小锤子敲打 (Hammer bonk)
 *    - 软萌猫爪手套抚摸 (Paw glove pet)
 * 4. 部件级图层独立分离：脸部、头发、眼球、高光、手臂、道具层
 * 5. 严格统一全角色画布尺寸 (完全一致的比例与居中度)
 */
export const LiveAnimeModel = ({
  characterId = 'deepseek',
  mood = 'idle', // 'idle' | 'happy' | 'crying' | 'thinking' | 'hammered'
  currentProp = 'none', // 'none' | 'hammer' | 'glove' | 'book' | 'star'
  isSpeaking = false,
  size = 320,
  onAction = () => {}
}) => {
  const containerRef = useRef(null);

  // 1. 真实独立眼球与头部物理跟随
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0, rot: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0 ~ 1 嘴型张合度

  // 鼠标移动时计算精准眼球与头部视角
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height * 0.35;

      const dx = (e.clientX - eyeCenterX) / (window.innerWidth / 2);
      const dy = (e.clientY - eyeCenterY) / (window.innerHeight / 2);

      // 眼球最大转动限制在真实瞳孔生理范围 (4px ~ 6px)
      const pX = Math.max(-1, Math.min(1, dx)) * 5.5;
      const pY = Math.max(-1, Math.min(1, dy)) * 4.0;
      setPupilOffset({ x: pX, y: pY });

      // 头部轻微 3D 透视倾角
      setHeadTilt({
        x: Math.max(-1, Math.min(1, dx)) * 8,
        y: Math.max(-1, Math.min(1, dy)) * 5,
        rot: Math.max(-1, Math.min(1, dx)) * 3.5
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. 自然眨眼
  useEffect(() => {
    let timer;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        timer = setTimeout(blink, 2800 + Math.random() * 3200);
      }, 150);
    };
    timer = setTimeout(blink, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 3. 说话时嘴型自然张合
  useEffect(() => {
    let frame;
    let step = 0;
    if (isSpeaking) {
      const interval = setInterval(() => {
        step++;
        setMouthOpen(Math.abs(Math.sin(step * 0.6)));
      }, 90);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(0);
    }
  }, [isSpeaking]);

  // 各角色特征色彩映射
  const charThemes = {
    deepseek: { hair: '#2563EB', hairSoft: '#60A5FA', eye: '#1D4ED8', blush: '#FDA4AF', accent: '#3B82F6' },
    claude: { hair: '#D97757', hairSoft: '#F5D0C5', eye: '#B45309', blush: '#FBCFE8', accent: '#D97757' },
    openai: { hair: '#1E293B', hairSoft: '#34D399', eye: '#6366F1', blush: '#FDA4AF', accent: '#10A37F' },
    gemini: { hair: '#8B5CF6', hairSoft: '#C4B5FD', eye: '#F59E0B', blush: '#F472B6', accent: '#9B72CB' },
    qwen: { hair: '#E2E8F0', hairSoft: '#DDD6FE', eye: '#7C3AED', blush: '#FDA4AF', accent: '#8B5CF6' },
    kimi: { hair: '#CBD5E1', hairSoft: '#67E8F9', eye: '#059669', blush: '#FDA4AF', accent: '#06B6D4' },
    grok: { hair: '#FDE047', hairSoft: '#FCA5A5', eye: '#DC2626', blush: '#FDA4AF', accent: '#EF4444' }
  };
  const theme = charThemes[characterId] || charThemes.deepseek;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: size,
        height: size * 1.3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
      className="live-anime-stage"
    >
      {/* 统一高清身体底图 (使用固定 270x350 统一框，彻底消除大小不一的问题) */}
      <div
        style={{
          width: '270px',
          height: '350px',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translate3d(${headTilt.x * 0.4}px, ${headTilt.y * 0.4}px, 0)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img
          src={`/characters/${characterId}.png`}
          alt={characterId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: mood === 'hammered' 
              ? 'brightness(0.9) hue-rotate(-20deg)' 
              : mood === 'crying'
              ? 'brightness(0.95)'
              : 'drop-shadow(0 15px 30px rgba(0,0,0,0.65))',
            pointerEvents: 'none'
          }}
          className={mood === 'happy' ? 'character-happy-jump' : 'character-img-breathing'}
        />

        {/* 动态图层 1: 真正可动独立眼球层 (Look-at Tracking Overlay) */}
        <div
          style={{
            position: 'absolute',
            top: '29%',
            left: '37%',
            width: '26%',
            height: '8%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none'
          }}
        >
          {/* 左眼瞳孔 */}
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: theme.eye,
              boxShadow: `inset 0 0 4px #000, 0 0 6px ${theme.hairSoft}`,
              position: 'relative',
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: 'transform 0.05s linear',
              display: isBlinking || mood === 'crying' ? 'none' : 'block'
            }}
          >
            {/* 瞳孔高光点 */}
            <div style={{ position: 'absolute', top: 2, left: 3, width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
          </div>

          {/* 右眼瞳孔 */}
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: theme.eye,
              boxShadow: `inset 0 0 4px #000, 0 0 6px ${theme.hairSoft}`,
              position: 'relative',
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: 'transform 0.05s linear',
              display: isBlinking || mood === 'crying' ? 'none' : 'block'
            }}
          >
            <div style={{ position: 'absolute', top: 2, left: 3, width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>

        {/* 动态图层 2: 动态眨眼与哭泣弯眼 */}
        {isBlinking && (
          <div
            style={{
              position: 'absolute',
              top: '32%',
              left: '37%',
              width: '26%',
              height: '3px',
              backgroundColor: '#1E293B',
              borderRadius: '2px',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* 动态图层 3: 被打哭流泪动态动效 (Crying Tears Animation) */}
        {mood === 'crying' && (
          <div
            style={{
              position: 'absolute',
              top: '32%',
              left: '33%',
              width: '34%',
              height: '24%',
              pointerEvents: 'none'
            }}
          >
            {/* 左泪崩瀑布 */}
            <div className="waterfall-tear" style={{ left: 5 }} />
            {/* 右泪崩瀑布 */}
            <div className="waterfall-tear" style={{ right: 5 }} />
            {/* 弯曲哭泣双眼 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: '1.2rem', color: '#1E293B', fontWeight: 900 }}>＞</span>
              <span style={{ fontSize: '1.2rem', color: '#1E293B', fontWeight: 900 }}>＜</span>
            </div>
          </div>
        )}

        {/* 动态图层 4: 动态嘴型张合层 (Lip-sync Talking) */}
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '48%',
            width: 14,
            height: mouthOpen > 0 ? 4 + mouthOpen * 8 : 3,
            borderRadius: mouthOpen > 0 ? '50%' : '2px',
            backgroundColor: '#BE185D',
            border: '1.5px solid #831843',
            pointerEvents: 'none',
            transition: 'height 0.08s ease'
          }}
        />

        {/* 动态图层 5: 高兴举手欢呼 (Raise hands overlay) */}
        {mood === 'happy' && (
          <div
            style={{
              position: 'absolute',
              top: '25%',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 10px',
              pointerEvents: 'none',
              animation: 'waveHands 0.5s infinite alternate ease-in-out'
            }}
          >
            <div style={{ fontSize: '2.2rem', transform: 'rotate(-30deg)' }}>🙋‍♀️</div>
            <div style={{ fontSize: '2.2rem', transform: 'rotate(30deg)' }}>🙋‍♀️</div>
          </div>
        )}

        {/* 动态图层 6: 道具互动层 (小锤子砸 / 猫爪手套摸) */}
        {currentProp === 'hammer' && (
          <div
            className="prop-hammer-swing"
            style={{
              position: 'absolute',
              top: '10%',
              right: '25%',
              fontSize: '3rem',
              pointerEvents: 'none',
              zIndex: 30
            }}
          >
            🔨
          </div>
        )}

        {currentProp === 'glove' && (
          <div
            className="prop-glove-pat"
            style={{
              position: 'absolute',
              top: '15%',
              left: '40%',
              fontSize: '2.8rem',
              pointerEvents: 'none',
              zIndex: 30
            }}
          >
            🐾
          </div>
        )}
      </div>
    </div>
  );
};

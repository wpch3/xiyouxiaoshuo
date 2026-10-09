import React from 'react';
import { BrainCircuit, Heart, Moon, Sparkles } from 'lucide-react';

const portraitPath = (characterId, form) => {
  if (characterId === 'deepseek') {
    if (form === 'normal') return '/characters/deepseek_live.png';
    return `/characters/deepseek_${form}_live.png`;
  }
  if (form === 'chibi') return `/characters/${characterId}_chibi.png`;
  if (form === 'loli') return `/characters/${characterId}_loli.png`;
  if (form === 'mature') return `/characters/${characterId}_mature.png`;
  return `/characters/${characterId}.png`;
};

export const CharacterImage = ({ characterId = 'deepseek', mood = 'idle', form = 'normal', size = 320 }) => (
  <div className="character-container" style={{ position: 'relative', width: size, height: size * 1.5, display: 'grid', placeItems: 'center', overflow: 'visible' }}>
    <img
      src={portraitPath(characterId, form)}
      onError={(event) => { event.currentTarget.src = `/characters/${characterId}.png`; }}
      alt={`${characterId} 桌宠立绘`}
      draggable="false"
      style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,.42))' }}
      className="character-img-breathing"
    />
    {mood === 'thinking' && <div className="pet-thinking-badge"><BrainCircuit size={17} /><span>正在思考</span></div>}
    {mood === 'sleepy' && <div className="avatar-state-badge"><Moon size={17} /><span>休息中</span></div>}
    {mood === 'happy' && <Heart className="avatar-state-heart" size={27} fill="currentColor" />}
    {mood === 'speaking' && <Sparkles className="avatar-state-sparkle" size={22} />}
  </div>
);

export const AvatarRenderer = ({ characterId, mood = 'idle', outfit = 'default', form = 'normal', size = 300 }) => (
  <CharacterImage characterId={characterId} mood={mood} outfit={outfit} form={form} size={size} />
);

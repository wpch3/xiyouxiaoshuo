import React, { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { getPetRig } from '../constants/petRig';
import { getToolCursor, getToolButtonArt } from '../constants/toolArt';
import { LayeredPetRig } from './LayeredPetRig';

const getPortraitPath = (characterId, form) => {
  if (characterId === 'deepseek') {
    if (form === 'normal') return '/characters/deepseek_live.png';
    return `/characters/deepseek_${form}_live.png`;
  }
  if (form === 'chibi') return `/characters/${characterId}_chibi.png`;
  if (form === 'loli') return `/characters/${characterId}_loli.png`;
  if (form === 'mature') return `/characters/${characterId}_mature.png`;
  return `/characters/${characterId}.png`;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const LiveAnimeModel = ({
  characterId = 'deepseek',
  form = 'normal',
  mood = 'idle',
  activeTool = 'pointer',
  isSpeaking = false,
  size = 320,
  accentColor = '#79A8F4',
  onPet = () => {},
  onHammer = () => {},
}) => {
  const stageRef = useRef(null);
  const pettingRef = useRef(false);
  const impactTimerRef = useRef(null);
  const [look, setLook] = useState({ x: 0, y: 0, rotate: 0 });
  const [touchPoint, setTouchPoint] = useState(null);
  const [impact, setImpact] = useState(null);
  const [isPetting, setIsPetting] = useState(false);
  const [imageSrc, setImageSrc] = useState(getPortraitPath(characterId, form));
  const fallbackImage = `/characters/${characterId}.png`;
  const rig = getPetRig(characterId, form);
  const height = size * 1.5;

  useEffect(() => {
    setImageSrc(getPortraitPath(characterId, form));
  }, [characterId, form]);

  useEffect(() => () => {
    if (impactTimerRef.current) window.clearTimeout(impactTimerRef.current);
  }, []);

  const updateLook = (event) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width / 2, 1);
    const dy = (event.clientY - (rect.top + rect.height * 0.35)) / Math.max(rect.height / 2, 1);
    setLook({
      x: clamp(dx, -1, 1) * 7,
      y: clamp(dy, -1, 1) * 4,
      rotate: clamp(dx, -1, 1) * 1.7,
    });
    if (pettingRef.current) {
      setTouchPoint({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        id: Date.now(),
      });
    }
  };

  const stopPetting = () => {
    pettingRef.current = false;
    setIsPetting(false);
  };

  const handlePointerDown = (event) => {
    if (activeTool === 'pet') {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      pettingRef.current = true;
      setIsPetting(true);
      updateLook(event);
      soundManager.playPet();
      onPet();
      return;
    }

    if (activeTool === 'hammer') {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const nextImpact = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        id: Date.now(),
      };
      setImpact(nextImpact);
      soundManager.playTap(true);
      onHammer();
      if (impactTimerRef.current) window.clearTimeout(impactTimerRef.current);
      impactTimerRef.current = window.setTimeout(() => setImpact(null), 560);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (activeTool === 'pet') {
      soundManager.playPet();
      onPet();
    } else if (activeTool === 'hammer') {
      setImpact({ x: size / 2, y: height * 0.34, id: Date.now() });
      soundManager.playTap(true);
      onHammer();
      window.setTimeout(() => setImpact(null), 560);
    }
  };

  const cursor = activeTool === 'hammer'
    ? getToolCursor(characterId, 'hammer')
    : activeTool === 'pet'
      ? getToolCursor(characterId, 'pet')
      : 'default';

  return (
    <div
      ref={stageRef}
      className={`dynamic-pet-stage tool-${activeTool} mood-${mood}`}
      style={{ width: size, height, '--pet-accent': accentColor, cursor }}
      role="button"
      tabIndex={0}
      aria-label={`${characterId} 桌宠互动区域`}
      onPointerMove={updateLook}
      onPointerDown={handlePointerDown}
      onPointerUp={stopPetting}
      onPointerCancel={stopPetting}
      onPointerLeave={() => {
        if (!pettingRef.current) setLook({ x: 0, y: 0, rotate: 0 });
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="pet-stage-backdrop" aria-hidden="true">
        <div className="pet-stage-halo" />
        <div className="pet-stage-orbit pet-stage-orbit-one" />
        <div className="pet-stage-orbit pet-stage-orbit-two" />
        <div className="pet-stage-floor" />
      </div>

      <div
        className={`pet-pose-layer ${isPetting ? 'is-petting' : ''} ${mood === 'happy' ? 'is-happy' : ''} ${mood === 'hammered' ? 'is-hit' : ''} ${isSpeaking ? 'is-speaking' : ''}`}
        style={{ transform: `translate3d(${look.x}px, ${look.y}px, 0) rotate(${look.rotate}deg)` }}
      >
        {rig ? (
          <LayeredPetRig rig={rig} isSpeaking={isSpeaking} look={{ x: look.x, y: look.y }} mood={mood} className="pet-portrait-image" fallbackSrc={imageSrc} />
        ) : (
          <img
            className="pet-portrait-image"
            src={imageSrc}
            alt={`${characterId} 桌宠立绘`}
            draggable="false"
            onError={() => {
              if (imageSrc !== fallbackImage) setImageSrc(fallbackImage);
            }}
          />
        )}
      </div>

      {mood === 'thinking' && (
        <div className="pet-thinking-badge" aria-hidden="true">
          <BrainCircuit size={19} strokeWidth={1.8} />
          <span>正在思考</span>
        </div>
      )}

      {isPetting && touchPoint && (
        <span
          key={touchPoint.id}
          className="pet-touch-ripple"
          aria-hidden="true"
          style={{ left: touchPoint.x, top: touchPoint.y }}
        />
      )}

      {impact && (
        <div
          key={impact.id}
          className="pet-impact-layer"
          aria-hidden="true"
          style={{ left: impact.x, top: impact.y }}
        >
          <span className="pet-impact-ring" />
          <img className="pet-impact-hammer" src={getToolButtonArt(characterId, 'hammer').src} style={{ filter: getToolButtonArt(characterId, 'hammer').filter }} alt="" />
          <Sparkles className="pet-impact-spark" size={32} color={accentColor} strokeWidth={2.5} />
        </div>
      )}

      <span className="pet-stage-caption" aria-hidden="true">
        {activeTool === 'hammer' ? '点击立绘触发互动' : activeTool === 'pet' ? '按住并拖动抚摸' : '移动鼠标，角色会跟随视线'}
      </span>
    </div>
  );
};

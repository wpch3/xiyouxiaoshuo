import React, { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { getPetRig } from '../constants/petRig';
import { getToolCursor, getToolButtonArt } from '../constants/toolArt';
import { LayeredPetRig } from './LayeredPetRig';

/**
 * 立绘舞台 v2（_clean-room 重写_）。
 *
 * 设计原则（吸取 v1 补丁堆的教训）：
 * 1. 几何单一来源：舞台盒尺寸 = 角色包围盒 + 固定留白，随缩放同步生长，
 *    因此任何缩放倍率下角色既不裁切、也不溢出到外部控件；
 * 2. 角色锚定舞台底边中心缩放（transformOrigin 50% 100%），缩放只改变大小不改变站位；
 * 3. 交互（抚摸/锤击/视线）与渲染（rig 层）完全分离，渲染交给 LayeredPetRig；
 * 4. 无 rig 的形态/角色回退单张立绘，素材 404 再回退默认图。
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// 角色在舞台内的基础占空比（1.0=贴边），留白 = 1 - POSE_FILL
const POSE_FILL = 0.9;
// 舞台盒 = 角色包围盒(size*POSE_FILL*scale) + 留白
const stageWidth = (size, scale) => Math.round(size * (POSE_FILL * scale + 0.1));
const stageHeight = (size, scale) => Math.round(size * 1.62 * POSE_FILL * scale + size * 0.16);

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

export const LiveAnimeModel = ({
  characterId = 'deepseek',
  form = 'normal',
  scale = 1,
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
  const impactTimerRef = useRef(0);

  const [look, setLook] = useState({ x: 0, y: 0, rotate: 0 });
  const [touchPoint, setTouchPoint] = useState(null);
  const [impact, setImpact] = useState(null);
  const [isPetting, setIsPetting] = useState(false);
  const [imageSrc, setImageSrc] = useState(() => getPortraitPath(characterId, form));

  const rig = getPetRig(characterId, form);
  const fallbackImage = `/characters/${characterId}.png`;
  const width = stageWidth(size, scale);
  const height = stageHeight(size, scale);

  useEffect(() => {
    setImageSrc(getPortraitPath(characterId, form));
  }, [characterId, form]);

  useEffect(() => () => window.clearTimeout(impactTimerRef.current), []);

  /* ── 视线：指针相对舞台上部 35% 中心的归一化偏移 ── */
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
      setTouchPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top, id: Date.now() });
    }
  };

  /* ── 交互：抚摸（按住拖动）与锤击（点击落锤） ── */
  const stopPetting = () => {
    pettingRef.current = false;
    setIsPetting(false);
  };

  const triggerHammer = (x, y) => {
    setImpact({ x, y, id: Date.now() });
    soundManager.playTap(true);
    onHammer();
    window.clearTimeout(impactTimerRef.current);
    impactTimerRef.current = window.setTimeout(() => setImpact(null), 560);
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
      triggerHammer(event.clientX - rect.left, event.clientY - rect.top);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (activeTool === 'pet') {
      soundManager.playPet();
      onPet();
    } else if (activeTool === 'hammer') {
      triggerHammer(width / 2, height * 0.34);
    }
  };

  const cursor = activeTool === 'hammer'
    ? getToolCursor(characterId, 'hammer')
    : activeTool === 'pet'
      ? getToolCursor(characterId, 'pet')
      : 'default';

  const hammerArt = getToolButtonArt(characterId, 'hammer');

  /* ── 渲染 ── */
  return (
    <div
      ref={stageRef}
      className={`dynamic-pet-stage tool-${activeTool} mood-${mood} form-${form}`}
      style={{ width, height, '--pet-accent': accentColor, cursor }}
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
        style={{
          transform: `${form === 'chibi' ? `translate3d(${look.x}px, ${look.y}px, 0) rotate(${look.rotate}deg) ` : ''}scale(1)`,
          transformOrigin: '50% 100%',
        }}
      >
        {rig ? (
          <LayeredPetRig
            rig={rig}
            isSpeaking={isSpeaking}
            look={{ x: look.x, y: look.y }}
            mood={mood}
            className="pet-portrait-image"
            fallbackSrc={imageSrc}
          />
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
          <img className="pet-impact-hammer" src={hammerArt.src} style={{ filter: hammerArt.filter }} alt="" />
          <Sparkles className="pet-impact-spark" size={32} color={accentColor} strokeWidth={2.5} />
        </div>
      )}

      <span className="pet-stage-caption" aria-hidden="true">
        {activeTool === 'hammer' ? '点击立绘触发互动' : activeTool === 'pet' ? '按住并拖动抚摸' : '移动鼠标，角色会跟随视线'}
      </span>
    </div>
  );
};

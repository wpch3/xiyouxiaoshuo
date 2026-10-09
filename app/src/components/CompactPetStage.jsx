import React, { useEffect, useRef, useState } from 'react';
import {
  MousePointer2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  FolderOpen,
  X
} from 'lucide-react';
import { LiveAnimeModel } from './LiveAnimeModel';
import { getToolButtonArt } from '../constants/toolArt';

const SCALE_KEY = 'pet_compact_scale_v1';
const MIN_SCALE = 0.5;
const MAX_SCALE = 5; // 500%：小窗放大上限，再大已超出屏幕物理尺寸

const readScale = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SCALE_KEY));
    return typeof saved === 'number' ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, saved)) : 1;
  } catch {
    return 1;
  }
};

/**
 * 桌面小窗（bomcat 风格）：画面只有角色本身 + 余额芯片 + 工作区召唤按钮，
 * 其余全部收进右键小菜单；滚轮缩放 50%–500% 并记忆到本机。
 */
export const CompactPetStage = ({
  characterId = 'deepseek',
  form = 'normal',
  mood = 'idle',
  speechText = '',
  balanceLabel = '0',
  activeTool = 'pointer',
  accentColor = '#79A8F4',
  onPet = () => {},
  onHammer = () => {},
  onSelectTool = () => {},
  onOpenWorkspace = () => {},
  onChooseWorkspace = null,
  onClose = () => {},
  contained = false
}) => {
  const [scale, setScale] = useState(readScale);
  const [menu, setMenu] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(SCALE_KEY, JSON.stringify(scale));
  }, [scale]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const onWheel = (event) => {
      setScale((value) => {
        const next = value * (event.deltaY < 0 ? 1.12 : 0.9);
        return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(next.toFixed(2))));
      });
    };
    node.addEventListener('wheel', onWheel, { passive: true });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const onKey = (event) => {
      if (event.key === 'Escape') setMenu(null);
    };
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const openMenu = (event) => {
    event.preventDefault();
    const width = 196;
    const height = 322;
    setMenu({
      x: Math.max(6, Math.min(event.clientX, window.innerWidth - width - 6)),
      y: Math.max(6, Math.min(event.clientY, window.innerHeight - height - 6))
    });
  };

  const zoomBy = (factor) => setScale((value) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((value * factor).toFixed(2)))));

  const toolEntries = [
    { id: 'pointer', label: '观察', icon: <MousePointer2 size={15} strokeWidth={1.9} /> },
    { id: 'pet', label: '抚摸手', art: getToolButtonArt(characterId, 'pet') },
    { id: 'hammer', label: '小锤子', art: getToolButtonArt(characterId, 'hammer') }
  ];

  const menuItems = [
    ...toolEntries.map((tool) => ({
      key: `tool-${tool.id}`,
      label: tool.label,
      active: activeTool === tool.id,
      icon: tool.icon || <img src={tool.art.src} alt="" style={{ filter: tool.art.filter, width: 15, height: 15 }} />,
      onClick: () => onSelectTool(tool.id)
    })),
    { key: 'sep-1', separator: true },
    { key: 'zoom-in', label: `放大（${Math.round(scale * 100)}%）`, icon: <ZoomIn size={15} />, onClick: () => zoomBy(1.25) },
    { key: 'zoom-out', label: '缩小', icon: <ZoomOut size={15} />, onClick: () => zoomBy(0.8) },
    { key: 'zoom-reset', label: '恢复默认大小', icon: <RotateCcw size={15} />, onClick: () => setScale(1) },
    { key: 'sep-2', separator: true },
    { key: 'workspace', label: '召唤工作区', icon: <Maximize2 size={15} />, onClick: onOpenWorkspace },
    ...(onChooseWorkspace
      ? [{ key: 'choose-dir', label: '选择工作目录', icon: <FolderOpen size={15} />, onClick: onChooseWorkspace }]
      : []),
    { key: 'close', label: '关闭小窗', icon: <X size={15} />, onClick: onClose }
  ];

  return (
    <div
      ref={rootRef}
      className={contained ? 'compact-stage is-contained' : 'compact-stage'}
      onContextMenu={openMenu}
      style={{ '--pet-accent': accentColor }}
    >
      {speechText && <div className="compact-stage-speech" aria-live="polite">{speechText}</div>}

      <div className="compact-stage-token" title="本机记录的 Token 余额">余额 {balanceLabel}</div>

      <div className="compact-stage-pet">
        <LiveAnimeModel
          characterId={characterId}
          form={form}
          mood={mood}
          activeTool={activeTool}
          accentColor={accentColor}
          onPet={onPet}
          onHammer={onHammer}
          size={Math.round(230 * scale)}
        />
      </div>

      <button
        type="button"
        className="compact-stage-summon"
        title="召唤工作区"
        aria-label="召唤工作区"
        onClick={onOpenWorkspace}
      >
        <Maximize2 size={15} />
      </button>

      {menu && (
        <div className="pet-ctx-menu" style={{ left: menu.x, top: menu.y }} role="menu">
          {menuItems.map((item) => (
            item.separator ? (
              <div key={item.key} className="pet-ctx-sep" />
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={item.active ? 'pet-ctx-item is-active' : 'pet-ctx-item'}
                onClick={() => {
                  setMenu(null);
                  item.onClick();
                }}
              >
                <span className="pet-ctx-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

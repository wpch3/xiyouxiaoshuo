import React, { useEffect, useState } from 'react';
import { Move, X } from 'lucide-react';
import { CompactPetStage } from './CompactPetStage';
import { LiveAnimeModel } from './LiveAnimeModel';

export const FloatingDeskPetOverlay = ({
  characterId = 'deepseek',
  mood = 'idle',
  speechText = '',
  tokensToday = 0,
  activeTool = 'pointer',
  accentColor = '#79A8F4',
  onPet = () => {},
  onHammer = () => {},
  onSelectTool = () => {},
  onClose = () => {},
}) => {
  const [position, setPosition] = useState(() => ({
    x: Math.max(12, window.innerWidth - 390),
    y: Math.max(12, window.innerHeight - 570),
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event) => {
    if (event.target.closest('button, input, textarea, select')) return;
    setIsDragging(true);
    setDragOffset({ x: event.clientX - position.x, y: event.clientY - position.y });
  };

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMouseMove = (event) => {
      setPosition({
        x: Math.max(8, Math.min(window.innerWidth - 360, event.clientX - dragOffset.x)),
        y: Math.max(8, Math.min(window.innerHeight - 520, event.clientY - dragOffset.y)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      className="floating-deskpet-window"
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 999999,
        width: 344,
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <div className="floating-pet-titlebar">
        <span><Move size={13} /> {characterId} 桌面伴侣</span>
        <button type="button" onClick={onClose} title="收起桌面伴侣" aria-label="收起桌面伴侣"><X size={15} /></button>
      </div>
      <div style={{ position: 'relative', height: 470 }}>
        <CompactPetStage
          contained
          characterId={characterId}
          mood={mood}
          speechText={speechText}
          balanceLabel={String(tokensToday || 0)}
          activeTool={activeTool}
          accentColor={accentColor}
          onPet={onPet}
          onHammer={onHammer}
          onSelectTool={onSelectTool}
          onOpenWorkspace={onClose}
          onClose={onClose}
        />
      </div>
      <BongoRealDesk
        characterId={characterId}
        mood={mood}
        speechText={speechText}
        tokensToday={tokensToday}
        activeTool={activeTool}
        accentColor={accentColor}
        onPet={onPet}
        onHammer={onHammer}
        onSelectTool={onSelectTool}
        onOpenDashboard={onClose}
      />
    </div>
  );
};

export const BongoPetLive = ({ characterId = 'deepseek', mood = 'idle', activeTool = 'pointer', onPet = () => {}, onHammer = () => {}, accentColor = '#79A8F4' }) => (
  <LiveAnimeModel
    characterId={characterId}
    mood={mood}
    activeTool={activeTool}
    accentColor={accentColor}
    onPet={onPet}
    onHammer={onHammer}
  />
);

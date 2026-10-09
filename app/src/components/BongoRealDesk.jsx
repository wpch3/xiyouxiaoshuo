import React from 'react';
import { Maximize2, MousePointer2 } from 'lucide-react';
import { LiveAnimeModel } from './LiveAnimeModel';

const toolOptions = [
  { id: 'pointer', label: '观察', image: null },
  { id: 'pet', label: '手抚摸', image: '/tools/petting-hand.svg' },
  { id: 'hammer', label: '小锤子', image: '/tools/hammer.svg' },
];

export const BongoRealDesk = ({
  characterId = 'deepseek',
  mood = 'idle',
  speechText = '',
  tokensToday = 0,
  form = 'normal',
  activeTool = 'pointer',
  accentColor = '#79A8F4',
  onPet = () => {},
  onHammer = () => {},
  onSelectTool = () => {},
  onOpenDashboard = () => {},
}) => (
  <section className="compact-pet-workspace" style={{ '--pet-accent': accentColor }}>
    {speechText && <div className="compact-pet-speech" aria-live="polite">{speechText}</div>}
    <LiveAnimeModel
      characterId={characterId}
      form={form}
      mood={mood}
      activeTool={activeTool}
      accentColor={accentColor}
      onPet={onPet}
      onHammer={onHammer}
      size={260}
    />
    <div className="pet-tool-dock compact-tool-dock" aria-label="桌宠互动工具">
      {toolOptions.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className="pet-tool-button"
          aria-pressed={activeTool === tool.id}
          onClick={() => onSelectTool(tool.id)}
        >
          {tool.image ? <img src={tool.image} alt="" /> : <MousePointer2 size={22} strokeWidth={1.8} />}
          <span>{tool.label}</span>
        </button>
      ))}
    </div>
    <div className="compact-pet-footer">
      <span>今日用量 {Number(tokensToday || 0).toLocaleString()} tokens</span>
      <button type="button" onClick={onOpenDashboard} title="打开完整工作台" aria-label="打开完整工作台">
        <Maximize2 size={14} />
      </button>
    </div>
  </section>
);

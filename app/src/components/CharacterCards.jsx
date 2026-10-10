import React, { useEffect, useRef, useState } from 'react';
import { Heart, ZoomIn, ZoomOut, RotateCcw, MousePointer2 } from 'lucide-react';
import { LiveAnimeModel } from './LiveAnimeModel';
import { getToolButtonArt } from '../constants/toolArt';

// 左栏两张独立卡片：角色舞台（只放立绘与缩放）、选择（形态与互动工具）。
// 舞台尺寸由容器实测得出，立绘高度 = 可用高度与宽度约束下的最大值 × 缩放比例。

export const RIG_ASPECT = 424 / 632;
export const PET_ZOOM_MIN = 0.6;
export const PET_ZOOM_MAX = 1.6;
export const PET_ZOOM_STEP = 0.1;
const FIT_MARGIN = 0.94; // 100% 时留出 6% 呼吸空间，避免贴边

const clampZoom = (value) => Math.min(PET_ZOOM_MAX, Math.max(PET_ZOOM_MIN, Number(value.toFixed(2))));

const useElementSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return size;
};

const iconButton = {
  display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
  color: '#e2e8f0', cursor: 'pointer',
};

export const CharacterStageCard = ({
  char,
  currentId,
  favorability = 0,
  mood = 'idle',
  isSpeaking = false,
  activeTool = 'pointer',
  form = 'normal',
  speechText = '',
  petZoom = 1,
  onPetZoom = () => {},
  onPet = () => {},
  onHammer = () => {},
}) => {
  const areaRef = useRef(null);
  const { width: areaW, height: areaH } = useElementSize(areaRef);

  // 100% 时立绘完整落在舞台区内；缩放超过 100% 时舞台区出现滚动条，不裁切、不压控件
  const fitHeight = Math.max(0, Math.min(areaH * FIT_MARGIN, (areaW * FIT_MARGIN) / RIG_ASPECT));
  const boxHeight = Math.round(fitHeight * petZoom);
  const boxWidth = Math.round(boxHeight * RIG_ASPECT);

  const zoomBy = (delta) => onPetZoom((value) => clampZoom(value + delta));

  return (
    <section
      className="char-card char-card-stage"
      aria-label="角色舞台"
      style={{ '--pet-accent': char.accentColor, background: char.cardBg, borderColor: char.borderTone }}
    >
      <header className="char-card-head">
        <div>
          <div className="char-card-title-row">
            <h2>{char.name}</h2>
            <span className="char-card-level" style={{ background: `${char.color}25`, color: char.accentColor }}>
              Lv.{Math.floor(favorability / 10) + 1}
            </span>
          </div>
          <p className="char-card-subtitle">{char.title}</p>
        </div>
        <div className="char-card-favor">
          <span className="char-card-favor-value"><Heart size={15} fill="#f43f5e" /> {favorability}%</span>
          <span className="char-card-favor-label">羁绊好感度</span>
        </div>
      </header>

      {speechText ? (
        <div className="char-card-bubble" style={{ borderColor: `${char.color}50` }} aria-live="polite">
          {speechText}
        </div>
      ) : null}

      <div className="char-card-zoombar">
        <button type="button" aria-label="缩小角色" style={iconButton} onClick={() => zoomBy(-PET_ZOOM_STEP)}>
          <ZoomOut size={14} />
        </button>
        <span className="char-card-zoom-value">{Math.round(petZoom * 100)}%</span>
        <button type="button" aria-label="放大角色" style={iconButton} onClick={() => zoomBy(PET_ZOOM_STEP)}>
          <ZoomIn size={14} />
        </button>
        <button type="button" aria-label="恢复默认大小" style={iconButton} onClick={() => onPetZoom(1)}>
          <RotateCcw size={13} />
        </button>
      </div>

      <div ref={areaRef} className="char-card-stage-area">
        <div className="char-card-stage-inner">
          {boxWidth > 0 && (
            <LiveAnimeModel
              characterId={currentId}
              form={form}
              mood={mood}
              activeTool={activeTool}
              isSpeaking={isSpeaking}
              accentColor={char.accentColor}
              onPet={onPet}
              onHammer={onHammer}
              boxWidth={boxWidth}
              boxHeight={boxHeight}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export const CharacterPickerCard = ({
  char,
  currentId,
  characterForm,
  onSelectForm = () => {},
  activeTool = 'pointer',
  onSelectTool = () => {},
}) => {
  const forms = [
    { id: 'normal', label: '少女' },
    { id: 'loli', label: '萝莉' },
    { id: 'mature', label: '青年女性' },
    { id: 'chibi', label: 'Q版' },
  ];
  const tools = [
    { id: 'pointer', label: '观察', icon: <MousePointer2 size={20} strokeWidth={1.8} /> },
    { id: 'pet', label: '手抚摸', art: getToolButtonArt(currentId, 'pet') },
    { id: 'hammer', label: '小锤子', art: getToolButtonArt(currentId, 'hammer') },
  ];
  const hint = activeTool === 'hammer'
    ? '小锤子已选中：移到立绘上点击'
    : activeTool === 'pet'
      ? '抚摸已选中：按住并在立绘上拖动'
      : '移动鼠标到立绘上，角色会跟随视线';

  return (
    <section className="char-card char-card-picker" aria-label="形态与互动工具" style={{ borderColor: `${char.color}35` }}>
      <div className="char-card-section-label">形态</div>
      <div className="char-card-forms">
        {forms.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={characterForm === item.id}
            className={characterForm === item.id ? 'char-form-chip is-active' : 'char-form-chip'}
            style={characterForm === item.id ? { borderColor: char.color, background: `${char.color}33` } : undefined}
            onClick={() => onSelectForm(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="char-card-section-label">互动工具</div>
      <div className="pet-tool-dock char-card-tools" aria-label="桌宠互动工具" style={{ '--pet-accent': char.color }}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="pet-tool-button"
            aria-pressed={activeTool === tool.id}
            onClick={() => onSelectTool(tool.id)}
          >
            {tool.art ? <img src={tool.art.src} style={{ filter: tool.art.filter }} alt="" /> : tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="pet-tool-hint char-card-hint" aria-live="polite">{hint}</div>
    </section>
  );
};

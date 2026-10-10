import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { LiveAnimeModel } from './LiveAnimeModel';
import { LayeredPetRig } from './LayeredPetRig';
import { getPetRig } from '../constants/petRig';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const render = (props) => {
  act(() => {
    root.render(<LiveAnimeModel {...props} />);
  });
  return container.querySelector('.dynamic-pet-stage');
};

const fire = (element, type, init = {}) => {
  act(() => {
    const event = new window.MouseEvent(type, { bubbles: true, cancelable: true, ...init });
    Object.defineProperty(event, 'pointerId', { value: init.pointerId ?? 1 });
    element.dispatchEvent(event);
  });
};

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('LiveAnimeModel 鼠标工具交互', () => {
  it('选中小锤子后光标为锤子图像，点击立绘触发锤击动画与回调', () => {
    const onHammer = vi.fn();
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'hammer', onHammer });
    expect(stage.style.cursor).toContain('data:image/png');
    expect(stage.style.cursor).toContain('crosshair');
    fire(stage, 'pointerdown', { clientX: 120, clientY: 160 });
    expect(onHammer).toHaveBeenCalledTimes(1);
    const impact = container.querySelector('.pet-impact-layer');
    expect(impact).not.toBeNull();
    expect(impact.querySelector('.pet-impact-hammer').getAttribute('src')).toContain('data:image/png');
  });

  it('选中抚摸后光标为手部图像，按住拖动产生连续反馈，抬起停止', () => {
    const onPet = vi.fn();
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pet', onPet });
    expect(stage.style.cursor).toContain('data:image/png');
    expect(stage.style.cursor).toContain('grab');
    fire(stage, 'pointerdown', { clientX: 100, clientY: 90 });
    expect(onPet).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.pet-touch-ripple')).not.toBeNull();
    fire(stage, 'pointermove', { clientX: 130, clientY: 110 });
    expect(container.querySelector('.pet-touch-ripple')).not.toBeNull();
    fire(stage, 'pointerup', {});
    expect(container.querySelector('.pet-touch-ripple')).toBeNull();
  });

  it('缩放由舞台盒同步生长承担（v2 几何：不裁切不溢出），pose 层不再二次缩放', () => {
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pointer', scale: 1.4 });
    expect(stage.style.width).toBe(`${Math.round(320 * (0.9 * 1.4 + 0.1))}px`);
    expect(stage.style.height).toBe(`${Math.round(320 * 1.62 * 0.9 * 1.4 + 320 * 0.16)}px`);
    const pose = container.querySelector('.pet-pose-layer');
    expect(pose.style.transform).toContain('scale(1)');
    expect(pose.style.transformOrigin).toBe('50% 100%');
  });

  it('观察模式下点击立绘不触发道具动画', () => {
    const onPet = vi.fn();
    const onHammer = vi.fn();
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pointer', onPet, onHammer });
    expect(stage.style.cursor).toBe('default');
    fire(stage, 'pointerdown', { clientX: 110, clientY: 140 });
    expect(onPet).not.toHaveBeenCalled();
    expect(onHammer).not.toHaveBeenCalled();
    expect(container.querySelector('.pet-impact-layer')).toBeNull();
  });

  it('键盘 Enter 在锤子模式下同样触发锤击', () => {
    const onHammer = vi.fn();
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'hammer', onHammer });
    act(() => {
      stage.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    expect(onHammer).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.pet-impact-layer')).not.toBeNull();
  });

  it('小寻四种形态分别使用重绘后的高清立绘', () => {
    const stage = render({ characterId: 'deepseek', form: 'chibi', activeTool: 'pointer' });
    expect(stage.querySelector('.pet-rig-layer').getAttribute('src')).toBe('/characters/deepseek_chibi.png');
    act(() => {
      root.render(<LiveAnimeModel characterId="deepseek" form="mature" activeTool="pointer" />);
    });
    expect(container.querySelector('.pet-portrait-image').getAttribute('src')).toBe('/characters/deepseek_mature_live.png');
  });
});

describe('分层立绘 rig（拆件）', () => {
  it('小寻少女形态使用 10 层透明拆件（+1 口型帧）而不是单张图', () => {
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pointer' });
    const rig = stage.querySelector('.pet-rig');
    expect(rig).not.toBeNull();
    expect(rig.querySelectorAll('.pet-rig-layer')).toHaveLength(11);
    expect(rig.querySelectorAll('.pet-rig-talk')).toHaveLength(1);
    expect(stage.querySelector('.pet-rig-layer.pet-rig-base').getAttribute('src')).toBe('/characters/xiaoxun_layers/body_base.png');
    expect(stage.querySelector('.pet-rig-layer[src="/characters/xiaoxun_layers/eye_closed_l.png"]')).not.toBeNull();
    expect(stage.querySelector('.pet-rig-layer[src="/characters/xiaoxun_layers/eye_white_l.png"]')).not.toBeNull();
    expect(stage.querySelectorAll('.pet-rig-gaze')).toHaveLength(2);
  });

  it('说话时嘴部口型层开合，停止说话后回到闭口，眨眼由眼睑层 CSS 动画驱动', () => {
    vi.useFakeTimers();
    try {
      const rigDef = getPetRig('deepseek', 'normal');
      act(() => {
        root.render(<LayeredPetRig rig={rigDef} isSpeaking />);
      });
      const frame = () => container.querySelector('.pet-rig-talk');
      const lids = container.querySelectorAll('.pet-rig-blink-anim');
      expect(lids).toHaveLength(2);
      const seen = new Set();
      for (let i = 0; i < 40; i += 1) {
        act(() => { vi.advanceTimersByTime(60); });
        seen.add(frame().style.opacity);
      }
      expect(seen).toEqual(new Set(['0', '1']));
    } finally {
      vi.useRealTimers();
    }
  });

  it('虹膜随视线偏移（rig 像素限幅换算为百分比）、眉毛层随情绪抬压', async () => {
    const rigDef = getPetRig('deepseek', 'normal');
    act(() => {
      root.render(<LayeredPetRig rig={rigDef} look={{ x: 7, y: 4 }} mood="happy" />);
    });
    const rigEl = container.querySelector('.pet-rig');
    const iris = container.querySelector('.pet-rig-layer[src="/characters/xiaoxun_layers/iris_l.png"]');
    const brows = container.querySelector('.pet-rig-layer[src="/characters/xiaoxun_layers/brow_l.png"]');
    expect(iris.style.transform).toBe('translate(var(--gaze-x, 0%), var(--gaze-y, 0%))');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });
    // 限幅 X 1.0 / Y 0.5 rig px → 440×704 画布的百分比
    expect(Number.parseFloat(rigEl.style.getPropertyValue('--gaze-x')).toFixed(2)).toBe((1 / 440 * 100).toFixed(2));
    expect(Number.parseFloat(rigEl.style.getPropertyValue('--gaze-y')).toFixed(2)).toBe((0.5 / 704 * 100).toFixed(2));
    expect(getPetRig('deepseek', 'chibi').layers).toHaveLength(1);
    expect(brows.style.transform).toBe('translateY(-2.5px)');
    act(() => {
      root.render(<LayeredPetRig rig={rigDef} look={{ x: 0, y: 0 }} mood="hammered" />);
    });
    expect(brows.style.transform).toBe('translateY(1.5px)');
  });

  it('拆件层加载失败时自动回退单张立绘（素材 404 韧性）', () => {
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pointer' });
    const baseLayer = stage.querySelector('.pet-rig-layer.pet-rig-base');
    act(() => {
      baseLayer.dispatchEvent(new window.Event('error', { bubbles: false }));
    });
    expect(container.querySelector('.pet-rig')).toBeNull();
    const img = container.querySelector('img.pet-portrait-image');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('/characters/deepseek_live.png');
  });

  it('其他角色/形态仍回退到单张立绘', () => {
    const stage = render({ characterId: 'claude', form: 'normal', activeTool: 'pointer' });
    expect(stage.querySelector('.pet-rig')).toBeNull();
    expect(stage.querySelector('.pet-portrait-image').tagName).toBe('IMG');
  });
});

describe('自检：口型节奏 / 视线缓动 / 舞台几何', () => {
  it('口型调度器出现词间闭口停顿且开合不机械同步', () => {
    vi.useFakeTimers();
    try {
      const rigDef = getPetRig('deepseek', 'normal');
      act(() => {
        root.render(<LayeredPetRig rig={rigDef} isSpeaking />);
      });
      const frames = () => Array.from(container.querySelectorAll('.pet-rig-talk'));
      const seen = new Set();
      let closedSeen = false;
      let maxVisible = 0;
      for (let i = 0; i < 120; i += 1) {
        act(() => {
          vi.advanceTimersByTime(50);
        });
        const vis = frames().filter((f) => f.style.opacity === '1');
        maxVisible = Math.max(maxVisible, vis.length);
        if (vis.length === 0) closedSeen = true;
        frames().forEach((f, idx) => {
          if (f.style.opacity === '1') seen.add(idx);
        });
      }
      // 当前仅有 1 张张嘴帧（mouth_open），节奏靠开合与词间停顿体现
      expect(closedSeen).toBe(true);
      expect(seen.has(0)).toBe(true);
      expect(maxVisible).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('停止说话时口型立即闭合', () => {
    vi.useFakeTimers();
    try {
      const rigDef = getPetRig('deepseek', 'normal');
      act(() => {
        root.render(<LayeredPetRig rig={rigDef} isSpeaking />);
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      act(() => {
        root.render(<LayeredPetRig rig={rigDef} isSpeaking={false} />);
      });
      const vis = Array.from(container.querySelectorAll('.pet-rig-talk')).filter((f) => f.style.opacity === '1');
      expect(vis).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('视线缓动：虹膜 transform 渐进收敛到目标而不是瞬移', async () => {
    const rigDef = getPetRig('deepseek', 'normal');
    act(() => {
      root.render(<LayeredPetRig rig={rigDef} look={{ x: 0, y: 0 }} />);
    });
    const rigEl = container.querySelector('.pet-rig');
    act(() => {
      root.render(<LayeredPetRig rig={rigDef} look={{ x: 1, y: 0 }} />);
    });
    const immediate = rigEl.style.getPropertyValue('--gaze-x');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });
    expect(Number.parseFloat(rigEl.style.getPropertyValue('--gaze-x')).toFixed(2)).toBe((1 / 440 * 100).toFixed(2));
    expect(immediate).not.toBe(rigEl.style.getPropertyValue('--gaze-x'));
  });

  it('舞台几何：背景加高、角色锚底缩放、缩放不溢出控件', () => {
    const stage = render({ characterId: 'deepseek', form: 'normal', scale: 1.5, size: 320 });
    expect(stage.style.height).toBe(`${Math.round(320 * 1.62 * 0.9 * 1.5 + 320 * 0.16)}px`);
    expect(stage.style.width).toBe(`${Math.round(320 * (0.9 * 1.5 + 0.1))}px`);
    const pose = stage.querySelector('.pet-pose-layer');
    expect(pose.style.transformOrigin).toBe('50% 100%');
    expect(pose.style.transform).toContain('scale(1)');
    expect(stage.className).toContain('dynamic-pet-stage');
  });
});

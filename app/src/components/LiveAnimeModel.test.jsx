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
    expect(stage.querySelector('.pet-portrait-image').getAttribute('src')).toBe('/characters/deepseek_chibi_live.png');
    act(() => {
      root.render(<LiveAnimeModel characterId="deepseek" form="mature" activeTool="pointer" />);
    });
    expect(container.querySelector('.pet-portrait-image').getAttribute('src')).toBe('/characters/deepseek_mature_live.png');
  });
});

describe('分层立绘 rig（拆件）', () => {
  it('小寻少女形态使用十三层拆件而不是单张图', () => {
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pointer' });
    const rig = stage.querySelector('.pet-rig');
    expect(rig).not.toBeNull();
    expect(rig.querySelectorAll('.pet-rig-layer')).toHaveLength(17); // 12 单图层 + 5 口型帧
    expect(rig.querySelectorAll('.pet-rig-talk')).toHaveLength(5);
    expect(stage.querySelector('.pet-rig-layer.pet-rig-base').getAttribute('src')).toBe('/characters/deepseek_layers/base_rig.png');
    const wave = stage.querySelector('.pet-rig-layer[src="/characters/deepseek_layers/arm_r_wave.png"]');
    const rest = stage.querySelector('.pet-rig-layer[src="/characters/deepseek_layers/arm_r_rest.png"]');
    expect(wave.style.opacity).toBe('0');
    expect(rest.style.opacity).toBe('1');
  });

  it('说话时嘴部口型层切换，眨眼计时器驱动眼睑层', () => {
    vi.useFakeTimers();
    try {
      const rigDef = getPetRig('deepseek', 'normal');
      act(() => {
        root.render(<LayeredPetRig rig={rigDef} isSpeaking />);
      });
      const frames = () => Array.from(container.querySelectorAll('.pet-rig-talk'));
      const lids = container.querySelector('.pet-rig-layer[src="/characters/deepseek_layers/eyelids.png"]');
      expect(frames().filter((f) => f.style.opacity === '1')).toHaveLength(1);
      act(() => { vi.advanceTimersByTime(200); });
      expect(frames().filter((f) => f.style.opacity === '1')).toHaveLength(1);
      expect(frames()[0].style.opacity).toBe('0');
      let blinked = false;
      for (let i = 0; i < 40 && !blinked; i += 1) {
        act(() => { vi.advanceTimersByTime(300); });
        blinked = lids.style.opacity === '1';
      }
      expect(blinked).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('虹膜层随视线偏移、眉毛层随情绪抬压', () => {
    const rigDef = getPetRig('deepseek', 'normal');
    act(() => {
      root.render(<LayeredPetRig rig={rigDef} look={{ x: 7, y: 4 }} mood="happy" />);
    });
    const iris = container.querySelector('.pet-rig-layer[src="/characters/deepseek_layers/iris.png"]');
    const brows = container.querySelector('.pet-rig-layer[src="/characters/deepseek_layers/brows.png"]');
    expect(iris.style.transform).toContain('translate(5.95px, 2.4px)');
    expect(getPetRig('deepseek', 'normal').clip).toContain('ellipse(');
    expect(brows.style.transform).toBe('translateY(-2.5px)');
    act(() => {
      root.render(<LayeredPetRig rig={rigDef} look={{ x: 0, y: 0 }} mood="hammered" />);
    });
    expect(brows.style.transform).toBe('translateY(1.5px)');
    expect(iris.style.transform).toBe('translate(0px, 0px)');
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

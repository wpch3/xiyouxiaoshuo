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
    expect(stage.style.cursor).toContain('/cursors/hammer.svg');
    fire(stage, 'pointerdown', { clientX: 120, clientY: 160 });
    expect(onHammer).toHaveBeenCalledTimes(1);
    const impact = container.querySelector('.pet-impact-layer');
    expect(impact).not.toBeNull();
    expect(impact.querySelector('.pet-impact-hammer').getAttribute('src')).toBe('/tools/hammer.svg');
  });

  it('选中抚摸后光标为手部图像，按住拖动产生连续反馈，抬起停止', () => {
    const onPet = vi.fn();
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pet', onPet });
    expect(stage.style.cursor).toContain('/cursors/petting-hand.svg');
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
  it('小寻少女形态使用四层拆件而不是单张图', () => {
    const stage = render({ characterId: 'deepseek', form: 'normal', activeTool: 'pointer' });
    const rig = stage.querySelector('.pet-rig');
    expect(rig).not.toBeNull();
    expect(rig.querySelectorAll('.pet-rig-layer')).toHaveLength(4);
    expect(stage.querySelector('.pet-rig-layer.pet-rig-base').getAttribute('src')).toBe('/characters/deepseek_layers/base_nobangs.png');
  });

  it('说话时嘴部口型层切换，眨眼计时器驱动眼睑层', () => {
    vi.useFakeTimers();
    try {
      const rigDef = getPetRig('deepseek', 'normal');
      act(() => {
        root.render(<LayeredPetRig rig={rigDef} isSpeaking />);
      });
      const mouth = container.querySelector('.pet-rig-mouth_open, .pet-rig-layer[src="/characters/deepseek_layers/mouth_open.png"]');
      const lids = container.querySelector('.pet-rig-layer[src="/characters/deepseek_layers/eyelids.png"]');
      expect(mouth.style.opacity).toBe('0');
      act(() => { vi.advanceTimersByTime(200); });
      expect(mouth.style.opacity).toBe('1');
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

  it('其他角色/形态仍回退到单张立绘', () => {
    const stage = render({ characterId: 'claude', form: 'normal', activeTool: 'pointer' });
    expect(stage.querySelector('.pet-rig')).toBeNull();
    expect(stage.querySelector('.pet-portrait-image').tagName).toBe('IMG');
  });
});

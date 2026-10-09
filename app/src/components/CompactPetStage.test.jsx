import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { CompactPetStage } from './CompactPetStage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const render = (props = {}) => {
  act(() => {
    root.render(<CompactPetStage balanceLabel="1.2万" {...props} />);
  });
  return container.querySelector('.compact-stage');
};

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('桌面小窗（bomcat 极简风）', () => {
  it('界面只有余额芯片、角色与召唤按钮，没有多余 UI', () => {
    const stage = render();
    expect(container.querySelector('.compact-stage-token').textContent).toContain('1.2万');
    expect(container.querySelector('.compact-stage-summon')).not.toBeNull();
    expect(container.querySelector('.compact-stage-pet .dynamic-pet-stage')).not.toBeNull();
    expect(container.querySelector('.pet-tool-dock')).toBeNull();
    expect(container.querySelector('.compact-pet-footer')).toBeNull();
  });

  it('右键弹出小菜单：工具/缩放/工作区/关闭齐全，点击工具可切换', () => {
    const onSelectTool = vi.fn();
    const stage = render({ onSelectTool });
    act(() => {
      stage.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }));
    });
    const menu = container.querySelector('.pet-ctx-menu');
    expect(menu).not.toBeNull();
    const labels = Array.from(menu.querySelectorAll('.pet-ctx-item')).map((node) => node.textContent);
    expect(labels.join('|')).toContain('抚摸手');
    expect(labels.join('|')).toContain('小锤子');
    expect(labels.join('|')).toContain('召唤工作区');
    expect(labels.join('|')).toContain('关闭小窗');
    const hammerItem = Array.from(menu.querySelectorAll('.pet-ctx-item')).find((node) => node.textContent.includes('小锤子'));
    act(() => { hammerItem.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    expect(onSelectTool).toHaveBeenCalledWith('hammer');
    expect(container.querySelector('.pet-ctx-menu')).toBeNull();
  });

  it('滚轮缩放 50%–500% 封顶并写入本机记忆', () => {
    const stage = render();
    const wheel = (deltaY) => act(() => {
      stage.dispatchEvent(new window.WheelEvent('wheel', { bubbles: true, deltaY }));
    });
    for (let i = 0; i < 40; i += 1) wheel(-120);
    expect(JSON.parse(localStorage.getItem('pet_compact_scale_v1'))).toBe(5);
    for (let i = 0; i < 80; i += 1) wheel(120);
    expect(JSON.parse(localStorage.getItem('pet_compact_scale_v1'))).toBe(0.5);
  });

  it('召唤按钮与菜单项都能打开主工作区', () => {
    const onOpenWorkspace = vi.fn();
    render({ onOpenWorkspace });
    act(() => {
      container.querySelector('.compact-stage-summon').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
    expect(onOpenWorkspace).toHaveBeenCalledTimes(1);
  });
});

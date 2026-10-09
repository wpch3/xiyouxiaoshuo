// 分层立绘清单（拆件 rig）。
// 约定（参考 Live2D/Spine 拆件规范，适配 Web 管线）：
// - 每个部件独立透明 PNG，同尺寸同锚点，直接叠放即可对齐；
// - 被遮挡区域必须补图（base 已补全额头/眉毛，刘海层单独保存）；
// - 对称部件不合并；图层按 z 序从下到上排列；
// - mode 决定动画映射：base 常显，sway 摆动，blink 眨眼时显示，talk 说话时显示。
export const PET_RIGS = {
  deepseek: {
    normal: {
      width: 848,
      height: 1264,
      layers: [
        { id: 'base', src: '/characters/deepseek_layers/base_nobangs.png', mode: 'base', z: 0 },
        { id: 'mouth_open', src: '/characters/deepseek_layers/mouth_open.png', mode: 'talk', z: 1 },
        { id: 'eyelids', src: '/characters/deepseek_layers/eyelids.png', mode: 'blink', z: 2 },
        { id: 'bangs', src: '/characters/deepseek_layers/bangs.png', mode: 'sway', z: 3 },
      ],
    },
  },
};

export const getPetRig = (characterId, form) => PET_RIGS[characterId]?.[form] || null;

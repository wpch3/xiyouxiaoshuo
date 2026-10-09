// 分层立绘清单（拆件 rig）。
// 约定（参考 Live2D/Spine 拆件规范，适配 Web 管线）：
// - 每个部件独立透明 PNG，同尺寸同锚点，直接叠放即可对齐；
// - 被遮挡区域必须补图（base_final 已补全额头、眉底、侧发后躯干、眼白）；
// - 对称部件不合并（side_hair_l / side_hair_r 独立，摆动相位相反）；
// - 图层按 z 序从下到上排列；
// - mode 决定动画映射：base 常显；sway/sway_l/sway_r 摆动；blink 眨眼显示；
//   talk 说话显示；gaze 随鼠标偏移；brow 随情绪抬压。
export const PET_RIGS = {
  deepseek: {
    normal: {
      width: 848,
      height: 1264,
      layers: [
        { id: 'base', src: '/characters/deepseek_layers/base_final.png', mode: 'base', z: 0 },
        { id: 'mouth_open', src: '/characters/deepseek_layers/mouth_open.png', mode: 'talk', z: 1 },
        { id: 'iris', src: '/characters/deepseek_layers/iris.png', mode: 'gaze', z: 2 },
        { id: 'eyelids', src: '/characters/deepseek_layers/eyelids.png', mode: 'blink', z: 3 },
        { id: 'brows', src: '/characters/deepseek_layers/brows.png', mode: 'brow', z: 4 },
        { id: 'side_hair_l', src: '/characters/deepseek_layers/side_hair_l.png', mode: 'sway_l', z: 5 },
        { id: 'side_hair_r', src: '/characters/deepseek_layers/side_hair_r.png', mode: 'sway_r', z: 6 },
        { id: 'bangs', src: '/characters/deepseek_layers/bangs.png', mode: 'sway', z: 7 },
      ],
    },
  },
};

export const getPetRig = (characterId, form) => PET_RIGS[characterId]?.[form] || null;

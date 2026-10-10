// 分层立绘清单（拆件 rig）。
// 约定（参考 Live2D/Spine 拆件规范，适配 Web 管线）：
// - 每个部件独立透明 PNG，同尺寸同锚点，直接叠放即可对齐；
// - 被遮挡区域必须补图（base_rig 已补额头/眉底/侧发后躯干/眼白/手臂后躯干）；
// - 对称部件不合并（side_hair_l/r、back_hair_l/r 独立，摆动相位相反）；
// - 图层按 z 序从下到上排列；
// - mode 动画映射：base/static 常显；sway* 摆动；blink 眨眼显示；talk 说话显示；
//   gaze 随鼠标偏移；brow 随情绪抬压；arm_rest 常显；arm_wave 仅 mood==='waving'
//   （挥手层 torso 侧暴露区仍有编辑漂移孔洞，未默认启用，资产保留待修）。
export const PET_RIGS = {
  deepseek: {
    normal: {
      // 小寻新分层：全部为 440x704 透明 PNG，同尺寸同锚点，直接叠放。
      // 眼白静止，虹膜单独随视线移动，眼睑（闭眼）只在眨眼时显示。
      width: 440,
      height: 704,
      gazeLimit: { x: 1.0, y: 0.5 }, // rig px：虹膜只在眼白内移动
      layers: [
        { id: 'base', src: '/characters/xiaoxun_layers/body_base.png', mode: 'base', z: 0 },
        { id: 'eye_white_l', src: '/characters/xiaoxun_layers/eye_white_l.png', mode: 'static', z: 1 },
        { id: 'eye_white_r', src: '/characters/xiaoxun_layers/eye_white_r.png', mode: 'static', z: 1 },
        { id: 'iris_l', src: '/characters/xiaoxun_layers/iris_l.png', mode: 'gaze', z: 2 },
        { id: 'iris_r', src: '/characters/xiaoxun_layers/iris_r.png', mode: 'gaze', z: 2 },
        { id: 'mouth_closed', src: '/characters/xiaoxun_layers/mouth_closed.png', mode: 'static', z: 3 },
        { id: 'mouth_set', mode: 'talk', z: 4, frames: ['/characters/xiaoxun_layers/mouth_open.png'] },
        { id: 'eye_closed_l', src: '/characters/xiaoxun_layers/eye_closed_l.png', mode: 'blink', z: 5 },
        { id: 'eye_closed_r', src: '/characters/xiaoxun_layers/eye_closed_r.png', mode: 'blink', z: 5 },
        { id: 'brow_l', src: '/characters/xiaoxun_layers/brow_l.png', mode: 'brow', z: 6 },
        { id: 'brow_r', src: '/characters/xiaoxun_layers/brow_r.png', mode: 'brow', z: 6 },
      ],
    },
    chibi: {
      width: 424,
      height: 632,
      layers: [{ id: 'portrait', src: '/characters/deepseek_chibi.png', mode: 'base', z: 0 }],
    },
  },
};

export const getPetRig = (characterId, form) => PET_RIGS[characterId]?.[form] || null;

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
      width: 424,
      height: 632,
      // 眼白遮罩：限制虹膜移动不超出眼形（clip-path 椭圆组）
      clip: 'ellipse(2.71% 1.25% at 46.46% 15.97%), ellipse(2.71% 1.25% at 54.72% 15.81%)',
      layers: [
        { id: 'back_hair_l', src: '/characters/deepseek_layers/back_hair_l.png', mode: 'sway_bl', z: 0 },
        { id: 'back_hair_r', src: '/characters/deepseek_layers/back_hair_r.png', mode: 'sway_br', z: 1 },
        { id: 'base', src: '/characters/deepseek_layers/base_rig.png', mode: 'base', z: 2 },
        {
          id: 'mouth_set',
          mode: 'talk',
          z: 3,
          frames: [
            '/characters/deepseek_layers/mouth_open.png',
            '/characters/deepseek_layers/mouth_e.png',
            '/characters/deepseek_layers/mouth_i.png',
            '/characters/deepseek_layers/mouth_o.png',
            '/characters/deepseek_layers/mouth_u.png',
          ],
        },
        { id: 'iris', src: '/characters/deepseek_layers/iris.png', mode: 'gaze', z: 4 },
        { id: 'eyelids', src: '/characters/deepseek_layers/eyelids.png', mode: 'blink', z: 5 },
        { id: 'brows', src: '/characters/deepseek_layers/brows.png', mode: 'brow', z: 6 },
        { id: 'arm_l', src: '/characters/deepseek_layers/arm_l.png', mode: 'static', z: 7 },
        { id: 'arm_r_rest', src: '/characters/deepseek_layers/arm_r_rest.png', mode: 'arm_rest', z: 8 },
        { id: 'arm_r_wave', src: '/characters/deepseek_layers/arm_r_wave.png', mode: 'arm_wave', z: 9 },
        { id: 'side_hair_l', src: '/characters/deepseek_layers/side_hair_l.png', mode: 'sway_l', z: 10 },
        { id: 'side_hair_r', src: '/characters/deepseek_layers/side_hair_r.png', mode: 'sway_r', z: 11 },
        { id: 'bangs', src: '/characters/deepseek_layers/bangs.png', mode: 'sway', z: 12 },
      ],
    },
  },
};

export const getPetRig = (characterId, form) => PET_RIGS[characterId]?.[form] || null;

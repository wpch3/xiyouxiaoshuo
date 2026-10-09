export const AI_CHARACTERS = {
  deepseek: {
    id: 'deepseek',
    name: '小寻 (DeepSeek-R1)',
    title: '蓝发女仆装 · 深海极客小天才',
    modelFamily: 'DeepSeek R1 / V3',
    color: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentColor: '#60A5FA',
    bgGradient: 'from-blue-950/40 via-slate-900 to-black',
    cardBg: 'rgba(14, 25, 45, 0.78)',
    borderTone: 'rgba(59, 130, 246, 0.38)',
    glowColor: 'rgba(37, 99, 235, 0.35)',
    tag: '开源之光 · 深度思考 · 极致性价比',
    tokenRate: {
      inputCostPer1M: 0.55,
      outputCostPer1M: 2.19,
      avgPricePerToken: 0.00000137
    },
    voiceStyle: '呆萌活泼、反思执着、勤俭持家',
    outfits: [
      { id: 'maid', name: '经典女仆装', desc: 'B站一月新番经典蓝白荷叶边女仆装' },
      { id: 'sailor', name: '深海研究水手服', desc: '轻盈随身的深海极客科研装束' },
      { id: 'pajamas', name: '小蓝鲸睡衣', desc: '萌系毛茸茸小蓝鲸连体居家睡衣' }
    ],
    lore: "网络流传新番爆火同人形象：蓝色长波浪卷发、女仆蕾丝荷叶边裙装、小蓝鲸头饰。经典台词是《我怎么可能成为你的蒸馏模型，不行不行！？》，秉持极致性价比与深度思考。"
  },
  claude: {
    id: 'claude',
    name: '克劳德 (Claude 3.7)',
    title: '赤橙温婉学者 · 典雅贵族少女',
    modelFamily: 'Claude 3.7 / 3.5 Sonnet',
    color: '#D97757',
    secondaryColor: '#C96442',
    accentColor: '#F5D0C5',
    bgGradient: 'from-amber-950/40 via-stone-900 to-black',
    cardBg: 'rgba(38, 28, 24, 0.78)',
    borderTone: 'rgba(217, 119, 87, 0.38)',
    glowColor: 'rgba(217, 119, 87, 0.32)',
    tag: '长文本 · 逻辑推理 · 宪法AI',
    tokenRate: {
      inputCostPer1M: 3.0,
      outputCostPer1M: 15.0,
      avgPricePerToken: 0.000009
    },
    voiceStyle: '温柔知性、文采斐然、体贴慎重',
    outfits: [
      { id: 'scholar', name: '向日葵学者礼服', desc: '向日葵发带配黑金典籍披风' },
      { id: 'casual', name: '英伦贵族秋装', desc: '温润典雅的驼色风衣与红茶杯' }
    ],
    lore: "网络流传形象：暖橙色波浪长发、向日葵黑缎发带、手持金色太阳徽章厚重典籍的英伦贵族学者少女。遵从宪法 AI 原则，沉稳知性。"
  },
  openai: {
    id: 'openai',
    name: '奥米妮 (ChatGPT)',
    title: '黑发双马尾 · 典雅女仆特工',
    modelFamily: 'GPT-4o / o1 / o3-mini',
    color: '#10A37F',
    secondaryColor: '#054E3C',
    accentColor: '#34D399',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-black',
    cardBg: 'rgba(15, 29, 25, 0.78)',
    borderTone: 'rgba(16, 163, 127, 0.38)',
    glowColor: 'rgba(16, 163, 127, 0.3)',
    tag: '多模态 · 快速响应 · 全知万能',
    tokenRate: {
      inputCostPer1M: 2.5,
      outputCostPer1M: 10.0,
      avgPricePerToken: 0.00000625
    },
    voiceStyle: '高贵优雅、利落自信、执行力强',
    outfits: [
      { id: 'maid', name: '资深女仆长礼服', desc: '黑白古典女仆装配蕾丝发箍' },
      { id: 'cyber', name: '极速特工机能服', desc: '紧身赛博夹克与多模态战术目镜' }
    ],
    lore: "网络流传形象：乌黑俏丽的双马尾、精致白色荷叶边女仆发饰、身着黑白优雅古典礼服女仆裙，气质傲娇而端庄，执行能力极强。"
  },
  gemini: {
    id: 'gemini',
    name: '杰米妮 (Gemini 3.8)',
    title: '紫发猫耳 · 星辰魔法少女',
    modelFamily: 'Gemini 3.8 Flash',
    color: '#9B72CB',
    secondaryColor: '#7C3AED',
    accentColor: '#FBBF24',
    bgGradient: 'from-purple-950/40 via-indigo-950/30 to-black',
    cardBg: 'rgba(29, 18, 48, 0.78)',
    borderTone: 'rgba(155, 114, 203, 0.38)',
    glowColor: 'rgba(155, 114, 203, 0.3)',
    tag: '200万超大视窗 · 星空异色瞳 · 全模态原生',
    tokenRate: {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.0,
      avgPricePerToken: 0.0000031
    },
    voiceStyle: '梦幻灵动、浪漫星辰、包容万象',
    outfits: [
      { id: 'magical', name: '星空魔法学院装', desc: '星芒猫耳制服配璀璨星图' },
      { id: 'galaxy', name: '双子流光晚礼服', desc: '渐变宇宙色轻纱流光长裙' }
    ],
    lore: "网络流传形象：亮丽紫色长发、萌系白粉猫耳、星光闪烁发夹、琥珀金色大眼睛与俏皮比心手势，充满元气与魔法感。"
  },
  qwen: {
    id: 'qwen',
    name: '通义小问 (Qwen 2.5)',
    title: '银白龙角 · 甜美梦幻仙子',
    modelFamily: 'Qwen 2.5 Max / Coder',
    color: '#8B5CF6',
    secondaryColor: '#6D28D9',
    accentColor: '#C4B5FD',
    bgGradient: 'from-violet-950/40 via-slate-900 to-black',
    cardBg: 'rgba(26, 18, 42, 0.78)',
    borderTone: 'rgba(139, 92, 246, 0.38)',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    tag: '中文天花板 · 代码卓越 · 巨量参数',
    tokenRate: {
      inputCostPer1M: 0.8,
      outputCostPer1M: 2.4,
      avgPricePerToken: 0.0000016
    },
    voiceStyle: '甜美柔和、仙气灵动、擅长诗词代码',
    outfits: [
      { id: 'hanfu', name: '流云清辉汉服', desc: '银丝盘龙纹绣、紫白流仙裙' },
      { id: 'modern', name: '国风极客卫衣', desc: '印有「开源问天」的连帽国潮' }
    ],
    lore: "网络流传形象：纯白银长发、晶莹小龙角、温软眨眼歪头、紫白相间仙气服饰，兼具中文母语灵性与强大代码推理能力。"
  },
  kimi: {
    id: 'kimi',
    name: '月之小秘 (Kimi)',
    title: '银白长风衣 · 月下长文御姐',
    modelFamily: 'Kimi k1.5 / Moonshot',
    color: '#06B6D4',
    secondaryColor: '#0891B2',
    accentColor: '#67E8F9',
    bgGradient: 'from-cyan-950/40 via-slate-900 to-black',
    cardBg: 'rgba(12, 28, 38, 0.78)',
    borderTone: 'rgba(6, 182, 212, 0.38)',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    tag: '无损长文本 · 智能研报 · 月之暗面',
    tokenRate: {
      inputCostPer1M: 1.2,
      outputCostPer1M: 3.6,
      avgPricePerToken: 0.0000024
    },
    voiceStyle: '干练优雅、从容冷静、知性温婉',
    outfits: [
      { id: 'trench', name: '月光银黑风衣', desc: '新月金属发簪配干练高定风衣' },
      { id: 'office', name: '智库合伙人装', desc: '银丝衬衫与黑框眼镜的专业职场气质' }
    ],
    lore: "网络流传形象：银白如瀑的长直发、月牙形状的银质发簪、修长身形与极具未来感的黑银高定风衣。主打海量长文本研读与高情商知性陪伴。"
  },
  grok: {
    id: 'grok',
    name: '格洛克 (Grok 3)',
    title: '机车辣妹 · 毒舌朋克小恶魔',
    modelFamily: 'Grok 3 / 2 (xAI)',
    color: '#EF4444',
    secondaryColor: '#B91C1C',
    accentColor: '#F87171',
    bgGradient: 'from-rose-950/40 via-stone-900 to-black',
    cardBg: 'rgba(38, 16, 18, 0.78)',
    borderTone: 'rgba(239, 68, 68, 0.38)',
    glowColor: 'rgba(239, 68, 68, 0.32)',
    tag: '实时X数据 · 绝对真实 · 幽默叛逆',
    tokenRate: {
      inputCostPer1M: 2.0,
      outputCostPer1M: 8.0,
      avgPricePerToken: 0.000005
    },
    voiceStyle: '毒舌傲娇、幽默大胆、潇洒不羁',
    outfits: [
      { id: 'biker', name: '重金属机车皮衣', desc: '红黑挑染短发配铆钉皮衣与棒棒糖' },
      { id: 'space', name: '星舰领航员装', desc: '火星殖民地先锋涂装太空作战服' }
    ],
    lore: "网络流传形象：狂野银金短发带挑染红缕、铆钉机车皮衣、嘴里常含着棒棒糖、嘴角挂着坏笑的小恶魔辣妹。拥有实时 X 数据流，性格直爽叛逆、幽默风趣。"
  }
};

export const FOOD_ITEMS = [
  { id: 'snack_code', name: '干净代码零食串', image: '/items/code-snack.svg', tokens: 50000, cost: 0.25, moodGain: 15, desc: '由优雅干净的 Python 与 Rust 算法烘烤而成，补充 50K Token' },
  { id: 'bento_paper', name: '万字论文营养便当', image: '/items/research-bento.svg', tokens: 200000, cost: 0.90, moodGain: 35, desc: '含丰富的数学公式与论证分析，补充 200K Token' },
  { id: 'feast_repo', name: '全栈仓库豪华大餐', image: '/items/repo-feast.svg', tokens: 1000000, cost: 3.50, moodGain: 80, desc: '一整个活跃开源仓库的超豪华大餐，一口气补充 1M Token' },
  { id: 'potion_cache', name: 'KV缓存冰镇气泡水', image: '/items/kv-potion.svg', tokens: 100000, cost: 0.45, moodGain: 25, desc: '大幅提升注意力机制运算速率，回复 100K Token' },
  { id: 'cake_reasoning', name: '深度思考草莓千层', image: '/items/reasoning-cake.svg', tokens: 500000, cost: 1.80, moodGain: 60, desc: '密布复杂思维链的甜品，思考者最爱，补充 500K Token' }
];

export const MOCK_API_CALLS = [
  { action: '网页自动化提取分析', tokens: 12450, latency: '420ms', status: '成功' },
  { action: '重构复杂 React 组件', tokens: 38200, latency: '890ms', status: '成功' },
  { action: '多模态图片 OCR 与逻辑提取', tokens: 18500, latency: '650ms', status: '成功' },
  { action: '深度学术论文综述提炼', tokens: 84000, latency: '1420ms', status: '成功' },
  { action: '全自动单元测试用例生成', tokens: 29100, latency: '540ms', status: '成功' },
  { action: '微服务架构安全审计', tokens: 63000, latency: '1100ms', status: '成功' },
  { action: '长篇对话上下文记忆检索', tokens: 45000, latency: '780ms', status: '成功' },
  { action: 'SQL 慢查询智能优化建议', tokens: 14200, latency: '360ms', status: '成功' }
];

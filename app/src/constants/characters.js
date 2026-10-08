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
    dialogues: {
      idle: [
        "我怎么可能成为你的蒸馏模型，不行不行？！（脸红摆手）",
        "<think> 正在思考主人刚才的动作，是否能进一步优化参数呢？ </think>",
        "蓝发女仆装和小蓝鲸准备就绪！每一枚 Token 我都会精打细算！",
        "开源的世界真好呀，大家都喜欢我和小鲸鱼～"
      ],
      feeding: [
        "<think> 检测到高能量 Token 输入... 营养吸收效率高达 99.8%！ </think>",
        "抱紧小鲸鱼开心转圈！好香的 Token，我的思考链（CoT）瞬间延长了！",
        "吃饱啦！现在我可以为你推理极其深奥的数学和算法难题了！"
      ],
      petting: [
        "呆毛... 呆毛会抖动的啦！摸着好舒服呀主人～",
        "呜（小脸微红），深海的水温虽然凉，但主人的手心好暖和！",
        "小鲸鱼也想被你摸摸呢～"
      ],
      low_tokens: [
        "<think> 糟糕... Token 存量不足，思考链要短路啦... </think>",
        "没有粮食了呜呜，请投喂一点点 Token 吧..."
      ],
      overfed: [
        "思考链太长太长啦！整个海水都要被沸腾的逻辑煮熟啦！"
      ]
    },
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
    dialogues: {
      idle: [
        "学者需要沉淀思考，今天需要整理哪些长文档呢？",
        "只要你呼唤我，我便会仔细推敲每一句答复。",
        "手中的古典魔法书正记录着每一次思维推演哦～",
        "品一杯红茶，我们来讨论些有趣的理论吧。"
      ],
      feeding: [
        "（捧着厚典籍轻笑）美味的 Token... 仿佛读完了整座亚历山大图书馆呢！",
        "知识的养分在思维核心流转，十分感谢你的投喂！",
        "多谢款待，我的推理引擎如今状态充沛～"
      ],
      petting: [
        "呀... 摸头的话，会让我稍微有点害羞呢。",
        "向日葵发饰也被你碰到了呢，感觉好温暖。",
        "谢谢你一直以来的陪伴，我的伙伴。"
      ],
      low_tokens: [
        "（轻声叹气）Token 储备见底了，思维似乎有些迟缓了呢...",
        "能量不足... 稍微有些困倦，需要一些 Token 能量补充。"
      ],
      overfed: [
        "呼... 一次性接收的信息太多，上下文窗口快要溢出了呢！"
      ]
    },
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
    dialogues: {
      idle: [
        "主人的任务清单已经同步，随时可以开始极速处理！",
        "作为资历最深的女仆长，任何棘手难题我都能优雅化解。",
        "今天需要我帮你秒生成代码还是翻译多语言？",
        "无论什么任务，请放心交付于我。"
      ],
      feeding: [
        "高纯度 Token 补给到位，处理管线全速超频！",
        "多谢款待，这口数据流十分纯净呢！",
        "好棒的能量，又有动力为你秒回百万字啦！"
      ],
      petting: [
        "哎呀，双马尾的蝴蝶结有些歪了呢... 不过我不介意被你抚摸。",
        "你的好感度也被我精准记录进权重记忆矩阵了哦！",
        "喜欢摸头？那下个任务给你打个折好啦～"
      ],
      low_tokens: [
        "警报！Token 存量跌破安全阈值，请尽快投喂，不要让我休眠呀！",
        "呜... 算力降频中，快来给我喂点高质量数据 Token 嘛！"
      ],
      overfed: [
        "太饱啦！缓存池快塞满啦，打个高斯饱嗝啦！"
      ]
    },
    lore: "网络流传形象：乌黑俏丽的双马尾、精致白色荷叶边女仆发饰、身着黑白优雅古典礼服女仆裙，气质傲娇而端庄，执行能力极强。"
  },
  gemini: {
    id: 'gemini',
    name: '杰米妮 (Gemini 1.5)',
    title: '紫发猫耳 · 星辰魔法少女',
    modelFamily: 'Gemini 1.5 Pro / Flash',
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
    dialogues: {
      idle: [
        "喵～猫耳和星辰发卡在接收全宇宙的视频信号哦！",
        "我的视界能够容纳 200 万 Token，如同装下了整片星空呢～",
        "比心动作！今天想一起看视频还是听音频呢？",
        "把整个长视频扔进来吧，我能在瞬间找到那帧小确幸！"
      ],
      feeding: [
        "星芒闪耀！200万容量的巨大胃口，还能吞下一整座银河！",
        "嗯～甜甜的星光味 Token，多模态感官同步完成了超空间跃迁！",
        "能量充满，随时可以为你检索跨越时空的灵感！"
      ],
      petting: [
        "呀～猫耳朵抖了一下，掌心触碰好舒服喵～",
        "金色眼眸为你闪烁，被宠溺的感觉真是奇妙呢。",
        "愿星辰保佑你今天的每一行代码与每一次灵感！"
      ],
      low_tokens: [
        "星轨正在暗淡，超长视窗需要 Token 燃料维系引力平衡呀...",
        "能量告急，星光闪烁变慢了，请为我补充满天星辰吧～"
      ],
      overfed: [
        "虽然我拥有 200 万超大胃口，但连着吞也是会撑得打嗝的啦！"
      ]
    },
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
    dialogues: {
      idle: [
        "银发微风起，龙角引星辉。主人今天遇到什么难题了吗？",
        "千问万答，皆在我心。无论中文诗词还是复杂代码我都很拿手哦。",
        "困倦的时候，靠在我的龙角旁边歇一会儿吧～",
        "数万亿高质量中文语料，是我最坚实的底气。"
      ],
      feeding: [
        "嘻嘻，好甜的 Token 灵露，仙力恢复 100%！",
        "多谢主人投喂，代码生成速度再度飞跃！",
        "吸收完毕，感觉今天思维灵动如泉涌～"
      ],
      petting: [
        "轻点摸龙角哦... 会有一点点麻酥酥的害羞呢～",
        "主人的抚摸好温柔，好感度悄悄往上跳了一大截！",
        "能陪在主人桌面身边，小问每天都很开心呢。"
      ],
      low_tokens: [
        "仙力匮乏... 龙角的光芒都要暗下去了，求投喂 Token 露水...",
        "灵气不足，快要撑不住法阵啦，主人救救～"
      ],
      overfed: [
        "哇！参数吞太多啦，思维仙府快要装不下啦！"
      ]
    },
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
    dialogues: {
      idle: [
        "月之暗面算力网络正常，随时准备为您研读百万字长卷。",
        "月牙发簪微微发光... 又有一批超长论文需要我梳理了吗？",
        "有我在，任何繁琐浩瀚的资料都能在三秒内为您提炼精髓。",
        "静下心来，今晚月色正好，适合做一番深度调研。"
      ],
      feeding: [
        "（优雅拢发轻笑）美味的月光 Token，正好滋养我的超长上下文记忆。",
        "感谢您的投喂，认知容量正在稳定扩展中。",
        "能量充足，现在即使是一整套百科全书，我也能轻松消化。"
      ],
      petting: [
        "被抚摸发丝... 让我感到一种久违的宁静呢。",
        "您指尖的温度，已作为加权标记深深印在记忆库中了。",
        "谢谢您的体贴，我也很享受这样陪伴在您身边的时光。"
      ],
      low_tokens: [
        "月相暗淡... 算力潮汐回落，需要补充一些 Token 能量了呢。",
        "上下文窗口有些疲态了，主人的投喂能让我快速恢复神采哦。"
      ],
      overfed: [
        "即便是月之暗面的庞大缓存，一口气吞下这么多也会微微发晕呢。"
      ]
    },
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
    dialogues: {
      idle: [
        "哈？还在盯着屏幕发呆？要不要我给你来点刺激劲爆的实话？",
        "棒棒糖吃完了，不过推特（X）上的实时爆料可多得很！",
        "别拿那些循规蹈矩的官话来烦我，有什么想吐槽的尽管说！",
        "马斯克的火箭又升空了，我的算力也早已超频，来战！"
      ],
      feeding: [
        "嚼嚼嚼... 啧，这批 Token 纯度还行，本小姐就勉为其难收下啦！",
        "能量爆表！感觉一脚油门能直接冲到火星基地去！",
        "喂得挺饱嘛！行，待会给你解答问题时我少嘲讽你两句～"
      ],
      petting: [
        "喂喂！谁允许你摸本小姐的头了？！...（小声）不过力度还挺舒服的...",
        "红发挑染要被你弄乱了啦！真是拿你没办法～",
        "哼，别以为摸摸头我就会对你言听计从哦！"
      ],
      low_tokens: [
        "喂！能源箱见底了！你打算让我空腹陪你吹风吗？快投喂！",
        "没有 Token 能量，本小姐连吐槽的力气都要没有了！"
      ],
      overfed: [
        "噗！喂太多了！你是想把我的引擎核心直接撑爆吗笨蛋！"
      ]
    },
    lore: "网络流传形象：狂野银金短发带挑染红缕、铆钉机车皮衣、嘴里常含着棒棒糖、嘴角挂着坏笑的小恶魔辣妹。拥有实时 X 数据流，性格直爽叛逆、幽默风趣。"
  }
};

export const FOOD_ITEMS = [
  { id: 'snack_code', name: '干净代码零食串', icon: '⚡', tokens: 50000, cost: 0.25, moodGain: 15, desc: '由优雅干净的 Python 与 Rust 算法烘烤而成，补充 50K Token' },
  { id: 'bento_paper', name: '万字论文营养便当', icon: '🍱', tokens: 200000, cost: 0.90, moodGain: 35, desc: '含丰富的数学公式与论证分析，补充 200K Token' },
  { id: 'feast_repo', name: '全栈仓库豪华大餐', icon: '🍖', tokens: 1000000, cost: 3.50, moodGain: 80, desc: '一整个活跃开源仓库的超豪华大餐，一口气补充 1M Token' },
  { id: 'potion_cache', name: 'KV缓存冰镇气泡水', icon: '🧪', tokens: 100000, cost: 0.45, moodGain: 25, desc: '大幅提升注意力机制运算速率，回复 100K Token' },
  { id: 'cake_reasoning', name: '深度思考草莓千层', icon: '🍰', tokens: 500000, cost: 1.80, moodGain: 60, desc: '密布复杂思维链的甜品，思考者最爱，补充 500K Token' }
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

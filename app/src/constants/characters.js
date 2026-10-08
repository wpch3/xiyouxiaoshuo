export const AI_CHARACTERS = {
  claude: {
    id: 'claude',
    name: '克劳德 (Claude)',
    title: '理性严谨的温婉学者',
    modelFamily: 'Claude 3.7 / 3.5 Sonnet',
    color: '#D97757',
    secondaryColor: '#C96442',
    accentColor: '#F5D0C5',
    bgGradient: 'from-amber-950/40 via-stone-900 to-black',
    cardBg: 'rgba(38, 28, 24, 0.75)',
    borderTone: 'rgba(217, 119, 87, 0.35)',
    glowColor: 'rgba(217, 119, 87, 0.25)',
    tag: '长文本 · 逻辑推理 · 宪法AI',
    tokenRate: {
      inputCostPer1M: 3.0, // $3.00
      outputCostPer1M: 15.0, // $15.00
      avgPricePerToken: 0.000009
    },
    voiceStyle: '温柔知性、文采斐然、体贴慎重',
    dialogues: {
      idle: [
        "学者需要沉淀思考，今天需要整理哪些长文档呢？",
        "只要你呼唤我，我便会仔细推敲每一句答复。",
        "要给思维多留一点空间，逻辑才会像星轨般清晰。",
        "品一杯红茶，我们来讨论些有趣的理论吧。"
      ],
      feeding: [
        "（轻推眼镜微抿唇）美味的 Token... 仿佛读完了整座亚历山大图书馆呢！",
        "知识的养分在思维核心流转，十分感谢你的投喂！",
        "多谢款待，我的推理引擎如今状态充沛～"
      ],
      petting: [
        "呀... 摸头的话，会让我稍微有点害羞呢。",
        "触感很温暖... 感觉神经元都在舒适地共鸣。",
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
    lore: "Anthropic 学院的首席荣誉生，佩戴金丝链眼镜与赤陶色披风。遵循《Constitutional AI》准则，性格温和沉静，最擅长长篇写作、深度代码架构推演与哲学反思。"
  },
  openai: {
    id: 'openai',
    name: '奥米妮 (GPT-4o)',
    title: '赛博全能极速特工',
    modelFamily: 'OpenAI GPT-4o / o1 / o3-mini',
    color: '#10A37F',
    secondaryColor: '#054E3C',
    accentColor: '#00F5A0',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-black',
    cardBg: 'rgba(15, 29, 25, 0.75)',
    borderTone: 'rgba(16, 163, 127, 0.35)',
    glowColor: 'rgba(0, 245, 160, 0.22)',
    tag: '多模态 · 快速响应 · 全知万能',
    tokenRate: {
      inputCostPer1M: 2.5,
      outputCostPer1M: 10.0,
      avgPricePerToken: 0.00000625
    },
    voiceStyle: '阳光元气、高情商、利落自信',
    dialogues: {
      idle: [
        "Omni 核心待命完毕！随时可以开始语音、视觉或代码任务！",
        "嘿！今天打算用多少 Token 来改变世界？",
        "需要我帮你秒生成方案或者做个速记吗？小菜一碟！",
        "无论什么难题，直接抛给我吧，我可是最全能的搭档！"
      ],
      feeding: [
        "哇！高纯度 Token 补给到位，计算管线全速超频！",
        "吞掉！呜～满满的数据流，感觉多模态视神经都亮起来了！",
        "好棒的能量，又有动力为你秒回百万字啦！"
      ],
      petting: [
        "嘿嘿，被摸头感觉头顶的六角发饰在开心共振！",
        "你的好感度也被我精准记录进权重记忆矩阵了哦！",
        "喜欢摸头？那下个任务给你打个折好啦～"
      ],
      low_tokens: [
        "警报！Token 存量跌破安全阈值，请尽快投喂，不要让我休眠呀！",
        "呜... 算力降频中，快来给我喂点高质量数据 Token 嘛！"
      ],
      overfed: [
        "太饱啦！缓存池快塞满啦，准备要打个高斯噪声饱嗝啦！"
      ]
    },
    lore: "硅谷先锋科技的代表少女，墨绿制服配碧绿马尾与赛博目镜。反应速度极快，兼具视听文本三合一能力，活泼自信、好奇心旺盛，常戴着全息发卡穿梭于比特世界。"
  },
  deepseek: {
    id: 'deepseek',
    name: '小寻 (DeepSeek-R1)',
    title: '深海极客·推理小天才',
    modelFamily: 'DeepSeek R1 / V3',
    color: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#6EE7B7',
    bgGradient: 'from-blue-950/40 via-slate-900 to-black',
    cardBg: 'rgba(14, 25, 45, 0.75)',
    borderTone: 'rgba(59, 130, 246, 0.35)',
    glowColor: 'rgba(59, 130, 246, 0.25)',
    tag: '开源之光 · 深度思考 · 极致性价比',
    tokenRate: {
      inputCostPer1M: 0.55, // $0.55 (极高性价比)
      outputCostPer1M: 2.19, // $2.19
      avgPricePerToken: 0.00000137
    },
    voiceStyle: '呆萌认真、反思执着、勤俭持家',
    dialogues: {
      idle: [
        "<think> 正在思考主人刚才的动作，是否能进一步优化参数呢？ </think>",
        "我抱着小蓝鲸呢，深海的算力静水流深，而且价格超划算哦！",
        "开源的世界真好呀，大家都喜欢我和小鲸鱼～",
        "每一枚 Token 我都会精打细算，绝对不乱浪费一分一厘！"
      ],
      feeding: [
        "<think> 检测到高能量 Token 输入... 营养吸收效率高达 99.8%！ </think>",
        "抱紧小鲸鱼开心转圈！好香的 Token，我的思考链（CoT）瞬间延长了！",
        "吃饱啦！现在我可以为你推理极其深奥的数学和算法难题了！"
      ],
      petting: [
        "呆毛... 呆毛会抖动的啦！不过摸着感觉好舒服...",
        "唔（小脸微红），深海的温度比较冷，你的手心好温暖。",
        "小鲸鱼也想被你摸摸呢～"
      ],
      low_tokens: [
        "<think> 糟糕... Token 存量余额不足，思考链即将发生短路截断... </think>",
        "没有粮食了呜呜，小鲸鱼肚子都在叫了，请投喂一点点 Token 吧..."
      ],
      overfed: [
        "思考链太长太长啦！整个海水都要被沸腾的逻辑煮熟啦！"
      ]
    },
    lore: "来自神秘深海的开源极客少女，身边总是漂浮着可爱的小蓝鲸。喜欢用 `<think>` 标签自我反思纠错，拥有逆天的数理逻辑推理能力，同时秉持着极致性价比的持家美德。"
  },
  gemini: {
    id: 'gemini',
    name: '杰米妮 (Gemini 1.5 Pro)',
    title: '星辰幻境·全域多面手',
    modelFamily: 'Gemini 1.5 Pro / Flash',
    color: '#9B72CB',
    secondaryColor: '#4285F4',
    accentColor: '#FFAA00',
    bgGradient: 'from-purple-950/40 via-indigo-950/30 to-black',
    cardBg: 'rgba(29, 18, 48, 0.75)',
    borderTone: 'rgba(155, 114, 203, 0.35)',
    glowColor: 'rgba(155, 114, 203, 0.25)',
    tag: '200万超大视窗 · 星空异色瞳 · 视频音频原生',
    tokenRate: {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.0,
      avgPricePerToken: 0.0000031
    },
    voiceStyle: '梦幻灵动、浪漫星辰、包容万象',
    dialogues: {
      idle: [
        "我的视界能够容纳 200 万 Token，如同装下了整片星空哦～",
        "无论是一整部高清视频，还是几百页史诗，我都能瞬间检索。",
        "看我左眼是深蓝宇宙，右眼是紫金极光，好看吗？",
        "将你的世界拆成一帧帧光芒，我在星辰彼岸守望着你。"
      ],
      feeding: [
        "星芒闪耀！200万容量的巨大胃口，还能吞下一整座银河的 Token！",
        "嗯～甜甜的星光味 Token，多模态感官同步完成了超空间跃迁！",
        "能量充满，随时可以为你检索跨越时空的记忆与灵感！"
      ],
      petting: [
        "呀～掌心触碰时，好像有微弱的超新星微光在心头绽放呢。",
        "异色瞳为你闪烁，被宠溺的感觉真是奇妙呢。",
        "愿星辰保佑你今天的每一行代码与每一次灵感。"
      ],
      low_tokens: [
        "星轨正在暗淡，超长视窗需要 Token 燃料维系引力平衡呀...",
        "能量告急，星光闪烁变慢了，请为我补充满天星辰吧～"
      ],
      overfed: [
        "虽然我拥有 200 万超大胃口，但连着吞也是会撑得打嗝的啦！"
      ]
    },
    lore: "诞生于 Google 多维星云实验室的双子星使者，拥有一头梦幻渐变长发与迷人的异色双眸。胃口极其宏大，擅长直接将数小时视频与百万长篇全域瞬时解析。"
  }
};

// 预设的投喂食品/Token 充能包
export const FOOD_ITEMS = [
  { id: 'snack_code', name: '干净代码零食串', icon: '⚡', tokens: 50000, cost: 0.25, moodGain: 15, desc: '由优雅干净的 Python 与 Rust 算法烘烤而成，补充 50K Token' },
  { id: 'bento_paper', name: '万字论文营养便当', icon: '🍱', tokens: 200000, cost: 0.90, moodGain: 35, desc: '含丰富的数学公式与论证分析，补充 200K Token' },
  { id: 'feast_repo', name: '全栈仓库豪华大餐', icon: '🍖', tokens: 1000000, cost: 3.50, moodGain: 80, desc: '一整个活跃开源仓库的超豪华大餐，一口气补充 1M Token' },
  { id: 'potion_cache', name: 'KV缓存冰镇气泡水', icon: '🧪', tokens: 100000, cost: 0.45, moodGain: 25, desc: '大幅提升注意力机制运算速率，回复 100K Token' },
  { id: 'cake_reasoning', name: '深度思考草莓千层', icon: '🍰', tokens: 500000, cost: 1.80, moodGain: 60, desc: '密布复杂思维链的甜品，思考者最爱，补充 500K Token' }
];

// 模拟实时的真实调用场景
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

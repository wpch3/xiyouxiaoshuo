import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AI_CHARACTERS, FOOD_ITEMS, MOCK_API_CALLS } from './constants/characters';
import { AvatarRenderer } from './components/Avatars';
import {
  Sparkles,
  Zap,
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Settings,
  PieChart,
  Coffee,
  Coins,
  History,
  Info,
  Maximize2,
  Minimize2,
  Volume2,
  RefreshCw,
  Sliders,
  DollarSign,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  PlusCircle,
  Play,
  Pause,
  AlertTriangle,
  Gift
} from 'lucide-react';

export default function App() {
  // 当前选中的 AI 角色 (默认选择看板娘小寻 DeepSeek)
  const [currentId, setCurrentId] = useState('deepseek');
  // 桌面宠物形态模式：'full' (综合大屏仪表盘), 'compact' (精简桌宠窗)
  const [windowMode, setWindowMode] = useState('full');
  
  // 角色拟人状态
  const [mood, setMood] = useState('idle'); // 'idle' | 'happy' | 'sleepy' | 'thinking'
  const [speechText, setSpeechText] = useState('');
  const [favorability, setFavorability] = useState({
    deepseek: 98,
    claude: 92,
    openai: 89,
    gemini: 91,
    qwen: 95,
    kimi: 93,
    grok: 86
  });

  // 服饰系统：记录各角色当前穿戴的服饰
  const [selectedOutfit, setSelectedOutfit] = useState({
    deepseek: 'maid',
    claude: 'scholar',
    openai: 'maid',
    gemini: 'magical',
    qwen: 'hanfu',
    kimi: 'trench',
    grok: 'biker'
  });
  
  // 各角色的动态 Token 与消费账户状态
  const [accounts, setAccounts] = useState({
    deepseek: {
      balanceTokens: 4890000,
      totalSpentTokens: 18950000,
      totalCostUSD: 26.15,
      todayTokens: 1250000,
      todayCostUSD: 1.71,
      health: 98,
      budgetLimitUSD: 50.0,
      quotaWarnPercent: 85
    },
    claude: {
      balanceTokens: 1420500,
      totalSpentTokens: 8579400,
      totalCostUSD: 42.60,
      todayTokens: 384500,
      todayCostUSD: 1.92,
      health: 88,
      budgetLimitUSD: 100.0,
      quotaWarnPercent: 80
    },
    openai: {
      balanceTokens: 890400,
      totalSpentTokens: 14280000,
      totalCostUSD: 89.25,
      todayTokens: 920000,
      todayCostUSD: 5.75,
      health: 74,
      budgetLimitUSD: 150.0,
      quotaWarnPercent: 75
    },
    gemini: {
      balanceTokens: 3200000,
      totalSpentTokens: 9800000,
      totalCostUSD: 30.38,
      todayTokens: 620000,
      todayCostUSD: 1.92,
      health: 92,
      budgetLimitUSD: 80.0,
      quotaWarnPercent: 80
    },
    qwen: {
      balanceTokens: 2800000,
      totalSpentTokens: 11200000,
      totalCostUSD: 17.92,
      todayTokens: 780000,
      todayCostUSD: 1.25,
      health: 95,
      budgetLimitUSD: 60.0,
      quotaWarnPercent: 80
    },
    kimi: {
      balanceTokens: 2150000,
      totalSpentTokens: 6420000,
      totalCostUSD: 15.40,
      todayTokens: 520000,
      todayCostUSD: 1.24,
      health: 94,
      budgetLimitUSD: 70.0,
      quotaWarnPercent: 80
    },
    grok: {
      balanceTokens: 1780000,
      totalSpentTokens: 8900000,
      totalCostUSD: 44.50,
      todayTokens: 890000,
      todayCostUSD: 4.45,
      health: 91,
      budgetLimitUSD: 100.0,
      quotaWarnPercent: 75
    }
  });

  // 模拟自动化实时调用流 / 开关
  const [isSimulatingStream, setIsSimulatingStream] = useState(true);
  const [liveCallLog, setLiveCallLog] = useState([
    { id: 1, time: '12:24:10', model: 'Claude 3.7 Sonnet', action: '深度学术论文综述提炼', tokens: 84000, cost: 0.756, status: '成功' },
    { id: 2, time: '12:23:45', model: 'GPT-4o', action: '多模态图片 OCR 与逻辑提取', tokens: 18500, cost: 0.115, status: '成功' },
    { id: 3, time: '12:22:18', model: 'DeepSeek-R1', action: '全自动单元测试用例生成', tokens: 29100, cost: 0.039, status: '成功' },
    { id: 4, time: '12:20:05', model: 'Gemini 1.5 Pro', action: '长篇对话上下文记忆检索', tokens: 45000, cost: 0.139, status: '成功' }
  ]);

  // Tab 切换：'pet' (互动饲养), 'analytics' (消耗统计), 'billing' (预算与充值), 'settings' (偏好与API)
  const [activeTab, setActiveTab] = useState('pet');

  const char = AI_CHARACTERS[currentId];
  const acc = accounts[currentId];

  // 初始化说话
  useEffect(() => {
    const list = char.dialogues.idle;
    const randomSpeech = list[Math.floor(Math.random() * list.length)];
    setSpeechText(randomSpeech);
  }, [currentId]);

  // 定时自动说话（每 18 秒随机一句）
  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'idle') {
        const list = char.dialogues.idle;
        const randomSpeech = list[Math.floor(Math.random() * list.length)];
        setSpeechText(randomSpeech);
      }
    }, 18000);
    return () => clearInterval(interval);
  }, [currentId, mood]);

  // 模拟后台实时 Token 消耗心跳（桌面伴侣实时感）
  useEffect(() => {
    if (!isSimulatingStream) return;
    const interval = setInterval(() => {
      const randomCall = MOCK_API_CALLS[Math.floor(Math.random() * MOCK_API_CALLS.length)];
      const tokenCount = Math.floor(randomCall.tokens * (0.8 + Math.random() * 0.4));
      const costCalc = Number((tokenCount * char.tokenRate.avgPricePerToken).toFixed(4));
      const nowStr = new Date().toTimeString().split(' ')[0];

      setAccounts(prev => {
        const cur = prev[currentId];
        const newBalance = Math.max(0, cur.balanceTokens - tokenCount);
        const newTotalSpent = cur.totalSpentTokens + tokenCount;
        const newCost = Number((cur.totalCostUSD + costCalc).toFixed(3));
        const newTodayTokens = cur.todayTokens + tokenCount;
        const newTodayCost = Number((cur.todayCostUSD + costCalc).toFixed(3));
        // 健康度受余额比率轻微影响
        const newHealth = Math.min(100, Math.max(10, Math.round((newBalance / (newBalance + 500000)) * 100)));

        return {
          ...prev,
          [currentId]: {
            ...cur,
            balanceTokens: newBalance,
            totalSpentTokens: newTotalSpent,
            totalCostUSD: newCost,
            todayTokens: newTodayTokens,
            todayCostUSD: newTodayCost,
            health: newHealth
          }
        };
      });

      setLiveCallLog(prev => [
        {
          id: Date.now(),
          time: nowStr,
          model: char.name.split(' ')[0],
          action: randomCall.action,
          tokens: tokenCount,
          cost: costCalc,
          status: '成功'
        },
        ...prev.slice(0, 19)
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, [currentId, isSimulatingStream, char]);

  // 互动：摸摸头
  const handlePetAvatar = () => {
    setMood('happy');
    const pets = char.dialogues.petting;
    const line = pets[Math.floor(Math.random() * pets.length)];
    setSpeechText(line);

    // 好感度增加
    setFavorability(prev => ({
      ...prev,
      [currentId]: Math.min(100, prev[currentId] + 2)
    }));

    // 放一点温和彩屑
    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.6 },
        colors: [char.color, char.accentColor, '#FFFFFF']
      });
    } catch (e) {}

    setTimeout(() => {
      setMood('idle');
    }, 3200);
  };

  // 互动：投喂食物 / 充能
  const handleFeedFood = (food) => {
    setMood('happy');
    const feedings = char.dialogues.feeding;
    const line = feedings[Math.floor(Math.random() * feedings.length)];
    setSpeechText(line);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: [char.color, '#FFD700', '#6EE7B7']
      });
    } catch (e) {}

    // 更新账户 Token
    setAccounts(prev => {
      const cur = prev[currentId];
      return {
        ...prev,
        [currentId]: {
          ...cur,
          balanceTokens: cur.balanceTokens + food.tokens,
          health: Math.min(100, cur.health + 10)
        }
      };
    });

    setFavorability(prev => ({
      ...prev,
      [currentId]: Math.min(100, prev[currentId] + Math.round(food.moodGain / 6))
    }));

    setTimeout(() => {
      setMood('idle');
    }, 3500);
  };

  // 手动测试快速消耗模拟（如模拟发起一次 Agent 重度思考）
  const triggerManualCall = (tokensToConsume = 50000, actionName = '执行深度自省推理任务') => {
    setMood('thinking');
    setSpeechText(currentId === 'deepseek' ? "<think> 正在逐层反思推理验证最优逻辑解... </think>" : "正在全力计算中，请稍候片刻...");

    setTimeout(() => {
      const costCalc = Number((tokensToConsume * char.tokenRate.avgPricePerToken).toFixed(4));
      const nowStr = new Date().toTimeString().split(' ')[0];

      setAccounts(prev => {
        const cur = prev[currentId];
        return {
          ...prev,
          [currentId]: {
            ...cur,
            balanceTokens: Math.max(0, cur.balanceTokens - tokensToConsume),
            totalSpentTokens: cur.totalSpentTokens + tokensToConsume,
            totalCostUSD: Number((cur.totalCostUSD + costCalc).toFixed(3)),
            todayTokens: cur.todayTokens + tokensToConsume,
            todayCostUSD: Number((cur.todayCostUSD + costCalc).toFixed(3))
          }
        };
      });

      setLiveCallLog(prev => [
        {
          id: Date.now(),
          time: nowStr,
          model: char.name.split(' ')[0],
          action: actionName,
          tokens: tokensToConsume,
          cost: costCalc,
          status: '完成'
        },
        ...prev.slice(0, 19)
      ]);

      setMood('happy');
      setSpeechText(`呼！成功处理完毕，共消耗 ${(tokensToConsume / 1000).toFixed(1)}k Tokens，解答已生成！`);

      setTimeout(() => setMood('idle'), 3000);
    }, 1200);
  };

  // 格式化函数
  const fmtNum = (num) => (num || 0).toLocaleString();
  const fmtTokens = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + ' M';
    if (num >= 1000) return (num / 1000).toFixed(1) + ' k';
    return num;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0d14',
        backgroundImage: `radial-gradient(circle at 50% 10%, ${char.glowColor}, transparent 45%), radial-gradient(circle at 90% 80%, rgba(15, 23, 42, 0.8), transparent 50%)`,
        color: '#f8fafc',
        transition: 'all 0.5s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 顶部多角色皮肤切换与状态栏 */}
      <header
        style={{
          borderBottom: `1px solid ${char.borderTone}`,
          backgroundColor: 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${char.color}, ${char.secondaryColor})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 16px ${char.glowColor}`
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                AI Token Pet · 拟人桌面消费伴侣
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: `${char.color}25`,
                  color: char.accentColor,
                  border: `1px solid ${char.color}50`
                }}
              >
                v2.5 Pro
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              高颜值拟人桌宠 · 实时 Token 计量 · 动态换肤 · 拟真饲育
            </p>
          </div>
        </div>

        {/* 4大 AI 形象快捷切换栏 */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
            gap: '6px'
          }}
        >
          {Object.values(AI_CHARACTERS).map((item) => {
            const isSelected = item.id === currentId;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentId(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: isSelected ? `1px solid ${item.color}` : '1px solid transparent',
                  backgroundColor: isSelected ? `${item.color}33` : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '0.82rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? `0 0 12px ${item.glowColor}` : 'none'
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    boxShadow: `0 0 6px ${item.color}`
                  }}
                />
                {item.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* 窗口形态与模拟器控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsSimulatingStream(!isSimulatingStream)}
            title={isSimulatingStream ? '暂停模拟后台 Token 消耗' : '开启模拟后台实时消耗'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              border: isSimulatingStream ? '1px solid #10B98150' : '1px solid #EF444450',
              backgroundColor: isSimulatingStream ? '#10B98120' : '#EF444420',
              color: isSimulatingStream ? '#34D399' : '#F87171',
              cursor: 'pointer'
            }}
          >
            {isSimulatingStream ? <Play size={14} /> : <Pause size={14} />}
            {isSimulatingStream ? '心跳监听中' : '监听已暂停'}
          </button>

          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '3px'
            }}
          >
            <button
              onClick={() => setWindowMode('full')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: windowMode === 'full' ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="完整仪表盘模式"
            >
              <Maximize2 size={13} /> 完整
            </button>
            <button
              onClick={() => setWindowMode('compact')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: windowMode === 'compact' ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="精简悬浮窗模式"
            >
              <Minimize2 size={13} /> 精简
            </button>
          </div>
        </div>
      </header>

      {/* 主体布局 */}
      <main style={{ flex: 1, padding: windowMode === 'full' ? '24px' : '16px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* 精简模式下只展示核心宠物和快速喂食条 */}
        {windowMode === 'compact' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: char.cardBg,
              borderRadius: '24px',
              padding: '24px',
              border: `1px solid ${char.borderTone}`,
              maxWidth: '460px',
              margin: '30px auto',
              boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${char.glowColor}`
            }}
          >
            {/* 顶栏快速切换 */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: char.accentColor, fontSize: '0.95rem' }}>{char.name}</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>余量: {fmtTokens(acc.balanceTokens)}</span>
            </div>

            {/* 对话气泡 */}
            <div
              className="speech-bubble"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: `1px solid ${char.color}60`,
                borderColor: `${char.color}60`,
                padding: '10px 18px',
                borderRadius: '16px',
                marginBottom: '10px',
                fontSize: '0.85rem',
                maxWidth: '90%',
                textAlign: 'center',
                color: '#f1f5f9'
              }}
            >
              💬 {speechText}
            </div>

            {/* 角色立体拟人立绘 */}
            <div onClick={handlePetAvatar} style={{ cursor: 'pointer', position: 'relative' }} title="点击摸摸头增加好感度！">
              <AvatarRenderer characterId={currentId} mood={mood} size={250} />
            </div>

            {/* 快速投喂操作 */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', width: '100%', justifyContent: 'center' }}>
              {FOOD_ITEMS.slice(0, 3).map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleFeedFood(food)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${char.borderTone}`,
                    color: '#fff',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{food.icon}</span>
                  <span>+{fmtTokens(food.tokens)}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => triggerManualCall(35000, '快捷推理调用')}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: `${char.color}33`,
                border: `1px solid ${char.color}`,
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} color={char.color} /> 模拟消费 35K Token
            </button>
          </div>
        ) : (
          /* 完整仪表盘模式 */
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
            {/* 左侧：拟人角色舞台与互动专区 */}
            <div
              style={{
                backgroundColor: char.cardBg,
                borderRadius: '24px',
                border: `1px solid ${char.borderTone}`,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                boxShadow: `0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
                overflow: 'hidden'
              }}
            >
              {/* 背景装饰光 */}
              <div
                style={{
                  position: 'absolute',
                  top: '-80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background: char.glowColor,
                  filter: 'blur(70px)',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />

              {/* 角色卡头衔 */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1, marginBottom: '6px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>{char.name}</h2>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        backgroundColor: `${char.color}25`,
                        color: char.accentColor,
                        fontWeight: 600
                      }}
                    >
                      Lv.{Math.floor(favorability[currentId] / 10) + 1}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{char.title}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.85rem', fontWeight: 700 }}>
                    <Heart size={16} fill="#f43f5e" />
                    <span>{favorability[currentId]}%</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>羁绊好感度</span>
                </div>
              </div>

              {/* 实时台词气泡 */}
              <div
                className="speech-bubble"
                style={{
                  zIndex: 2,
                  marginTop: '12px',
                  marginBottom: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.92)',
                  border: `1px solid ${char.color}50`,
                  borderColor: `${char.color}50`,
                  padding: '12px 18px',
                  borderRadius: '18px',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                  maxWidth: '320px',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#e2e8f0',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span>{speechText}</span>
              </div>

              {/* 核心立绘角色 */}
              <div
                onClick={handlePetAvatar}
                style={{
                  zIndex: 2,
                  cursor: 'pointer',
                  margin: '4px 0 10px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}
                title="抚摸脑袋 / 点击互动"
              >
                <AvatarRenderer characterId={currentId} mood={mood} outfit={selectedOutfit[currentId]} size={270} />
              </div>

              {/* 情绪与服饰换装快捷条 */}
              <div style={{ width: '100%', zIndex: 2, marginBottom: '14px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: char.accentColor, fontWeight: 600 }}>👗 服饰换装系统</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['idle', 'happy', 'thinking', 'sleepy'].map((m) => (
                      <button
                        key={m}
                        onClick={(e) => { e.stopPropagation(); setMood(m); }}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          border: mood === m ? `1px solid ${char.color}` : '1px solid transparent',
                          backgroundColor: mood === m ? `${char.color}35` : 'rgba(255,255,255,0.05)',
                          color: mood === m ? '#fff' : '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        {m === 'idle' ? '待机' : m === 'happy' ? '开心' : m === 'thinking' ? '思考' : '困倦'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(char.outfits || [{ id: 'default', name: '默认服饰', desc: '经典造型' }]).map((outfit) => (
                    <button
                      key={outfit.id}
                      onClick={() => setSelectedOutfit(p => ({ ...p, [currentId]: outfit.id }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        border: selectedOutfit[currentId] === outfit.id ? `1px solid ${char.color}` : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: selectedOutfit[currentId] === outfit.id ? `${char.color}40` : 'rgba(255,255,255,0.04)',
                        color: selectedOutfit[currentId] === outfit.id ? '#fff' : '#cbd5e1'
                      }}
                      title={outfit.desc}
                    >
                      ✨ {outfit.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 快捷互动小动作条 */}
              <div style={{ display: 'flex', gap: '10px', width: '100%', zIndex: 2, marginBottom: '16px' }}>
                <button
                  onClick={handlePetAvatar}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <Heart size={14} /> 抚摸安慰
                </button>
                <button
                  onClick={() => triggerManualCall(40000, '思维推演连击')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '12px',
                    backgroundColor: `${char.color}25`,
                    border: `1px solid ${char.color}50`,
                    color: char.accentColor,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <Cpu size={14} /> 激活动态思考
                </button>
              </div>

              {/* 拟人背景人设小卡 */}
              <div
                style={{
                  zIndex: 2,
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  lineHeight: 1.5
                }}
              >
                <div style={{ color: char.accentColor, fontWeight: 600, marginBottom: '4px' }}>
                  📖 角色立绘设定集 ({char.modelFamily})
                </div>
                <div>{char.lore}</div>
              </div>
            </div>

            {/* 右侧：多功能控制台 (投喂、仪表盘、消费流水、模型定价对比) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 四大关键数据指标卡片 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                {/* 1. 当前 Token 余额 */}
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span>剩余可用 Token 储备</span>
                    <Coins size={15} color={char.color} />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    {fmtTokens(acc.balanceTokens)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    精确值: {fmtNum(acc.balanceTokens)}
                  </div>
                </div>

                {/* 2. 今日累计消费 */}
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span>今日消耗金额</span>
                    <DollarSign size={15} color="#10B981" />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399' }}>
                    ${acc.todayCostUSD.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    共消耗 {fmtTokens(acc.todayTokens)} Tokens
                  </div>
                </div>

                {/* 3. 历史总计消耗 */}
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span>历史总支出 (USD)</span>
                    <Activity size={15} color="#F59E0B" />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBBF24' }}>
                    ${acc.totalCostUSD.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    累计调用 {fmtTokens(acc.totalSpentTokens)} Tokens
                  </div>
                </div>

                {/* 4. 宠物健康/活力度 */}
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span>伴侣活力 (健康状态)</span>
                    <Sparkles size={15} color="#A855F7" />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C084FC' }}>
                    {acc.health}%
                  </div>
                  <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${acc.health}%`,
                        height: '100%',
                        backgroundColor: '#C084FC',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 中间 Tab 导航区 */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  paddingBottom: '8px'
                }}
              >
                {[
                  { id: 'pet', label: 'Token 投喂饲育', icon: Coffee },
                  { id: 'analytics', label: '模型费率与对比', icon: PieChart },
                  { id: 'billing', label: '调用流水审计', icon: History },
                  { id: 'settings', label: '预算预警与配置', icon: Sliders }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isActive ? `${char.color}33` : 'transparent',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                    >
                      <Icon size={16} color={isActive ? char.color : '#94a3b8'} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 页面内容 */}
              {activeTab === 'pet' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      backgroundColor: char.cardBg,
                      border: `1px solid ${char.borderTone}`,
                      borderRadius: '18px',
                      padding: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                          🥫 知识与能量投喂商铺
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          为 {char.name.split(' ')[0]} 充能各种优质结构化数据，补充 Token 储备并提升好感度！
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: char.accentColor, backgroundColor: `${char.color}20`, padding: '4px 10px', borderRadius: '12px' }}>
                        单价: ${(char.tokenRate.avgPricePerToken * 1000000).toFixed(2)} / 1M Tokens
                      </span>
                    </div>

                    {/* 食品投喂卡片列表 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      {FOOD_ITEMS.map((food) => (
                        <div
                          key={food.id}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px',
                            transition: 'transform 0.2s, border-color 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ fontSize: '2rem', padding: '6px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
                              {food.icon}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{food.name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>${food.cost.toFixed(2)}</span>
                              </div>
                              <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', lineHeight: 1.35 }}>
                                {food.desc}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                              ⚡ +{fmtTokens(food.tokens)} Tokens · 好感 +{food.moodGain}
                            </span>
                            <button
                              onClick={() => handleFeedFood(food)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                backgroundColor: char.color,
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <Gift size={13} /> 立即投喂
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 快捷测试调用面板 */}
                  <div
                    style={{
                      backgroundColor: char.cardBg,
                      border: `1px solid ${char.borderTone}`,
                      borderRadius: '18px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                        🚀 一键体验高强度 Agent 任务调用
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                        触发拟人伴侣现场处理任务，查看实时立绘情绪变化、扣费与台词反馈
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => triggerManualCall(20000, '代码重构建议')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        测试小任务 (20K)
                      </button>
                      <button
                        onClick={() => triggerManualCall(100000, '万行仓库深度架构推理')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          backgroundColor: `${char.color}35`,
                          border: `1px solid ${char.color}`,
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ 极限压测 (100K)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 各大 AI 模型费率横向对比 */}
              {activeTab === 'analytics' && (
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '20px'
                  }}
                >
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: '#fff' }}>
                    📊 四大家族 AI Token 性价比与费率全景看板
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {Object.values(AI_CHARACTERS).map((item) => {
                      const isCurrent = item.id === currentId;
                      return (
                        <div
                          key={item.id}
                          style={{
                            backgroundColor: isCurrent ? `${item.color}15` : 'rgba(255,255,255,0.02)',
                            border: isCurrent ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, color: item.color, fontSize: '0.9rem' }}>{item.name.split(' ')[0]}</span>
                            {isCurrent && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: item.color, color: '#fff', padding: '2px 6px', borderRadius: '6px' }}>
                                当前皮肤
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.tag}</div>

                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#64748b' }}>输入 (1M):</span>
                              <span style={{ color: '#f1f5f9' }}>${item.tokenRate.inputCostPer1M.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#64748b' }}>输出 (1M):</span>
                              <span style={{ color: '#f1f5f9' }}>${item.tokenRate.outputCostPer1M.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>综合均价:</span>
                              <span style={{ color: '#10B981', fontWeight: 600 }}>
                                ${(item.tokenRate.avgPricePerToken * 1000000).toFixed(2)} / 1M
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setCurrentId(item.id)}
                            style={{
                              marginTop: '6px',
                              padding: '6px',
                              borderRadius: '8px',
                              border: `1px solid ${item.color}60`,
                              backgroundColor: `${item.color}20`,
                              color: item.color,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            切换此形象
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: 调用流水审计 */}
              {activeTab === 'billing' && (
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                      📋 实时 API Token 审计流水记录
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>展示最近 20 条消费明细</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '8px 10px' }}>时间</th>
                          <th style={{ padding: '8px 10px' }}>模型</th>
                          <th style={{ padding: '8px 10px' }}>调用动作</th>
                          <th style={{ padding: '8px 10px' }}>Token 规模</th>
                          <th style={{ padding: '8px 10px' }}>折合费用</th>
                          <th style={{ padding: '8px 10px' }}>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveCallLog.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>{log.time}</td>
                            <td style={{ padding: '8px 10px', color: '#cbd5e1', fontWeight: 600 }}>{log.model}</td>
                            <td style={{ padding: '8px 10px', color: '#f1f5f9' }}>{log.action}</td>
                            <td style={{ padding: '8px 10px', color: char.accentColor }}>{fmtNum(log.tokens)}</td>
                            <td style={{ padding: '8px 10px', color: '#10B981' }}>${log.cost.toFixed(4)}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#10B98120', color: '#34D399', fontSize: '0.7rem' }}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: 预算预警与个性化配置 */}
              {activeTab === 'settings' && (
                <div
                  style={{
                    backgroundColor: char.cardBg,
                    border: `1px solid ${char.borderTone}`,
                    borderRadius: '18px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    ⚙️ 桌面伴侣偏好 & 费用预警策略
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* 月度预算限制 */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        本月支出软上限预算 (USD)
                      </label>
                      <input
                        type="number"
                        value={acc.budgetLimitUSD}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAccounts(p => ({ ...p, [currentId]: { ...p[currentId], budgetLimitUSD: val } }));
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        达到上限时伴侣将做出疲倦提示并发出桌面通知
                      </span>
                    </div>

                    {/* 预警阈值比例 */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        消耗警告阈值 ({acc.quotaWarnPercent}%)
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={acc.quotaWarnPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAccounts(p => ({ ...p, [currentId]: { ...p[currentId], quotaWarnPercent: val } }));
                        }}
                        style={{ width: '100%', accentColor: char.color, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        当前消耗已达 {((acc.todayCostUSD / acc.budgetLimitUSD) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* 声音与台词风格设置 */}
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                      伴侣性格音效与语音偏好
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      当前语调特征: <span style={{ color: char.accentColor }}>{char.voiceStyle}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 底部信息栏 */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748b'
        }}
      >
        <div>
          <span>AI Desktop Token Pet © 2026</span>
          <span style={{ marginLeft: '12px' }}>支持 Claude · OpenAI · DeepSeek · Gemini 全模态接入</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>状态: 运行正常 (WebSocket 监听活跃)</span>
          <span>延迟: 42ms</span>
        </div>
      </footer>
    </div>
  );
}

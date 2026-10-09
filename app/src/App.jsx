import React, { useState, useEffect, useRef } from 'react';
import { AI_CHARACTERS, FOOD_ITEMS } from './constants/characters';
import { getToolButtonArt } from './constants/toolArt';
import { CompactPetStage } from './components/CompactPetStage';
import { LiveAnimeModel } from './components/LiveAnimeModel';
import { FloatingDeskPetOverlay } from './components/BongoPetLive';
import { ClickParticleCanvas } from './components/ClickParticleCanvas';
import { VoiceChatControls } from './components/VoiceChatControls';
import { WorkspacePanel, LibraryPanel, AgentPanel, SocialPanel, LinksPanel } from './components/ProjectPanels';
import { listLocalDocuments } from './utils/localDocumentStore';
import { soundManager } from './utils/soundManager';
import { aiService, DEFAULT_PROVIDER_CONFIGS } from './utils/aiService';
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
  AlertTriangle,
  Gift,
  MousePointer2,
  MessageCircle,
  Shirt,
  BookOpen,
  Package,
  ClipboardList,
  PlugZap,
  Mic,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const ACCOUNT_STORAGE_KEY = 'pet_account_state_v1';
const CHAT_STORAGE_KEY = 'pet_chat_history_v1';
const CALL_LOG_STORAGE_KEY = 'pet_call_log_v1';

const EMOJI_RANGES = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu;
// 展示层净化：模型回复或任何文本中的 Emoji 一律不渲染（项目硬约束：界面不出现 Emoji）
const stripEmoji = (text = '') => String(text).replace(EMOJI_RANGES, '').replace(/\s{3,}/g, ' ');

const localDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const makeEmptyAccounts = () => Object.fromEntries(
  Object.keys(AI_CHARACTERS).map((id) => [id, {
    balanceTokens: 0,
    totalSpentTokens: 0,
    totalCostUSD: 0,
    todayTokens: 0,
    todayCostUSD: 0,
    health: 100,
    budgetLimitUSD: 50,
    quotaWarnPercent: 85,
  }]),
);

const readLocalJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const loadAccounts = () => {
  const empty = makeEmptyAccounts();
  const saved = readLocalJson(ACCOUNT_STORAGE_KEY, null);
  if (!saved) return empty;
  const savedAccounts = saved.accounts || saved;
  const accounts = Object.fromEntries(Object.keys(empty).map((id) => [
    id,
    { ...empty[id], ...(savedAccounts[id] || {}) },
  ]));
  if (saved.date && saved.date !== localDateKey()) {
    Object.values(accounts).forEach((account) => {
      account.todayTokens = 0;
      account.todayCostUSD = 0;
    });
  }
  return accounts;
};

export default function App() {
  // 当前选中的 AI 角色 (默认选择看板娘小寻 DeepSeek)
  const [currentId, setCurrentId] = useState(() => readLocalJson('pet_current_character_v1', 'deepseek'));
  // 独立桌面小窗通过 #compact 打开时，直接进入紧凑模式
  const [windowMode, setWindowMode] = useState(() => window.location.hash === '#compact' ? 'compact' : 'full');
  // 是否开启右下角独立置顶悬浮伴侣小窗口
  const [isFloatingOverlayOpen, setIsFloatingOverlayOpen] = useState(false);
  
  // 角色拟人状态
  const [mood, setMood] = useState('idle'); // 'idle' | 'happy' | 'crying' | 'thinking' | 'hammered'
  const [characterForm, setCharacterForm] = useState(() => readLocalJson('pet_character_form_v1', 'normal')); // loli | normal(少女) | mature | chibi
  const [petScale, setPetScale] = useState(() => {
    const saved = readLocalJson('pet_scale_v1', 1);
    return typeof saved === 'number' ? Math.min(1.5, Math.max(0.7, saved)) : 1;
  });
  const [speechText, setSpeechText] = useState('');
  const [activeTool, setActiveTool] = useState('pointer');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userChatInput, setUserChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiConfig, setApiConfigState] = useState(() => aiService.getApiConfig('deepseek'));
  const [voiceConfig, setVoiceConfigState] = useState(() => aiService.getVoiceConfig());
  const [favorability, setFavorability] = useState(() => readLocalJson('pet_favorability_v1', {
    deepseek: 98,
    claude: 92,
    openai: 89,
    gemini: 91,
    qwen: 95,
    kimi: 93,
    grok: 86
  }));

  // 服饰系统：记录各角色当前穿戴的服饰
  const [selectedOutfit, setSelectedOutfit] = useState(() => readLocalJson('pet_selected_outfits_v1', {
    deepseek: 'maid',
    claude: 'scholar',
    openai: 'maid',
    gemini: 'magical',
    qwen: 'hanfu',
    kimi: 'trench',
    grok: 'biker'
  }));
  
  // 本地累计的真实 API 用量与桌宠能量状态（费用以实际 API usage 计量）
  const [accounts, setAccounts] = useState(loadAccounts);
  const [liveCallLog, setLiveCallLog] = useState(() => readLocalJson(CALL_LOG_STORAGE_KEY, []));
  const [chatHistories, setChatHistories] = useState(() => readLocalJson(CHAT_STORAGE_KEY, {}));
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    listLocalDocuments().then(setDocuments).catch((error) => console.warn('读取本机资料库失败:', error));
  }, []);

  // Tab 切换：'pet' (互动饲养), 'analytics' (消耗统计), 'billing' (预算与充值), 'settings' (偏好与API)
  const [activeTab, setActiveTab] = useState('pet');

  const char = AI_CHARACTERS[currentId] || AI_CHARACTERS.deepseek;
  const acc = accounts[currentId] || makeEmptyAccounts().deepseek;
  const currentChatMessages = chatHistories[currentId] || [];
  const localDocumentContext = documents
    .filter((document) => document.includeInContext && document.textContent)
    .map((document) => `【本机资料：${document.name}】\n${document.textContent}`)
    .join('\n\n')
    .slice(0, 50_000);

  useEffect(() => {
    setApiConfigState(aiService.getApiConfig(currentId));
  }, [currentId]);

  const updateApiConfig = (patch) => {
    setApiConfigState(aiService.setApiConfig(currentId, patch));
  };
  const updateVoiceConfig = (patch) => {
    setVoiceConfigState(aiService.setVoiceConfig(patch));
  };

  // 对话、用量、偏好和服饰都保存在本机浏览器存储中
  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify({ date: localDateKey(), accounts }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistories));
      localStorage.setItem(CALL_LOG_STORAGE_KEY, JSON.stringify(liveCallLog.slice(0, 100)));
      localStorage.setItem('pet_current_character_v1', JSON.stringify(currentId));
      localStorage.setItem('pet_character_form_v1', JSON.stringify(characterForm));
      localStorage.setItem('pet_selected_outfits_v1', JSON.stringify(selectedOutfit));
      localStorage.setItem('pet_favorability_v1', JSON.stringify(favorability));
      localStorage.setItem('pet_scale_v1', JSON.stringify(petScale));
    } catch (error) {
      console.warn('本地数据保存失败:', error);
    }
  }, [accounts, chatHistories, liveCallLog, currentId, characterForm, selectedOutfit, favorability, petScale]);

  // 互动动作只更新角色状态，不伪造角色台词；对话气泡只展示 API 回复与连接状态。
  const handlePetAvatar = () => {
    setMood('happy');
    setFavorability((prev) => ({
      ...prev,
      [currentId]: Math.min(100, (prev[currentId] || 0) + 1),
    }));
    window.setTimeout(() => setMood((currentMood) => currentMood === 'happy' ? 'idle' : currentMood), 900);
  };

  const handleHammerAvatar = () => {
    setMood('hammered');
    window.setTimeout(() => setMood((currentMood) => currentMood === 'hammered' ? 'idle' : currentMood), 560);
  };

  // 互动：投喂食物 / 充能
  const handleFeedFood = (food) => {
    setMood('happy');
    soundManager.playFeed();
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

  const updatePendingAssistant = (provider, messageId, patch) => {
    setChatHistories((prev) => ({
      ...prev,
      [provider]: (prev[provider] || []).map((message) =>
        message.id === messageId ? { ...message, ...patch } : message,
      ),
    }));
  };

  const recordApiUsage = (provider, action, result) => {
    const selectedCharacter = AI_CHARACTERS[provider] || AI_CHARACTERS.deepseek;
    const inputCost = (Number(result.inputTokens || 0) * selectedCharacter.tokenRate.inputCostPer1M) / 1_000_000;
    const outputCost = (Number(result.outputTokens || 0) * selectedCharacter.tokenRate.outputCostPer1M) / 1_000_000;
    const costCalc = Number((inputCost + outputCost).toFixed(6));
    const usedTokens = Number(result.tokens) || 0;
    const nowStr = new Date().toTimeString().split(' ')[0];
    setAccounts((prev) => {
      const cur = prev[provider] || makeEmptyAccounts()[provider];
      const balanceTokens = Math.max(0, cur.balanceTokens - usedTokens);
      return {
        ...prev,
        [provider]: {
          ...cur,
          balanceTokens,
          totalSpentTokens: cur.totalSpentTokens + usedTokens,
          totalCostUSD: Number((cur.totalCostUSD + costCalc).toFixed(6)),
          todayTokens: cur.todayTokens + usedTokens,
          todayCostUSD: Number((cur.todayCostUSD + costCalc).toFixed(6)),
          health: Math.max(10, Math.round((balanceTokens / (balanceTokens + 500_000)) * 100)),
        },
      };
    });
    setLiveCallLog((prev) => [{
      id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: nowStr,
      model: result.model || selectedCharacter.modelFamily,
      action: String(action || '').slice(0, 90),
      tokens: usedTokens,
      cost: costCalc,
      status: '成功',
      usageSource: result.usageSource,
    }, ...prev].slice(0, 100));
  };

  const sendChatMessage = async (rawPrompt = userChatInput) => {
    const prompt = String(rawPrompt || '').trim();
    if (!prompt || isAiLoading) return;

    const provider = currentId;
    const selectedCharacter = AI_CHARACTERS[provider] || AI_CHARACTERS.deepseek;
    const previousMessages = (chatHistories[provider] || [])
      .filter((message) => !message.pending && !message.failed && message.content)
      .slice(-30)
      .map(({ role, content }) => ({ role, content }));
    const userMessage = { id: `u-${Date.now()}`, role: 'user', content: prompt, createdAt: new Date().toISOString() };
    const assistantId = `a-${Date.now()}`;

    setUserChatInput('');
    setIsAiLoading(true);
    setIsSpeaking(true);
    setMood('thinking');
    setSpeechText('正在连接所选 API…');
    soundManager.playThinking();
    setChatHistories((prev) => ({
      ...prev,
      [provider]: [
        ...(prev[provider] || []),
        userMessage,
        { id: assistantId, role: 'assistant', content: '', pending: true, createdAt: new Date().toISOString() },
      ].slice(-100),
    }));

    try {
      await aiService.sendPrompt({
        provider,
        messages: [...previousMessages, { role: 'user', content: prompt }],
        systemPrompt: `你是 ${selectedCharacter.name}，角色特征：${selectedCharacter.tag}。性格：${selectedCharacter.voiceStyle}。请以自然、简洁、友善的桌宠语气回答；用户提出工作任务时优先给出可执行的结果。${localDocumentContext ? `\n\n以下是用户在本机资料库中勾选的上下文资料，请按需引用：\n${localDocumentContext}` : ''}`,
        onChunk: (_chunk, fullText) => {
          setSpeechText(fullText);
          updatePendingAssistant(provider, assistantId, { content: fullText, pending: true });
        },
        onComplete: (result) => {
          setIsAiLoading(false);
          setIsSpeaking(false);
          setMood('happy');
          setSpeechText(result.fullText);
          soundManager.playPet();
          updatePendingAssistant(provider, assistantId, {
            content: result.fullText,
            pending: false,
            model: result.model,
            tokens: result.tokens,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            usageSource: result.usageSource,
          });

          recordApiUsage(provider, prompt, result);
          setTimeout(() => setMood('idle'), 3000);
        },
        onError: (message) => {
          setIsAiLoading(false);
          setIsSpeaking(false);
          setMood('idle');
          setSpeechText(`API 调用失败：${message}`);
          updatePendingAssistant(provider, assistantId, {
            content: `API 调用失败：${message}`,
            pending: false,
            failed: true,
          });
        },
      });
    } catch {
      // aiService 已通过 onError 把错误写进对话记录；不再降级成虚构回答。
    }
  };

  // 快捷任务走真实 API 对话，不再虚构 Token 消耗。
  const triggerManualCall = (actionName = '请帮我完成当前任务') => {
    sendChatMessage(`请帮我完成：${actionName}`);
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
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0a0d14',
        backgroundImage: `radial-gradient(circle at 50% 10%, ${char.glowColor}, transparent 45%), radial-gradient(circle at 90% 80%, rgba(15, 23, 42, 0.8), transparent 50%)`,
        color: '#f8fafc',
        transition: 'all 0.5s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 全局点击彩色微粒子光晕特效 */}
      <ClickParticleCanvas />

      {/* 独立置顶桌面伴侣小窗口 */}
      {isFloatingOverlayOpen && !window.pywebview?.api?.spawn_floating_pet && (
        <FloatingDeskPetOverlay
          characterId={currentId}
          mood={mood}
          speechText={speechText}
          tokensToday={acc.todayTokens}
          onPet={handlePetAvatar}
          onHammer={handleHammerAvatar}
          onSelectTool={setActiveTool}
          activeTool={activeTool}
          accentColor={char.accentColor}
          onClose={() => setIsFloatingOverlayOpen(false)}
        />
      )}

      {/* 顶部多角色皮肤切换与状态栏 */}
      <header
        style={{
          borderBottom: `1px solid ${char.borderTone}`,
          backgroundColor: 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          padding: '12px 24px',
          display: windowMode === 'compact' ? 'none' : 'flex',
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
                onClick={() => {
                  soundManager.playSwitch();
                  setCurrentId(item.id);
                }}
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
                <img
                  src={item.id === 'deepseek' ? '/characters/deepseek_live.png' : `/characters/${item.id}.png`}
                  alt=""
                  style={{ width: 30, height: 30, objectFit: 'cover', objectPosition: 'center 18%', borderRadius: '50%', border: `1px solid ${item.color}80`, background: `${item.color}22` }}
                />
                {item.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* 窗口形态与模拟器控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              const desktopApi = window.pywebview?.api;
              if (desktopApi?.spawn_floating_pet) {
                if (isFloatingOverlayOpen) desktopApi.close_floating_pet?.();
                else desktopApi.spawn_floating_pet();
              }
              setIsFloatingOverlayOpen((open) => !open);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: isFloatingOverlayOpen ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.15)',
              backgroundColor: isFloatingOverlayOpen ? '#3B82F633' : 'rgba(255,255,255,0.06)',
              color: isFloatingOverlayOpen ? '#60A5FA' : '#cbd5e1',
              cursor: 'pointer'
            }}
            title="开启/关闭独立桌面置顶伴侣小窗"
          >
            <Heart size={14} /> {isFloatingOverlayOpen ? '置顶小窗已激活' : '弹出独立桌宠小窗'}
          </button>

          <span
            title="账单只记录真实 API 响应的用量；无 usage 数据时会明确标记为估算"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: '#34D399',
              border: '1px solid #10B98150',
              backgroundColor: '#10B98120',
              whiteSpace: 'nowrap'
            }}
          >
            ● 真实 API 计量
          </span>

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
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: windowMode === 'full' ? '18px 24px' : '16px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* 精简模式下切换为真正的 Bongo 实时键鼠工作台 */}
        {windowMode === 'compact' ? (
          <CompactPetStage
            characterId={currentId}
            form={characterForm}
            mood={mood}
            speechText={speechText}
            balanceLabel={fmtTokens(acc.balanceTokens)}
            activeTool={activeTool}
            accentColor={char.accentColor}
            onPet={handlePetAvatar}
            onHammer={handleHammerAvatar}
            onSelectTool={setActiveTool}
            onOpenWorkspace={() => {
              if (window.pywebview?.api?.open_main_window) window.pywebview.api.open_main_window();
              else setWindowMode('full');
            }}
            onChooseWorkspace={
              window.pywebview?.api?.choose_workspace
                ? async () => {
                  try {
                    const picked = await window.pywebview.api.choose_workspace();
                    if (picked) setSpeechText(`已选择工作目录：${picked}`);
                  } catch (err) {
                    setSpeechText(String((err && err.message) || err));
                  }
                }
                : null
            }
            onClose={() => {
              if (window.pywebview?.api?.close_floating_pet) window.pywebview.api.close_floating_pet();
              else setWindowMode('full');
            }}
          />
        ) : (
          /* 完整仪表盘模式 */
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', height: '100%', minHeight: 0 }}>
            {/* 左侧：拟人角色舞台与互动专区 */}
            <div
              className="pet-main-card"
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
                className="speech-bubble pet-speech-bubble"
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
                <span>{stripEmoji(speechText)}</span>
              </div>

              {/* 角色缩放控制：太小看不清/不好点时放大，记忆到本机 */}
              <div
                style={{
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  color: '#94a3b8',
                  fontSize: '0.7rem'
                }}
              >
                <button
                  type="button"
                  aria-label="缩小角色"
                  onClick={() => setPetScale((v) => Math.max(0.7, Number((v - 0.1).toFixed(2))))}
                  style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}
                ><ZoomOut size={14} /></button>
                <span style={{ minWidth: 40, textAlign: 'center' }}>{Math.round(petScale * 100)}%</span>
                <button
                  type="button"
                  aria-label="放大角色"
                  onClick={() => setPetScale((v) => Math.min(1.5, Number((v + 0.1).toFixed(2))))}
                  style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}
                ><ZoomIn size={14} /></button>
                <span>角色大小</span>
              </div>

              {/* 形态快速切换（常驻可见，不再被聊天区挤出） */}
              <div style={{ display: 'flex', gap: '4px', zIndex: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { id: 'normal', label: '少女' },
                  { id: 'loli', label: '萝莉' },
                  { id: 'mature', label: '青年女性' },
                  { id: 'chibi', label: 'Q版' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      soundManager.playSwitch();
                      setCharacterForm(f.id);
                    }}
                    style={{
                      fontSize: '0.66rem',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      border: `1px solid ${characterForm === f.id ? char.color : 'rgba(255,255,255,0.14)'}`,
                      backgroundColor: characterForm === f.id ? `${char.color}33` : 'rgba(255,255,255,0.05)',
                      color: '#e2e8f0',
                      cursor: 'pointer'
                    }}
                  >{f.label}</button>
                ))}
              </div>

              {/* 核心立绘角色 (分层拆件 rig：视线/眨眼/口型/眉/发丝摆动) */}
              <div
                style={{
                  zIndex: 2,
                  margin: '4px 0 10px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <LiveAnimeModel
                  characterId={currentId}
                  form={characterForm}
                  mood={mood}
                  activeTool={activeTool}
                  isSpeaking={isSpeaking}
                  accentColor={char.accentColor}
                  onPet={handlePetAvatar}
                  onHammer={handleHammerAvatar}
                  size={320}
                  scale={petScale}
                />
              </div>

              <div className="pet-tool-dock" style={{ zIndex: 3, '--pet-accent': char.color }} aria-label="桌宠互动工具">
                {[
                  { id: 'pointer', label: '观察', icon: <MousePointer2 size={23} strokeWidth={1.8} /> },
                  { id: 'pet', label: '手抚摸', art: getToolButtonArt(currentId, 'pet') },
                  { id: 'hammer', label: '小锤子', art: getToolButtonArt(currentId, 'hammer') },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className="pet-tool-button"
                    aria-pressed={activeTool === tool.id}
                    onClick={() => setActiveTool(tool.id)}
                  >
                    {tool.art ? <img src={tool.art.src} style={{ filter: tool.art.filter }} alt="" /> : tool.icon}
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>
              <div className="pet-tool-hint" aria-live="polite">
                {activeTool === 'hammer' ? '小锤子已选中：移到立绘上点击' : activeTool === 'pet' ? '抚摸已选中：按住并在立绘上拖动' : '移动鼠标到立绘上，角色会跟随视线'}
              </div>

              {/* 实时 AI 对话交互条 (支持与少女/桌宠实时发问和流式说话) */}
              <div style={{ width: '100%', zIndex: 3, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: char.accentColor, fontWeight: 700 }}><MessageCircle size={14} /> 与 {char.name.split(' ')[0]} 对话</span>
                  <button
                    type="button"
                    onClick={() => setChatHistories((prev) => ({ ...prev, [currentId]: [] }))}
                    style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.68rem' }}
                  >清空本机对话</button>
                </div>

                <div
                  aria-live="polite"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: 'min(220px, 26vh)', overflowY: 'auto',
                    padding: '8px', borderRadius: '12px', background: 'rgba(0,0,0,0.24)',
                    border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px'
                  }}
                >
                  {currentChatMessages.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', fontSize: '0.72rem', padding: '12px 4px' }}>
                      对话内容和用量记录只保存在本机。先配置 API，再发送消息。
                    </div>
                  ) : currentChatMessages.slice(-12).map((message) => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '92%', padding: '7px 10px', borderRadius: '10px',
                        background: message.role === 'user' ? `${char.color}35` : 'rgba(255,255,255,0.06)',
                        color: message.failed ? '#fca5a5' : '#e2e8f0', fontSize: '0.72rem', lineHeight: 1.45,
                        whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'
                      }}
                    >
                      {stripEmoji(message.content) || (message.pending ? '正在等待 API 响应…' : '')}
                      {message.usageSource && (
                        <div style={{ marginTop: '4px', color: '#64748b', fontSize: '0.63rem' }}>
                          {message.model || char.modelFamily} · {fmtNum(message.tokens || 0)} tokens · {message.usageSource === 'api' ? 'API 返回用量' : '本地估算'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '7px' }}>
                  {['帮我规划今天的工作', '把一个复杂问题拆解成步骤', '陪我聊聊最近的灵感'].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => sendChatMessage(topic)}
                      disabled={isAiLoading}
                      style={{ padding: '4px 7px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.64rem' }}
                    >{topic}</button>
                  ))}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={userChatInput}
                    onChange={(e) => setUserChatInput(e.target.value)}
                    placeholder={`和 ${char.name.split(' ')[0]} 对话…`}
                    style={{ flex: 1, padding: '7px 12px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', outline: 'none' }}
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !userChatInput.trim()}
                    style={{ padding: '7px 12px', borderRadius: '10px', backgroundColor: char.color, border: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: isAiLoading ? 'wait' : 'pointer', opacity: isAiLoading ? 0.7 : 1 }}
                  >{isAiLoading ? '请求中…' : '发送'}</button>
                </form>
                <div style={{ marginTop: '7px' }}>
                  <VoiceChatControls
                    onTranscript={(transcript) => setUserChatInput((previous) => previous ? `${previous} ${transcript}` : transcript)}
                    accentColor={char.accentColor}
                  />
                </div>
              </div>

              {/* 立绘形态与服饰切换 (完整支持 少女 / 萝莉 / 青年女性 / Q版萌宠 四种形态) */}
              <div style={{ width: '100%', zIndex: 2, marginBottom: '14px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: char.accentColor, fontWeight: 600 }}><Shirt size={14} /> 四大形态切换</span>
                    {/* 少女 / 萝莉 / 青年女性 / Q版 4态切换药丸按钮 */}
                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '2px', gap: '2px' }}>
                      {[
                        { id: 'normal', label: '少女' },
                        { id: 'loli', label: '萝莉' },
                        { id: 'mature', label: '青年女性' },
                        { id: 'chibi', label: 'Q版' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => {
                            soundManager.playSwitch();
                            setCharacterForm(f.id);
                          }}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: characterForm === f.id ? char.color : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: characterForm === f.id ? 600 : 400
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 情绪微表情切换 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['idle', 'happy', 'thinking', 'sleepy'].map((m) => (
                      <button
                        key={m}
                        onClick={(e) => { e.stopPropagation(); setMood(m); }}
                        style={{
                          fontSize: '0.68rem',
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
                      {outfit.name}
                    </button>
                  ))}
                </div>
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
                  <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> 角色立绘设定集 ({char.modelFamily})
                </div>
                <div>{char.lore}</div>
              </div>
            </div>

            {/* 右侧：多功能控制台 (投喂、仪表盘、消费流水、模型定价对比) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
                    <span>本地桌宠能量储备</span>
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
                  gap: '6px',
                  flexWrap: 'wrap',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  paddingBottom: '8px'
                }}
              >
                {[
                  { id: 'pet', label: 'Token 投喂饲育', icon: Coffee },
                  { id: 'analytics', label: '模型费率与对比', icon: PieChart },
                  { id: 'billing', label: '调用流水审计', icon: History },
                  { id: 'settings', label: '预算预警与配置', icon: Sliders },
                  { id: 'workspace', label: 'API 工作区', icon: Layers },
                  { id: 'library', label: '文件保存区', icon: PlusCircle },
                  { id: 'agent', label: 'Agent', icon: Cpu },
                  { id: 'social', label: '角色社交', icon: Heart },
                  { id: 'links', label: 'GitHub / 云盘', icon: Info }
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
                        padding: '7px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isActive ? `${char.color}33` : 'transparent',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
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

              {/* Tab 页面内容（页内独立滚动区：应用式分页，不整页滚动） */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Package size={16} /> 知识与能量投喂商铺</span>
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
                            <span style={{ display: 'grid', placeItems: 'center', padding: '4px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                              <img className="pet-food-image" src={food.image} alt="" />
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
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Zap size={13} /> +{fmtTokens(food.tokens)} Tokens · 好感 +{food.moodGain}</span>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Activity size={15} /> 快捷真实 API 任务</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                        点击后会实际调用当前角色 API，并按返回用量记录；未返回官方用量时会清楚标记为估算
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        disabled={isAiLoading}
                        onClick={() => triggerManualCall('代码重构建议')}
                        style={{ opacity: isAiLoading ? 0.55 : 1,
                          padding: '7px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        代码重构建议
                      </button>
                      <button
                        disabled={isAiLoading}
                        onClick={() => triggerManualCall('万行仓库深度架构推理')}
                        style={{ opacity: isAiLoading ? 0.55 : 1,
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
                        架构分析任务
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><PieChart size={16} /> 四大家族 AI Token 性价比与费率全景看板</span>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ClipboardList size={16} /> 实时 API Token 审计流水记录</span>
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
                          <th style={{ padding: '8px 10px' }}>费用估算</th>
                          <th style={{ padding: '8px 10px' }}>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveCallLog.length === 0 ? (
                          <tr><td colSpan="6" style={{ padding: '18px', color: '#64748b', textAlign: 'center' }}>尚无真实 API 调用记录；成功调用后会在这里保存用量。</td></tr>
                        ) : liveCallLog.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>{log.time}</td>
                            <td style={{ padding: '8px 10px', color: '#cbd5e1', fontWeight: 600 }}>{log.model}</td>
                            <td style={{ padding: '8px 10px', color: '#f1f5f9' }}>{log.action}</td>
                            <td style={{ padding: '8px 10px', color: char.accentColor }}>{fmtNum(log.tokens)} <small style={{ color: '#64748b' }}>({log.usageSource === 'api' ? 'API' : '估算'})</small></td>
                            <td style={{ padding: '8px 10px', color: '#10B981' }}>~${Number(log.cost || 0).toFixed(4)}</td>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Settings size={16} /> 桌面伴侣偏好 & 费用预警策略</span>
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

                  {/* API 接口：各家官方协议 + 用户自定义本地兼容接口 */}
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><PlugZap size={15} /> {char.name.split(' ')[0]} API 工作接口</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 0.7fr) 1.3fr', gap: '8px', marginBottom: '8px' }}>
                      <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                        接口类型
                        <select
                          value={apiConfig.mode}
                          onChange={(e) => {
                            if (e.target.value === 'local') {
                              updateApiConfig({ mode: 'local', protocol: 'openai', baseUrl: 'http://127.0.0.1:11434/v1' });
                            } else {
                              updateApiConfig({ ...DEFAULT_PROVIDER_CONFIGS[currentId], mode: 'official' });
                            }
                          }}
                          style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px', borderRadius: '8px', background: '#111827', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                        >
                          <option value="official">官方接口</option>
                          <option value="local">本地兼容接口（OpenAI API 格式）</option>
                        </select>
                      </label>
                      <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                        模型名称
                        <input
                          value={apiConfig.model || ''}
                          onChange={(e) => updateApiConfig({ model: e.target.value })}
                          placeholder="例如 qwen-plus / llama3.1"
                          style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem' }}
                        />
                      </label>
                    </div>
                    <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      {apiConfig.mode === 'local' ? '本地 API Base URL' : '官方 API Base URL'}
                      <input
                        value={apiConfig.baseUrl || ''}
                        onChange={(e) => updateApiConfig({ baseUrl: e.target.value })}
                        placeholder={apiConfig.mode === 'local' ? '例如 http://127.0.0.1:11434/v1' : '官方 API 地址'}
                        style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem' }}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        key={currentId}
                        type="password"
                        autoComplete="new-password"
                        placeholder={apiConfig.mode === 'local' ? '本地服务 Key（可留空）' : `输入 ${char.name.split(' ')[0]} 官方 API Key`}
                        defaultValue={aiService.getApiKey(currentId)}
                        onChange={(e) => aiService.setApiKey(currentId, e.target.value)}
                        style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem' }}
                      />
                      <span style={{ alignSelf: 'center', fontSize: '0.68rem', color: '#34D399', whiteSpace: 'nowrap' }}>自动本机保存</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', lineHeight: 1.5, color: '#64748b', marginTop: '7px' }}>
                      请求由本机网关转发到此处配置的接口；Key 仅保存在本机浏览器存储中。调用失败会显示错误，不会伪造回答或用量。
                    </div>
                  </div>

                  {/* API 语音输入、语音聊天和播报设置 */}
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mic size={15} /> 语音输入配置</span>
                    </div>
                    <label style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      语音转写 API Base URL
                      <input value={voiceConfig.baseUrl} onChange={(e) => updateVoiceConfig({ baseUrl: e.target.value })} placeholder="https://api.openai.com/v1 或 https://apic.ohmygpt.com" style={{ display: 'block', width: '100%', marginTop: '4px', padding: '7px 9px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem' }} />
                    </label>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', marginTop: '8px' }}>
                      语音转写模型
                      <input value={voiceConfig.transcriptionModel} onChange={(e) => updateVoiceConfig({ transcriptionModel: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '4px', padding: '7px', borderRadius: '8px', background: '#111827', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
                    </label>
                    <input
                      key="voice-api-key"
                      type="password"
                      autoComplete="new-password"
                      defaultValue={aiService.getVoiceApiKey()}
                      onChange={(e) => aiService.setVoiceApiKey(e.target.value)}
                      placeholder="语音转写 API Key（不会用于语音回复）"
                      style={{ width: '100%', marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <div style={{ fontSize: '0.68rem', lineHeight: 1.5, color: '#64748b', marginTop: '6px' }}>
                      当前仅提供单次语音转文字输入，不包含文字转语音或实时通话。浏览器语音识别可作为备用；完整语音模式会接入支持双向实时音频的服务。
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'workspace' && (
                <WorkspacePanel
                  character={char}
                  provider={currentId}
                  documents={documents}
                  isChatBusy={isAiLoading}
                  onOpenSettings={() => setActiveTab('settings')}
                  onSend={sendChatMessage}
                  onUsage={recordApiUsage}
                />
              )}
              {activeTab === 'library' && <LibraryPanel documents={documents} setDocuments={setDocuments} accentColor={char.color} />}
              {activeTab === 'agent' && <AgentPanel provider={currentId} character={char} characters={AI_CHARACTERS} documents={documents} onUsage={recordApiUsage} />}
              {activeTab === 'social' && <SocialPanel characters={AI_CHARACTERS} onUsage={recordApiUsage} />}
              {activeTab === 'links' && <LinksPanel />}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部信息栏 */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 24px',
          display: windowMode === 'compact' ? 'none' : 'flex',
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
          <span>本机网关负责处理 API 请求</span>
          <span>聊天与用量记录保存在本机</span>
        </div>
      </footer>
    </div>
  );
}

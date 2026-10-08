/**
 * 对话服务（当前为离线演示模式）
 *
 * 安全约束（热修，见 docs/TAKEOVER_AUDIT.md §4.1）：
 * - 当前版本不发起任何真实 API 请求，Key 不会离开本机。
 * - 真实请求只允许发往厂商自己的域名（白名单）。未列入白名单的厂商永远不会收到 Key。
 * - 正式版本将改为后端代理 + 系统凭据库（见审计文档 §7 阶段 1）。
 */

// 总开关：离线演示阶段保持 false。
const LIVE_API_ENABLED = false;

// 白名单：厂商 -> 唯一允许的端点与模型。
// Claude、Gemini、Kimi、Grok、Qwen 暂未适配，不在白名单内，因此永远不会发起请求。
const LIVE_ENDPOINTS = {
  deepseek: { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' }
};

class AITokenPetService {
  constructor() {
    this.apiKeys = {
      deepseek: localStorage.getItem('pet_key_deepseek') || '',
      claude: localStorage.getItem('pet_key_claude') || '',
      openai: localStorage.getItem('pet_key_openai') || '',
      gemini: localStorage.getItem('pet_key_gemini') || '',
      qwen: localStorage.getItem('pet_key_qwen') || '',
      kimi: localStorage.getItem('pet_key_kimi') || '',
      grok: localStorage.getItem('pet_key_grok') || ''
    };
  }

  setApiKey(provider, key) {
    this.apiKeys[provider] = key;
    localStorage.setItem(`pet_key_${provider}`, key);
  }

  getApiKey(provider) {
    return this.apiKeys[provider] || '';
  }

  // 发起真实请求（仅在总开关开启、厂商在白名单内、且已配置 Key 时），否则走离线演示
  async sendPrompt({ provider, prompt, systemPrompt, onChunk, onComplete, onError }) {
    const key = this.getApiKey(provider);
    const target = LIVE_ENDPOINTS[provider];

    // 1. 真实请求（当前默认关闭）
    if (LIVE_API_ENABLED && target && key && key.trim().length > 5) {
      try {
        const response = await fetch(target.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: target.model,
            messages: [
              { role: 'system', content: systemPrompt || '你是一只活泼可爱的桌面伴侣，用简短生动的语气回答我。' },
              { role: 'user', content: prompt }
            ],
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`API 响应错误: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let totalTokens = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || '';
                if (content) {
                  fullText += content;
                  totalTokens += 1;
                  if (onChunk) onChunk(content, fullText);
                }
              } catch (e) {}
            }
          }
        }

        if (onComplete) onComplete({ fullText, tokens: Math.max(fullText.length * 2, totalTokens) });
        return;
      } catch (err) {
        console.warn('调用真实 API 失败，降级为离线演示:', err);
      }
    }

    // 2. 离线演示：流式输出固定台词（不会回答问题，仅用于界面演示）
    const mockResponses = [
      `收到主人的指令啦！正在调动全域算力进行分析... 逻辑链已推演完毕，随时听候您的差遣哦！✨`,
      `哼哼～主人刚才打字好快，我刚才数了一下，一秒钟至少敲了5个按键呢！今天我也在元气满满地守护你！`,
      `<think> 正在思考主人的最新需求... 经过深度自省与参数调优，该方案最佳实践已为您整理就绪！ </think> 答案马上送到！`,
      `Token 储备非常充足！知识库全线保持在线，请问接下来我们来攻克哪一个难题呢？`
    ];
    const picked = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    let cur = '';
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < picked.length) {
        cur += picked[idx];
        idx++;
        if (onChunk) onChunk(picked[idx - 1], cur);
      } else {
        clearInterval(interval);
        if (onComplete) {
          onComplete({
            fullText: cur,
            tokens: Math.floor(cur.length * 2.5 + 40)
          });
        }
      }
    }, 40);
  }
}

export const aiService = new AITokenPetService();

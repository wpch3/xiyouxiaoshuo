const CONFIG_STORAGE_KEY = 'pet_api_configs_v1';
const VOICE_CONFIG_STORAGE_KEY = 'pet_voice_config_v1';
const DEFAULT_VOICE_CONFIG = { baseUrl: 'https://api.openai.com/v1', transcriptionModel: 'whisper-1' };

export const DEFAULT_PROVIDER_CONFIGS = {
  deepseek: { mode: 'official', protocol: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  claude: { mode: 'official', protocol: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  openai: { mode: 'official', protocol: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  gemini: { mode: 'official', protocol: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.8-flash' },
  qwen: { mode: 'official', protocol: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  kimi: { mode: 'official', protocol: 'openai', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  grok: { mode: 'official', protocol: 'openai', baseUrl: 'https://api.x.ai/v1', model: 'grok-3-mini' },
};

const safeReadJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const safeWriteJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('无法保存本地 API 配置:', error);
  }
};

class AITokenPetService {
  constructor() {
    const savedConfigs = safeReadJson(CONFIG_STORAGE_KEY, {});
    this.configs = savedConfigs && typeof savedConfigs === 'object' && !Array.isArray(savedConfigs)
      ? savedConfigs
      : {};
    // 迁移此前保存的、已下线的 Gemini 默认模型；保留用户自定义的其他模型。
    if (this.configs.gemini?.model === 'gemini-2.0-flash' && (this.configs.gemini.mode || 'official') === 'official') {
      this.configs = {
        ...this.configs,
        gemini: { ...this.configs.gemini, model: DEFAULT_PROVIDER_CONFIGS.gemini.model },
      };
      safeWriteJson(CONFIG_STORAGE_KEY, this.configs);
    }
    this.apiKeys = Object.fromEntries(
      Object.keys(DEFAULT_PROVIDER_CONFIGS).map((provider) => [
        provider,
        this._readKey(provider),
      ]),
    );
  }

  _readKey(provider) {
    try {
      return localStorage.getItem(`pet_key_${provider}`) || '';
    } catch {
      return '';
    }
  }

  getApiConfig(provider) {
    const defaults = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.openai;
    return { ...defaults, ...(this.configs[provider] || {}) };
  }

  setApiConfig(provider, patch) {
    const current = this.getApiConfig(provider);
    const next = { ...current, ...patch };
    this.configs = { ...this.configs, [provider]: next };
    safeWriteJson(CONFIG_STORAGE_KEY, this.configs);
    return next;
  }

  setApiKey(provider, key) {
    this.apiKeys[provider] = key;
    try {
      localStorage.setItem(`pet_key_${provider}`, key);
    } catch (error) {
      console.warn('无法保存本地 API Key:', error);
    }
  }

  getApiKey(provider) {
    return this.apiKeys[provider] || this._readKey(provider);
  }

  getVoiceConfig() {
    const saved = safeReadJson(VOICE_CONFIG_STORAGE_KEY, {});
    return {
      baseUrl: String(saved.baseUrl || DEFAULT_VOICE_CONFIG.baseUrl),
      transcriptionModel: String(saved.transcriptionModel || DEFAULT_VOICE_CONFIG.transcriptionModel),
    };
  }

  setVoiceConfig(patch) {
    const next = { ...this.getVoiceConfig(), ...patch };
    safeWriteJson(VOICE_CONFIG_STORAGE_KEY, {
      baseUrl: next.baseUrl,
      transcriptionModel: next.transcriptionModel,
    });
    return next;
  }

  getVoiceApiKey() {
    return this._readKey('voice');
  }

  setVoiceApiKey(key) {
    try {
      localStorage.setItem('pet_key_voice', key);
    } catch (error) {
      console.warn('无法保存本地语音 API Key:', error);
    }
  }

  async transcribeAudio(audioBlob) {
    const config = this.getVoiceConfig();
    const form = new FormData();
    form.append('apiKey', this.getVoiceApiKey());
    form.append('baseUrl', config.baseUrl);
    form.append('model', config.transcriptionModel);
    const audioType = String(audioBlob.type || '').split(';')[0].toLowerCase();
    const audioExtension = ({ 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav' })[audioType] || 'webm';
    form.append('file', audioBlob, `voice.${audioExtension}`);
    const response = await fetch('/api/transcribe', { method: 'POST', body: form });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `语音识别失败 (${response.status})`);
    return String(result.text || '');
  }

  async sendPrompt({ provider, prompt, messages, systemPrompt, onChunk, onComplete, onError, signal }) {
    const conversation = Array.isArray(messages) && messages.length
      ? messages
      : [{ role: 'user', content: prompt || '' }];
    const config = this.getApiConfig(provider);
    const apiKey = this.getApiKey(provider);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          provider,
          config,
          apiKey,
          messages: conversation,
          systemPrompt: systemPrompt || '',
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `本地 API 网关响应错误 (${response.status})`);
      }

      const fullText = String(result.text || '');
      const usage = result.usage || {};
      const tokens = Number(usage.totalTokens) || 0;
      const completion = {
        fullText,
        model: result.model || config.model,
        tokens,
        inputTokens: Number(usage.inputTokens) || 0,
        outputTokens: Number(usage.outputTokens) || 0,
        usageSource: usage.source === 'api' ? 'api' : 'estimated',
      };
      if (onChunk && fullText) onChunk(fullText, fullText);
      if (onComplete) onComplete(completion);
      return completion;
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? '请求已取消'
        : (error?.message || 'API 请求失败');
      if (onError) onError(message);
      throw error;
    }
  }
}

export const aiService = new AITokenPetService();

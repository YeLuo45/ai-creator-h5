/**
 * MiniMaxAdapter.js (H5 Version - Token Plan)
 * MiniMax 模型适配器实现 - Web 版
 * 使用 MiniMax Token Plan API (Anthropic 兼容端点)
 * Base URL: https://api.minimaxi.com/anthropic/v1
 * 无需 Group ID
 */

// MiniMax Token Plan API 端点 (Anthropic 兼容)
const API_BASE = 'https://api.minimaxi.com/anthropic/v1';

// MiniMax 模型 ID 映射
export const MINIMAX_MODELS = {
  IMAGE_01: 'image-01',
  IMAGE_01_PRO: 'image-01-pro',
  MUSIC_26: 'music-2.6',
  LYRICS: 'lyrics_generation',
  MUSIC_COVER: 'music-cover',
  TTS_HD: 'speech-02-hd',  // Token Plan 使用 speech-02-hd
  TTS: 'speech-02',
};

export class MiniMaxAdapter {
  constructor(apiKey, model = MINIMAX_MODELS.TTS_HD) {
    this.apiKey = apiKey;
    this.model = model;
    this.provider = 'minimax';
    this.capabilities = ['image', 'text', 'music', 'audio'];
  }

  /**
   * 通用 HTTP 请求 (fetch 版)
   * Token Plan 使用 Anthropic 兼容格式
   */
  async request(endpoint, params = {}, method = 'POST') {
    const url = `${API_BASE}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        // Token Plan 不需要 MM-Group-Id
      },
    };

    if (method !== 'GET' && Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`MiniMax API Error: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data;
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      // Token Plan 使用 messages API 做健康检查
      await this.request('/messages', {
        model: 'MiniMax-M2.7',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }]
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * MiniMax 图片生成适配器
 */
export class MiniMaxImageAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey, MINIMAX_MODELS.IMAGE_01);
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      n: params.n || 1,
      size: params.size || '1024x1024',
      style: params.style || 'vivid',
      response_format: params.response_format || 'url',
    };

    return this.request('/images/generations', payload);
  }
}

/**
 * MiniMax 音乐生成适配器
 */
export class MiniMaxMusicAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey, MINIMAX_MODELS.MUSIC_26);
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      duration: params.duration || 180,
      instrumental: params.instrumental || false,
    };

    return this.request('/audio/generations', payload);
  }
}

/**
 * MiniMax 歌词生成适配器
 */
export class MiniMaxLyricsAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey, MINIMAX_MODELS.LYRICS);
  }

  async generate(params) {
    // Token Plan 使用 M2.7 生成歌词
    const payload = {
      model: 'MiniMax-M2.7',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `请为以下主题创作歌词（只需歌词，不需要其他说明）：${params.prompt}\n\n风格：${params.genre || 'pop'}\n主题：${params.theme || 'love'}`,
        },
      ],
    };

    return this.request('/messages', payload);
  }
}

/**
 * MiniMax 音乐封面生成适配器
 */
export class MiniMaxMusicCoverAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey, MINIMAX_MODELS.MUSIC_COVER);
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
    };

    return this.request('/images/generations', payload);
  }
}

/**
 * MiniMax TTS HD 适配器 (Token Plan)
 */
export class MiniMaxTTSAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey, MINIMAX_MODELS.TTS_HD);
  }

  // Token Plan Speech 2.8 音色列表
  static VOICE_LIST = [
    { id: 'male-qn-qingse', name: '青年男声', lang: 'zh' },
    { id: 'female-shaonv', name: '少女声音', lang: 'zh' },
    { id: 'male-qn-jingxing', name: '激情男声', lang: 'zh' },
    { id: 'female-yujie', name: '御姐声音', lang: 'zh' },
    { id: 'female-tianmei', name: '甜妹声音', lang: 'zh' },
    { id: 'male-yunyang', name: '云扬声音', lang: 'zh' },
  ];

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      input: params.input,
      voice: params.voice || 'female-shaonv',
      speed: params.speed || 1.0,
      format: params.format || 'mp3',
    };

    // Token Plan TTS 返回的是 base64 音频
    const res = await this.request('/audio/speech', payload);

    return {
      b64_audio: res?.audio,
    };
  }
}

/**
 * 工厂函数
 */
export function createMiniMaxImageAdapter(apiKey) {
  return new MiniMaxImageAdapter(apiKey);
}

export function createMiniMaxMusicAdapter(apiKey) {
  return new MiniMaxMusicAdapter(apiKey);
}

export function createMiniMaxLyricsAdapter(apiKey) {
  return new MiniMaxLyricsAdapter(apiKey);
}

export function createMiniMaxMusicCoverAdapter(apiKey) {
  return new MiniMaxMusicCoverAdapter(apiKey);
}

export function createMiniMaxTTSAdapter(apiKey) {
  return new MiniMaxTTSAdapter(apiKey);
}

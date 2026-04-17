/**
 * MiniMaxAdapter.js (H5 Version)
 * MiniMax 模型适配器实现 - Web 版
 * 用 fetch 替代 wx.request
 */

// MiniMax API 端点
const API_BASE = 'https://api.minimax.chat/v1';

// MiniMax 模型 ID 映射
export const MINIMAX_MODELS = {
  IMAGE_01: 'image-01',
  IMAGE_01_PRO: 'image-01-pro',
  MUSIC_26: 'music-2.6',
  LYRICS: 'lyrics_generation',
  MUSIC_COVER: 'music-cover',
  TTS_HD: 'TTS-HD',
  TTS: 'speech-02',
};

export class MiniMaxAdapter {
  constructor(apiKey, groupId, model = MINIMAX_MODELS.TTS_HD) {
    this.apiKey = apiKey;
    this.groupId = groupId;
    this.model = model;
    this.provider = 'minimax';
    this.capabilities = ['image', 'text', 'music', 'audio'];
  }

  /**
   * 通用 HTTP 请求 (fetch 版)
   */
  async request(endpoint, params = {}, method = 'POST') {
    const url = `${API_BASE}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'MM-Group-Id': this.groupId,
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
      await this.request('/models', {}, 'GET');
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
  constructor(apiKey, groupId) {
    super(apiKey, groupId, MINIMAX_MODELS.IMAGE_01);
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
  constructor(apiKey, groupId) {
    super(apiKey, groupId, MINIMAX_MODELS.MUSIC_26);
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
  constructor(apiKey, groupId) {
    super(apiKey, groupId, MINIMAX_MODELS.LYRICS);
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      genre: params.genre || 'pop',
      theme: params.theme || 'love',
    };

    return this.request('/chat/completions', {
      model: payload.model,
      messages: [
        {
          role: 'user',
          content: `请为以下主题创作歌词：${params.prompt}`,
        },
      ],
      max_tokens: 500,
    });
  }
}

/**
 * MiniMax 音乐封面生成适配器
 */
export class MiniMaxMusicCoverAdapter extends MiniMaxAdapter {
  constructor(apiKey, groupId) {
    super(apiKey, groupId, MINIMAX_MODELS.MUSIC_COVER);
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
 * MiniMax TTS HD 适配器
 */
export class MiniMaxTTSAdapter extends MiniMaxAdapter {
  constructor(apiKey, groupId) {
    super(apiKey, groupId, MINIMAX_MODELS.TTS_HD);
  }

  static VOICE_LIST = [
    { id: 'male-qn-qingse', name: '青年男声', lang: 'zh' },
    { id: 'female-shaonv', name: '少女声音', lang: 'zh' },
    { id: 'male-qn-jingxing', name: '激情男声', lang: 'zh' },
    { id: 'female-yujie', name: '御姐声音', lang: 'zh' },
  ];

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      input: params.input,
      voice: params.voice || 'female-shaonv',
      speed: params.speed || 1.0,
      pitch: params.pitch || 0,
      format: params.format || 'mp3',
    };

    // MiniMax TTS 返回的是 base64 音频
    const res = await this.request('/audio/speech', payload);

    return {
      b64_audio: res?.data?.audio,
    };
  }
}

/**
 * 工厂函数
 */
export function createMiniMaxImageAdapter(apiKey, groupId) {
  return new MiniMaxImageAdapter(apiKey, groupId);
}

export function createMiniMaxMusicAdapter(apiKey, groupId) {
  return new MiniMaxMusicAdapter(apiKey, groupId);
}

export function createMiniMaxLyricsAdapter(apiKey, groupId) {
  return new MiniMaxLyricsAdapter(apiKey, groupId);
}

export function createMiniMaxMusicCoverAdapter(apiKey, groupId) {
  return new MiniMaxMusicCoverAdapter(apiKey, groupId);
}

export function createMiniMaxTTSAdapter(apiKey, groupId) {
  return new MiniMaxTTSAdapter(apiKey, groupId);
}

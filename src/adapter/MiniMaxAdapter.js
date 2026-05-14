/**
 * MiniMaxAdapter.js (H5 Version - Token Plan)
 * MiniMax 模型适配器实现
 *
 * 注意：Token Plan 的 Anthropic 兼容端点 (/anthropic/v1) 仅适用于 M2.7 文本对话
 * 图片、音乐、TTS 仍使用旧版 API 端点 (/v1)
 */

// MiniMax API 端点
const API_BASE = 'https://api.minimaxi.com/v1';

// MiniMax 模型 ID 映射
export const MINIMAX_MODELS = {
  IMAGE_01: 'image-01',
  IMAGE_01_PRO: 'image-01-pro',
  MUSIC_26: 'music-2.6',
  LYRICS: 'lyrics_generation',
  MUSIC_COVER: 'music-cover',
  TTS_HD: 'speech-2.8-hd',
  TTS: 'speech-02',
  VIDEO_01: 'video-01',
};

export class MiniMaxAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
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
      },
    };

    if (method !== 'GET' && Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
    }

    const response = await fetch(url, options);

    // TTS 返回二进制音频
    if (endpoint === '/t2a_v2') {
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`MiniMax API Error: ${response.status} - ${err}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return { audio: base64 };
    }

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
      await this.request('/image_generation', {
        model: MINIMAX_MODELS.IMAGE_01,
        prompt: 'test',
        n: 1,
        aspect_ratio: '1:1',
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * MiniMax 图片生成适配器
 * POST /v1/image_generation
 */
export class MiniMaxImageAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.IMAGE_01;
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      n: params.n || 1,
      aspect_ratio: this.sizeToAspectRatio(params.size || '1024x1024'),
      response_format: params.response_format || 'url',
      prompt_optimizer: true,
    };

    return this.request('/image_generation', payload);
  }

  sizeToAspectRatio(size) {
    switch (size) {
      case '1024x1792': return '9:16';
      case '1792x1024': return '16:9';
      default: return '1:1';
    }
  }
}

/**
 * MiniMax 音乐生成适配器
 * POST /v1/music_generation
 */
export class MiniMaxMusicAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.MUSIC_26;
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      lyrics: params.lyrics || '',
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
    };

    if (params.duration) {
      // duration in seconds, convert to ms for extra_info
    }

    return this.request('/music_generation', payload);
  }
}

/**
 * MiniMax 歌词生成适配器
 * POST /v1/lyrics_generation
 */
export class MiniMaxLyricsAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.LYRICS;
  }

  async generate(params) {
    const payload = {
      model: this.model,
      prompt: params.prompt,
      genre: params.genre || 'pop',
      theme: params.theme || 'love',
    };

    return this.request('/lyrics_generation', payload);
  }
}

/**
 * MiniMax 音乐封面生成适配器
 * 使用图片生成 API
 */
export class MiniMaxMusicCoverAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
  }

  async generate(params) {
    const payload = {
      model: MINIMAX_MODELS.IMAGE_01,
      prompt: params.prompt,
      n: 1,
      aspect_ratio: '1:1',
      response_format: 'url',
    };

    return this.request('/image_generation', payload);
  }
}

/**
 * MiniMax TTS HD 适配器
 * POST /v1/t2a_v2
 */
export class MiniMaxTTSAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.TTS_HD;
  }

  // 音色列表 (speech-2.8-hd)
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
      text: params.input || params.text,
      stream: false,
      voice_setting: {
        voice_id: params.voice || 'female-shaonv',
        speed: params.speed || 1,
        vol: 1,
        pitch: 0,
        emotion: params.emotion || 'happy',
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1,
      },
    };

    // TTS 返回二进制，需要特殊处理
    const url = `${API_BASE}/t2a_v2`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MiniMax API Error: ${response.status} - ${err}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return { b64_audio: base64 };
  }
}

/**
 * MiniMax 视频生成适配器
 * POST /v1/video_generation
 * 模型: video-01
 * 参数: model, prompt, duration (5/10/15), resolution (720p), response_format (url)
 */
export class MiniMaxVideoAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.VIDEO_01;
  }

  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      duration: params.duration || 5,
      resolution: params.resolution || '720p',
      response_format: params.response_format || 'url',
    };

    return this.request('/video_generation', payload);
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

export function createMiniMaxVideoAdapter(apiKey) {
  return new MiniMaxVideoAdapter(apiKey);
}

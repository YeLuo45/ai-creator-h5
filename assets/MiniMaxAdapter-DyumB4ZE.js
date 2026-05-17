var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const API_BASE = "https://api.minimaxi.com/v1";
const MINIMAX_MODELS = {
  IMAGE_01: "image-01",
  IMAGE_02: "image-02",
  MUSIC_26: "music-2.6",
  MUSIC_02: "music-02",
  LYRICS: "lyrics_generation",
  MUSIC_COVER: "music-cover",
  TTS_HD: "speech-01",
  TTS_EMOTION: "speech-02"
};
class MiniMaxAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.provider = "minimax";
    this.capabilities = ["image", "text", "music", "audio"];
  }
  /**
   * 通用 HTTP 请求 (fetch 版)
   */
  async request(endpoint, params = {}, method = "POST") {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      }
    };
    if (method !== "GET" && Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
    }
    const response = await fetch(url, options);
    if (endpoint === "/t2a_v2") {
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
      await this.request("/image_generation", {
        model: MINIMAX_MODELS.IMAGE_01,
        prompt: "test",
        n: 1,
        aspect_ratio: "1:1"
      });
      return true;
    } catch {
      return false;
    }
  }
}
class MiniMaxImageAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.IMAGE_01;
  }
  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      n: params.n || 1,
      aspect_ratio: this.sizeToAspectRatio(params.size || "1024x1024"),
      response_format: params.response_format || "url",
      prompt_optimizer: true
    };
    return this.request("/image_generation", payload);
  }
  sizeToAspectRatio(size) {
    switch (size) {
      case "1024x1792":
        return "9:16";
      case "1792x1024":
        return "16:9";
      default:
        return "1:1";
    }
  }
}
class MiniMaxMusicAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.MUSIC_26;
  }
  async generate(params) {
    const payload = {
      model: params.model || this.model,
      prompt: params.prompt,
      lyrics: params.lyrics || "",
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256e3,
        format: "mp3"
      }
    };
    if (params.duration) ;
    return this.request("/music_generation", payload);
  }
}
class MiniMaxLyricsAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.LYRICS;
  }
  async generate(params) {
    const payload = {
      model: this.model,
      prompt: params.prompt,
      genre: params.genre || "pop",
      theme: params.theme || "love"
    };
    return this.request("/lyrics_generation", payload);
  }
}
class MiniMaxMusicCoverAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
  }
  async generate(params) {
    const payload = {
      model: MINIMAX_MODELS.IMAGE_01,
      prompt: params.prompt,
      n: 1,
      aspect_ratio: "1:1",
      response_format: "url"
    };
    return this.request("/image_generation", payload);
  }
}
class MiniMaxTTSAdapter extends MiniMaxAdapter {
  constructor(apiKey) {
    super(apiKey);
    this.model = MINIMAX_MODELS.TTS_HD;
  }
  async generate(params) {
    const payload = {
      model: params.model || this.model,
      text: params.input || params.text,
      stream: false,
      voice_setting: {
        voice_id: params.voice || "female-shaonv",
        speed: params.speed || 1,
        vol: 1,
        pitch: 0,
        emotion: params.emotion || "happy"
      },
      audio_setting: {
        sample_rate: 32e3,
        bitrate: 128e3,
        format: "mp3",
        channel: 1
      }
    };
    const url = `${API_BASE}/t2a_v2`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
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
// 音色列表 (speech-2.8-hd)
__publicField(MiniMaxTTSAdapter, "VOICE_LIST", [
  { id: "male-qn-qingse", name: "青年男声", lang: "zh" },
  { id: "female-shaonv", name: "少女声音", lang: "zh" },
  { id: "male-qn-jingxing", name: "激情男声", lang: "zh" },
  { id: "female-yujie", name: "御姐声音", lang: "zh" },
  { id: "female-tianmei", name: "甜妹声音", lang: "zh" },
  { id: "male-yunyang", name: "云扬声音", lang: "zh" }
]);
export {
  MiniMaxImageAdapter as M,
  MiniMaxLyricsAdapter as a,
  MiniMaxMusicAdapter as b,
  MiniMaxMusicCoverAdapter as c,
  MiniMaxTTSAdapter as d
};
//# sourceMappingURL=MiniMaxAdapter-DyumB4ZE.js.map

/**
 * api.ts - 统一 API 请求层
 * 整合图片、音乐、TTS 服务的 API 调用
 */

export const API_BASE = 'https://api.minimax.chat/v1';

export interface ApiConfig {
  apiKey: string;
  groupId: string;
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}

export interface ImageItem {
  url: string;
  b64_json?: string;
}

export interface ImageGenerationResponse {
  created: number;
  data: ImageItem[];
  model: string;
}

export interface MusicItem {
  url: string;
  duration?: number;
}

export interface MusicGenerationResponse {
  data: MusicItem[];
}

export interface TTSResponse {
  b64_audio?: string;
  audio?: string;
}

// 获取 API 配置
export function getApiConfig(): ApiConfig {
  const apiKey = localStorage.getItem('minimax_api_key') || '';
  const groupId = localStorage.getItem('minimax_group_id') || '';
  
  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }
  if (!groupId) {
    throw new Error('请先在"我的"页面配置 MiniMax Group ID');
  }
  
  return { apiKey, groupId };
}

// 通用请求方法
async function request<T = any>(
  endpoint: string,
  params?: any,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  const { apiKey, groupId } = getApiConfig();
  const url = API_BASE + endpoint;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'MM-Group-Id': groupId,
    },
  };

  if (method !== 'GET' && params) {
    options.body = JSON.stringify(params);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (res.status >= 200 && res.status < 300) {
    return data as T;
  } else {
    throw new Error(`MiniMax API Error: ${res.status} - ${JSON.stringify(data)}`);
  }
}

// ========== 图片服务 ==========

export interface GenerateImageParams {
  prompt: string;
  style?: 'vivid' | 'natural';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  n?: number;
}

export async function generateImage(params: GenerateImageParams): Promise<ImageGenerationResponse> {
  const payload = {
    model: 'image-01',
    prompt: params.prompt,
    n: params.n || 1,
    size: params.size || '1024x1024',
    style: params.style || 'vivid',
    response_format: 'url',
  };
  return request<ImageGenerationResponse>('/images/generations', payload);
}

// ========== 音乐服务 ==========

export interface GenerateLyricsParams {
  prompt: string;
  genre?: string;
  theme?: string;
}

export interface LyricsResult {
  lyrics: string;
  title: string;
}

export async function generateLyrics(params: GenerateLyricsParams): Promise<LyricsResult> {
  const res = await request<any>('/chat/completions', {
    model: 'lyrics_generation',
    messages: [{ role: 'user', content: `请为以下主题创作歌词：${params.prompt}` }],
    max_tokens: 500,
  });
  
  const content = res.choices?.[0]?.message?.content || '';
  return {
    lyrics: content,
    title: extractTitle(content),
  };
}

function extractTitle(lyrics: string): string {
  if (!lyrics) return '无标题';
  const lines = lyrics.split('\n').filter(l => l.trim());
  const titleLine = lines.find(l => l.startsWith('#')) || lines[0];
  return titleLine ? titleLine.replace(/^#\s*/, '').trim() : '无标题';
}

export interface GenerateMusicParams {
  prompt: string;
  lyrics?: string;
  duration?: number;
}

export async function generateMusic(params: GenerateMusicParams): Promise<MusicGenerationResponse> {
  const payload: any = { model: 'music-2.6', prompt: params.prompt, duration: params.duration || 180 };
  if (params.lyrics) payload.lyrics = params.lyrics;
  return request<MusicGenerationResponse>('/audio/generations', payload);
}

export interface GenerateMusicCoverParams {
  prompt: string;
}

export async function generateMusicCover(params: GenerateMusicCoverParams): Promise<{ url: string }> {
  const res = await request<any>('/images/generations', {
    model: 'music-cover',
    prompt: params.prompt,
  });
  return { url: res.data?.[0]?.url || '' };
}

export interface FullMusicResult {
  lyrics: string;
  musicUrl: string;
  coverUrl: string;
  duration: number;
}

export async function generateFullMusic(
  params: GenerateLyricsParams & { duration?: number }
): Promise<FullMusicResult> {
  const lyricsResult = await generateLyrics(params);
  const musicResult = await generateMusic({ 
    prompt: params.prompt, 
    lyrics: lyricsResult.lyrics, 
    duration: params.duration 
  });
  const coverResult = await generateMusicCover({ prompt: params.prompt });

  return {
    lyrics: lyricsResult.lyrics,
    musicUrl: musicResult.data?.[0]?.url || '',
    coverUrl: coverResult.url || '',
    duration: musicResult.data?.[0]?.duration || 0,
  };
}

// ========== TTS 服务 ==========

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
}

export const TTS_VOICES: TTSVoice[] = [
  { id: 'male-qn-qingse', name: '青年男声', lang: 'zh' },
  { id: 'female-shaonv', name: '少女声音', lang: 'zh' },
  { id: 'female-yujie', name: '御姐声音', lang: 'zh' },
  { id: 'male-qn-jingxing', name: '激情男声', lang: 'zh' },
];

export interface GenerateSpeechParams {
  input: string;
  voice?: string;
  format?: 'mp3' | 'wav' | 'opus';
  speed?: number;
}

export async function generateSpeech(params: GenerateSpeechParams): Promise<TTSResponse> {
  const res = await request<any>('/audio/speech', {
    model: 'TTS-HD',
    input: params.input,
    voice: params.voice || 'female-shaonv',
    speed: params.speed || 1.0,
    format: params.format || 'mp3',
  });
  return { b64_audio: res?.data?.audio };
}

// ========== 工具函数 ==========

export function saveB64AudioAsDataUrl(b64Audio: string, format: string): string {
  const mimeMap: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', opus: 'audio/opus' };
  const mime = mimeMap[format] || 'audio/mpeg';
  const binary = atob(b64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

export function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        resolve(URL.createObjectURL(blob));
      })
      .catch(err => reject(new Error(`下载失败: ${err.message}`)));
  });
}

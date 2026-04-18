/**
 * 音乐生成服务 (H5 Version - Token Plan)
 */

import { MiniMaxMusicAdapter, MiniMaxLyricsAdapter, MiniMaxMusicCoverAdapter } from '../adapter/MiniMaxAdapter.js';
import { storage, showLoading, hideLoading } from '../adapter/web-api.js';

const HISTORY_KEY = 'history_music';

/**
 * Hex 字符串转 Base64
 * 用于将 MiniMax API 返回的 hex 编码音频转换为可播放的 data URL
 */
function hexToBase64(hex) {
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    // 使用 TextEncoder + btoa 的方式处理大数组更稳定
    const bin = String.fromCharCode(...bytes);
    return btoa(bin);
  } catch (err) {
    console.error('[MusicService] hexToBase64 error:', err, 'hex length:', hex.length);
    throw new Error('音频数据转换失败');
  }
}

/**
 * 获取 API 配置
 */
function getConfig() {
  return {
    apiKey: storage.get('minimax_api_key') || '',
  };
}

/**
 * 生成音乐
 */
export async function generateMusic({ prompt, lyrics = '', duration = 180, instrumental = false }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxMusicAdapter(apiKey);

  showLoading({ title: '音乐生成中（可能需要30-60秒）...' });
  try {
    // 如果没有提供歌词，使用 prompt 作为简单歌词
    const finalLyrics = lyrics || `这是一首关于 ${prompt} 的歌曲`;
    console.log('[MusicService] Generating with prompt:', prompt, 'lyrics:', finalLyrics);
    const result = await adapter.generate({ prompt, lyrics: finalLyrics, duration, instrumental });
    console.log('[MusicService] API result:', JSON.stringify(result).substring(0, 200));

    // music_generation 返回格式: { data: { audio: "hex", status: 2 }, extra_info: {...} }
    if (result.data?.audio && result.data.status === 2) {
      console.log('[MusicService] Converting audio hex, length:', result.data.audio.length);
      const audioUrl = 'data:audio/mp3;base64,' + hexToBase64(result.data.audio);
      addToHistory({
        prompt,
        lyrics: finalLyrics,
        duration,
        instrumental,
        url: audioUrl,
      });
      hideLoading();
      console.log('[MusicService] Success, audioUrl:', audioUrl.substring(0, 50) + '...');
      return { ...result, url: audioUrl };
    } else if (result.base_resp?.status_msg) {
      console.error('[MusicService] API error:', result.base_resp.status_msg);
      throw new Error(`API 错误: ${result.base_resp.status_msg}`);
    }

    console.warn('[MusicService] Unexpected result structure:', result);
    hideLoading();
    return result;
  } catch (err) {
    console.error('[MusicService] generateMusic error:', err);
    hideLoading();
    throw err;
  }
}

/**
 * 生成歌词
 */
export async function generateLyrics({ prompt, genre = 'pop', theme = 'love' }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxLyricsAdapter(apiKey);

  showLoading({ title: '歌词生成中...' });
  try {
    const result = await adapter.generate({ prompt, genre, theme });
    hideLoading();
    return result;
  } catch (err) {
    hideLoading();
    throw err;
  }
}

/**
 * 生成音乐封面
 */
export async function generateMusicCover({ prompt, musicUrl }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxMusicCoverAdapter(apiKey);

  showLoading({ title: '封面生成中...' });
  try {
    const result = await adapter.generate({ prompt, music_url: musicUrl });
    hideLoading();
    return result;
  } catch (err) {
    hideLoading();
    throw err;
  }
}

/**
 * 添加到历史记录
 */
function addToHistory(item) {
  const history = getHistory();
  history.unshift({
    ...item,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  });
  if (history.length > 50) history.pop();
  storage.set(HISTORY_KEY, history);
}

/**
 * 获取历史记录
 */
export function getHistory() {
  return storage.get(HISTORY_KEY) || [];
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  storage.remove(HISTORY_KEY);
}

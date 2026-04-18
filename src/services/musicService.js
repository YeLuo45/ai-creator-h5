/**
 * 音乐生成服务 (H5 Version - Token Plan)
 */

import { MiniMaxMusicAdapter, MiniMaxLyricsAdapter, MiniMaxMusicCoverAdapter } from '../adapter/MiniMaxAdapter.js';
import { storage, showLoading, hideLoading } from '../adapter/web-api.js';

const HISTORY_KEY = 'history_music';

/**
 * Hex 字符串转 Base64
 */
function hexToBase64(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  const bin = String.fromCharCode(...bytes);
  return btoa(bin);
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
export async function generateMusic({ prompt, duration = 180, instrumental = false }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxMusicAdapter(apiKey);

  showLoading({ title: '音乐生成中（可能需要30-60秒）...' });
  try {
    const result = await adapter.generate({ prompt, duration, instrumental });

    // 保存到历史
    if (result.data?.audio) {
      // music_generation 返回的是 hex 编码的音频，需要转换为 base64
      const audioUrl = 'data:audio/mp3;base64,' + hexToBase64(result.data.audio);
      addToHistory({
        prompt,
        duration,
        instrumental,
        url: audioUrl,
      });
      hideLoading();
      return { ...result, url: audioUrl };
    }

    hideLoading();
    return result;
  } catch (err) {
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

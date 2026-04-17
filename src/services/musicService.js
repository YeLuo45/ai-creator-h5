/**
 * 音乐生成服务 (H5 Version)
 */

import { MiniMaxMusicAdapter, MiniMaxLyricsAdapter, MiniMaxMusicCoverAdapter } from '../adapter/MiniMaxAdapter.js';
import { storage, showLoading, hideLoading } from '../adapter/web-api.js';

const HISTORY_KEY = 'history_music';

/**
 * 获取 API 配置
 */
function getConfig() {
  return {
    apiKey: storage.get('minimax_api_key') || '',
    groupId: storage.get('minimax_group_id') || '',
  };
}

/**
 * 生成音乐
 */
export async function generateMusic({ prompt, duration = 180, instrumental = false }) {
  const { apiKey, groupId } = getConfig();

  if (!apiKey || !groupId) {
    throw new Error('请先在"我的"页面配置 API Key 和 Group ID');
  }

  const adapter = new MiniMaxMusicAdapter(apiKey, groupId);

  showLoading({ title: '音乐生成中（可能需要30-60秒）...' });
  try {
    const result = await adapter.generate({ prompt, duration, instrumental });

    // 保存到历史
    if (result.data?.[0]?.url) {
      addToHistory({
        prompt,
        duration,
        instrumental,
        url: result.data[0].url,
      });
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
  const { apiKey, groupId } = getConfig();

  if (!apiKey || !groupId) {
    throw new Error('请先在"我的"页面配置 API Key 和 Group ID');
  }

  const adapter = new MiniMaxLyricsAdapter(apiKey, groupId);

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
  const { apiKey, groupId } = getConfig();

  if (!apiKey || !groupId) {
    throw new Error('请先在"我的"页面配置 API Key 和 Group ID');
  }

  const adapter = new MiniMaxMusicCoverAdapter(apiKey, groupId);

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

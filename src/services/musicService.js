/**
 * 音乐生成服务 (H5 Version - Token Plan)
 */

import { MiniMaxMusicAdapter, MiniMaxLyricsAdapter, MiniMaxMusicCoverAdapter } from '../adapter/MiniMaxAdapter.js';
import { showLoading, hideLoading } from '../adapter/web-api.js';
import useStore from '../store/useStore.js';

/**
 * Hex 字符串转 Base64
 * 用于将 MiniMax API 返回的 hex 编码音频转换为可播放的 data URL
 * 使用 canvas 方式处理大数组，避免 String.fromCharCode spread 溢出和 btoa 字符串过长问题
 */
function hexToBase64(hex) {
  try {
    // 将 hex 转为字节数组
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    // 分块 btoa 转换，每次处理 30000 字节（约 40000 hex 字符）
    const chunkSize = 30000;
    let base64 = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      // 将 Uint8Array 转为二进制字符串（每个字符码对应一个字节值）
      let binary = '';
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
      base64 += btoa(binary);
    }
    return base64;
  } catch (err) {
    console.error('[MusicService] hexToBase64 error:', err, 'hex length:', hex.length);
    throw new Error('音频数据转换失败');
  }
}

/**
 * 获取 API 配置
 */
function getConfig() {
  const apiKey = useStore.getState().apiKey;
  return { apiKey };
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
  useStore.getState().addHistoryItem('music', item);
}

/**
 * 获取历史记录
 */
export function getHistory() {
  return useStore.getState().getHistory('music');
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  useStore.getState().clearHistory('music');
}

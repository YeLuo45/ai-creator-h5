/**
 * 视频生成服务 (H5 Version - Token Plan)
 */

import { MiniMaxVideoAdapter } from '../adapter/MiniMaxAdapter.js';
import { storage, showLoading, hideLoading } from '../adapter/web-api.js';

const HISTORY_KEY = 'history_videos';

/**
 * 获取 API 配置
 */
function getConfig() {
  return {
    apiKey: storage.get('minimax_api_key') || '',
  };
}

/**
 * 生成视频
 */
export async function generateVideo({ prompt, duration = 5 }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxVideoAdapter(apiKey);

  showLoading({ title: '视频生成中（可能需要较长时间）...' });
  try {
    const result = await adapter.generate({ prompt, duration });
    console.log('[VideoService] API result:', JSON.stringify(result).substring(0, 200));

    // 视频 API 返回格式: { data: { video_url: "...", cover_image_url: "..." } }
    if (result.data?.video_url) {
      const videoUrl = result.data.video_url;
      addToHistory({
        prompt,
        duration,
        url: videoUrl,
        coverUrl: result.data.cover_image_url || '',
      });
      hideLoading();
      console.log('[VideoService] Success, videoUrl:', videoUrl);
      return { ...result, url: videoUrl };
    } else if (result.base_resp?.status_msg) {
      console.error('[VideoService] API error:', result.base_resp.status_msg);
      throw new Error(`API 错误: ${result.base_resp.status_msg}`);
    }

    console.warn('[VideoService] Unexpected result structure:', result);
    hideLoading();
    return result;
  } catch (err) {
    console.error('[VideoService] generateVideo error:', err);
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

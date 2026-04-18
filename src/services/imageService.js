/**
 * 图片生成服务 (H5 Version - Token Plan)
 */

import { MiniMaxImageAdapter } from '../adapter/MiniMaxAdapter.js';
import { storage, showLoading, hideLoading } from '../adapter/web-api.js';

const HISTORY_KEY = 'history_images';

/**
 * 获取 API 配置
 */
function getConfig() {
  return {
    apiKey: storage.get('minimax_api_key') || '',
  };
}

/**
 * 生成图片
 */
export async function generateImage({ prompt, style = 'vivid', size = '1024x1024' }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxImageAdapter(apiKey);

  showLoading({ title: '图片生成中...' });
  try {
    const result = await adapter.generate({ prompt, style, size });

    // 保存到历史
    if (result.data?.[0]?.url) {
      addToHistory({
        prompt,
        style,
        size,
        url: result.data[0].url,
        revised_prompt: result.data[0].revised_prompt || '',
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
 * 添加到历史记录
 */
function addToHistory(item) {
  const history = getHistory();
  history.unshift({
    ...item,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  });
  // 最多保存 50 条
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

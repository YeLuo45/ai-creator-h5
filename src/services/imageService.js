/**
 * 图片生成服务 (H5 Version - Token Plan)
 */

import { MiniMaxImageAdapter } from '../adapter/MiniMaxAdapter.js';
import { showLoading, hideLoading } from '../adapter/web-api.js';
import useStore from '../store/useStore.js';

/**
 * 获取 API 配置
 */
function getConfig() {
  const apiKey = useStore.getState().apiKey;
  return { apiKey };
}

/**
 * 生成图片
 */
export async function generateImage({ prompt, model = 'image-01', style = 'vivid', size = '1024x1024' }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxImageAdapter(apiKey);

  showLoading({ title: '图片生成中...' });
  try {
    const result = await adapter.generate({ prompt, model, style, size });

    // Token Plan 图片 API 返回 { data: { image_urls: [...] } }
    if (result.data?.image_urls?.length > 0) {
      addToHistory({
        prompt,
        model,
        style,
        size,
        url: result.data.image_urls[0],
        revised_prompt: result.revised_prompt || '',
      });
      hideLoading();
      return result;
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
  useStore.getState().addHistoryItem('image', item);
}

/**
 * 获取历史记录
 */
export function getHistory() {
  return useStore.getState().getHistory('image');
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  useStore.getState().clearHistory('image');
}

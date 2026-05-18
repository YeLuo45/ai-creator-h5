/**
 * imageService.js - H5 Image Generation Service
 */

const API_BASE = 'https://api.minimax.chat/v1';

function getApiConfig() {
  const apiKey = localStorage.getItem('minimax_api_key') || '';
  const groupId = localStorage.getItem('minimax_group_id') || '';
  if (!apiKey) throw new Error('请先在"我的"页面配置 MiniMax API Key');
  if (!groupId) throw new Error('请先在"我的"页面配置 MiniMax Group ID');
  return { apiKey, groupId };
}

async function request(endpoint, params, method = 'POST') {
  const { apiKey, groupId } = getApiConfig();
  const url = API_BASE + endpoint;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'MM-Group-Id': groupId,
    },
  };

  if (method !== 'GET') {
    options.body = JSON.stringify(params);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (res.status >= 200 && res.status < 300) {
    return data;
  } else {
    throw new Error(`MiniMax API Error: ${res.status} - ${JSON.stringify(data)}`);
  }
}

export async function generateImage({ prompt, style = 'vivid', size = '1024x1024' }) {
  const payload = {
    model: 'image-01',
    prompt,
    n: 1,
    size,
    style,
    response_format: 'url',
  };
  return request('/images/generations', payload);
}

export function saveImageHistory(record) {
  const history = JSON.parse(localStorage.getItem('history_images') || '[]');
  history.unshift({
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    type: 'image',
  });
  if (history.length > 100) history.splice(100);
  localStorage.setItem('history_images', JSON.stringify(history));
}

export function getImageHistory() {
  return JSON.parse(localStorage.getItem('history_images') || '[]');
}

/**
 * Batch generate images with concurrency control (max 5 concurrent)
 * @param {string[]} prompts - Array of prompts
 * @param {string} style - Image style
 * @param {string} size - Image size
 * @param {function} onProgress - Progress callback (completed/total)
 * @returns {Promise<Array>} - Array of {success, url, revised_prompt} or {success: false, error}
 */
export async function batchGenerateImages(prompts, style = 'vivid', size = '1024x1024', onProgress) {
  const results = [];
  const concurrency = 5;
  let completed = 0;

  async function generateOne(prompt, index) {
    try {
      const res = await generateImage({ prompt, style, size });
      const url = res.data?.[0]?.url;
      if (!url) throw new Error('未获取到生成结果');
      // Save to history
      saveImageHistory({ prompt, url, style, size });
      results[index] = { success: true, url, revised_prompt: res.data?.[0]?.revised_prompt };
    } catch (e) {
      results[index] = { success: false, error: e.message, prompt };
    } finally {
      completed++;
      if (onProgress) onProgress(completed, prompts.length);
    }
  }

  // Process in batches of concurrency
  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = [];
    for (let j = 0; j < concurrency && i + j < prompts.length; j++) {
      batch.push(generateOne(prompts[i + j], i + j));
    }
    await Promise.all(batch);
  }

  return results;
}

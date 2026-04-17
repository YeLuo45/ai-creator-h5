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

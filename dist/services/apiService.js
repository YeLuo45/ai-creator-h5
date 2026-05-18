/**
 * apiService.js - API Open Platform Service
 * Provides unified API calling interface and API Key management
 */

const API_BASE = 'https://api.minimax.chat/v1';
const API_KEY_PREFIX = 'mm_h5_';

// ============ API Key Management ============

/**
 * Generate a unique API Key for platform access
 */
export function generateApiKey() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${API_KEY_PREFIX}${timestamp}${random}`;
}

/**
 * Set API Key for platform access
 */
export function setApiKey(key) {
  if (!key) {
    localStorage.removeItem('platform_api_key');
    localStorage.removeItem('platform_api_key_enabled');
  } else {
    localStorage.setItem('platform_api_key', key);
    localStorage.setItem('platform_api_key_enabled', 'true');
  }
}

/**
 * Get stored API Key
 */
export function getApiKey() {
  return localStorage.getItem('platform_api_key') || '';
}

/**
 * Check if API Key is enabled
 */
export function isApiKeyEnabled() {
  return localStorage.getItem('platform_api_key_enabled') === 'true';
}

/**
 * Enable/disable API Key
 */
export function setApiKeyEnabled(enabled) {
  localStorage.setItem('platform_api_key_enabled', enabled ? 'true' : 'false');
}

// ============ API Usage Statistics ============

function getApiStats() {
  return JSON.parse(localStorage.getItem('api_stats') || '{"image":0,"music":0,"tts":0,"lastReset":null}');
}

function saveApiStats(stats) {
  localStorage.setItem('api_stats', JSON.stringify(stats));
}

function incrementApiStat(type) {
  const stats = getApiStats();
  const today = new Date().toDateString();
  
  // Reset stats if new day
  if (stats.lastReset !== today) {
    stats.image = 0;
    stats.music = 0;
    stats.tts = 0;
    stats.lastReset = today;
  }
  
  stats[type] = (stats[type] || 0) + 1;
  saveApiStats(stats);
  return stats;
}

export function getApiStatsSummary() {
  const stats = getApiStats();
  return {
    imageCount: stats.image || 0,
    musicCount: stats.music || 0,
    ttsCount: stats.tts || 0,
    totalCount: (stats.image || 0) + (stats.music || 0) + (stats.tts || 0)
  };
}

// ============ Request Signature (Simple) ============

function generateSignature(apiKey, timestamp) {
  // Simple signature: base64(timestamp + apiKey)
  const data = `${timestamp}:${apiKey}`;
  return btoa(data);
}

function addSignature(headers, apiKey) {
  const timestamp = Date.now().toString(36);
  const signature = generateSignature(apiKey, timestamp);
  headers['X-API-Key'] = apiKey;
  headers['X-Timestamp'] = timestamp;
  headers['X-Signature'] = signature;
}

// ============ Core Request Function ============

async function request(endpoint, params, method = 'POST', usePlatformKey = false) {
  let apiKey, groupId;
  
  if (usePlatformKey) {
    apiKey = getApiKey();
    if (!apiKey || !isApiKeyEnabled()) {
      throw new Error('请先在"我的"页面生成并启用 API Key');
    }
  } else {
    apiKey = localStorage.getItem('minimax_api_key') || '';
    groupId = localStorage.getItem('minimax_group_id') || '';
    if (!apiKey) throw new Error('请先在"我的"页面配置 MiniMax API Key');
    if (!groupId) throw new Error('请先在"我的"页面配置 MiniMax Group ID');
  }
  
  const url = API_BASE + endpoint;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  
  if (!usePlatformKey) {
    headers['MM-Group-Id'] = groupId;
  } else {
    addSignature(headers, apiKey);
  }
  
  const options = { method, headers };
  if (method !== 'GET') {
    options.body = JSON.stringify(params);
  }
  
  // Simulate API response in demo mode
  if (usePlatformKey && !localStorage.getItem('minimax_api_key')) {
    return simulateResponse(endpoint, params);
  }
  
  const res = await fetch(url, options);
  const data = await res.json();
  
  if (res.status >= 200 && res.status < 300) {
    return data;
  } else {
    throw new Error(`API Error: ${res.status} - ${JSON.stringify(data)}`);
  }
}

// ============ Simulate Response (Demo Mode) ============

function simulateResponse(endpoint, params) {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint.includes('/images/generations')) {
        resolve({
          success: true,
          data: [{
            url: 'https://picsum.photos/512/512?random=' + Date.now(),
            revised_prompt: params.prompt
          }]
        });
      } else if (endpoint.includes('/audio/speech') || endpoint.includes('/generations')) {
        resolve({
          success: true,
          data: {
            audio: 'simulated_audio_data_' + Date.now()
          }
        });
      } else if (endpoint.includes('/music')) {
        resolve({
          success: true,
          data: [{
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: 180
          }]
        });
      } else {
        resolve({ success: true, mock: true });
      }
    }, 500);
  });
}

// ============ Image Generation API ============

export async function generateImage({ prompt, style = 'vivid', size = '1024x1024' }) {
  const payload = {
    model: 'image-01',
    prompt,
    n: 1,
    size,
    style,
    response_format: 'url',
  };
  
  const result = await request('/images/generations', payload);
  incrementApiStat('image');
  
  // Save to history
  const history = JSON.parse(localStorage.getItem('history_images') || '[]');
  history.unshift({
    id: Date.now().toString(),
    prompt,
    url: result.data?.[0]?.url || '',
    style,
    size,
    createdAt: new Date().toISOString(),
    type: 'image'
  });
  if (history.length > 100) history.splice(100);
  localStorage.setItem('history_images', JSON.stringify(history));
  
  return result;
}

// ============ Music Generation API ============

export async function generateMusic({ prompt, lyrics, duration = 180 }) {
  const payload = { model: 'music-2.6', prompt, duration };
  if (lyrics) payload.lyrics = lyrics;
  
  const result = await request('/audio/generations', payload);
  incrementApiStat('music');
  
  // Save to history
  const history = JSON.parse(localStorage.getItem('history_music') || '[]');
  history.unshift({
    id: Date.now().toString(),
    prompt,
    lyrics,
    musicUrl: result.data?.[0]?.url || '',
    duration: result.data?.[0]?.duration || 0,
    createdAt: new Date().toISOString(),
    type: 'music'
  });
  if (history.length > 100) history.splice(100);
  localStorage.setItem('history_music', JSON.stringify(history));
  
  return result;
}

// ============ TTS Generation API ============

export async function generateTTS({ input, voice = 'female-shaonv', format = 'mp3', speed = 1.0 }) {
  const payload = {
    model: 'TTS-HD',
    input,
    voice,
    speed,
    format,
  };
  
  const result = await request('/audio/speech', payload);
  incrementApiStat('tts');
  
  // Save to history
  const history = JSON.parse(localStorage.getItem('history_tts') || '[]');
  history.unshift({
    id: Date.now().toString(),
    input,
    voice,
    b64_audio: result?.data?.audio || '',
    createdAt: new Date().toISOString(),
    type: 'audio'
  });
  if (history.length > 100) history.splice(100);
  localStorage.setItem('history_tts', JSON.stringify(history));
  
  return result;
}

// ============ Task Status Query ============

const taskCache = new Map();

export async function getTaskStatus(taskId) {
  // Check cache first
  if (taskCache.has(taskId)) {
    const cached = taskCache.get(taskId);
    if (Date.now() - cached.timestamp < 5000) {
      return cached.status;
    }
  }
  
  // In real implementation, would query the API
  // For demo, return mock status
  const status = {
    taskId,
    status: 'completed',
    progress: 100,
    result: null
  };
  
  taskCache.set(taskId, { status, timestamp: Date.now() });
  return status;
}

// ============ API Health Check ============

export async function checkApiHealth() {
  try {
    const result = await request('/models', {}, 'GET');
    return { healthy: true, latency: 0 };
  } catch (e) {
    return { healthy: false, error: e.message };
  }
}

// ============ Export API Config ============

export function getMiniMaxConfig() {
  return {
    apiKey: localStorage.getItem('minimax_api_key') || '',
    groupId: localStorage.getItem('minimax_group_id') || ''
  };
}

export function setMiniMaxConfig(apiKey, groupId) {
  localStorage.setItem('minimax_api_key', apiKey);
  localStorage.setItem('minimax_group_id', groupId);
}
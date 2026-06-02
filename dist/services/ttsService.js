/**
 * ttsService.js - H5 TTS Service
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

const TTS_VOICES = [
  { id: 'male-qn-qingse', name: '青年男声', lang: 'zh' },
  { id: 'female-shaonv', name: '少女声音', lang: 'zh' },
  { id: 'female-yujie', name: '御姐声音', lang: 'zh' },
  { id: 'male-qn-jingxing', name: '激情男声', lang: 'zh' },
];

export async function generateSpeech({ input, voice = 'female-shaonv', format = 'mp3', speed = 1.0 }) {
  const res = await request('/audio/speech', {
    model: 'TTS-HD',
    input,
    voice,
    speed,
    format,
  });
  return { b64_audio: res?.data?.audio };
}

export function saveB64AudioAsDataUrl(b64Audio, format) {
  const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', opus: 'audio/opus' };
  const mime = mimeMap[format] || 'audio/mpeg';
  const binary = atob(b64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

export function saveTTSHistory(record) {
  const history = JSON.parse(localStorage.getItem('history_tts') || '[]');
  history.unshift({
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    type: 'audio',
  });
  if (history.length > 100) history.splice(100);
  localStorage.setItem('history_tts', JSON.stringify(history));
}

export function getTTSHistory() {
  return JSON.parse(localStorage.getItem('history_tts') || '[]');
}

/**
 * Batch generate TTS with concurrency control (max 5 concurrent)
 * @param {string[]} texts - Array of text inputs
 * @param {string} voice - Voice ID
 * @param {function} onProgress - Progress callback (completed/total)
 * @returns {Promise<Array>} - Array of {success, filePath, prompt} or {success: false, error}
 */
export async function batchGenerateSpeech(texts, voice = 'female-shaonv', onProgress) {
  const results = [];
  const concurrency = 5;
  let completed = 0;

  async function generateOne(text, index) {
    try {
      const res = await generateSpeech({ input: text, voice, format: 'mp3' });
      if (!res.b64_audio) throw new Error('未获取到音频数据');
      const dataUrl = saveB64AudioAsDataUrl(res.b64_audio, 'mp3');
      results[index] = { success: true, filePath: dataUrl, prompt: text };
    } catch (e) {
      results[index] = { success: false, error: e.message, prompt: text };
    } finally {
      completed++;
      if (onProgress) onProgress(completed, texts.length);
    }
  }

  // Process in batches of concurrency
  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = [];
    for (let j = 0; j < concurrency && i + j < texts.length; j++) {
      batch.push(generateOne(texts[i + j], i + j));
    }
    await Promise.all(batch);
  }

  return results;
}

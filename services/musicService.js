/**
 * musicService.js - H5 Music Generation Service
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

async function generateLyrics({ prompt, genre = 'pop', theme = 'love' }) {
  const res = await request('/chat/completions', {
    model: 'lyrics_generation',
    messages: [{ role: 'user', content: `请为以下主题创作歌词：${prompt}` }],
    max_tokens: 500,
  });
  const content = res.choices && res.choices[0] && res.choices[0].message ? res.choices[0].message.content : '';
  return {
    lyrics: content,
    title: extractTitle(content),
  };
}

function extractTitle(lyrics) {
  if (!lyrics) return '无标题';
  const lines = lyrics.split('\n').filter(l => l.trim());
  const titleLine = lines.find(l => l.startsWith('#')) || lines[0];
  return titleLine ? titleLine.replace(/^#\s*/, '').trim() : '无标题';
}

async function generateMusic({ prompt, lyrics, duration = 180 }) {
  const payload = { model: 'music-2.6', prompt, duration };
  if (lyrics) payload.lyrics = lyrics;
  return request('/audio/generations', payload);
}

async function generateMusicCover({ prompt }) {
  const res = await request('/images/generations', {
    model: 'music-cover',
    prompt,
  });
  return { url: res.data && res.data[0] ? res.data[0].url : '' };
}

export async function generateFullMusic({ prompt, genre, duration = 60 }) {
  const lyricsResult = await generateLyrics({ prompt, genre });
  const musicResult = await generateMusic({ prompt, lyrics: lyricsResult.lyrics, duration });
  const coverResult = await generateMusicCover({ prompt });

  return {
    lyrics: lyricsResult.lyrics,
    musicUrl: musicResult.data && musicResult.data[0] ? musicResult.data[0].url : '',
    coverUrl: coverResult.url || '',
    duration: musicResult.data && musicResult.data[0] ? musicResult.data[0].duration : 0,
  };
}

export function saveMusicHistory(record) {
  const history = JSON.parse(localStorage.getItem('history_music') || '[]');
  history.unshift({
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    type: 'music',
  });
  if (history.length > 100) history.splice(100);
  localStorage.setItem('history_music', JSON.stringify(history));
}

export function getMusicHistory() {
  return JSON.parse(localStorage.getItem('history_music') || '[]');
}

/**
 * Batch generate music with concurrency control (max 5 concurrent)
 * @param {string[]} prompts - Array of prompts
 * @param {string} genre - Music genre
 * @param {number} duration - Duration in seconds
 * @param {function} onProgress - Progress callback (completed/total)
 * @returns {Promise<Array>} - Array of {success, musicUrl, coverUrl, lyrics, duration} or {success: false, error}
 */
export async function batchGenerateMusic(prompts, genre = 'pop', duration = 60, onProgress) {
  const results = [];
  const concurrency = 5;
  let completed = 0;

  async function generateOne(prompt, index) {
    try {
      const res = await generateFullMusic({ prompt, genre, duration });
      if (!res.musicUrl) throw new Error('未获取到音乐数据');
      // Save to history
      saveMusicHistory({
        prompt,
        musicUrl: res.musicUrl,
        coverUrl: res.coverUrl,
        lyrics: res.lyrics,
        duration: res.duration,
      });
      results[index] = {
        success: true,
        musicUrl: res.musicUrl,
        coverUrl: res.coverUrl,
        lyrics: res.lyrics,
        duration: res.duration,
      };
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

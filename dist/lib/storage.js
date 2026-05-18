/**
 * storage.js - Web Storage API 适配 (替代 wx.getStorageSync)
 */

const storage = {
  get(key, defaultValue) {
    const value = localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : defaultValue;
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },

  has(key) {
    return localStorage.getItem(key) !== null;
  },
};

const STORAGE_KEYS = {
  API_KEY: 'minimax_api_key',
  GROUP_ID: 'minimax_group_id',
  USER_INFO: 'user_info',
  OPENID: 'openid',
  CREDITS: 'credits',
  HISTORY_IMAGES: 'history_images',
  HISTORY_MUSIC: 'history_music',
  HISTORY_TTS: 'history_tts',
  SETTINGS: 'settings',
};

function getAllHistory() {
  const images = storage.get(STORAGE_KEYS.HISTORY_IMAGES, []);
  const music = storage.get(STORAGE_KEYS.HISTORY_MUSIC, []);
  const tts = storage.get(STORAGE_KEYS.HISTORY_TTS, []);
  return [...images, ...music, ...tts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function clearAllHistory() {
  storage.remove(STORAGE_KEYS.HISTORY_IMAGES);
  storage.remove(STORAGE_KEYS.HISTORY_MUSIC);
  storage.remove(STORAGE_KEYS.HISTORY_TTS);
}

// Export for use in services
window.storage = storage;
window.STORAGE_KEYS = STORAGE_KEYS;
window.getAllHistory = getAllHistory;
window.clearAllHistory = clearAllHistory;

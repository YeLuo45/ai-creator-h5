/**
 * Web API 适配层 - 替代微信 wx.* API
 * 提供 toast, modal, loading, storage, audio, download 等 Web 实现
 */

// ============ Toast ============
let toastTimer = null;
export function showToast({ title, icon = 'none', duration = 2000 }) {
  removeToast();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = title;
  document.body.appendChild(el);
  toastTimer = setTimeout(removeToast, duration);
}

function removeToast() {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimer) clearTimeout(toastTimer);
}

// ============ Loading ============
let loadingEl = null;
export function showLoading({ title = '加载中...', mask = true } = {}) {
  hideLoading();
  loadingEl = document.createElement('div');
  loadingEl.className = 'loading-mask';
  loadingEl.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">${title}</div>
  `;
  document.body.appendChild(loadingEl);
}

export function hideLoading() {
  if (loadingEl) {
    loadingEl.remove();
    loadingEl = null;
  }
}

// ============ Modal ============
export function showModal({
  title = '提示',
  content = '',
  showCancel = true,
  cancelText = '取消',
  confirmText = '确定'
}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-content">${content}</div>
        <div class="modal-btns">
          ${showCancel ? `<button class="btn" id="modal-cancel">${cancelText}</button>` : ''}
          <button class="btn btn-primary" id="modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('#modal-confirm')?.addEventListener('click', () => cleanup({ confirm: true }));
    overlay.querySelector('#modal-cancel')?.addEventListener('click', () => cleanup({ confirm: false, cancel: true }));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup({ confirm: false, cancel: true });
    });
  });
}

// ============ Storage (localStorage) ============
const STORAGE_PREFIX = 'ai_creator_';

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  },

  has(key) {
    return localStorage.getItem(STORAGE_PREFIX + key) !== null;
  }
};

// ============ Audio ============
export function createInnerAudioContext() {
  const audio = new Audio();
  const ctx = {
    audio,

    play() { return audio.play(); },
    pause() { audio.pause(); },
    stop() {
      audio.pause();
      audio.currentTime = 0;
    },
    destroy() {
      audio.pause();
      audio.src = '';
    },

    get src() { return audio.src; },
    set src(v) { audio.src = v; },

    get currentTime() { return audio.currentTime; },
    set currentTime(v) { audio.currentTime = v; },

    get duration() { return audio.duration; },

    get paused() { return audio.paused; },

    get volume() { return audio.volume; },
    set volume(v) { audio.volume = v; },

    onPlay(callback) { audio.addEventListener('play', callback); },
    onPause(callback) { audio.addEventListener('pause', callback); },
    onEnded(callback) { audio.addEventListener('ended', callback); },
    onError(callback) { audio.addEventListener('error', callback); },
    onTimeUpdate(callback) { audio.addEventListener('timeupdate', callback); },

    offPlay(callback) { audio.removeEventListener('play', callback); },
    offPause(callback) { audio.removeEventListener('pause', callback); },
    offEnded(callback) { audio.removeEventListener('ended', callback); },
    offError(callback) { audio.removeEventListener('error', callback); },
    offTimeUpdate(callback) { audio.removeEventListener('timeupdate', callback); },
  };
  return ctx;
}

// ============ Download / Save ============
export function downloadFile({ url, fileName = 'download' }) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function saveImageToPhotosAlbum({ filePath }) {
  // Web 环境直接触发下载
  downloadFile({ url: filePath, fileName: 'ai_image.png' });
}

export function saveVideoToPhotosAlbum({ filePath }) {
  downloadFile({ url: filePath, fileName: 'ai_video.mp4' });
}

export function previewImage({ urls, current }) {
  // 浏览器新窗口打开
  window.open(current || urls[0], '_blank');
}

// ============ Network ============
export function getNetworkType() {
  return new Promise((resolve) => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    resolve({ networkType: conn?.effectiveType || 'unknown' });
  });
}

// ============ Get File Info ============
export function getFileInfo({ filePath }) {
  return new Promise((resolve, reject) => {
    fetch(filePath, { method: 'HEAD' })
      .then(resp => {
        resolve({
          size: parseInt(resp.headers.get('content-length') || '0'),
          statusCode: resp.status
        });
      })
      .catch(reject);
  });
}

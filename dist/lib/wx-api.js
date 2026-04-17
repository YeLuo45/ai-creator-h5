/**
 * wx-api.js - Web API 适配 (替代微信 wx.* API)
 */

// ========== Toast ==========
function showToast(title, icon = 'none', duration = 1500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${icon}`;
  toast.innerHTML = `<span class="toast-icon">${
    icon === 'success' ? '✅' : icon === 'error' ? '❌' : icon === 'loading' ? '⏳' : ''
  }</span><span class="toast-title">${title}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => container.removeChild(toast), 300);
  }, duration);
}

// ========== Loading ==========
function showLoading(title = '加载中...', mask = true) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.querySelector('.loading-text').textContent = title;
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ========== Modal ==========
function showModal(options) {
  return new Promise((resolve) => {
    const container = document.getElementById('modalContainer');
    const titleEl = document.getElementById('modalTitle');
    const contentEl = document.getElementById('modalContent');
    const actionsEl = document.getElementById('modalActions');

    titleEl.textContent = options.title || '';
    contentEl.innerHTML = options.content || '';
    actionsEl.innerHTML = '';

    if (options.showCancel !== false) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'modal-btn modal-btn-cancel';
      cancelBtn.textContent = options.cancelText || '取消';
      cancelBtn.onclick = () => {
        container.style.display = 'none';
        resolve({ confirm: false, cancel: true });
      };
      actionsEl.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn modal-btn-confirm';
    confirmBtn.textContent = options.confirmText || '确定';
    confirmBtn.onclick = () => {
      container.style.display = 'none';
      resolve({ confirm: true, cancel: false });
    };
    actionsEl.appendChild(confirmBtn);

    container.style.display = 'flex';
  });
}

// ========== ActionSheet ==========
function showActionSheet(options) {
  return new Promise((resolve) => {
    const container = document.getElementById('modalContainer');
    const titleEl = document.getElementById('modalTitle');
    const contentEl = document.getElementById('modalContent');
    const actionsEl = document.getElementById('modalActions');

    titleEl.textContent = '';
    contentEl.innerHTML = `<div class="actionsheet-list">${
      options.itemList.map((item, i) =>
        `<button class="actionsheet-item" data-index="${i}">${item}</button>`
      ).join('')
    }</div>`;
    actionsEl.innerHTML = `<button class="modal-btn modal-btn-cancel" id="actionsheetCancel">取消</button>`;

    contentEl.querySelectorAll('.actionsheet-item').forEach(btn => {
      btn.onclick = () => {
        container.style.display = 'none';
        resolve({ tapIndex: parseInt(btn.dataset.index), errMsg: 'ok' });
      };
    });
    document.getElementById('actionsheetCancel').onclick = () => {
      container.style.display = 'none';
      resolve({ tapIndex: -1, errMsg: 'cancel' });
    };

    container.style.display = 'flex';
  });
}

// ========== Preview Image ==========
function previewImage(urls, current) {
  // Simple lightbox preview
  const overlay = document.createElement('div');
  overlay.className = 'preview-overlay';
  overlay.innerHTML = `<img src="${current || urls[0]}" class="preview-image" />`;
  overlay.onclick = () => document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

// ========== Audio Playback ==========
function createAudioContext() {
  let audio = null;
  return {
    src: '',
    play() {
      if (!this.src) return;
      if (!audio) audio = new Audio(this.src);
      audio.src = this.src;
      audio.play().catch(() => {});
    },
    stop() {
      if (audio) audio.pause();
    },
    destroy() {
      if (audio) { audio.pause(); audio = null; }
    },
    onError() {},
  };
}

let currentAudio = null;

function playAudio(url) {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  currentAudio = new Audio(url);
  currentAudio.play().catch(() => {});
}

// ========== Download File (returns blob URL) ==========
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        resolve(URL.createObjectURL(blob));
      })
      .catch(err => reject(new Error(`下载失败: ${err.message}`)));
  });
}

// ========== Save Image to Album ==========
function saveImageToAlbum(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-image-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    resolve();
  });
}

// ========== Save File ==========
function saveFile(url) {
  return saveImageToAlbum(url);
}

// ========== Content Moderation ==========
function contentModeration(text) {
  const sensitiveWords = ['暴力', '色情', '赌博', '毒品', '政治', '宗教', '敏感'];
  for (const word of sensitiveWords) {
    if (text.includes(word)) return false;
  }
  return true;
}

// ========== Error Handler ==========
function handleError(err, title = '出错了') {
  console.error(`[Error] ${title}:`, err);
  const message = err instanceof Error ? err.message : String(err);
  showToast(`${title}：${message}`, 'none');
}

// ========== Mock Login ==========
function mockLogin() {
  return new Promise((resolve) => {
    const randomId = 'h5_' + Math.random().toString(36).substring(2, 18);
    resolve({ code: randomId });
  });
}

// ========== Mock User Profile ==========
function mockGetUserProfile() {
  return new Promise((resolve) => {
    resolve({
      userInfo: {
        nickname: 'H5用户',
        avatarUrl: '',
      }
    });
  });
}

// ========== Share ==========
function showShareMenu(options) {
  // Web share API if available
  if (navigator.share) {
    navigator.share({
      title: options.title,
      text: options.desc,
      url: window.location.href,
    }).catch(() => {});
  }
}

// ========== Get Network Type ==========
function getNetworkType() {
  return new Promise((resolve) => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    resolve(conn ? conn.effectiveType : 'unknown');
  });
}

// Export all
window.showToast = showToast;
window.hideLoading = hideLoading;
window.showLoading = showLoading;
window.showModal = showModal;
window.showActionSheet = showActionSheet;
window.previewImage = previewImage;
window.createAudioContext = createAudioContext;
window.playAudio = playAudio;
window.downloadFile = downloadFile;
window.saveImageToAlbum = saveImageToAlbum;
window.saveFile = saveFile;
window.contentModeration = contentModeration;
window.handleError = handleError;
window.mockLogin = mockLogin;
window.mockGetUserProfile = mockGetUserProfile;
window.showShareMenu = showShareMenu;
window.getNetworkType = getNetworkType;

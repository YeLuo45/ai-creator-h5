/**
 * AI Creator H5 - 主入口
 * 简单的 Hash 路由实现
 */

import { showToast, showModal } from './adapter/web-api.js';
import { renderIndexPage } from './pages/index.js';
import { renderGeneratePage, initGeneratePage } from './pages/generate.js';
import { renderHistoryPage } from './pages/history.js';
import { renderMyPage } from './pages/my.js';
import useStore from './store/useStore.js';

// 当前路由
let currentPage = '';

// 路由配置
const routes = {
  '': renderIndexPage,
  'index': renderIndexPage,
  'generate': renderGeneratePage,
  'history': renderHistoryPage,
  'my': renderMyPage,
};

// 渲染页面
function render(page) {
  const app = document.getElementById('app');
  currentPage = page;

  // 渲染内容
  let content = '';
  if (routes[page]) {
    content = routes[page]();
  } else {
    content = renderIndexPage();
  }

  // 渲染 Tab 栏
  const tabBar = `
    <nav class="tab-nav">
      <div class="tab-item ${page === 'index' || page === '' ? 'active' : ''}" data-page="index">
        <span class="icon">🏠</span>
        <span>首页</span>
      </div>
      <div class="tab-item ${page === 'generate' ? 'active' : ''}" data-page="generate">
        <span class="icon">✨</span>
        <span>生成</span>
      </div>
      <div class="tab-item ${page === 'history' ? 'active' : ''}" data-page="history">
        <span class="icon">📜</span>
        <span>历史</span>
      </div>
      <div class="tab-item ${page === 'my' ? 'active' : ''}" data-page="my">
        <span class="icon">👤</span>
        <span>我的</span>
      </div>
    </nav>
  `;

  app.innerHTML = content + tabBar;

  // 页面切换动画
  app.style.animation = 'fadeIn 0.3s ease';

  // 绑定 Tab 事件
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      const page = tab.dataset.page;
      navigate(page);
    });
  });

  // 绑定页面内部事件
  bindPageEvents(page);
}

// 绑定页面事件
function bindPageEvents(page) {
  if (page === 'index') {
    bindIndexEvents();
  } else if (page === 'generate') {
    bindGenerateEvents();
  } else if (page === 'history') {
    bindHistoryEvents();
  } else if (page === 'my') {
    bindMyEvents();
  }
}

// 导航
function navigate(page) {
  window.location.hash = page;
  render(page);
}

// 路由处理
function handleRoute() {
  const hash = window.location.hash.slice(1) || 'index';
  render(hash);
}

// 首页事件绑定
function bindIndexEvents() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      navigate('generate');
      // 等页面渲染完成后设置类型
      setTimeout(() => {
        const typeTag = document.querySelector(`.type-tag[data-type="${type}"]`);
        if (typeTag) typeTag.click();
      }, 100);
    });
  });
}

// 生成页事件绑定
function bindGenerateEvents() {
  // 初始化生成页交互（模型选择、模板等）
  initGeneratePage();

  // 生成按钮
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }
}

// 更新生成表单（由 generate.js initGeneratePage 调用）
// 现在由 generate.js 的 updateGenerateForm 统一处理

// 处理生成
async function handleGenerate() {
  const typeTags = document.querySelectorAll('.type-tag.active');
  if (!typeTags.length) return;

  const type = typeTags[0].dataset.type;
  const promptInput = document.getElementById('prompt-input');
  if (!promptInput || !promptInput.value.trim()) {
    showToast({ title: '请输入内容' });
    return;
  }

  const modelSelect = document.getElementById('model-select');
  const selectedModel = modelSelect?.value || (type === 'image' ? 'image-01' : type === 'music' ? 'music-2.6' : 'speech-01');

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.textContent = '生成中...';

  try {
    let result;
    if (type === 'image') {
      const { generateImage } = await import('./services/imageService.js');
      const style = document.getElementById('style-select')?.value || 'vivid';
      const size = document.getElementById('size-select')?.value || '1024x1024';
      result = await generateImage({ prompt: promptInput.value, model: selectedModel, style, size });
      showResult('image', result);
    } else if (type === 'music') {
      const { generateMusic } = await import('./services/musicService.js');
      const duration = parseInt(document.getElementById('duration-input')?.value || '180');
      const lyrics = document.getElementById('lyrics-input')?.value || '';
      result = await generateMusic({ prompt: promptInput.value, model: selectedModel, lyrics, duration });
      showResult('music', result);
    } else if (type === 'tts') {
      const { generateTTS } = await import('./services/ttsService.js');
      const voice = document.getElementById('voice-select')?.value || 'female-shaonv';
      const speed = parseFloat(document.getElementById('tts-speed')?.value || '1.0');
      result = await generateTTS({ input: promptInput.value, model: selectedModel, voice, speed });
      showResult('tts', result);
    }
  } catch (err) {
    showToast({ title: err.message || '生成失败' });
  } finally {
    btn.disabled = false;
    btn.textContent = '生成';
  }
}

// 显示结果
function showResult(type, result) {
  const resultContainer = document.getElementById('result-container');
  if (!resultContainer) return;

  let html = '<div class="card"><div class="form-label">生成结果</div>';

  // Token Plan API 返回格式更新
  if (type === 'image' && result.data?.image_urls?.[0]) {
    const imgUrl = result.data.image_urls[0];
    html += `<img src="${imgUrl}" class="preview-image" alt="生成图片">`;
    html += `<div style="margin-top:12px;display:flex;gap:8px;">`;
    html += `<button class="btn" onclick="window.open('${imgUrl}', '_blank')">在新窗口打开</button>`;
    html += `</div>`;
  } else if (type === 'music' && result.url) {
    html += `<audio src="${result.url}" controls class="audio-player"></audio>`;
    html += `<div style="margin-top:12px;">`;
    html += `<button class="btn" onclick="window.open('${result.url}', '_blank')">下载音乐</button>`;
    html += `</div>`;
  } else if (type === 'tts' && result.url) {
    html += `<audio src="${result.url}" controls class="audio-player"></audio>`;
    html += `<div style="margin-top:12px;">`;
    html += `<button class="btn" onclick="window.open('${result.url}', '_blank')">下载音频</button>`;
    html += `</div>`;
  } else {
    html += '<p>生成完成，但未返回有效数据</p>';
    // Debug: 显示原始结果
    html += `<pre style="font-size:10px;overflow:auto;max-height:100px;">${JSON.stringify(result, null, 2)}</pre>`;
  }

  html += '</div>';
  resultContainer.innerHTML = html;
  resultContainer.style.display = 'block';
}

// 历史页事件绑定
function bindHistoryEvents() {
  // 筛选标签
  document.querySelectorAll('.type-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.type-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      loadHistory(tag.dataset.filter);
    });
  });

  // 加载历史
  loadHistory('all');
}

// 加载历史记录
async function loadHistory(filter) {
  const listContainer = document.getElementById('history-list');
  if (!listContainer) return;

  let images = [], music = [], tts = [];

  if (filter === 'all' || filter === 'image') {
    const { getHistory: getImageHistory } = await import('./services/imageService.js');
    images = getImageHistory();
  }
  if (filter === 'all' || filter === 'music') {
    const { getHistory: getMusicHistory } = await import('./services/musicService.js');
    music = getMusicHistory();
  }
  if (filter === 'all' || filter === 'tts') {
    const { getHistory: getTTSHistory } = await import('./services/ttsService.js');
    tts = getTTSHistory();
  }

  const all = [
    ...images.map(i => ({ ...i, type: 'image' })),
    ...music.map(m => ({ ...m, type: 'music' })),
    ...tts.map(t => ({ ...t, type: 'tts' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (all.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>暂无历史记录</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = all.map(item => `
    <div class="history-item" data-id="${item.id}" data-type="${item.type}">
      ${item.type === 'image' ? `<img class="history-thumb" src="${item.url}" alt="图片">` : '<div class="history-thumb" style="display:flex;align-items:center;justify-content:center;font-size:32px;">' + (item.type === 'music' ? '🎵' : '🔊') + '</div>'}
      <div class="history-info">
        <div class="history-title">${item.prompt || item.input || '生成作品'}</div>
        <div class="history-meta">${new Date(item.createdAt).toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  // 绑定点击事件
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      const id = parseInt(item.dataset.id);
      showHistoryDetail(type, id);
    });
  });
}

// 显示历史详情
async function showHistoryDetail(type, id) {
  let item = null;
  if (type === 'image') {
    const { getHistory } = await import('./services/imageService.js');
    item = getHistory().find(i => i.id === id);
  } else if (type === 'music') {
    const { getHistory } = await import('./services/musicService.js');
    item = getHistory().find(i => i.id === id);
  } else if (type === 'tts') {
    const { getHistory } = await import('./services/ttsService.js');
    item = getHistory().find(i => i.id === id);
  }

  if (!item) {
    showToast({ title: '未找到该记录' });
    return;
  }

  let content = `<p>${item.prompt || item.input || ''}</p>`;
  if (type === 'image') {
    content += `<img src="${item.url}" style="max-width:100%;margin-top:12px;border-radius:8px;">`;
    content += `<div style="margin-top:12px;"><button class="btn" onclick="window.open('${item.url}', '_blank')">打开图片</button></div>`;
  } else {
    content += `<audio src="${item.url}" controls style="width:100%;margin-top:12px;"></audio>`;
    content += `<div style="margin-top:12px;"><button class="btn" onclick="window.open('${item.url}', '_blank')">下载</button></div>`;
  }

  await showModal({
    title: '历史详情',
    content,
    showCancel: false,
    confirmText: '关闭',
  });
}

// 我的页事件绑定
function bindMyEvents() {
  // 加载配置 (Token Plan 只需 API Key)
  const apiKey = useStore.getState().apiKey;

  const apiKeyInput = document.getElementById('api-key-input');

  if (apiKeyInput) apiKeyInput.value = apiKey;

  // 保存按钮
  const saveBtn = document.getElementById('save-config-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const newApiKey = document.getElementById('api-key-input')?.value || '';

      useStore.getState().setApiKey(newApiKey);
      // 清除旧的 Group ID（如果存在）
      useStore.getState().setGroupId('');

      showToast({ title: '配置已保存' });
    });
  }

  // 清空历史按钮
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const { confirm } = await showModal({
        title: '确认清空',
        content: '确定要清空所有历史记录吗？此操作不可恢复。',
      });
      if (confirm) {
        useStore.getState().clearAllHistory();
        showToast({ title: '历史已清空' });
      }
    });
  }
}

// ============ Offline Status Bar ============
function renderOfflineBar() {
  const isOffline = useStore.getState().isOffline;
  let bar = document.getElementById('offline-bar');
  if (isOffline) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'offline-bar';
      bar.innerHTML = '⚠️ 当前处于离线模式';
      document.body.prepend(bar);
    }
  } else {
    if (bar) bar.remove();
  }
}

// ============ Init ============
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
  // 初始化离线状态
  useStore.getState().setOffline(!navigator.onLine);

  // 监听 online/offline 事件
  window.addEventListener('online', () => {
    useStore.getState().setOffline(false);
    renderOfflineBar();
  });
  window.addEventListener('offline', () => {
    useStore.getState().setOffline(true);
    renderOfflineBar();
  });

  // 渲染离线状态栏
  renderOfflineBar();

  handleRoute();
});

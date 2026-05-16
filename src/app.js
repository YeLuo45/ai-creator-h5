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
      // V5: 记录模型使用
      useStore.getState().incrementModelUsage(selectedModel);
    } else if (type === 'music') {
      const { generateMusic } = await import('./services/musicService.js');
      const duration = parseInt(document.getElementById('duration-input')?.value || '180');
      const lyrics = document.getElementById('lyrics-input')?.value || '';
      result = await generateMusic({ prompt: promptInput.value, model: selectedModel, lyrics, duration });
      showResult('music', result);
      // V5: 记录模型使用
      useStore.getState().incrementModelUsage(selectedModel);
    } else if (type === 'tts') {
      const { generateTTS } = await import('./services/ttsService.js');
      const voice = document.getElementById('voice-select')?.value || 'female-shaonv';
      const speed = parseFloat(document.getElementById('tts-speed')?.value || '1.0');
      result = await generateTTS({ input: promptInput.value, model: selectedModel, voice, speed });
      showResult('tts', result);
      // V5: 记录模型使用
      useStore.getState().incrementModelUsage(selectedModel);
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
      loadHistory(getCurrentFilters());
    });
  });

  // V9: 时间筛选
  const timeFilter = document.getElementById('time-filter');
  if (timeFilter) {
    timeFilter.addEventListener('change', () => {
      loadHistory(getCurrentFilters());
    });
  }

  // V9: 评分筛选
  const ratingFilter = document.getElementById('rating-filter');
  if (ratingFilter) {
    ratingFilter.addEventListener('change', () => {
      loadHistory(getCurrentFilters());
    });
  }

  // V9: 搜索输入
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadHistory(getCurrentFilters());
      }, 300);
    });
  }

  // V9: 批量下载按钮
  const batchDownloadBtn = document.getElementById('batch-download');
  if (batchDownloadBtn) {
    batchDownloadBtn.addEventListener('click', handleBatchDownload);
  }

  // 加载历史
  loadHistory(getCurrentFilters());
}

// V9: 获取当前筛选条件
function getCurrentFilters() {
  const activeFilter = document.querySelector('.type-tag.active')?.dataset.filter || 'all';
  const timeFilter = document.getElementById('time-filter')?.value || 'all';
  const ratingFilter = parseInt(document.getElementById('rating-filter')?.value || '0');
  const searchKeyword = document.getElementById('search-input')?.value.trim().toLowerCase() || '';
  return { filter: activeFilter, timeFilter, ratingFilter, searchKeyword };
}

// 批量更新选中计数并显示/隐藏批量栏
function updateBatchBar() {
  const batchBar = document.getElementById('batch-bar');
  const selectedCount = document.getElementById('selected-count');
  if (!batchBar || !selectedCount) return;

  const count = window.__batchSelectedItems?.size || 0;
  selectedCount.textContent = count;
  batchBar.style.display = count > 0 ? 'flex' : 'none';
}

// V9: 判断时间是否在范围内
function isWithinTimeRange(dateStr, timeFilter) {
  if (timeFilter === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  if (timeFilter === 'today') {
    return date.toDateString() === now.toDateString();
  } else if (timeFilter === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  } else if (timeFilter === 'month') {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }
  return true;
}

// V9: 判断是否匹配搜索关键词
function matchesSearch(item, keyword) {
  if (!keyword) return true;
  const prompt = (item.prompt || item.input || '').toLowerCase();
  const note = (item.note || '').toLowerCase();
  return prompt.includes(keyword) || note.includes(keyword);
}

// V9: 判断是否匹配评分筛选
function matchesRating(item, minRating) {
  if (minRating === 0) return true;
  return (item.rating || 0) >= minRating;
}

// V9: 判断是否匹配标签筛选
function matchesTags(item, tagFilter) {
  if (!tagFilter || tagFilter.length === 0) return true;
  const itemTags = item.tags || [];
  return tagFilter.some(t => itemTags.includes(t));
}

// 加载历史记录
async function loadHistory(filters) {
  // 支持传入 filters 对象或旧的 filter string（兼容）
  let filter, timeFilter, ratingFilter, searchKeyword;
  if (typeof filters === 'object') {
    ({ filter = 'all', timeFilter = 'all', ratingFilter = 0, searchKeyword = '' } = filters);
  } else {
    filter = filters;
    timeFilter = 'all';
    ratingFilter = 0;
    searchKeyword = '';
  }

  const listContainer = document.getElementById('history-list');
  if (!listContainer) return;

  // 重置批量选择
  window.__batchSelectedItems = new Set();
  updateBatchBar();

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

  // V9: 应用时间、评分、搜索筛选
  const filtered = all.filter(item => {
    if (!isWithinTimeRange(item.createdAt, timeFilter)) return false;
    if (!matchesRating(item, ratingFilter)) return false;
    if (!matchesSearch(item, searchKeyword)) return false;
    return true;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>暂无历史记录</p>
      </div>
    `;
    return;
  }

  // V9: 渲染历史卡片，包含评分星星、标签、备注按钮
  listContainer.innerHTML = filtered.map(item => `
    <div class="history-item" data-id="${item.id}" data-type="${item.type}">
      <input type="checkbox" class="item-checkbox" data-id="${item.id}" data-type="${item.type}">
      ${item.type === 'image' ? `<img class="history-thumb" src="${item.url}" alt="图片">` : '<div class="history-thumb" style="display:flex;align-items:center;justify-content:center;font-size:32px;">' + (item.type === 'music' ? '🎵' : '🔊') + '</div>'}
      <div class="history-info">
        <div class="history-title">${item.prompt || item.input || '生成作品'}</div>
        <div class="history-meta">
          ${new Date(item.createdAt).toLocaleString()}
          ${item.tags && item.tags.length > 0 ? `<span class="item-tags">${item.tags.map(t => `<span class="tag-dot" style="background:${t}"></span>`).join('')}</span>` : ''}
        </div>
        <div class="history-note-preview" id="note-preview-${item.id}" style="font-size:11px;color:var(--text-secondary);margin-top:2px;${item.note ? '' : 'display:none'}">
          📝 ${item.note.length > 30 ? item.note.slice(0, 30) + '...' : item.note}
        </div>
      </div>

      <!-- V9: 评分星星 -->
      <div class="item-rating" data-id="${item.id}" data-type="${item.type}" onclick="event.stopPropagation()">
        ${[1,2,3,4,5].map(n => `<span class="star ${n <= (item.rating || 0) ? 'filled' : ''}" data-value="${n}">★</span>`).join('')}
      </div>

      <!-- V9: 标签按钮 -->
      <button class="tag-btn" data-id="${item.id}" data-type="${item.type}" onclick="event.stopPropagation()">🏷️</button>

      <!-- V9: 备注按钮 -->
      <button class="note-btn" data-id="${item.id}" data-type="${item.type}" onclick="event.stopPropagation()">📝</button>

      <button class="share-btn" data-id="${item.id}" data-type="${item.type}" data-url="${item.url || ''}">📤</button>
      <button class="fav-btn" data-id="${item.id}" data-type="${item.type}">⭐</button>
    </div>
  `).join('');

  // V9: 绑定评分星星点击
  document.querySelectorAll('.item-rating .star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = star.closest('.item-rating').dataset.type;
      const id = parseInt(star.closest('.item-rating').dataset.id);
      const value = parseInt(star.dataset.value);
      handleUpdateRating(type, id, value);
    });
  });

  // V9: 绑定标签按钮点击
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = parseInt(btn.dataset.id);
      openTagModal(type, id);
    });
  });

  // V9: 绑定备注按钮点击
  document.querySelectorAll('.note-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = parseInt(btn.dataset.id);
      openNoteModal(type, id);
    });
  });

  // 绑定 checkbox 事件
  document.querySelectorAll('.item-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      const key = `${cb.dataset.type}-${cb.dataset.id}`;
      if (!window.__batchSelectedItems) window.__batchSelectedItems = new Set();
      if (cb.checked) {
        window.__batchSelectedItems.add(key);
      } else {
        window.__batchSelectedItems.delete(key);
      }
      updateBatchBar();
      updateSelectAllState();
    });
  });

  // 全选/取消全选
  const selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.item-checkbox').forEach(cb => {
        cb.checked = checked;
        const key = `${cb.dataset.type}-${cb.dataset.id}`;
        if (checked) {
          window.__batchSelectedItems.add(key);
        } else {
          window.__batchSelectedItems.delete(key);
        }
      });
      updateBatchBar();
    });
  }

  // 绑定批量删除
  const batchDeleteBtn = document.getElementById('batch-delete');
  if (batchDeleteBtn) {
    batchDeleteBtn.onclick = () => {
      const items = Array.from(window.__batchSelectedItems || []);
      if (items.length === 0) return;
      if (confirm(`确认删除 ${items.length} 项？`)) {
        const toRemove = items.map(key => {
          const [type, id] = key.split('-');
          return { type, id: parseInt(id) };
        });
        useStore.getState().removeHistoryItems(toRemove);
        showToast({ title: `已删除 ${items.length} 项` });
        loadHistory(getCurrentFilters());
      }
    };
  }

  // 绑定批量收藏
  const batchFavBtn = document.getElementById('batch-fav');
  if (batchFavBtn) {
    batchFavBtn.onclick = () => {
      const items = Array.from(window.__batchSelectedItems || []);
      if (items.length === 0) return;
      openBatchFavoriteModal(items);
    };
  }

  // 绑定取消
  const batchCancelBtn = document.getElementById('batch-cancel');
  if (batchCancelBtn) {
    batchCancelBtn.onclick = () => {
      window.__batchSelectedItems = new Set();
      document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = false);
      const selectAllEl = document.getElementById('select-all');
      if (selectAllEl) selectAllEl.checked = false;
      updateBatchBar();
    };
  }

  // 绑定分享按钮
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const url = btn.dataset.url;
      handleShare(type, url);
    });
  });

  // 绑定收藏按钮事件
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = parseInt(btn.dataset.id);
      openFavoriteModal(type, id);
    });
  });

  // 绑定点击事件（排除按钮）
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      const type = item.dataset.type;
      const id = parseInt(item.dataset.id);
      showHistoryDetail(type, id);
    });
  });
}

// V9: 处理评分更新
async function handleUpdateRating(type, id, value) {
  useStore.getState().updateHistoryItem(type, id, { rating: value });
  // 更新 UI
  const ratingEl = document.querySelector(`.item-rating[data-id="${id}"][data-type="${type}"]`);
  if (ratingEl) {
    ratingEl.querySelectorAll('.star').forEach(star => {
      const starVal = parseInt(star.dataset.value);
      star.classList.toggle('filled', starVal <= value);
    });
  }
  showToast({ title: `已设为 ${value} 星` });
}

// V9: 打开标签选择弹窗
async function openTagModal(type, id) {
  // 获取当前标签
  let currentTags = [];
  if (type === 'image') {
    const { getHistory } = await import('./services/imageService.js');
    const item = getHistory().find(i => i.id === id);
    currentTags = item?.tags || [];
  } else if (type === 'music') {
    const { getHistory } = await import('./services/musicService.js');
    const item = getHistory().find(i => i.id === id);
    currentTags = item?.tags || [];
  } else if (type === 'tts') {
    const { getHistory } = await import('./services/ttsService.js');
    const item = getHistory().find(i => i.id === id);
    currentTags = item?.tags || [];
  }

  const tagColors = [
    { name: '红', value: '#ef4444' },
    { name: '橙', value: '#f97316' },
    { name: '黄', value: '#eab308' },
    { name: '绿', value: '#22c55e' },
    { name: '青', value: '#06b6d4' },
    { name: '蓝', value: '#3b82f6' },
    { name: '紫', value: '#a855f7' },
    { name: '粉', value: '#ec4899' },
  ];

  const content = `
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
      ${tagColors.map(t => `
        <div class="tag-option ${currentTags.includes(t.value) ? 'selected' : ''}"
             data-color="${t.value}"
             style="width:40px;height:40px;border-radius:50%;background:${t.value};cursor:pointer;opacity:${currentTags.includes(t.value) ? 1 : 0.4};border:3px solid ${currentTags.includes(t.value) ? '#fff' : 'transparent'};">
        </div>
      `).join('')}
    </div>
  `;

  await showModal({
    title: '选择标签',
    content,
    confirmText: '保存',
    cancelText: '取消',
  }).then(async ({ confirm }) => {
    if (!confirm) return;
    // 收集选中的颜色
    const selected = [];
    document.querySelectorAll('.tag-option.selected').forEach(el => {
      selected.push(el.dataset.color);
    });
    useStore.getState().updateHistoryItem(type, id, { tags: selected });
    showToast({ title: '标签已更新' });
    loadHistory(getCurrentFilters());
  });

  // 绑定标签点击事件（在弹窗显示后）
  setTimeout(() => {
    document.querySelectorAll('.tag-option').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('selected');
        el.style.opacity = el.classList.contains('selected') ? 1 : 0.4;
        el.style.borderColor = el.classList.contains('selected') ? '#fff' : 'transparent';
      });
    });
  }, 100);
}

// V9: 打开备注编辑弹窗
async function openNoteModal(type, id) {
  // 获取当前备注
  let currentNote = '';
  if (type === 'image') {
    const { getHistory } = await import('./services/imageService.js');
    const item = getHistory().find(i => i.id === id);
    currentNote = item?.note || '';
  } else if (type === 'music') {
    const { getHistory } = await import('./services/musicService.js');
    const item = getHistory().find(i => i.id === id);
    currentNote = item?.note || '';
  } else if (type === 'tts') {
    const { getHistory } = await import('./services/ttsService.js');
    const item = getHistory().find(i => i.id === id);
    currentNote = item?.note || '';
  }

  await showModal({
    title: '编辑备注',
    content: `<textarea id="note-input" class="input" rows="3" placeholder="输入备注信息...">${currentNote}</textarea>`,
    confirmText: '保存',
    cancelText: '取消',
  }).then(({ confirm }) => {
    if (!confirm) return;
    const note = document.getElementById('note-input')?.value || '';
    useStore.getState().updateHistoryItem(type, id, { note });
    showToast({ title: '备注已保存' });
    // 更新预览
    const preview = document.getElementById(`note-preview-${id}`);
    if (preview) {
      if (note) {
        preview.textContent = '📝 ' + (note.length > 30 ? note.slice(0, 30) + '...' : note);
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    }
  });
}

// V9: 批量下载处理
async function handleBatchDownload() {
  const items = Array.from(window.__batchSelectedItems || []);
  if (items.length === 0) {
    showToast({ title: '请先选择要下载的项目' });
    return;
  }

  showToast({ title: `正在准备 ${items.length} 个文件...` });

  try {
    const zip = new JSZip();
    let addedCount = 0;

    for (const key of items) {
      const [type, idStr] = key.split('-');
      const id = parseInt(idStr);

      let item = null;
      let folderName = '';
      if (type === 'image') {
        const { getHistory } = await import('./services/imageService.js');
        item = getHistory().find(i => i.id === id);
        folderName = 'images';
      } else if (type === 'music') {
        const { getHistory } = await import('./services/musicService.js');
        item = getHistory().find(i => i.id === id);
        folderName = 'music';
      } else if (type === 'tts') {
        const { getHistory } = await import('./services/ttsService.js');
        item = getHistory().find(i => i.id === id);
        folderName = 'audio';
      }

      if (item && item.url) {
        try {
          // 尝试下载文件内容
          const response = await fetch(item.url);
          const blob = await response.blob();
          const ext = getFileExtension(item.url, type);
          const filename = `${folderName}/${item.id}_${item.prompt?.slice(0, 20) || 'untitled'}${ext}`;
          zip.file(filename.replace(/[\/\\:*?"<>|]/g, '_'), blob);
          addedCount++;
        } catch (e) {
          console.warn(`下载失败: ${item.url}`, e);
        }
      }
    }

    if (addedCount === 0) {
      showToast({ title: '没有可下载的文件' });
      return;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    saveAs(zipBlob, `ai-creator-${timestamp}.zip`);
    showToast({ title: `已生成 ${addedCount} 个文件的 ZIP 包` });
  } catch (e) {
    console.error('批量下载失败', e);
    showToast({ title: '批量下载失败: ' + (e.message || '未知错误') });
  }
}

// V9: 根据 URL 和类型获取文件扩展名
function getFileExtension(url, type) {
  if (!url) {
    return type === 'image' ? '.png' : type === 'music' ? '.mp3' : '.wav';
  }
  const match = url.match(/\.[^.]+$/);
  if (match) return match[0];
  return type === 'image' ? '.png' : type === 'music' ? '.mp3' : '.wav';
}

// V9: loadHistory 已在上方重新实现，兼容旧的 loadHistory(filter) 调用
// 此处保留兼容性代理
const _origLoadHistory = loadHistory;

// 更新全选复选框状态
function updateSelectAllState() {
  const selectAll = document.getElementById('select-all');
  const checkboxes = document.querySelectorAll('.item-checkbox');
  if (!selectAll || checkboxes.length === 0) return;

  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  const someChecked = Array.from(checkboxes).some(cb => cb.checked);
  selectAll.checked = allChecked;
  selectAll.indeterminate = someChecked && !allChecked;
}

// 处理分享
function handleShare(type, url) {
  if (type === 'image' && url) {
    // 复制图片 URL 到剪贴板
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast({ title: '已复制到剪贴板' });
      }).catch(() => {
        showToast({ title: '复制失败' });
      });
    } else {
      alert('复制功能在非安全环境下不可用');
    }
  } else if ((type === 'music' || type === 'tts') && url) {
    // 播放音频（不复制 base64）
    try {
      const audio = new Audio(url);
      audio.play();
      showToast({ title: '正在播放' });
    } catch (e) {
      showToast({ title: '播放失败' });
    }
  } else {
    showToast({ title: '分享内容不可用' });
  }
}

// 批量收藏弹窗
async function openBatchFavoriteModal(items) {
  const { albums, addFavorite, createAlbum } = useStore.getState();
  const modal = document.getElementById('batch-fav-modal');
  const albumSelect = document.getElementById('batch-album-select');
  const newAlbumInput = document.getElementById('batch-new-album-name');
  const countEl = document.getElementById('batch-fav-count');

  countEl.textContent = `已选 ${items.length} 项`;
  albumSelect.innerHTML = '<option value="">-- 选择专辑 --</option>' +
    albums.map(a => `<option value="${a.id}">${a.name}</option>`).join('') +
    '<option value="__new__">+ 新建专辑</option>';

  newAlbumInput.style.display = 'none';
  newAlbumInput.value = '';
  modal.style.display = 'flex';

  albumSelect.onchange = () => {
    newAlbumInput.style.display = albumSelect.value === '__new__' ? 'block' : 'none';
  };

  document.getElementById('batch-fav-cancel').onclick = () => {
    modal.style.display = 'none';
  };

  document.getElementById('batch-fav-confirm').onclick = async () => {
    let albumId = albumSelect.value;
    if (albumId === '__new__') {
      const name = newAlbumInput.value.trim();
      if (!name) { showToast({ title: '请输入专辑名称' }); return; }
      albumId = createAlbum(name);
    }

    // 批量添加到收藏
    for (const key of items) {
      const [type, id] = key.split('-');
      let item = null;
      if (type === 'image') {
        const { getHistory } = await import('./services/imageService.js');
        item = getHistory().find(i => i.id === parseInt(id));
      } else if (type === 'music') {
        const { getHistory } = await import('./services/musicService.js');
        item = getHistory().find(i => i.id === parseInt(id));
      } else if (type === 'tts') {
        const { getHistory } = await import('./services/ttsService.js');
        item = getHistory().find(i => i.id === parseInt(id));
      }
      if (item) {
        addFavorite({ type, data: item }, albumId, '');
      }
    }

    showToast({ title: `已收藏 ${items.length} 项到专辑` });
    modal.style.display = 'none';
    window.__batchSelectedItems = new Set();
    loadHistory(document.querySelector('.type-tag.active')?.dataset.filter || 'all');
  };
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

// 打开收藏弹窗
async function openFavoriteModal(type, id) {
  const { albums, addFavorite, createAlbum } = useStore.getState();
  const modal = document.getElementById('favorite-modal');
  const albumSelect = document.getElementById('album-select');
  const newAlbumInput = document.getElementById('new-album-name');
  const favNameInput = document.getElementById('favorite-name');

  // 填充专辑选项
  albumSelect.innerHTML = '<option value="">-- 选择专辑 --</option>' +
    albums.map(a => `<option value="${a.id}">${a.name}</option>`).join('') +
    '<option value="__new__">+ 新建专辑</option>';

  newAlbumInput.style.display = 'none';
  newAlbumInput.value = '';
  favNameInput.value = '';
  modal.style.display = 'flex';

  // 切换到新建专辑输入
  albumSelect.onchange = () => {
    newAlbumInput.style.display = albumSelect.value === '__new__' ? 'block' : 'none';
  };

  // 取消
  document.getElementById('fav-cancel').onclick = () => {
    modal.style.display = 'none';
  };

  // 确认
  document.getElementById('fav-confirm').onclick = async () => {
    let albumId = albumSelect.value;
    if (albumId === '__new__') {
      const name = newAlbumInput.value.trim();
      if (!name) { showToast({ title: '请输入专辑名称' }); return; }
      albumId = createAlbum(name);
    }

    // 获取历史项目数据
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

    if (item) {
      addFavorite({ type, data: item }, albumId, favNameInput.value.trim());
      showToast({ title: '已收藏到专辑' });
    }
    modal.style.display = 'none';
  };
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

  // V7: 专辑管理
  renderAlbumList();

  // 新建专辑按钮
  const createAlbumBtn = document.getElementById('create-album-btn');
  const newAlbumInput = document.getElementById('new-album-name');
  if (createAlbumBtn) {
    createAlbumBtn.addEventListener('click', () => {
      if (newAlbumInput.style.display === 'none') {
        newAlbumInput.style.display = 'block';
        newAlbumInput.focus();
      } else {
        const name = newAlbumInput.value.trim();
        if (!name) { showToast({ title: '请输入专辑名称' }); return; }
        useStore.getState().createAlbum(name);
        newAlbumInput.value = '';
        newAlbumInput.style.display = 'none';
        renderAlbumList();
        showToast({ title: '专辑已创建' });
      }
    });
  }
}

// 渲染专辑列表
function renderAlbumList() {
  const list = document.getElementById('album-list');
  if (!list) return;
  const { albums, getFavoritesByAlbum, deleteAlbum } = useStore.getState();

  if (albums.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">暂无专辑</p>';
    return;
  }

  list.innerHTML = albums.map(album => {
    const favs = getFavoritesByAlbum(album.id);
    return `<div class="album-item" data-id="${album.id}">
      <div class="album-header">
        <span class="album-name">${album.name}</span>
        <span class="album-count">${favs.length}个作品</span>
        <button class="album-delete-btn" data-id="${album.id}">🗑️</button>
      </div>
      <div class="album-favs" id="album-favs-${album.id}" style="display:none;">
        ${favs.length === 0 ? '<p style="font-size:12px;color:var(--text-secondary);">专辑为空</p>' :
          favs.map(f => `<div class="fav-item">
            <span>${f.type === 'image' ? '🖼️' : f.type === 'music' ? '🎵' : '🔊'}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name || f.data?.prompt || f.data?.input || '作品'}</span>
            <button class="fav-remove-btn" data-id="${f.id}">✕</button>
          </div>`).join('')
        }
      </div>
    </div>`;
  }).join('');

  // 绑定专辑展开/折叠
  document.querySelectorAll('.album-name').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.closest('.album-item').dataset.id;
      const favs = document.getElementById(`album-favs-${id}`);
      if (favs) favs.style.display = favs.style.display === 'none' ? 'block' : 'none';
    });
  });

  // 绑定删除专辑
  document.querySelectorAll('.album-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const { confirm } = await showModal({
        title: '确认删除',
        content: '删除专辑将同时删除其内所有收藏，确定删除？',
      });
      if (confirm) {
        deleteAlbum(id);
        renderAlbumList();
        showToast({ title: '专辑已删除' });
      }
    });
  });

  // 绑定删除收藏
  document.querySelectorAll('.fav-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      useStore.getState().removeFavorite(id);
      renderAlbumList();
      showToast({ title: '已移除收藏' });
    });
  });
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

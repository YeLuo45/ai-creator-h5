/**
 * workflowRecommendUI.js - AI Recommendation & Template Gallery UI
 * UI adapter for AI recommendation and template marketplace features
 */

// Global state for recommendation UI
const recommendUIState = {
  isAIRecommendOpen: false,
  isTemplateGalleryOpen: false,
  currentFilters: {
    category: 'all',
    style: 'all',
    difficulty: 'all',
    search: ''
  }
};

/**
 * Initialize AI recommend button (bottom-right floating button)
 */
function initAIRecommendButton() {
  // Create AI assistant button if not exists
  if (!document.getElementById('ai-assist-btn')) {
    const btn = document.createElement('button');
    btn.id = 'ai-assist-btn';
    btn.className = 'ai-assist-btn';
    btn.innerHTML = '⚡ AI';
    btn.title = 'AI 创作助手';
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      z-index: 999;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    btn.onclick = toggleAIRecommendPanel;
    document.body.appendChild(btn);
  }
  
  // Create template gallery button (bottom tab bar)
  initTemplateGalleryTab();
}

/**
 * Initialize template gallery tab in bottom bar
 */
function initTemplateGalleryTab() {
  const statusBar = document.querySelector('.status-bar');
  if (!statusBar) return;
  
  if (!document.getElementById('template-gallery-tab')) {
    const tab = document.createElement('div');
    tab.id = 'template-gallery-tab';
    tab.className = 'status-item';
    tab.style.cssText = 'cursor: pointer; padding: 4px 12px; background: var(--bg-node); border-radius: 4px;';
    tab.innerHTML = '<span>📋 模板市场</span>';
    tab.onclick = showTemplateGallery;
    statusBar.appendChild(tab);
  }
}

/**
 * Toggle AI recommendation panel
 */
function toggleAIRecommendPanel() {
  if (recommendUIState.isAIRecommendOpen) {
    closeAIRecommendPanel();
  } else {
    showAIRecommendPanel();
  }
}

/**
 * Show AI recommendation panel
 */
function showAIRecommendPanel() {
  recommendUIState.isAIRecommendOpen = true;
  
  // Create or show panel
  let panel = document.getElementById('ai-recommend-panel');
  if (!panel) {
    panel = createAIRecommendPanel();
    document.body.appendChild(panel);
  }
  
  panel.classList.add('active');
  panel.style.display = 'flex';
  
  // Update button state
  const btn = document.getElementById('ai-assist-btn');
  if (btn) btn.style.transform = 'rotate(15deg)';
  
  // Close template gallery if open
  if (recommendUIState.isTemplateGalleryOpen) {
    hideTemplateGallery();
  }
}

/**
 * Close AI recommendation panel
 */
function closeAIRecommendPanel() {
  recommendUIState.isAIRecommendOpen = false;
  
  const panel = document.getElementById('ai-recommend-panel');
  if (panel) {
    panel.classList.remove('active');
    panel.style.display = 'none';
  }
  
  const btn = document.getElementById('ai-assist-btn');
  if (btn) btn.style.transform = '';
}

/**
 * Create AI recommendation panel HTML
 * @returns {HTMLElement} Panel element
 */
function createAIRecommendPanel() {
  const panel = document.createElement('div');
  panel.id = 'ai-recommend-panel';
  panel.className = 'ai-recommend-panel';
  panel.style.cssText = `
    display: none;
    position: fixed;
    bottom: 140px;
    right: 20px;
    width: 380px;
    max-height: 500px;
    background: var(--bg-panel, #1A1A2E);
    border: 1px solid var(--border, #333355);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 1000;
    flex-direction: column;
    overflow: hidden;
  `;
  
  panel.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid var(--border, #333355); display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">🤖</span>
        <span style="font-weight: 600; font-size: 14px;">AI 创作助手</span>
      </div>
      <button id="ai-panel-close" style="background: none; border: none; color: var(--text-dim, #8888AA); cursor: pointer; font-size: 18px; padding: 4px;">×</button>
    </div>
    <div style="padding: 16px; border-bottom: 1px solid var(--border, #333355);">
      <div style="display: flex; gap: 8px;">
        <input type="text" id="ai-goal-input" placeholder="描述你的创作目标，如：写一首古风歌曲" 
          style="flex: 1; padding: 10px 12px; background: var(--bg-dark, #0F0F1A); border: 1px solid var(--border, #333355); border-radius: 6px; color: var(--text, #E0E0FF); font-size: 13px;">
        <button id="ai-recommend-btn" style="padding: 10px 16px; background: var(--primary, #6366F1); border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 13px; white-space: nowrap;">
          推荐
        </button>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-dim, #8888AA);">
        例如：写一首古风歌曲、制作科幻视频、创作插画
      </div>
    </div>
    <div id="ai-recommend-results" style="flex: 1; overflow-y: auto; padding: 12px;">
      <div style="text-align: center; padding: 40px 20px; color: var(--text-dim, #8888AA); font-size: 13px;">
        <div style="font-size: 32px; margin-bottom: 12px;">💡</div>
        <div>输入创作目标，获取AI推荐</div>
      </div>
    </div>
    <div style="padding: 12px; border-top: 1px solid var(--border, #333355); display: flex; gap: 8px;">
      <button id="ai-template-gallery-btn" style="flex: 1; padding: 8px; background: var(--bg-node, #252542); border: 1px solid var(--border, #333355); border-radius: 6px; color: var(--text, #E0E0FF); cursor: pointer; font-size: 12px;">
        📋 模板市场
      </button>
      <button id="ai-export-btn" style="flex: 1; padding: 8px; background: var(--bg-node, #252542); border: 1px solid var(--border, #333355); border-radius: 6px; color: var(--text, #E0E0FF); cursor: pointer; font-size: 12px;">
        📤 导出当前
      </button>
    </div>
  `;
  
  // Bind events after appending
  setTimeout(() => {
    document.getElementById('ai-panel-close').onclick = closeAIRecommendPanel;
    document.getElementById('ai-recommend-btn').onclick = handleAIRecommend;
    document.getElementById('ai-template-gallery-btn').onclick = showTemplateGallery;
    document.getElementById('ai-export-btn').onclick = exportCurrentWorkflow;
    
    // Enter key to trigger recommend
    document.getElementById('ai-goal-input').onkeydown = (e) => {
      if (e.key === 'Enter') handleAIRecommend();
    };
  }, 0);
  
  return panel;
}

/**
 * Handle AI recommend button click
 */
function handleAIRecommend() {
  const input = document.getElementById('ai-goal-input');
  const goal = input?.value?.trim();
  
  if (!goal) {
    showToast('请输入创作目标');
    return;
  }
  
  const templates = TemplateGallery.getTemplates({});
  const recommendations = WorkflowAIRecommend.recommend(goal, templates, 3);
  
  renderRecommendResults(recommendations);
}

/**
 * Render recommendation results
 * @param {Object[]} results - Recommendation results
 */
function renderRecommendResults(results) {
  const container = document.getElementById('ai-recommend-results');
  if (!container) return;
  
  if (!results || results.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-dim, #8888AA); font-size: 13px;">
        <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
        <div>未找到匹配的模板</div>
        <div style="margin-top: 8px; font-size: 11px;">试试其他关键词</div>
      </div>
    `;
    return;
  }
  
  let html = '';
  results.forEach((rec, index) => {
    const tpl = rec.template;
    const reason = WorkflowAIRecommend.getRecommendationReason(rec);
    const stars = '★'.repeat(Math.round(tpl.rating)) + '☆'.repeat(5 - Math.round(tpl.rating));
    
    html += `
      <div class="recommend-item" style="background: var(--bg-node, #252542); border: 1px solid var(--border, #333355); border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.2s;" 
           onclick="loadTemplateToCanvas(TemplateGallery.getTemplateById('${tpl.id}'))"
           onmouseover="this.style.borderColor='var(--primary, #6366F1)'"
           onmouseout="this.style.borderColor='var(--border, #333355)'">
        <div style="display: flex; gap: 12px;">
          <div style="width: 60px; height: 40px; border-radius: 4px; overflow: hidden; flex-shrink: 0; background: var(--bg-dark, #0F0F1A);">
            ${tpl.thumbnail || '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;">📋</div>'}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 13px; color: var(--text, #E0E0FF);">${tpl.name}</span>
              <span style="font-size: 10px; padding: 2px 6px; background: var(--primary, #6366F1); border-radius: 3px; color: white;">${tpl.category}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-dim, #8888AA); margin-bottom: 4px;">${reason}</div>
            <div style="font-size: 11px; color: #F59E0B;">${stars} <span style="color: var(--text-dim, #8888AA);">(${tpl.useCount}次使用)</span></div>
          </div>
        </div>
        <div style="margin-top: 8px; display: flex; gap: 6px;">
          <button class="btn-small primary" onclick="event.stopPropagation();loadTemplateToCanvas(TemplateGallery.getTemplateById('${tpl.id}'))">加载模板</button>
          <button class="btn-small" onclick="event.stopPropagation();TemplateGallery.downloadTemplate(TemplateGallery.getTemplateById('${tpl.id}'))">导出</button>
          <button class="btn-small" onclick="event.stopPropagation();toggleTemplateFavorite('${tpl.id}', this)" style="${TemplateGallery.getTemplateById(tpl.id).isFavorite ? 'color: #EF4444;' : ''}">
            ${TemplateGallery.getTemplateById(tpl.id).isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Toggle template favorite status
 * @param {string} id - Template ID
 * @param {HTMLElement} btn - Button element
 */
function toggleTemplateFavorite(id, btn) {
  const updated = TemplateGallery.favoriteTemplate(id);
  if (btn) {
    btn.textContent = updated.isFavorite ? '❤️' : '🤍';
    btn.style.color = updated.isFavorite ? '#EF4444' : '';
  }
}

/**
 * Load template to canvas
 * @param {Object} template - Template object
 */
function loadTemplateToCanvas(template) {
  if (!template || !template.nodes) {
    showToast('模板加载失败');
    return;
  }
  
  // Check if canvas has nodes
  if (state.workflow.nodes.length > 0) {
    if (!confirm('当前画布有内容，加载模板将替换现有节点。是否继续？')) {
      return;
    }
  }
  
  // Generate new IDs to avoid conflicts
  const idMap = {};
  const newNodes = template.nodes.map(node => {
    const newId = 'n' + Date.now() + Math.random().toString(36).slice(2, 6);
    idMap[node.id] = newId;
    return { ...node, id: newId };
  });
  
  const newConnections = (template.connections || []).map(conn => ({
    from: idMap[conn.from] || conn.from,
    fromPort: conn.fromPort,
    to: idMap[conn.to] || conn.to,
    toPort: conn.toPort
  }));
  
  // Update state
  pushUndoState();
  state.workflow = {
    id: null,
    name: template.name || '未命名工作流',
    description: template.description || '',
    nodes: newNodes,
    connections: newConnections
  };
  
  // Clear and re-render
  document.querySelectorAll('.workflow-node').forEach(n => n.remove());
  state.workflow.nodes.forEach(n => renderNode(n));
  renderConnections();
  selectNode(null);
  state.executionResults = {};
  updateProgress(0);
  saveToURL();
  updateNodeCount();
  
  closeAIRecommendPanel();
  showToast('已加载: ' + template.name);
  WorkflowLogger.info('从模板加载: ' + template.name);
}

/**
 * Export current workflow
 */
function exportCurrentWorkflow() {
  if (state.workflow.nodes.length === 0) {
    showToast('当前画布为空');
    return;
  }
  
  const json = JSON.stringify(state.workflow, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.workflow.name || 'workflow') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('已导出工作流');
}

/**
 * Show template gallery panel
 */
function showTemplateGallery() {
  recommendUIState.isTemplateGalleryOpen = true;
  
  // Close AI recommend panel if open
  closeAIRecommendPanel();
  
  // Create or show gallery modal
  let modal = document.getElementById('template-gallery-modal');
  if (!modal) {
    modal = createTemplateGalleryModal();
    document.body.appendChild(modal);
  }
  
  modal.classList.add('active');
  
  // Initial render
  renderTemplateCards(TemplateGallery.getTemplates(recommendUIState.currentFilters));
  updateGalleryFilters();
}

/**
 * Hide template gallery
 */
function hideTemplateGallery() {
  recommendUIState.isTemplateGalleryOpen = false;
  
  const modal = document.getElementById('template-gallery-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Create template gallery modal
 * @returns {HTMLElement} Modal element
 */
function createTemplateGalleryModal() {
  const modal = document.createElement('div');
  modal.id = 'template-gallery-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'z-index: 1001;';
  
  modal.innerHTML = `
    <div class="modal" style="width: 700px; max-height: 80vh; display: flex; flex-direction: column;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📋</span>
          <span style="font-weight: 600;">模板市场</span>
        </div>
        <button class="modal-close" onclick="hideTemplateGallery()">×</button>
      </div>
      <div style="padding: 12px 20px; border-bottom: 1px solid var(--border, #333355); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <div style="display: flex; gap: 4px;" id="gallery-category-filters">
          <button class="gallery-filter-btn active" data-category="all" onclick="setGalleryFilter('category', 'all', this)">全部</button>
          <button class="gallery-filter-btn" data-category="music" onclick="setGalleryFilter('category', 'music', this)">🎵 音乐</button>
          <button class="gallery-filter-btn" data-category="drawing" onclick="setGalleryFilter('category', 'drawing', this)">🎨 绘画</button>
          <button class="gallery-filter-btn" data-category="video" onclick="setGalleryFilter('category', 'video', this)">🎬 视频</button>
          <button class="gallery-filter-btn" data-category="text" onclick="setGalleryFilter('category', 'text', this)">📝 文案</button>
          <button class="gallery-filter-btn" data-category="voice" onclick="setGalleryFilter('category', 'voice', this)">🎙️ 配音</button>
        </div>
        <div style="flex: 1;"></div>
        <input type="text" id="gallery-search" placeholder="搜索模板..." 
          style="padding: 6px 10px; background: var(--bg-dark, #0F0F1A); border: 1px solid var(--border, #333355); border-radius: 4px; color: var(--text, #E0E0FF); font-size: 12px; width: 150px;"
          oninput="handleGallerySearch(this.value)">
      </div>
      <div class="modal-body" id="template-gallery-content" style="flex: 1; overflow-y: auto; padding: 16px 20px;">
        <!-- Template cards will be rendered here -->
      </div>
    </div>
  `;
  
  return modal;
}

/**
 * Set gallery filter
 * @param {string} type - Filter type
 * @param {string} value - Filter value
 * @param {HTMLElement} btn - Button element
 */
function setGalleryFilter(type, value, btn) {
  // Update button states
  if (type === 'category') {
    document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
  }
  
  recommendUIState.currentFilters[type] = value;
  
  // Apply filters and re-render
  const templates = TemplateGallery.getTemplates(recommendUIState.currentFilters);
  renderTemplateCards(templates);
}

/**
 * Handle gallery search
 * @param {string} query - Search query
 */
function handleGallerySearch(query) {
  recommendUIState.currentFilters.search = query;
  const templates = TemplateGallery.getTemplates(recommendUIState.currentFilters);
  renderTemplateCards(templates);
}

/**
 * Update gallery filter button states
 */
function updateGalleryFilters() {
  const currentCategory = recommendUIState.currentFilters.category;
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === currentCategory);
  });
}

/**
 * Render template cards in gallery
 * @param {Object[]} templates - Array of templates
 */
function renderTemplateCards(templates) {
  const container = document.getElementById('template-gallery-content');
  if (!container) return;
  
  if (!templates || templates.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-dim, #8888AA);">
        <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
        <div>未找到模板</div>
      </div>
    `;
    return;
  }
  
  let html = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">';
  
  templates.forEach(tpl => {
    const stars = '★'.repeat(Math.round(tpl.rating)) + '☆'.repeat(5 - Math.round(tpl.rating));
    const difficultyLabels = { beginner: '入门', intermediate: '进阶', expert: '专家' };
    const styleLabels = { ancient: '古风', scifi: '科幻', realistic: '写实', abstract: '抽象' };
    
    html += `
      <div class="template-card" style="background: var(--bg-node, #252542); border: 1px solid var(--border, #333355); border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s;"
           onclick="loadTemplateToCanvas(TemplateGallery.getTemplateById('${tpl.id}'))"
           onmouseover="this.style.borderColor='var(--primary, #6366F1)'; this.style.transform='translateY(-2px)';"
           onmouseout="this.style.borderColor='var(--border, #333355)'; this.style.transform='';">
        <div style="display: flex; gap: 10px;">
          <div style="width: 70px; height: 50px; border-radius: 4px; overflow: hidden; flex-shrink: 0; background: var(--bg-dark, #0F0F1A);">
            ${tpl.thumbnail || '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;">📋</div>'}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: var(--text, #E0E0FF);">${tpl.name}</div>
            <div style="font-size: 11px; color: var(--text-dim, #8888AA); margin-bottom: 4px;">${tpl.author}</div>
            <div style="font-size: 10px; color: #F59E0B;">${stars}</div>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: var(--text-dim, #8888AA); line-height: 1.4;">${tpl.description}</div>
        <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
          <span style="font-size: 10px; padding: 2px 6px; background: var(--bg-dark, #0F0F1A); border-radius: 3px;">${tpl.category}</span>
          <span style="font-size: 10px; padding: 2px 6px; background: var(--bg-dark, #0F0F1A); border-radius: 3px;">${styleLabels[tpl.style] || tpl.style}</span>
          <span style="font-size: 10px; padding: 2px 6px; background: var(--bg-dark, #0F0F1A); border-radius: 3px;">${difficultyLabels[tpl.difficulty] || tpl.difficulty}</span>
          <span style="font-size: 10px; padding: 2px 6px; background: var(--bg-dark, #0F0F1A); border-radius: 3px; margin-left: auto;">${tpl.useCount}次</span>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 6px; border-top: 1px solid var(--border, #333355); padding-top: 8px;">
          <button class="btn-small primary" onclick="event.stopPropagation();loadTemplateToCanvas(TemplateGallery.getTemplateById('${tpl.id}'))" style="flex:1;">加载</button>
          <button class="btn-small" onclick="event.stopPropagation();TemplateGallery.downloadTemplate(TemplateGallery.getTemplateById('${tpl.id}'))">导出</button>
          <button class="btn-small" onclick="event.stopPropagation();rateTemplateFromGallery('${tpl.id}')" title="评分">⭐</button>
          <button class="btn-small" onclick="event.stopPropagation();toggleGalleryFavorite('${tpl.id}', this)" style="${tpl.isFavorite ? 'color: #EF4444;' : ''}">
            ${tpl.isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Rate template from gallery
 * @param {string} id - Template ID
 */
function rateTemplateFromGallery(id) {
  const rating = prompt('请输入评分（1-5）：', '5');
  if (!rating) return;
  
  const numRating = parseInt(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    showToast('请输入1-5之间的数字');
    return;
  }
  
  TemplateGallery.rateTemplate(id, numRating);
  showToast('评分已保存');
  
  // Re-render cards
  const templates = TemplateGallery.getTemplates(recommendUIState.currentFilters);
  renderTemplateCards(templates);
}

/**
 * Toggle favorite in gallery
 * @param {string} id - Template ID
 * @param {HTMLElement} btn - Button element
 */
function toggleGalleryFavorite(id, btn) {
  const updated = TemplateGallery.favoriteTemplate(id);
  if (btn) {
    btn.textContent = updated.isFavorite ? '❤️' : '🤍';
    btn.style.color = updated.isFavorite ? '#EF4444' : '';
  }
}

/**
 * Show recommend modal (alternative entry point)
 */
function showRecommendModal() {
  showAIRecommendPanel();
}

/**
 * Show toast notification (if not already defined)
 */
if (typeof showToast !== 'function') {
  window.showToast = function(message, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  };
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure other scripts are loaded
  setTimeout(initAIRecommendButton, 100);
});

// Export for external use
window.WorkflowRecommendUI = {
  showRecommendModal,
  renderRecommendResults,
  loadTemplateToCanvas,
  showTemplateGallery,
  renderTemplateCards,
  initAIRecommendButton,
  closeAIRecommendPanel,
  hideTemplateGallery
};
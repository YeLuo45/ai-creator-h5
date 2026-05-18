/**
 * WorkflowVersionUI - 版本管理 UI 适配器
 * 提供版本面板、版本历史、分支管理等 UI 功能
 */

// 版本管理器实例
let _workflowVersion = null;

/**
 * 初始化版本面板
 */
function initVersionPanel() {
  _workflowVersion = new WorkflowVersion();
  _workflowVersion.init().catch(err => {
    console.error('Failed to init WorkflowVersion:', err);
  });
  
  // 绑定标签页切换
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', handleTabClick);
  });
  
  // 初始化版本列表
  refreshVersionList();
}

/**
 * 处理标签页点击
 */
function handleTabClick(e) {
  const tabName = e.target.dataset.tab;
  if (!tabName) return;
  
  // 更新标签状态
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  
  // 更新内容显示
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const content = document.getElementById('tab-' + tabName);
  if (content) content.style.display = 'block';
  
  // 刷新版本列表
  if (tabName === 'versions') {
    refreshVersionList();
  }
}

/**
 * 显示版本历史侧边栏
 */
function showVersionHistory() {
  refreshVersionList();
  
  // 切换到版本标签页
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.panel-tab[data-tab="versions"]').classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const content = document.getElementById('tab-versions');
  if (content) content.style.display = 'block';
}

/**
 * 刷新版本列表
 */
async function refreshVersionList() {
  const list = document.getElementById('version-list');
  if (!list) return;
  
  if (!_workflowVersion) {
    list.innerHTML = '<div style="color:var(--text-dim);font-size:12px;text-align:center;padding:20px;">版本服务初始化中...</div>';
    return;
  }
  
  try {
    const versions = await _workflowVersion.getAllVersions(50);
    
    if (versions.length === 0) {
      list.innerHTML = '<div style="color:var(--text-dim);font-size:12px;text-align:center;padding:20px;">暂无版本记录<br>运行工作流后将自动保存版本</div>';
      return;
    }
    
    let html = '';
    versions.forEach(v => {
      const date = new Date(v.timestamp);
      const timeStr = date.toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const branchTag = v.branch !== 'main' 
        ? `<span style="font-size:10px;padding:2px 6px;background:var(--primary);border-radius:3px;margin-left:4px;">${escHtml(v.branch)}</span>` 
        : '';
      const currentTag = v.isBranch 
        ? '<span style="font-size:10px;color:var(--warning);margin-left:4px;">分支</span>' 
        : '';
      
      html += `
        <div class="version-item" data-version-id="${escHtml(v.id)}">
          <div class="version-info">
            <div class="version-name">${escHtml(v.name)}${branchTag}${currentTag}</div>
            <div class="version-time">${timeStr} · ${v.nodeCount}节点</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${escHtml(v.summary || '')}</div>
          </div>
          <div class="version-actions">
            <button class="btn-small" onclick="showVersionDiffUI('${v.id}')">对比</button>
            <button class="btn-small" onclick="rollbackToVersion('${v.id}')">回滚</button>
            <button class="btn-small" onclick="createBranchFromVersion('${v.id}')">分支</button>
          </div>
        </div>
      `;
    });
    
    list.innerHTML = html;
  } catch (err) {
    console.error('Failed to load versions:', err);
    list.innerHTML = '<div style="color:var(--error);font-size:12px;text-align:center;padding:20px;">加载版本失败</div>';
  }
}

/**
 * 显示版本对比视图
 * @param {string} versionIdA - 版本A ID
 * @param {string} versionIdB - 版本B ID（可选，默认选择第二个）
 */
async function showVersionDiff(versionIdA, versionIdB) {
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    const versionA = await _workflowVersion.getVersion(versionIdA);
    const versionB = versionIdB ? await _workflowVersion.getVersion(versionIdB) : null;
    
    if (!versionA) {
      showToast('版本不存在');
      return;
    }
    
    // 如果没有指定版本B，让用户选择
    if (!versionB) {
      showVersionSelector(versionA.id);
      return;
    }
    
    // 计算差异
    const diff = diffWorkflowVersions(versionA, versionB);
    
    // 显示差异面板
    showDiffPanel(versionA, versionB, diff);
    
  } catch (err) {
    console.error('Failed to diff versions:', err);
    showToast('对比失败');
  }
}

/**
 * 显示版本选择器（用于选择对比目标）
 */
function showVersionSelector(baseVersionId) {
  const modal = createDiffSelectorModal(baseVersionId);
  document.body.appendChild(modal);
}

/**
 * 创建版本对比选择弹窗
 */
function createDiffSelectorModal(baseVersionId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'diff-selector-modal';
  
  overlay.innerHTML = `
    <div class="modal" style="width:400px;">
      <div class="modal-header">
        <span>选择对比版本</span>
        <button class="modal-close" onclick="closeDiffSelectorModal()">×</button>
      </div>
      <div class="modal-body" style="max-height:350px;">
        <div id="diff-version-list" style="display:flex;flex-direction:column;gap:8px;">
          <div style="color:var(--text-dim);font-size:12px;text-align:center;padding:20px;">加载中...</div>
        </div>
      </div>
    </div>
  `;
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDiffSelectorModal();
  });
  
  // 加载版本列表
  loadDiffVersionList(baseVersionId);
  
  return overlay;
}

/**
 * 加载对比版本列表
 */
async function loadDiffVersionList(baseVersionId) {
  const list = document.getElementById('diff-version-list');
  if (!list || !_workflowVersion) return;
  
  try {
    const versions = await _workflowVersion.getAllVersions(50);
    const filtered = versions.filter(v => v.id !== baseVersionId);
    
    if (filtered.length === 0) {
      list.innerHTML = '<div style="color:var(--text-dim);font-size:12px;text-align:center;padding:20px;">没有其他版本可对比</div>';
      return;
    }
    
    let html = '';
    filtered.forEach(v => {
      const date = new Date(v.timestamp);
      const timeStr = date.toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      html += `
        <div class="version-item" style="cursor:pointer;" onclick="executeVersionDiff('${baseVersionId}', '${v.id}')">
          <div class="version-info">
            <div class="version-name">${escHtml(v.name)}</div>
            <div class="version-time">${timeStr}</div>
          </div>
        </div>
      `;
    });
    
    list.innerHTML = html;
  } catch (err) {
    list.innerHTML = '<div style="color:var(--error);font-size:12px;text-align:center;padding:20px;">加载失败</div>';
  }
}

/**
 * 执行版本对比
 */
function executeVersionDiff(versionIdA, versionIdB) {
  closeDiffSelectorModal();
  showVersionDiff(versionIdA, versionIdB);
}

/**
 * 关闭对比选择弹窗
 */
function closeDiffSelectorModal() {
  const modal = document.getElementById('diff-selector-modal');
  if (modal) modal.remove();
}

/**
 * 显示差异面板
 */
function showDiffPanel(versionA, versionB, diff) {
  const existing = document.getElementById('diff-panel');
  if (existing) existing.remove();
  
  const panel = document.createElement('div');
  panel.id = 'diff-panel';
  panel.className = 'diff-panel';
  panel.innerHTML = `
    <div class="diff-panel-header">
      <div class="diff-panel-title">版本对比</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div style="text-align:center;">
          <div style="font-size:11px;color:var(--text-dim);">版本A</div>
          <div style="font-size:12px;font-weight:500;">${escHtml(versionA.name)}</div>
        </div>
        <span style="color:var(--text-dim);">→</span>
        <div style="text-align:center;">
          <div style="font-size:11px;color:var(--text-dim);">版本B</div>
          <div style="font-size:12px;font-weight:500;">${escHtml(versionB.name)}</div>
        </div>
        <button class="btn-small" onclick="closeDiffPanel()" style="margin-left:16px;">关闭</button>
      </div>
    </div>
    <div class="diff-panel-stats">
      <span class="diff-stat added">+${diff.stats.nodes.added} 节点</span>
      <span class="diff-stat removed">-${diff.stats.nodes.removed} 节点</span>
      <span class="diff-stat modified">~${diff.stats.nodes.modified} 节点</span>
      <span class="diff-stat added">+${diff.stats.connections.added} 连接</span>
      <span class="diff-stat removed">-${diff.stats.connections.removed} 连接</span>
    </div>
    <div class="diff-panel-content">
      <div class="diff-section">
        <div class="diff-section-title">新增节点</div>
        <div class="diff-section-content">
          ${diff.nodes.added.length > 0 
            ? diff.nodes.added.map(n => `<div class="diff-node added">${getNodeIcon(n.type, n.subtype)} ${escHtml(n.name)}</div>`).join('')
            : '<div style="color:var(--text-dim);font-size:12px;">无</div>'
          }
        </div>
      </div>
      <div class="diff-section">
        <div class="diff-section-title">删除节点</div>
        <div class="diff-section-content">
          ${diff.nodes.removed.length > 0 
            ? diff.nodes.removed.map(n => `<div class="diff-node removed">${getNodeIcon(n.type, n.subtype)} ${escHtml(n.name)}</div>`).join('')
            : '<div style="color:var(--text-dim);font-size:12px;">无</div>'
          }
        </div>
      </div>
      <div class="diff-section">
        <div class="diff-section-title">修改节点</div>
        <div class="diff-section-content">
          ${diff.nodes.modified.length > 0 
            ? diff.nodes.modified.map(n => `<div class="diff-node modified">${getNodeIcon(n.type, n.subtype)} ${escHtml(n.name)}</div>`).join('')
            : '<div style="color:var(--text-dim);font-size:12px;">无</div>'
          }
        </div>
      </div>
      <div class="diff-section">
        <div class="diff-section-title">新增连接</div>
        <div class="diff-section-content">
          ${diff.connections.added.length > 0 
            ? diff.connections.added.map(c => `<div class="diff-conn added">${c.from} → ${c.to}</div>`).join('')
            : '<div style="color:var(--text-dim);font-size:12px;">无</div>'
          }
        </div>
      </div>
      <div class="diff-section">
        <div class="diff-section-title">删除连接</div>
        <div class="diff-section-content">
          ${diff.connections.removed.length > 0 
            ? diff.connections.removed.map(c => `<div class="diff-conn removed">${c.from} → ${c.to}</div>`).join('')
            : '<div style="color:var(--text-dim);font-size:12px;">无</div>'
          }
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // 高亮画布上的差异节点
  const canvas = document.getElementById('workflow-canvas');
  if (canvas) {
    highlightDiffNodes(canvas, diff);
  }
}

/**
 * 关闭差异面板
 */
function closeDiffPanel() {
  const panel = document.getElementById('diff-panel');
  if (panel) panel.remove();
  
  // 清除高亮
  const canvas = document.getElementById('workflow-canvas');
  if (canvas) {
    clearDiffHighlight(canvas);
  }
}

/**
 * 获取节点图标
 */
function getNodeIcon(type, subtype) {
  const icons = {
    'trigger': '⚡',
    'creator': '🎨',
    'logic': '❓',
    'output': '💾',
    'loop': '🔁',
    'subflow': '📦'
  };
  return icons[type] || '📄';
}

/**
 * 回滚到指定版本
 */
async function rollbackToVersion(versionId) {
  if (!confirm('确定要回滚到此版本？当前工作流将被替换。')) return;
  
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    const workflow = await _workflowVersion.rollback(versionId);
    
    // 更新画布
    if (typeof loadWorkflow === 'function') {
      loadWorkflow(workflow);
    }
    
    showToast('已回滚到版本');
    WorkflowLogger?.info('已回滚到版本');
    
    // 刷新版本列表
    refreshVersionList();
    
  } catch (err) {
    console.error('Rollback failed:', err);
    showToast('回滚失败: ' + err.message);
  }
}

/**
 * 从版本创建分支
 */
async function createBranchFromVersion(versionId) {
  const name = prompt('请输入分支名称:');
  if (!name || !name.trim()) return;
  
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    const branchId = await _workflowVersion.createBranch(versionId, name.trim());
    showToast('已创建分支: ' + name);
    WorkflowLogger?.info('已创建分支: ' + name);
    refreshVersionList();
    
  } catch (err) {
    console.error('Create branch failed:', err);
    showToast('创建分支失败: ' + err.message);
  }
}

/**
 * 显示分支管理面板
 */
async function showBranchPanel() {
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    const branches = await _workflowVersion.listBranches();
    renderBranchList(branches);
    openModal('branch-modal');
  } catch (err) {
    console.error('Failed to load branches:', err);
    showToast('加载分支失败');
  }
}

/**
 * 渲染分支列表
 */
function renderBranchList(branches) {
  const list = document.getElementById('branch-list');
  if (!list) return;
  
  // 添加 main 分支
  const allBranches = [
    { id: 'main', name: 'main', createdAt: 0, isMain: true },
    ...branches.filter(b => b.id !== 'main')
  ];
  
  if (allBranches.length === 0) {
    list.innerHTML = '<div style="color:var(--text-dim);font-size:12px;text-align:center;padding:20px;">暂无分支</div>';
    return;
  }
  
  let html = '';
  allBranches.forEach(b => {
    const date = b.createdAt ? new Date(b.createdAt).toLocaleString('zh-CN', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '初始';
    
    html += `
      <div class="version-item">
        <div class="version-info">
          <div class="version-name">${escHtml(b.name)} ${b.isMain ? '<span style="font-size:10px;color:var(--primary);">当前</span>' : ''}</div>
          <div class="version-time">${date}</div>
        </div>
        <div class="version-actions">
          ${!b.isMain ? `
            <button class="btn-small" onclick="switchToBranch('${b.id}')">切换</button>
            <button class="btn-small" onclick="mergeBranch('${b.id}')">合并</button>
            <button class="btn-small danger" onclick="deleteBranch('${b.id}')">删除</button>
          ` : '<span style="color:var(--text-dim);font-size:11px;">主分支</span>'}
        </div>
      </div>
    `;
  });
  
  list.innerHTML = html;
}

/**
 * 切换分支
 */
async function switchToBranch(branchId) {
  if (!confirm('切换分支将加载该分支的最新版本，确定继续？')) return;
  
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    const workflow = await _workflowVersion.switchBranch(branchId);
    
    if (typeof loadWorkflow === 'function') {
      loadWorkflow(workflow);
    }
    
    closeModal('branch-modal');
    showToast('已切换到分支');
    WorkflowLogger?.info('已切换到分支');
    
  } catch (err) {
    console.error('Switch branch failed:', err);
    showToast('切换分支失败: ' + err.message);
  }
}

/**
 * 合并分支
 */
async function mergeBranch(branchId) {
  if (!confirm('确定要合并此分支到当前分支？')) return;
  
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    const workflow = await _workflowVersion.merge(branchId, 'main');
    
    if (typeof loadWorkflow === 'function') {
      loadWorkflow(workflow);
    }
    
    closeModal('branch-modal');
    showToast('已合并分支');
    WorkflowLogger?.info('已合并分支');
    refreshVersionList();
    
  } catch (err) {
    console.error('Merge branch failed:', err);
    showToast('合并分支失败: ' + err.message);
  }
}

/**
 * 删除分支
 */
async function deleteBranch(branchId) {
  if (!confirm('确定要删除此分支？此操作不可撤销。')) return;
  
  if (!_workflowVersion) {
    console.error('Version service not initialized');
    return;
  }
  
  try {
    await _workflowVersion.deleteBranch(branchId);
    showToast('已删除分支');
    WorkflowLogger?.info('已删除分支');
    renderBranchList(await _workflowVersion.listBranches());
    
  } catch (err) {
    console.error('Delete branch failed:', err);
    showToast('删除分支失败: ' + err.message);
  }
}

/**
 * 显示回滚确认弹窗
 */
function showRollbackConfirm(versionId) {
  rollbackToVersion(versionId);
}

/**
 * 保存版本时自动调用
 */
async function autoSaveVersion(workflow, metadata = {}) {
  if (!_workflowVersion) return;
  
  try {
    await _workflowVersion.saveVersion(workflow, {
      name: metadata.name || workflow.name || '自动保存',
      summary: metadata.summary || '',
      author: 'local'
    });
    refreshVersionList();
  } catch (err) {
    console.error('Auto save version failed:', err);
  }
}

/**
 * 显示版本对比 UI（供外部调用）
 */
function showVersionDiffUI(versionId) {
  showVersionDiff(versionId);
}

// ============ 辅助函数 ============

function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============ 样式注入 ============
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Diff Panel */
    .diff-panel {
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 500px;
      max-height: 400px;
      overflow: hidden;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    
    .diff-panel-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .diff-panel-title {
      font-size: 14px;
      font-weight: 600;
    }
    
    .diff-panel-stats {
      padding: 8px 16px;
      background: var(--bg-dark);
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
    }
    
    .diff-stat {
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .diff-stat.added {
      background: rgba(16, 185, 129, 0.2);
      color: var(--success);
    }
    
    .diff-stat.removed {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error);
    }
    
    .diff-stat.modified {
      background: rgba(245, 158, 11, 0.2);
      color: var(--warning);
    }
    
    .diff-panel-content {
      padding: 12px 16px;
      max-height: 280px;
      overflow-y: auto;
    }
    
    .diff-section {
      margin-bottom: 12px;
    }
    
    .diff-section-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-dim);
      margin-bottom: 6px;
    }
    
    .diff-section-content {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .diff-node, .diff-conn {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .diff-node.added, .diff-conn.added {
      background: rgba(16, 185, 129, 0.2);
      color: var(--success);
    }
    
    .diff-node.removed, .diff-conn.removed {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error);
    }
    
    .diff-node.modified {
      background: rgba(245, 158, 11, 0.2);
      color: var(--warning);
    }
    
    /* Canvas Diff Highlights */
    .diff-highlight {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5) !important;
    }
    
    .diff-added {
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.5) !important;
    }
    
    .diff-removed {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.5) !important;
      opacity: 0.6;
    }
    
    .diff-modified {
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.5) !important;
    }
  `;
  document.head.appendChild(style);
})();

// 导出
window.initVersionPanel = initVersionPanel;
window.showVersionHistory = showVersionHistory;
window.refreshVersionList = refreshVersionList;
window.showVersionDiff = showVersionDiff;
window.showVersionDiffUI = showVersionDiffUI;
window.showRollbackConfirm = showRollbackConfirm;
window.showBranchPanel = showBranchPanel;
window.renderBranchList = renderBranchList;
window.showMergeConfirm = function(branchId) { mergeBranch(branchId); };
window.rollbackToVersion = rollbackToVersion;
window.createBranchFromVersion = createBranchFromVersion;
window.switchToBranch = switchToBranch;
window.mergeBranch = mergeBranch;
window.deleteBranch = deleteBranch;
window.autoSaveVersion = autoSaveVersion;
window.closeDiffPanel = closeDiffPanel;
window.executeVersionDiff = executeVersionDiff;
window.closeDiffSelectorModal = closeDiffSelectorModal;
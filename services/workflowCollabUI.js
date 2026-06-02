/**
 * WorkflowCollabUI - 协作 UI 适配器
 * 负责协作功能的 UI 渲染和交互
 */

// 全局实例
let workflowShare = null;
let workflowCollab = null;
let workflowAudit = null;

/**
 * 初始化协作面板
 */
function initCollabPanel() {
  // 初始化服务
  workflowShare = new WorkflowShare();
  workflowCollab = new WorkflowCollab();
  workflowAudit = new WorkflowAudit();

  // 读取当前用户名
  const savedName = localStorage.getItem('workflow_user_name');
  if (!savedName) {
    const defaultName = '用户_' + Math.random().toString(36).slice(2, 6);
    localStorage.setItem('workflow_user_name', defaultName);
  }

  // 注册协作事件回调
  workflowCollab.onUserJoin(handleUserJoin);
  workflowCollab.onUserLeave(handleUserLeave);
  workflowCollab.onNodeLocked(handleNodeLocked);

  // 添加用户离开回调
  workflowCollab.onUserLeave(handleUserLeave);

  // 添加节点解锁回调
  if (typeof workflowCollab._addCallback === 'function') {
    workflowCollab._addCallback('nodeUnlocked', handleNodeUnlocked);
  }

  // 加入当前工作流协作会话
  joinCurrentSession();
}

/**
 * 加入当前工作流的协作会话
 */
function joinCurrentSession() {
  const workflowId = state.workflow.id || 'local_' + location.pathname;
  const userId = localStorage.getItem('workflow_current_user') || 'user_default';
  const userName = localStorage.getItem('workflow_user_name') || '匿名用户';

  workflowCollab.joinSession(workflowId, userId, userName);
  workflowAudit.log(workflowId, userId, userName, 'join_session', { action: '加入协作会话' });

  // 更新在线用户显示
  updateCollabStatus(workflowCollab.getActiveUsers(workflowId));
}

/**
 * 显示分享弹窗
 */
function showShareModal() {
  const modal = document.getElementById('share-modal');
  if (!modal) return;

  const workflowId = state.workflow.id || 'local';
  const userId = localStorage.getItem('workflow_current_user');
  const shares = workflowShare.getShareList(workflowId);

  // 渲染分享列表
  renderShareList(shares);

  modal.classList.add('active');
}

/**
 * 渲染分享列表
 * @param {Array} shares - 分享列表
 */
function renderShareList(shares) {
  const listEl = document.getElementById('share-list');
  if (!listEl) return;

  if (shares.length === 0) {
    listEl.innerHTML = '<div class="empty-share">暂无分享链接</div>';
    return;
  }

  let html = '';
  shares.forEach(share => {
    const isExpired = share.expiresAt > 0 && Date.now() > share.expiresAt;
    const expiresText = share.expiresAt > 0 
      ? (isExpired ? '已过期' : '剩余 ' + formatDuration(share.expiresAt - Date.now()))
      : '永不过期';

    html += `
      <div class="share-item" data-share-id="${share.id}">
        <div class="share-info">
          <div class="share-permission">${share.permission === 'edit' ? '可编辑' : '仅查看'}</div>
          <div class="share-meta">
            <span class="share-expires ${isExpired ? 'expired' : ''}">${expiresText}</span>
          </div>
        </div>
        <div class="share-actions">
          <button class="btn-small" onclick="copyShareLink('${share.token}')">复制链接</button>
          <button class="btn-small danger" onclick="revokeShare('${share.id}')">撤销</button>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

/**
 * 生成分享链接
 * @param {string} permission - 权限级别
 */
function generateShareLink(permission = 'view') {
  const workflowId = state.workflow.id || 'local_' + Date.now();
  const userId = localStorage.getItem('workflow_current_user');
  const userName = localStorage.getItem('workflow_user_name');

  // 7天有效期
  const expiresIn = 7 * 24 * 60 * 60 * 1000;
  const token = workflowShare.generateShareLink(workflowId, permission, expiresIn);

  // 构建分享 URL
  const shareUrl = location.origin + location.pathname + '?share=' + token;

  // 记录审计日志
  workflowAudit.log(workflowId, userId, userName, 'share', { permission, expiresIn });

  return shareUrl;
}

/**
 * 复制分享链接
 * @param {string} token - 分享令牌
 */
function copyShareLink(token) {
  const shareUrl = location.origin + location.pathname + '?share=' + token;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('分享链接已复制到剪贴板');
    });
  } else {
    // 降级处理
    const textarea = document.createElement('textarea');
    textarea.value = shareUrl;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('分享链接已复制到剪贴板');
  }
}

/**
 * 撤销分享
 * @param {string} shareId - 分享ID
 */
function revokeShare(shareId) {
  const workflowId = state.workflow.id || 'local';
  const userId = localStorage.getItem('workflow_current_user');
  const userName = localStorage.getItem('workflow_user_name');

  if (workflowShare.revokeShare(shareId)) {
    workflowAudit.log(workflowId, userId, userName, 'revoke_share', { shareId });
    showToast('分享已撤销');
    
    // 刷新分享列表
    const shares = workflowShare.getShareList(workflowId);
    renderShareList(shares);
  }
}

/**
 * 处理分享链接访问
 */
function handleShareLinkAccess() {
  const params = new URLSearchParams(location.search);
  const token = params.get('share');

  if (!token) return;

  const share = workflowShare.validateShareToken(token);
  if (!share) {
    showToast('分享链接已过期或无效');
    return;
  }

  // 显示提示
  showToast(`以${share.permission === 'edit' ? '可编辑' : '仅查看'}权限打开`);

  // 记录审计日志
  const userId = localStorage.getItem('workflow_current_user');
  const userName = localStorage.getItem('workflow_user_name');
  workflowAudit.log(share.workflowId, userId, userName, 'share_access', { shareId: share.id });
}

/**
 * 更新协作状态栏
 * @param {Array} users - 在线用户列表
 */
function updateCollabStatus(users) {
  renderActiveUsers(users);
  updatePermissionUI();
}

/**
 * 渲染在线用户
 * @param {Array} users - 用户列表
 */
function renderActiveUsers(users) {
  let statusBar = document.getElementById('collab-status-bar');
  
  // 如果不存在则创建
  if (!statusBar) {
    statusBar = document.createElement('div');
    statusBar.id = 'collab-status-bar';
    statusBar.className = 'collab-status-bar';
    
    // 插入到工具栏和画布之间
    const container = document.querySelector('.workflow-container');
    if (container) {
      container.insertBefore(statusBar, container.children[2]);
    }
  }

  // 更新用户列表
  const existingUsers = statusBar.querySelector('.collab-users');
  if (!existingUsers) {
    const usersEl = document.createElement('div');
    usersEl.className = 'collab-users';
    statusBar.appendChild(usersEl);
  }

  const usersContainer = statusBar.querySelector('.collab-users');
  usersContainer.innerHTML = users.map(user => `
    <div class="collab-user" title="${user.userName}">
      <span class="collab-user-avatar">${user.userName.charAt(0)}</span>
      <span class="collab-user-name">${user.userName}</span>
    </div>
  `).join('');

  // 更新在线人数
  let countEl = statusBar.querySelector('.collab-count');
  if (!countEl) {
    countEl = document.createElement('span');
    countEl.className = 'collab-count';
    statusBar.appendChild(countEl);
  }
  countEl.textContent = users.length + ' 人在线';
}

/**
 * 显示节点锁定
 * @param {string} nodeId - 节点ID
 * @param {string} userName - 锁定者用户名
 */
function showNodeLocked(nodeId, userName) {
  const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (!nodeEl) return;

  // 添加锁定样式
  nodeEl.classList.add('locked');
  
  // 添加锁定指示器
  let lockIndicator = nodeEl.querySelector('.node-lock-indicator');
  if (!lockIndicator) {
    lockIndicator = document.createElement('div');
    lockIndicator.className = 'node-lock-indicator';
    nodeEl.querySelector('.node-header').appendChild(lockIndicator);
  }
  lockIndicator.innerHTML = '🔒';
  lockIndicator.title = `被 ${userName} 锁定`;
}

/**
 * 显示节点解锁
 * @param {string} nodeId - 节点ID
 */
function showNodeUnlock(nodeId) {
  const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (!nodeEl) return;

  nodeEl.classList.remove('locked');
  
  const lockIndicator = nodeEl.querySelector('.node-lock-indicator');
  if (lockIndicator) {
    lockIndicator.remove();
  }
}

/**
 * 显示审计面板
 */
function showAuditPanel() {
  const panel = document.getElementById('audit-panel');
  if (!panel) return;

  const workflowId = state.workflow.id || 'local';
  const logs = workflowAudit.getAuditLogs(workflowId, 50);
  
  renderAuditLogs(logs);
  panel.classList.add('active');
}

/**
 * 渲染审计日志
 * @param {Array} logs - 日志列表
 */
function renderAuditLogs(logs) {
  const listEl = document.getElementById('audit-log-list');
  if (!listEl) return;

  if (logs.length === 0) {
    listEl.innerHTML = '<div class="empty-audit">暂无审计日志</div>';
    return;
  }

  const actionTypes = workflowAudit.getActionTypes();

  let html = '';
  logs.forEach(log => {
    const actionInfo = actionTypes.find(a => a.type === log.action) || { icon: '📋', label: log.action };
    const timeStr = new Date(log.timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    html += `
      <div class="audit-log-item">
        <div class="audit-log-icon">${actionInfo.icon}</div>
        <div class="audit-log-content">
          <div class="audit-log-action">${actionInfo.label}</div>
          <div class="audit-log-meta">
            <span class="audit-log-user">${log.userName}</span>
            <span class="audit-log-time">${timeStr}</span>
          </div>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

/**
 * 根据权限应用 UI
 * @param {string} permission - 权限级别
 */
function applyPermissionUI(permission) {
  const isEdit = permission === 'edit' || permission === 'owner';
  const isOwner = permission === 'owner';

  // 禁用/启用编辑相关的按钮
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    // 这里可以添加更细粒度的权限控制
  });

  // 如果只是查看权限，显示提示
  if (permission === 'view') {
    showToast('当前为查看权限，无法编辑');
  }
}

/**
 * 更新权限 UI
 */
function updatePermissionUI() {
  const workflowId = state.workflow.id || 'local';
  const userId = localStorage.getItem('workflow_current_user');
  
  const permission = workflowShare.getPermissionLevel(workflowId, userId);
  if (permission) {
    applyPermissionUI(permission);
  }
}

/**
 * 用户加入处理
 * @param {Object} data - 事件数据
 */
function handleUserJoin(data) {
  const workflowId = state.workflow.id || 'local';
  if (data.workflowId !== workflowId) return;

  showToast(`${data.userName} 加入了协作`);
  updateCollabStatus(workflowCollab.getActiveUsers(workflowId));
}

/**
 * 用户离开处理
 * @param {Object} data - 事件数据
 */
function handleUserLeave(data) {
  const workflowId = state.workflow.id || 'local';
  if (data.workflowId !== workflowId) return;

  showToast(`${data.userName} 离开了协作`);
  updateCollabStatus(workflowCollab.getActiveUsers(workflowId));
}

/**
 * 节点锁定处理
 * @param {Object} data - 事件数据
 */
function handleNodeLocked(data) {
  showNodeLocked(data.nodeId, data.userName);
}

/**
 * 节点解锁处理
 * @param {Object} data - 事件数据
 */
function handleNodeUnlocked(data) {
  showNodeUnlock(data.nodeId);
}

/**
 * 格式化时长
 * @param {number} ms - 毫秒
 * @returns {string}
 */
function formatDuration(ms) {
  if (!ms || ms <= 0) return '0秒';
  if (ms < 60000) return Math.round(ms / 1000) + '秒';
  if (ms < 3600000) return Math.round(ms / 60000) + '分钟';
  return Math.round(ms / 3600000) + '小时';
}

// 添加协作相关的样式到页面
function injectCollabStyles() {
  const styleId = 'collab-ui-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* 协作状态栏 */
    .collab-status-bar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      background: linear-gradient(90deg, var(--bg-panel), rgba(99, 102, 241, 0.1));
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      height: 32px;
    }

    .collab-users {
      display: flex;
      gap: 8px;
    }

    .collab-user {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: var(--bg-node);
      border-radius: 12px;
      cursor: default;
    }

    .collab-user-avatar {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }

    .collab-user-name {
      color: var(--text);
      font-size: 11px;
    }

    .collab-count {
      margin-left: auto;
      color: var(--text-dim);
      font-size: 11px;
    }

    /* 节点锁定样式 */
    .workflow-node.locked {
      border-color: var(--warning) !important;
      opacity: 0.8;
    }

    .workflow-node.locked::before {
      content: '';
      position: absolute;
      inset: -4px;
      border: 2px dashed var(--warning);
      border-radius: 10px;
      pointer-events: none;
    }

    .node-lock-indicator {
      position: absolute;
      top: -6px;
      right: -6px;
      font-size: 12px;
      z-index: 10;
    }

    /* 分享列表样式 */
    .share-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .share-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: var(--bg-node);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .share-permission {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .share-meta {
      font-size: 11px;
      color: var(--text-dim);
    }

    .share-expires.expired {
      color: var(--error);
    }

    .share-actions {
      display: flex;
      gap: 8px;
    }

    .empty-share {
      text-align: center;
      padding: 20px;
      color: var(--text-dim);
      font-size: 12px;
    }

    /* 审计面板样式 */
    .audit-panel {
      position: fixed;
      top: 0;
      right: -360px;
      width: 360px;
      height: 100vh;
      background: var(--bg-panel);
      border-left: 1px solid var(--border);
      z-index: 1001;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .audit-panel.active {
      right: 0;
    }

    .audit-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }

    .audit-panel-title {
      font-weight: 600;
      font-size: 14px;
    }

    .audit-panel-close {
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 18px;
    }

    .audit-log-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .audit-log-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      border-bottom: 1px solid var(--border);
    }

    .audit-log-icon {
      font-size: 16px;
      width: 24px;
      text-align: center;
    }

    .audit-log-action {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .audit-log-meta {
      font-size: 11px;
      color: var(--text-dim);
      display: flex;
      gap: 8px;
    }

    .empty-audit {
      text-align: center;
      padding: 40px;
      color: var(--text-dim);
      font-size: 12px;
    }

    /* 分享弹窗样式增强 */
    .share-link-box {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .share-link-input {
      flex: 1;
      padding: 10px 12px;
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 13px;
    }

    .permission-select {
      padding: 10px 12px;
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 13px;
      min-width: 100px;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

// 导出
window.initCollabPanel = initCollabPanel;
window.showShareModal = showShareModal;
window.renderShareList = renderShareList;
window.updateCollabStatus = updateCollabStatus;
window.renderActiveUsers = renderActiveUsers;
window.showNodeLocked = showNodeLocked;
window.showNodeUnlock = showNodeUnlock;
window.showAuditPanel = showAuditPanel;
window.renderAuditLogs = renderAuditLogs;
window.applyPermissionUI = applyPermissionUI;
window.injectCollabStyles = injectCollabStyles;
window.copyShareLink = copyShareLink;
window.revokeShare = revokeShare;
window.generateShareLink = generateShareLink;
window.handleShareLinkAccess = handleShareLinkAccess;
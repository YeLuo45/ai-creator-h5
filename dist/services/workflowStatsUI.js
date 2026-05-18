/**
 * WorkflowStatsUI - 统计 UI 适配器
 * 负责渲染统计面板、历史记录面板等 UI 组件
 */
const WorkflowStatsUI = {
  statsPanelVisible: false,
  historyPanelVisible: false,

  // 初始化统计面板
  initStatsPanel() {
    // 创建统计面板 DOM 结构
    const statsPanel = document.createElement('div');
    statsPanel.id = 'stats-panel';
    statsPanel.className = 'stats-panel';
    statsPanel.innerHTML = `
      <div class="stats-header">
        <span>📊 性能统计</span>
        <button class="stats-close" onclick="WorkflowStatsUI.hideStatsPanel()">×</button>
      </div>
      <div class="stats-content" id="stats-content">
        <div class="stats-placeholder">运行工作流后查看统计数据</div>
      </div>
    `;
    document.body.appendChild(statsPanel);
    
    // 添加样式
    this.addStyles();
  },

  // 添加样式
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Stats Panel */
      .stats-panel {
        position: fixed;
        bottom: 50px;
        right: 16px;
        width: 360px;
        max-height: 400px;
        background: var(--bg-panel, #1A1A2E);
        border: 1px solid var(--border, #333355);
        border-radius: 12px;
        display: none;
        flex-direction: column;
        z-index: 500;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      }
      
      .stats-panel.visible {
        display: flex;
      }
      
      .stats-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border, #333355);
        font-weight: 600;
        font-size: 14px;
      }
      
      .stats-close {
        background: none;
        border: none;
        color: var(--text-dim, #8888AA);
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .stats-close:hover {
        color: var(--text, #E0E0FF);
      }
      
      .stats-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      
      .stats-placeholder {
        text-align: center;
        color: var(--text-dim, #8888AA);
        font-size: 13px;
        padding: 24px;
      }
      
      /* Stats Cards */
      .stats-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .stats-card {
        background: var(--bg-node, #252542);
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      }
      
      .stats-card-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--primary, #6366F1);
      }
      
      .stats-card-label {
        font-size: 11px;
        color: var(--text-dim, #8888AA);
        margin-top: 4px;
      }
      
      .stats-card.highlight {
        border: 1px solid var(--primary, #6366F1);
      }
      
      .stats-card.success .stats-card-value { color: var(--success, #10B981); }
      .stats-card.error .stats-card-value { color: var(--error, #EF4444); }
      .stats-card.warning .stats-card-value { color: var(--warning, #F59E0B); }
      
      /* Node Ranking */
      .stats-section-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-dim, #8888AA);
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      
      .node-ranking {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .ranking-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: var(--bg-node, #252542);
        border-radius: 6px;
      }
      
      .ranking-position {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--bg-dark, #0F0F1A);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
      }
      
      .ranking-position.p1 { background: #FFD700; color: #000; }
      .ranking-position.p2 { background: #C0C0C0; color: #000; }
      .ranking-position.p3 { background: #CD7F32; color: #000; }
      
      .ranking-name {
        flex: 1;
        font-size: 12px;
      }
      
      .ranking-duration {
        font-size: 12px;
        font-weight: 500;
        font-family: monospace;
      }
      
      .ranking-bar {
        height: 3px;
        background: var(--bg-dark, #0F0F1A);
        border-radius: 2px;
        margin-top: 4px;
        overflow: hidden;
      }
      
      .ranking-bar-fill {
        height: 100%;
        background: var(--primary, #6366F1);
        transition: width 0.3s;
      }
      
      /* ASCII Trend Chart */
      .trend-chart {
        font-family: monospace;
        font-size: 11px;
        background: var(--bg-dark, #0F0F1A);
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        white-space: pre;
        line-height: 1.4;
      }
      
      .trend-label {
        color: var(--text-dim, #8888AA);
        margin-bottom: 8px;
        font-size: 11px;
      }
      
      /* History Panel */
      .history-panel {
        position: fixed;
        top: 56px;
        right: 0;
        width: 400px;
        height: calc(100vh - 96px);
        background: var(--bg-panel, #1A1A2E);
        border-left: 1px solid var(--border, #333355);
        display: none;
        flex-direction: column;
        z-index: 400;
      }
      
      .history-panel.visible {
        display: flex;
      }
      
      .history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border, #333355);
        font-weight: 600;
        font-size: 14px;
      }
      
      .history-actions {
        display: flex;
        gap: 8px;
      }
      
      .history-close {
        background: none;
        border: none;
        color: var(--text-dim, #8888AA);
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .history-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      
      .history-empty {
        text-align: center;
        color: var(--text-dim, #8888AA);
        font-size: 13px;
        padding: 40px;
      }
      
      .history-item {
        background: var(--bg-node, #252542);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: border-color 0.2s;
        border: 1px solid transparent;
      }
      
      .history-item:hover {
        border-color: var(--primary, #6366F1);
      }
      
      .history-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .history-item-name {
        font-weight: 500;
        font-size: 13px;
      }
      
      .history-item-status {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
      }
      
      .history-item-status.completed {
        background: rgba(16, 185, 129, 0.2);
        color: var(--success, #10B981);
      }
      
      .history-item-status.error {
        background: rgba(239, 68, 68, 0.2);
        color: var(--error, #EF4444);
      }
      
      .history-item-status.stopped {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning, #F59E0B);
      }
      
      .history-item-meta {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: var(--text-dim, #8888AA);
      }
      
      .history-item-actions {
        display: flex;
        gap: 6px;
        margin-top: 10px;
      }
      
      .btn-tiny {
        padding: 4px 10px;
        font-size: 11px;
        border-radius: 4px;
        border: 1px solid var(--border, #333355);
        background: transparent;
        color: var(--text, #E0E0FF);
        cursor: pointer;
      }
      
      .btn-tiny:hover {
        background: var(--bg-dark, #0F0F1A);
      }
      
      .btn-tiny.primary {
        background: var(--primary, #6366F1);
        border-color: var(--primary, #6366F1);
      }
      
      /* Real-time Status Bar */
      .realtime-status-bar {
        display: none;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        background: linear-gradient(90deg, var(--bg-panel, #1A1A2E), var(--bg-dark, #0F0F1A));
        border-bottom: 1px solid var(--border, #333355);
        font-size: 12px;
      }
      
      .realtime-status-bar.visible {
        display: flex;
      }
      
      .realtime-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .realtime-label {
        color: var(--text-dim, #8888AA);
      }
      
      .realtime-value {
        font-weight: 500;
      }
      
      .realtime-progress {
        flex: 1;
        height: 4px;
        background: var(--bg-dark, #0F0F1A);
        border-radius: 2px;
        overflow: hidden;
        max-width: 200px;
      }
      
      .realtime-progress-fill {
        height: 100%;
        background: var(--primary, #6366F1);
        transition: width 0.3s;
      }
      
      .realtime-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }
      
      .realtime-badge.idle { background: rgba(16, 185, 129, 0.2); color: var(--success, #10B981); }
      .realtime-badge.running { background: rgba(245, 158, 11, 0.2); color: var(--warning, #F59E0B); }
      .realtime-badge.paused { background: rgba(99, 102, 241, 0.2); color: var(--primary, #6366F1); }
      .realtime-badge.completed { background: rgba(16, 185, 129, 0.2); color: var(--success, #10B981); }
      .realtime-badge.error { background: rgba(239, 68, 68, 0.2); color: var(--error, #EF4444); }
    `;
    document.head.appendChild(style);
  },

  // 显示执行统计
  async showExecutionStats() {
    const stats = WorkflowMonitor.getOverallStats();
    const historyStats = await WorkflowHistory.getStats();
    const nodeStats = WorkflowMonitor.getNodeStats();
    
    const content = document.getElementById('stats-content');
    if (!content) return;
    
    const duration = WorkflowMonitor.stats.elapsedTime || 0;
    const durationStr = this.formatDuration(duration);
    const avgStr = this.formatDuration(stats.avgDuration);
    
    content.innerHTML = `
      <div class="stats-cards">
        <div class="stats-card highlight">
          <div class="stats-card-value">${historyStats.total}</div>
          <div class="stats-card-label">总执行次数</div>
        </div>
        <div class="stats-card success">
          <div class="stats-card-value">${historyStats.successRate}%</div>
          <div class="stats-card-label">成功率</div>
        </div>
        <div class="stats-card warning">
          <div class="stats-card-value">${durationStr}</div>
          <div class="stats-card-label">本次耗时</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${avgStr}</div>
          <div class="stats-card-label">平均耗时</div>
        </div>
      </div>
      
      ${nodeStats.length > 0 ? `
        <div class="stats-section-title">⏱️ 节点耗时排行</div>
        ${this.renderNodeRanking(nodeStats)}
      ` : ''}
      
      <div style="margin-top: 16px;">
        <button class="btn-tiny primary" onclick="WorkflowStatsUI.hideStatsPanel()" style="width:100%;">
          关闭
        </button>
      </div>
    `;
    
    this.statsPanelVisible = true;
    document.getElementById('stats-panel').classList.add('visible');
  },

  // 渲染节点耗时排行榜
  renderNodeRanking(nodeStats) {
    if (!nodeStats || nodeStats.length === 0) {
      return '<div style="color:var(--text-dim);font-size:12px;text-align:center;">暂无数据</div>';
    }
    
    const maxDuration = Math.max(...nodeStats.map(n => n.duration || 0));
    
    const items = nodeStats.slice(0, 5).map((stat, index) => {
      const percent = maxDuration > 0 ? ((stat.duration || 0) / maxDuration * 100) : 0;
      const posClass = index === 0 ? 'p1' : index === 1 ? 'p2' : index === 2 ? 'p3' : '';
      const durationStr = this.formatDuration(stat.duration || 0);
      
      return `
        <div class="ranking-item">
          <div class="ranking-position ${posClass}">${index + 1}</div>
          <div style="flex:1;">
            <div class="ranking-name">${this.escHtml(stat.name || stat.subtype || '未知')}</div>
            <div class="ranking-bar">
              <div class="ranking-bar-fill" style="width:${percent}%"></div>
            </div>
          </div>
          <div class="ranking-duration">${durationStr}</div>
        </div>
      `;
    }).join('');
    
    return `<div class="node-ranking">${items}</div>`;
  },

  // 渲染简易 ASCII 趋势图
  renderTrendChart(history) {
    if (!history || history.length === 0) {
      return '<div class="trend-chart">暂无趋势数据</div>';
    }
    
    const recent = history.slice(0, 20).reverse();
    const maxDuration = Math.max(...recent.map(r => r.totalDuration || 0));
    const minDuration = Math.min(...recent.map(r => r.totalDuration || 0));
    const range = maxDuration - minDuration || 1;
    
    const rows = 5;
    let chart = '';
    
    for (let i = rows; i >= 0; i--) {
      const threshold = minDuration + (range * i / rows);
      let row = '  ';
      for (const r of recent) {
        const h = Math.floor(((r.totalDuration || 0) - minDuration) / range * (rows + 1));
        if (h >= i) {
          row += '█';
        } else if (h === i - 1) {
          row += '▄';
        } else {
          row += ' ';
        }
      }
      chart += row + ' ' + this.formatDuration(threshold) + '\n';
    }
    
    const labels = recent.map((r, i) => i % 4 === 0 ? (i + 1) + '' : ' ').join('');
    
    return `
      <div class="trend-label">最近 ${recent.length} 次执行趋势 (时长)</div>
      <div class="trend-chart">${chart}${labels}</div>
    `;
  },

  // 显示/隐藏统计面板
  showStatsPanel() {
    this.showExecutionStats();
  },

  hideStatsPanel() {
    this.statsPanelVisible = false;
    document.getElementById('stats-panel')?.classList.remove('visible');
  },

  // 显示历史记录面板
  async showHistoryPanel() {
    const panel = document.getElementById('history-panel');
    if (!panel) {
      this.createHistoryPanel();
    }
    
    await this.loadHistoryList();
    this.historyPanelVisible = true;
    document.getElementById('history-panel').classList.add('visible');
  },

  hideHistoryPanel() {
    this.historyPanelVisible = false;
    document.getElementById('history-panel')?.classList.remove('visible');
  },

  // 创建历史记录面板
  createHistoryPanel() {
    const panel = document.createElement('div');
    panel.id = 'history-panel';
    panel.className = 'history-panel';
    panel.innerHTML = `
      <div class="history-header">
        <span>📋 执行历史</span>
        <div class="history-actions">
          <button class="btn-tiny" onclick="WorkflowStatsUI.loadHistoryList()">刷新</button>
          <button class="history-close" onclick="WorkflowStatsUI.hideHistoryPanel()">×</button>
        </div>
      </div>
      <div class="history-list" id="history-list">
        <div class="history-empty">加载中...</div>
      </div>
    `;
    document.body.appendChild(panel);
  },

  // 加载历史记录列表
  async loadHistoryList() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    try {
      const records = await WorkflowHistory.getExecutionHistory(50);
      this.renderHistoryList(records);
    } catch (e) {
      console.error('Failed to load history:', e);
      list.innerHTML = '<div class="history-empty">加载失败</div>';
    }
  },

  // 渲染历史记录列表
  renderHistoryList(records) {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    if (!records || records.length === 0) {
      list.innerHTML = '<div class="history-empty">暂无执行记录</div>';
      return;
    }
    
    list.innerHTML = records.map(record => {
      const time = this.formatTime(record.timestamp);
      const duration = this.formatDuration(record.totalDuration || 0);
      const nodeCount = record.nodeStats?.length || 0;
      const statusText = record.status === 'completed' ? '成功' : record.status === 'error' ? '失败' : '停止';
      
      return `
        <div class="history-item" onclick="WorkflowStatsUI.showHistoryDetail(${record.id})">
          <div class="history-item-header">
            <span class="history-item-name">${this.escHtml(record.workflowName || '未命名')}</span>
            <span class="history-item-status ${record.status}">${statusText}</span>
          </div>
          <div class="history-item-meta">
            <span>⏱️ ${duration}</span>
            <span>📊 ${nodeCount} 节点</span>
            <span>🕐 ${time}</span>
          </div>
          <div class="history-item-actions">
            <button class="btn-tiny primary" onclick="event.stopPropagation();WorkflowStatsUI.retryFromHistory(${record.id})">
              重新执行
            </button>
            <button class="btn-tiny" onclick="event.stopPropagation();WorkflowStatsUI.deleteHistoryItem(${record.id})">
              删除
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // 显示历史详情
  async showHistoryDetail(id) {
    const record = await WorkflowHistory.getExecutionById(id);
    if (!record) return;
    
    const content = document.getElementById('stats-content');
    if (!content) return;
    
    const nodeStats = record.nodeStats || [];
    const statusText = record.status === 'completed' ? '成功' : record.status === 'error' ? '失败' : '停止';
    const statusClass = record.status === 'completed' ? 'success' : record.status === 'error' ? 'error' : 'warning';
    
    content.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="font-weight:600;font-size:14px;">${this.escHtml(record.workflowName || '未命名')}</span>
          <span class="history-item-status ${record.status}">${statusText}</span>
        </div>
        <div style="font-size:12px;color:var(--text-dim);">
          <div>总耗时: ${this.formatDuration(record.totalDuration || 0)}</div>
          <div>节点数: ${nodeStats.length}</div>
          <div>执行时间: ${this.formatDate(record.timestamp)}</div>
        </div>
      </div>
      
      ${nodeStats.length > 0 ? `
        <div class="stats-section-title">节点详情</div>
        ${this.renderNodeRanking(nodeStats)}
      ` : ''}
      
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="btn-tiny primary" onclick="WorkflowStatsUI.retryFromHistory(${id})" style="flex:1;">
          重新执行
        </button>
        <button class="btn-tiny" onclick="WorkflowStatsUI.showExecutionStats()" style="flex:1;">
          返回
        </button>
      </div>
    `;
    
    this.statsPanelVisible = true;
    document.getElementById('stats-panel').classList.add('visible');
  },

  // 从历史重新执行
  async retryFromHistory(id) {
    try {
      const { workflow, record } = await WorkflowHistory.retryExecution(id);
      
      // 加载工作流
      if (typeof loadWorkflow === 'function') {
        loadWorkflow(workflow);
      }
      
      // 如果有统计面板打开则关闭
      this.hideStatsPanel();
      this.hideHistoryPanel();
      
      // 自动运行
      setTimeout(() => {
        runWorkflow();
      }, 500);
    } catch (e) {
      console.error('Retry failed:', e);
      showToast('重新执行失败: ' + e.message);
    }
  },

  // 删除历史记录项
  async deleteHistoryItem(id) {
    if (!confirm('确定删除此记录？')) return;
    
    try {
      await WorkflowHistory.deleteExecution(id);
      this.loadHistoryList();
      showToast('已删除');
    } catch (e) {
      console.error('Delete failed:', e);
      showToast('删除失败');
    }
  },

  // 工具方法：格式化时长
  formatDuration(ms) {
    if (!ms || ms <= 0) return '0ms';
    if (ms < 1000) return Math.round(ms) + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    return (ms / 60000).toFixed(1) + 'm';
  },

  // 工具方法：格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  },

  // 工具方法：格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 工具方法：HTML转义
  escHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

// 导出
window.WorkflowStatsUI = WorkflowStatsUI;
/**
 * WorkflowAudit - 审计日志服务
 * 记录所有用户操作到 localStorage
 */
class WorkflowAudit {
  constructor() {
    this.LOG_KEY = 'workflow_audit_logs';
    this.MAX_LOGS = 1000;
  }

  /**
   * 记录审计日志
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @param {string} userName - 用户名
   * @param {string} action - 操作类型
   * @param {Object} details - 详细信息
   */
  log(workflowId, userId, userName, action, details = {}) {
    const log = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      workflowId,
      userId,
      userName,
      action,
      details,
      timestamp: Date.now()
    };

    const logs = this._getLogs();
    logs.unshift(log); // 添加到开头

    // 限制最大数量
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }

    this._saveLogs(logs);
    return log.id;
  }

  /**
   * 获取审计日志
   * @param {string} workflowId - 工作流ID
   * @param {number} limit - 最大数量
   * @param {Object} filter - 过滤条件
   * @returns {Array} 日志列表
   */
  getAuditLogs(workflowId, limit = 100, filter = {}) {
    let logs = this._getLogs().filter(log => log.workflowId === workflowId);

    // 应用过滤
    if (filter.userId) {
      logs = logs.filter(log => log.userId === filter.userId);
    }
    if (filter.action) {
      logs = logs.filter(log => log.action === filter.action);
    }
    if (filter.startTime) {
      logs = logs.filter(log => log.timestamp >= filter.startTime);
    }
    if (filter.endTime) {
      logs = logs.filter(log => log.timestamp <= filter.endTime);
    }

    // 限制返回数量
    return logs.slice(0, limit);
  }

  /**
   * 清理旧日志
   * @param {string} workflowId - 工作流ID
   * @param {number} maxCount - 最大保留数量
   */
  clearOldLogs(workflowId, maxCount = 100) {
    const logs = this._getLogs();
    const filtered = logs.filter(log => log.workflowId !== workflowId);
    
    // 按时间排序，保留最新的
    const wfLogs = logs
      .filter(log => log.workflowId === workflowId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxCount);

    this._saveLogs([...filtered, ...wfLogs]);
  }

  /**
   * 导出日志
   * @param {string} workflowId - 工作流ID
   * @returns {string} JSON 字符串
   */
  exportLogs(workflowId) {
    const logs = this.getAuditLogs(workflowId, this.MAX_LOGS);
    
    const exportData = {
      workflowId,
      exportedAt: Date.now(),
      exportTime: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        ...log,
        time: new Date(log.timestamp).toISOString()
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 下载审计日志
   * @param {string} workflowId - 工作流ID
   */
  downloadLogs(workflowId) {
    const json = this.exportLogs(workflowId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${workflowId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 清除所有日志（谨慎使用）
   */
  clearAllLogs() {
    localStorage.removeItem(this.LOG_KEY);
  }

  /**
   * 获取日志统计
   * @param {string} workflowId - 工作流ID
   * @returns {Object} 统计信息
   */
  getStats(workflowId) {
    const logs = this._getLogs().filter(log => log.workflowId === workflowId);
    
    const stats = {
      total: logs.length,
      byAction: {},
      byUser: {},
      firstLog: null,
      lastLog: null
    };

    logs.forEach(log => {
      // 按操作类型统计
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // 按用户统计
      stats.byUser[log.userId] = stats.byUser[log.userId] || { name: log.userName, count: 0 };
      stats.byUser[log.userId].count++;
    });

    if (logs.length > 0) {
      stats.firstLog = logs[logs.length - 1];
      stats.lastLog = logs[0];
    }

    return stats;
  }

  /**
   * 获取操作类型列表
   * @returns {Array}
   */
  getActionTypes() {
    return [
      { type: 'create', label: '创建', icon: '➕' },
      { type: 'update', label: '更新', icon: '✏️' },
      { type: 'delete', label: '删除', icon: '🗑️' },
      { type: 'run', label: '运行', icon: '▶️' },
      { type: 'pause', label: '暂停', icon: '⏸' },
      { type: 'stop', label: '停止', icon: '⏹' },
      { type: 'share', label: '分享', icon: '🔗' },
      { type: 'revoke_share', label: '撤销分享', icon: '🔗' },
      { type: 'lock_node', label: '锁定节点', icon: '🔒' },
      { type: 'unlock_node', label: '解锁节点', icon: '🔓' },
      { type: 'join_session', label: '加入协作', icon: '👤' },
      { type: 'leave_session', label: '离开协作', icon: '👤' },
      { type: 'save', label: '保存', icon: '💾' },
      { type: 'export', label: '导出', icon: '📤' },
      { type: 'import', label: '导入', icon: '📥' }
    ];
  }

  /**
   * 获取日志列表
   * @returns {Array}
   */
  _getLogs() {
    try {
      return JSON.parse(localStorage.getItem(this.LOG_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存日志列表
   * @param {Array} logs
   */
  _saveLogs(logs) {
    localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
  }

  /**
   * 获取当前用户ID
   * @returns {string}
   */
  _getCurrentUserId() {
    let user = localStorage.getItem('workflow_current_user');
    if (!user) {
      user = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('workflow_current_user', user);
    }
    return user;
  }

  /**
   * 获取当前用户名
   * @returns {string}
   */
  _getCurrentUserName() {
    return localStorage.getItem('workflow_user_name') || '未知用户';
  }
}

// 操作类型常量
const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RUN: 'run',
  PAUSE: 'pause',
  STOP: 'stop',
  SHARE: 'share',
  REVOKE_SHARE: 'revoke_share',
  LOCK_NODE: 'lock_node',
  UNLOCK_NODE: 'unlock_node',
  JOIN_SESSION: 'join_session',
  LEAVE_SESSION: 'leave_session',
  SAVE: 'save',
  EXPORT: 'export',
  IMPORT: 'import'
};

// 导出
window.WorkflowAudit = WorkflowAudit;
window.AUDIT_ACTIONS = AUDIT_ACTIONS;
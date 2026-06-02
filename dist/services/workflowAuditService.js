/**
 * WorkflowAuditService - 增强审计日志服务 v22
 * 完整审计日志 who/what/when、分类、搜索/导出、可疑告警
 */
class WorkflowAuditService {
  constructor() {
    this.LOG_KEY = 'workflow_audit_logs_v22';
    this.MAX_LOGS = 2000;
    
    // 日志类别
    this.CATEGORIES = {
      OPERATION: 'operation',   // 操作日志
      ACCESS: 'access',         // 访问日志
      PERMISSION: 'permission', // 权限日志
      SYSTEM: 'system'          // 系统日志
    };
    
    // 可疑操作模式
    this.SUSPICIOUS_PATTERNS = [
      { pattern: /failed.*login|登录失败/i, weight: 3, description: '多次登录失败' },
      { pattern: /permission.*denied|权限.*拒绝/i, weight: 2, description: '权限访问被拒绝' },
      { pattern: /delete.*workflow|删除.*工作流/i, weight: 4, description: '删除工作流操作' },
      { pattern: /share.*link|分享.*链接/i, weight: 2, description: '分享链接操作' },
      { pattern: /export.*data|导出.*数据/i, weight: 2, description: '数据导出操作' },
      { pattern: /role.*change|角色.*变更/i, weight: 5, description: '权限角色变更' },
      { pattern: /bulk.*delete|批量.*删除/i, weight: 4, description: '批量删除操作' },
      { pattern: /offline.*modify|离线.*修改/i, weight: 1, description: '离线修改' },
      { pattern: /api.*key|api.*密钥/i, weight: 3, description: 'API密钥访问' },
      { pattern: /admin.*action|管理员.*操作/i, weight: 3, description: '管理员操作' }
    ];
  }

  /**
   * 初始化
   */
  init() {
    console.log('[WorkflowAuditService] Initialized');
  }

  /**
   * 记录日志
   * @param {Object} params
   */
  log({ workflowId, userId, userName, action, details = {}, category = 'operation' }) {
    const log = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      workflowId: workflowId || 'global',
      userId: userId || this._getCurrentUserId(),
      userName: userName || this._getCurrentUserName(),
      action,
      details,
      category,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: new Date().toTimeString().slice(0, 8)
    };

    // 检测可疑操作
    log.suspicious = this._detectSuspicious(log);
    if (log.suspicious) {
      log.suspiciousAlert = true;
    }

    const logs = this._getLogs();
    logs.unshift(log);

    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }

    this._saveLogs(logs);
    
    // 触发可疑告警事件
    if (log.suspiciousAlert) {
      this._dispatchAlert(log);
    }

    return log.id;
  }

  /**
   * 检测可疑操作
   */
  _detectSuspicious(log) {
    const searchText = `${log.action} ${JSON.stringify(log.details)}`.toLowerCase();
    
    for (const item of this.SUSPICIOUS_PATTERNS) {
      if (item.pattern.test(searchText)) {
        return {
          pattern: item.description,
          weight: item.weight,
          matched: item.pattern.source
        };
      }
    }
    
    return null;
  }

  /**
   * 发送告警事件
   */
  _dispatchAlert(log) {
    document.dispatchEvent(new CustomEvent('auditSuspiciousAlert', {
      detail: { log }
    }));
  }

  /**
   * 获取日志（支持搜索和过滤）
   * @param {Object} params
   */
  getLogs({ workflowId, userId, action, category, startTime, endTime, search, limit = 100, offset = 0 }) {
    let logs = this._getLogs();

    // 应用过滤
    if (workflowId) {
      logs = logs.filter(l => l.workflowId === workflowId);
    }
    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }
    if (action) {
      logs = logs.filter(l => l.action === action);
    }
    if (category) {
      logs = logs.filter(l => l.category === category);
    }
    if (startTime) {
      logs = logs.filter(l => l.timestamp >= startTime);
    }
    if (endTime) {
      logs = logs.filter(l => l.timestamp <= endTime);
    }
    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter(l => 
        l.action.toLowerCase().includes(s) ||
        l.userName.toLowerCase().includes(s) ||
        JSON.stringify(l.details).toLowerCase().includes(s)
      );
    }

    // 分页
    const total = logs.length;
    const paged = logs.slice(offset, offset + limit);

    return { logs: paged, total, offset, limit };
  }

  /**
   * 获取可疑日志
   */
  getSuspiciousLogs({ workflowId, startTime, endTime, limit = 50 } = {}) {
    let logs = this._getLogs().filter(l => l.suspiciousAlert);
    
    if (workflowId) {
      logs = logs.filter(l => l.workflowId === workflowId);
    }
    if (startTime) {
      logs = logs.filter(l => l.timestamp >= startTime);
    }
    if (endTime) {
      logs = logs.filter(l => l.timestamp <= endTime);
    }
    
    // 按可疑权重排序
    logs.sort((a, b) => (b.suspicious?.weight || 0) - (a.suspicious?.weight || 0));
    
    return logs.slice(0, limit);
  }

  /**
   * 获取统计数据
   */
  getStats({ workflowId, startTime, endTime } = {}) {
    let logs = this._getLogs();
    
    if (workflowId) {
      logs = logs.filter(l => l.workflowId === workflowId);
    }
    if (startTime) {
      logs = logs.filter(l => l.timestamp >= startTime);
    }
    if (endTime) {
      logs = logs.filter(l => l.timestamp <= endTime);
    }

    const stats = {
      total: logs.length,
      byCategory: {},
      byAction: {},
      byUser: {},
      byDay: {},
      suspiciousCount: 0,
      firstLog: null,
      lastLog: null
    };

    logs.forEach(log => {
      // 按类别统计
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      // 按操作统计
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // 按用户统计
      if (!stats.byUser[log.userId]) {
        stats.byUser[log.userId] = { name: log.userName, count: 0 };
      }
      stats.byUser[log.userId].count++;
      
      // 按日期统计
      stats.byDay[log.dateStr] = (stats.byDay[log.dateStr] || 0) + 1;
      
      // 可疑数量
      if (log.suspiciousAlert) {
        stats.suspiciousCount++;
      }
    });

    if (logs.length > 0) {
      stats.firstLog = logs[logs.length - 1];
      stats.lastLog = logs[0];
    }

    return stats;
  }

  /**
   * 获取操作类型列表
   */
  getActionTypes() {
    return [
      // 操作类
      { type: 'create', label: '创建', icon: '➕', category: 'operation' },
      { type: 'update', label: '更新', icon: '✏️', category: 'operation' },
      { type: 'delete', label: '删除', icon: '🗑️', category: 'operation' },
      { type: 'save', label: '保存', icon: '💾', category: 'operation' },
      { type: 'export', label: '导出', icon: '📤', category: 'operation' },
      { type: 'import', label: '导入', icon: '📥', category: 'operation' },
      { type: 'run', label: '运行', icon: '▶️', category: 'operation' },
      { type: 'pause', label: '暂停', icon: '⏸', category: 'operation' },
      { type: 'stop', label: '停止', icon: '⏹', category: 'operation' },
      
      // 访问类
      { type: 'view', label: '查看', icon: '👁️', category: 'access' },
      { type: 'share', label: '分享', icon: '🔗', category: 'access' },
      { type: 'login', label: '登录', icon: '🔐', category: 'access' },
      { type: 'logout', label: '登出', icon: '🔒', category: 'access' },
      
      // 权限类
      { type: 'role_assign', label: '分配角色', icon: '👤', category: 'permission' },
      { type: 'role_change', label: '角色变更', icon: '🔄', category: 'permission' },
      { type: 'permission_grant', label: '授予权限', icon: '✅', category: 'permission' },
      { type: 'permission_revoke', label: '撤销权限', icon: '❌', category: 'permission' },
      { type: 'permission_request', label: '申请权限', icon: '📝', category: 'permission' },
      { type: 'permission_approve', label: '审批权限', icon: '👍', category: 'permission' },
      { type: 'permission_reject', label: '拒绝权限', icon: '👎', category: 'permission' },
      { type: 'node_permission', label: '节点权限', icon: '🔐', category: 'permission' },
      { type: 'inheritance_change', label: '继承变更', icon: '🔗', category: 'permission' },
      
      // 系统类
      { type: 'error', label: '错误', icon: '❗', category: 'system' },
      { type: 'warning', label: '警告', icon: '⚠️', category: 'system' },
      { type: 'sync', label: '同步', icon: '🔄', category: 'system' },
      { type: 'offline_edit', label: '离线编辑', icon: '📴', category: 'system' }
    ];
  }

  /**
   * 导出日志
   * @param {Object} filters - 过滤条件
   * @param {string} format - 导出格式 (json, csv, txt)
   */
  exportLogs(filters = {}, format = 'json') {
    const { logs } = this.getLogs({ ...filters, limit: this.MAX_LOGS });
    
    if (format === 'json') {
      return this._exportJSON(logs);
    } else if (format === 'csv') {
      return this._exportCSV(logs);
    } else if (format === 'txt') {
      return this._exportTXT(logs);
    }
    
    return null;
  }

  /**
   * 导出JSON
   */
  _exportJSON(logs) {
    const data = {
      exportedAt: Date.now(),
      exportTime: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(l => ({
        ...l,
        time: new Date(l.timestamp).toISOString()
      }))
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出CSV
   */
  _exportCSV(logs) {
    const headers = ['时间', '用户', '操作', '类别', '详情', '工作流ID', '可疑'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.action,
      l.category,
      JSON.stringify(l.details).slice(0, 100),
      l.workflowId,
      l.suspiciousAlert ? '是' : '否'
    ]);
    
    return [headers, ...rows].map(r => r.join(',')).join('\n');
  }

  /**
   * 导出TXT
   */
  _exportTXT(logs) {
    return logs.map(l => {
      let line = `[${new Date(l.timestamp).toLocaleString()}] `;
      line += `${l.userName} - ${l.action}`;
      if (l.suspiciousAlert) line += ' [⚠️可疑]';
      line += `\n  详情: ${JSON.stringify(l.details)}`;
      return line;
    }).join('\n\n');
  }

  /**
   * 下载导出文件
   */
  downloadExport(filters = {}, format = 'json') {
    const content = this.exportLogs(filters, format);
    if (!content) return false;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    return true;
  }

  /**
   * 清除日志
   */
  clearLogs(workflowId = null) {
    if (workflowId) {
      const logs = this._getLogs().filter(l => l.workflowId !== workflowId);
      this._saveLogs(logs);
    } else {
      localStorage.removeItem(this.LOG_KEY);
    }
  }

  /**
   * 获取日志
   */
  _getLogs() {
    try {
      return JSON.parse(localStorage.getItem(this.LOG_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存日志
   */
  _saveLogs(logs) {
    localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
  }

  /**
   * 获取当前用户ID
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
   */
  _getCurrentUserName() {
    return localStorage.getItem('workflow_user_name') || '未知用户';
  }
}

// 审计日志类别
const AUDIT_CATEGORIES = {
  OPERATION: 'operation',
  ACCESS: 'access',
  PERMISSION: 'permission',
  SYSTEM: 'system'
};

// 审计操作类型
const AUDIT_ACTIONS_V2 = {
  // 操作
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SAVE: 'save',
  EXPORT: 'export',
  IMPORT: 'import',
  RUN: 'run',
  PAUSE: 'pause',
  STOP: 'stop',
  
  // 访问
  VIEW: 'view',
  SHARE: 'share',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // 权限
  ROLE_ASSIGN: 'role_assign',
  ROLE_CHANGE: 'role_change',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_REVOKE: 'permission_revoke',
  PERMISSION_REQUEST: 'permission_request',
  PERMISSION_APPROVE: 'permission_approve',
  PERMISSION_REJECT: 'permission_reject',
  NODE_PERMISSION: 'node_permission',
  INHERITANCE_CHANGE: 'inheritance_change',
  
  // 系统
  ERROR: 'error',
  WARNING: 'warning',
  SYNC: 'sync',
  OFFLINE_EDIT: 'offline_edit'
};

// 导出
window.WorkflowAuditService = WorkflowAuditService;
window.AUDIT_CATEGORIES = AUDIT_CATEGORIES;
window.AUDIT_ACTIONS_V2 = AUDIT_ACTIONS_V2;

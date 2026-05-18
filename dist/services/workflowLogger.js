/**
 * Workflow Logger Service
 * 执行日志服务 - 记录节点执行历史、时间线日志
 */
const WorkflowLogger = {
  logs: [],
  maxLogs: 500,
  subscribers: [],

  // 订阅日志变化
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  },

  // 发布日志更新
  publish(logs) {
    this.subscribers.forEach(cb => cb(logs));
  },

  // 记录日志
  log(level, message, nodeId = null, duration = null) {
    const entry = {
      id: 'log-' + Date.now() + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      level, // 'info' | 'success' | 'warning' | 'error'
      message,
      nodeId,
      duration
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.publish(this.logs);
    return entry;
  },

  // 便捷方法
  info(message, nodeId) { return this.log('info', message, nodeId); },
  success(message, nodeId, duration) { return this.log('success', message, nodeId, duration); },
  warning(message, nodeId) { return this.log('warning', message, nodeId); },
  error(message, nodeId) { return this.log('error', message, nodeId); },

  // 清除日志
  clear() {
    this.logs = [];
    this.publish(this.logs);
  },

  // 获取日志
  getLogs() {
    return [...this.logs];
  },

  // 筛选日志
  filterLogs({ level = null, nodeId = null, search = '' } = {}) {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (nodeId && log.nodeId !== nodeId) return false;
      if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  },

  // 导出日志（JSON）
  exportLogs() {
    const data = {
      exportTime: new Date().toISOString(),
      logs: this.logs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

/**
 * Workflow Version Manager
 * 工作流版本管理 - 保存/加载/对比/回滚
 */
const WorkflowVersionManager = {
  STORAGE_KEY: 'workflow_versions',
  MAX_VERSIONS: 10,

  // 获取所有版本
  getVersions() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 保存版本
  saveVersion(workflow, name = null) {
    const versions = this.getVersions();
    
    const version = {
      id: 'v' + Date.now(),
      name: name || `版本 ${versions.length + 1}`,
      createdAt: Date.now(),
      nodeCount: workflow.nodes.length,
      connectionCount: workflow.connections.length,
      workflow: JSON.parse(JSON.stringify(workflow)) // 深拷贝
    };

    versions.unshift(version);

    // 限制版本数量
    if (versions.length > this.MAX_VERSIONS) {
      versions.splice(this.MAX_VERSIONS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
    return version;
  },

  // 加载版本
  loadVersion(id) {
    const versions = this.getVersions();
    const version = versions.find(v => v.id === id);
    return version ? version.workflow : null;
  },

  // 删除版本
  deleteVersion(id) {
    const versions = this.getVersions().filter(v => v.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
  },

  // 对比两个版本
  compareVersions(id1, id2) {
    const versions = this.getVersions();
    const v1 = versions.find(v => v.id === id1);
    const v2 = versions.find(v => v.id === id2);
    
    if (!v1 || !v2) return null;

    const diff = {
      added: [],
      removed: [],
      modified: []
    };

    // 节点差异
    const nodes1 = new Map(v1.workflow.nodes.map(n => [n.id, n]));
    const nodes2 = new Map(v2.workflow.nodes.map(n => [n.id, n]));

    for (const [id, node] of nodes2) {
      if (!nodes1.has(id)) {
        diff.added.push(node);
      } else {
        const n1 = nodes1.get(id);
        if (JSON.stringify(n1) !== JSON.stringify(node)) {
          diff.modified.push({ from: n1, to: node });
        }
      }
    }

    for (const [id] of nodes1) {
      if (!nodes2.has(id)) {
        diff.removed.push(nodes1.get(id));
      }
    }

    return diff;
  },

  // 清除所有版本
  clearVersions() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

/**
 * Workflow Execution History
 * 执行历史记录
 */
const WorkflowExecutionHistory = {
  STORAGE_KEY: 'workflow_exec_history',
  MAX_HISTORY: 20,

  // 记录执行
  record(execution) {
    const history = this.getHistory();
    
    history.unshift({
      id: 'exec-' + Date.now(),
      timestamp: Date.now(),
      duration: execution.duration || 0,
      nodeCount: execution.nodeCount || 0,
      successCount: execution.successCount || 0,
      failCount: execution.failCount || 0,
      status: execution.status || 'completed'
    });

    // 限制历史数量
    while (history.length > this.MAX_HISTORY) {
      history.pop();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  },

  // 获取历史
  getHistory() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 清除历史
  clearHistory() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};
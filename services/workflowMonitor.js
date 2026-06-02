/**
 * WorkflowMonitor - 执行监控服务
 * 订阅 workflowEngine 事件，提供实时状态统计
 */
const WorkflowMonitor = {
  isActive: false,
  subscribers: [],
  stats: {
    currentNode: null,
    currentNodeName: '',
    progress: 0,
    elapsedTime: 0,
    estimatedTime: 0,
    status: 'idle', // idle, running, paused, completed, error
    totalNodes: 0,
    completedNodes: 0,
    failedNodes: 0,
    nodeStats: {}, // { nodeId: { name, startTime, endTime, duration, status } }
    startTime: null,
    endTime: null
  },
  timerInterval: null,

  // 节点复杂度系数
  nodeComplexity: {
    simple: 0.1,    // IO/赋值
    medium: 0.3,    // API调用
    complex: 0.8   // AI生成/渲染
  },

  // 订阅状态变化
  subscribe(callback) {
    this.subscribers.push(callback);
  },

  // 发布状态变化
  publish(event, data) {
    this.subscribers.forEach(cb => cb(event, data));
  },

  // 获取节点复杂度
  getNodeComplexity(nodeType) {
    const type = nodeType || '';
    if (type.includes('character') || type.includes('music') || type.includes('poster')) {
      return this.nodeComplexity.complex;
    }
    if (type.includes('tts') || type.includes('loop') || type.includes('condition')) {
      return this.nodeComplexity.medium;
    }
    return this.nodeComplexity.simple;
  },

  // 开始监控
  startMonitor() {
    if (this.isActive) return;
    this.isActive = true;
    this.resetStats();
    this.startTimer();
    this.publish('monitorStart', this.stats);
  },

  // 停止监控
  stopMonitor() {
    if (!this.isActive) return;
    this.isActive = false;
    this.stopTimer();
    this.stats.status = 'idle';
    this.publish('monitorStop', this.stats);
  },

  // 暂停监控
  pauseMonitor() {
    if (!this.isActive) return;
    this.stats.status = 'paused';
    this.stopTimer();
    this.publish('monitorPause', this.stats);
  },

  // 恢复监控
  resumeMonitor() {
    if (!this.isActive) return;
    this.stats.status = 'running';
    this.startTimer();
    this.publish('monitorResume', this.stats);
  },

  // 重置统计
  resetStats() {
    this.stats = {
      currentNode: null,
      currentNodeName: '',
      progress: 0,
      elapsedTime: 0,
      estimatedTime: 0,
      status: 'idle',
      totalNodes: 0,
      completedNodes: 0,
      failedNodes: 0,
      nodeStats: {},
      startTime: null,
      endTime: null
    };
  },

  // 启动计时器
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.stats.status === 'running' && this.stats.startTime) {
        this.stats.elapsedTime = Date.now() - this.stats.startTime;
        // 估算剩余时间
        if (this.stats.progress > 0) {
          const totalEstimated = this.stats.elapsedTime / (this.stats.progress / 100);
          this.stats.estimatedTime = Math.max(0, totalEstimated - this.stats.elapsedTime);
        }
        this.publish('timeUpdate', this.stats);
      }
    }, 100);
  },

  // 停止计时器
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  // 处理 workflowEngine 事件
  handleEngineEvent(event, data) {
    switch (event) {
      case 'status':
        this.handleStatusChange(data);
        break;
      case 'nodeStart':
        this.handleNodeStart(data);
        break;
      case 'nodeComplete':
        this.handleNodeComplete(data);
        break;
      case 'complete':
        this.handleComplete(data);
        break;
      case 'error':
        this.handleError(data);
        break;
      case 'log':
        // 忽略日志事件
        break;
    }
  },

  // 处理状态变化
  handleStatusChange(data) {
    if (data.running && !data.paused) {
      // 运行中
      if (this.stats.status !== 'running') {
        this.stats.status = 'running';
        if (!this.stats.startTime) {
          this.stats.startTime = Date.now();
        }
      }
    } else if (data.running && data.paused) {
      // 暂停
      this.stats.status = 'paused';
    } else {
      // 停止
      this.stats.status = data.running ? 'paused' : 'idle';
    }
    this.publish('statusChange', this.stats);
  },

  // 处理节点开始
  handleNodeStart(data) {
    const { nodeId, node } = data;
    this.stats.currentNode = nodeId;
    this.stats.currentNodeName = node.name || node.subtype || nodeId;
    this.stats.nodeStats[nodeId] = {
      name: this.stats.currentNodeName,
      subtype: node.subtype,
      type: node.type,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      status: 'running'
    };
    this.publish('nodeStart', this.stats);
  },

  // 处理节点完成
  handleNodeComplete(data) {
    const { nodeId, result } = data;
    const nodeStat = this.stats.nodeStats[nodeId];
    if (nodeStat) {
      nodeStat.endTime = Date.now();
      nodeStat.duration = nodeStat.endTime - nodeStat.startTime;
      nodeStat.status = result.success ? 'completed' : 'error';
      if (!result.success) {
        this.stats.failedNodes++;
      } else {
        this.stats.completedNodes++;
      }
    }
    
    // 更新进度
    this.stats.currentNode = null;
    this.stats.currentNodeName = '';
    if (this.stats.totalNodes > 0) {
      this.stats.progress = Math.round((this.stats.completedNodes / this.stats.totalNodes) * 100);
    }
    
    this.publish('nodeComplete', this.stats);
  },

  // 处理工作流完成
  handleComplete(data) {
    this.stats.status = 'completed';
    this.stats.endTime = Date.now();
    this.stats.progress = 100;
    this.stats.currentNode = null;
    this.stats.currentNodeName = '';
    if (this.stats.startTime) {
      this.stats.elapsedTime = this.stats.endTime - this.stats.startTime;
    }
    this.stopTimer();
    this.publish('complete', this.stats);
  },

  // 处理错误
  handleError(data) {
    this.stats.status = 'error';
    this.stats.endTime = Date.now();
    this.stopTimer();
    this.publish('error', this.stats);
  },

  // 初始化（设置总节点数）
  initTotalNodes(total) {
    this.stats.totalNodes = total;
    this.stats.progress = 0;
  },

  // 获取节点耗时统计
  getNodeStats() {
    return Object.values(this.stats.nodeStats).sort((a, b) => {
      return (b.duration || 0) - (a.duration || 0);
    });
  },

  // 获取整体性能统计
  getOverallStats() {
    const nodeStats = this.getNodeStats();
    const totalDuration = nodeStats.reduce((sum, n) => sum + (n.duration || 0), 0);
    const avgDuration = nodeStats.length > 0 ? totalDuration / nodeStats.length : 0;
    
    return {
      totalExecutions: storage.get('wf_total_executions', 0),
      successCount: storage.get('wf_success_count', 0),
      failedCount: storage.get('wf_failed_count', 0),
      avgDuration: avgDuration,
      totalDuration: totalDuration,
      nodeStats: nodeStats
    };
  },

  // 更新历史统计
  updateHistoryStats(success) {
    const total = storage.get('wf_total_executions', 0) + 1;
    storage.set('wf_total_executions', total);
    if (success) {
      storage.set('wf_success_count', storage.get('wf_success_count', 0) + 1);
    } else {
      storage.set('wf_failed_count', storage.get('wf_failed_count', 0) + 1);
    }
  }
};

// 订阅 workflowEngine 事件
WorkflowEngine.subscribe((event, data) => {
  WorkflowMonitor.handleEngineEvent(event, data);
});

// 导出
window.WorkflowMonitor = WorkflowMonitor;
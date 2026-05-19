/**
 * Execution Tracer Service v11
 * 执行轨迹服务 - 记录工作流执行路径用于回放和高亮
 */
class ExecutionTracer {
  constructor() {
    this.isTracing = false;
    this.workflowId = null;
    this.trace = []; // { index, nodeId, variables, output, timestamp, status }
    this.executionPath = []; // 按执行顺序排列的节点ID列表
    this.listeners = {
      traceUpdate: []
    };
  }

  // 轨迹记录
  startTrace(workflowId) {
    this.stopTrace();
    this.workflowId = workflowId;
    this.isTracing = true;
    this.trace = [];
    this.executionPath = [];
    console.log('[Tracer] Started tracing workflow:', workflowId);
  }

  stopTrace() {
    if (this.isTracing) {
      this.isTracing = false;
      console.log('[Tracer] Stopped tracing, recorded', this.trace.length, 'steps');
    }
  }

  recordStep(nodeId, variables = {}, output = null, status = 'completed') {
    if (!this.isTracing) return;

    const step = {
      index: this.trace.length,
      nodeId,
      variables: JSON.parse(JSON.stringify(variables)), // 深拷贝
      output: output ? JSON.parse(JSON.stringify(output)) : null,
      timestamp: Date.now(),
      status
    };

    this.trace.push(step);
    
    // 更新执行路径
    if (!this.executionPath.includes(nodeId)) {
      this.executionPath.push(nodeId);
    }

    this._emit('traceUpdate', { step, total: this.trace.length });
  }

  // 轨迹回放
  getTrace() {
    return [...this.trace];
  }

  getTraceByNode(nodeId) {
    return this.trace.filter(s => s.nodeId === nodeId);
  }

  replay(startIndex = 0, endIndex = null) {
    if (this.trace.length === 0) {
      console.warn('[Tracer] No trace to replay');
      return;
    }

    const end = endIndex !== null ? endIndex : this.trace.length - 1;
    const steps = this.trace.slice(startIndex, end + 1);

    console.log('[Tracer] Replaying steps', startIndex, 'to', end);
    return steps;
  }

  clearTrace() {
    this.trace = [];
    this.executionPath = [];
    console.log('[Tracer] Trace cleared');
  }

  // 轨迹可视化
  getExecutionPath() {
    return [...this.executionPath];
  }

  getConnectionHighlights() {
    // 返回需要高亮的连接线
    const highlights = [];
    
    for (let i = 0; i < this.executionPath.length - 1; i++) {
      const from = this.executionPath[i];
      const to = this.executionPath[i + 1];
      highlights.push({ from, to });
    }
    
    return highlights;
  }

  getNodeExecutionCount() {
    const counts = {};
    this.trace.forEach(step => {
      counts[step.nodeId] = (counts[step.nodeId] || 0) + 1;
    });
    return counts;
  }

  // 统计信息
  getStats() {
    return {
      totalSteps: this.trace.length,
      uniqueNodes: this.executionPath.length,
      duration: this.trace.length > 0 
        ? this.trace[this.trace.length - 1].timestamp - this.trace[0].timestamp 
        : 0,
      nodeExecutionCounts: this.getNodeExecutionCount()
    };
  }

  // 事件监听
  onTraceUpdate(callback) {
    this.listeners.traceUpdate.push(callback);
  }

  _emit(event, data) {
    this.listeners.traceUpdate.forEach(cb => cb(data));
  }
}

// 导出
window.ExecutionTracer = ExecutionTracer;
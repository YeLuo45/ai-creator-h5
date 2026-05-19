/**
 * Workflow Debugger Service v11
 * 高级调试与断点管理
 */
class WorkflowDebugger {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
    this.breakpoints = new Map(); // nodeId -> { condition, enabled }
    this.status = 'idle'; // idle, running, paused, stepping
    this.stepMode = null; // null, 'over', 'into', 'out'
    this.currentBreakpointHit = null;
    this.listeners = {
      breakpointHit: [],
      pause: [],
      resume: [],
      statusChange: []
    };

    // 监听引擎事件
    if (workflowEngine) {
      workflowEngine.subscribe((event, data) => {
        this._handleEngineEvent(event, data);
      });
    }
  }

  // 断点管理
  addBreakpoint(nodeId, condition = null) {
    this.breakpoints.set(nodeId, { condition, enabled: true });
    this._emit('statusChange', { type: 'breakpointAdded', nodeId });
  }

  removeBreakpoint(nodeId) {
    if (this.breakpoints.has(nodeId)) {
      this.breakpoints.delete(nodeId);
      this._emit('statusChange', { type: 'breakpointRemoved', nodeId });
    }
  }

  toggleBreakpoint(nodeId) {
    const bp = this.breakpoints.get(nodeId);
    if (bp) {
      bp.enabled = !bp.enabled;
      this._emit('statusChange', { type: 'breakpointToggled', nodeId, enabled: bp.enabled });
    }
  }

  getBreakpoints() {
    return Array.from(this.breakpoints.entries()).map(([nodeId, data]) => ({
      nodeId,
      condition: data.condition,
      enabled: data.enabled
    }));
  }

  hasBreakpoint(nodeId) {
    return this.breakpoints.has(nodeId) && this.breakpoints.get(nodeId).enabled;
  }

  // 调试控制
  pause() {
    if (this.workflowEngine && this.workflowEngine.isRunning) {
      this.workflowEngine.pause();
      this.status = 'paused';
      this._emit('pause', { nodeId: this.workflowEngine.currentNodeId });
    }
  }

  resume() {
    if (this.workflowEngine && this.workflowEngine.isPaused) {
      this.workflowEngine.resume();
      this.status = 'running';
      this.currentBreakpointHit = null;
      this._emit('resume', {});
    }
  }

  stepOver() {
    if (this.status !== 'paused') return;
    this.stepMode = 'over';
    this.resume();
  }

  stepInto() {
    if (this.status !== 'paused') return;
    this.stepMode = 'into';
    this.resume();
  }

  stepOut() {
    if (this.status !== 'paused') return;
    this.stepMode = 'out';
    this.resume();
  }

  stop() {
    if (this.workflowEngine) {
      this.workflowEngine.stop();
    }
    this.status = 'idle';
    this.stepMode = null;
    this.currentBreakpointHit = null;
    this._emit('statusChange', { type: 'stopped' });
  }

  // 状态
  getStatus() {
    return {
      status: this.status,
      stepMode: this.stepMode,
      currentNodeId: this.workflowEngine?.currentNodeId || null,
      breakpoints: this.getBreakpoints()
    };
  }

  isPaused() {
    return this.status === 'paused';
  }

  // 条件求值
  evaluateCondition(expr, context = {}) {
    if (!expr || typeof expr !== 'string') return true;
    
    try {
      // 安全求值 - 只允许简单的比较和逻辑运算
      const allowedGlobals = {
        Math,
        Date,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object,
        RegExp,
        Error,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        typeof: (v) => typeof v
      };
      
      // 构建函数体
      const varNames = Object.keys(context);
      const varValues = Object.values(context);
      const func = new Function(...varNames, ...Object.keys(allowedGlobals), 
        `return (${expr})`);
      
      return func(...varValues, ...Object.values(allowedGlobals));
    } catch (error) {
      console.warn('[Debugger] Condition evaluation error:', error);
      return true; // 出错时默认继续
    }
  }

  // 事件监听
  onBreakpointHit(callback) {
    this.listeners.breakpointHit.push(callback);
  }

  onPause(callback) {
    this.listeners.pause.push(callback);
  }

  onResume(callback) {
    this.listeners.resume.push(callback);
  }

  onStatusChange(callback) {
    this.listeners.statusChange.push(callback);
  }

  _emit(event, data) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(cb => cb(data));
  }

  // 内部事件处理
  _handleEngineEvent(event, data) {
    switch (event) {
      case 'nodeStart':
        this._onNodeStart(data);
        break;
      case 'status':
        if (data.paused) {
          this.status = 'paused';
          this._emit('pause', { nodeId: this.workflowEngine.currentNodeId });
        } else if (data.running) {
          this.status = 'running';
        } else {
          this.status = 'idle';
        }
        break;
    }
  }

  _onNodeStart(data) {
    const { nodeId } = data;
    
    // 检查断点
    if (this.hasBreakpoint(nodeId)) {
      const bp = this.breakpoints.get(nodeId);
      
      // 如果有条件，先求值条件
      if (bp.condition) {
        const shouldPause = this.evaluateCondition(bp.condition, {
          nodeId,
          node: data.node,
          variables: this._getContextVariables()
        });
        
        if (!shouldPause) {
          return; // 条件不满足，不暂停
        }
      }
      
      // 命中断点
      this.pause();
      this.currentBreakpointHit = nodeId;
      this._emit('breakpointHit', {
        nodeId,
        condition: bp.condition,
        node: data.node
      });
    }
    
    // 单步模式处理
    if (this.stepMode) {
      this._handleStepMode(nodeId);
    }
  }

  _handleStepMode(nodeId) {
    // 单步跳过：执行完当前节点后暂停
    // 单步进入：进入子节点时暂停
    // 单步退出：离开当前节点时暂停
    // 当前简化实现：在下一节点开始时暂停
    if (this.status === 'running') {
      setTimeout(() => {
        if (this.stepMode && this.status === 'paused') return;
        this.pause();
        this.stepMode = null;
        this._emit('pause', { nodeId, stepMode: true });
      }, 50);
    }
  }

  _getContextVariables() {
    // 获取当前上下文变量（由 VariableInspector 提供）
    if (window.variableInspector) {
      return window.variableInspector.getAllVariables();
    }
    return {};
  }
}

// 导出
window.WorkflowDebugger = WorkflowDebugger;
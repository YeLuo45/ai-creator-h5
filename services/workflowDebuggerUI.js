/**
 * Workflow Debugger UI Adapter v11
 * 调试 UI 适配器 - 提供调试功能的 UI 交互接口
 */

// 全局实例引用
let workflowDebugger = null;
let variableInspector = null;
let executionTracer = null;
let timeTravel = null;

/**
 * 初始化调试 UI
 */
function initDebuggerUI() {
  // 初始化服务
  if (!window.VariableInspector) {
    console.error('[DebuggerUI] VariableInspector not found');
    return;
  }
  variableInspector = new VariableInspector();
  window.variableInspector = variableInspector;

  if (!window.ExecutionTracer) {
    console.error('[DebuggerUI] ExecutionTracer not found');
    return;
  }
  executionTracer = new ExecutionTracer();
  window.executionTracer = executionTracer;

  if (!window.WorkflowEngine) {
    console.error('[DebuggerUI] WorkflowEngine not found');
    return;
  }
  
  if (!window.WorkflowDebugger) {
    console.error('[DebuggerUI] WorkflowDebugger not found');
    return;
  }
  workflowDebugger = new WorkflowDebugger(window.WorkflowEngine);
  window.workflowDebugger = workflowDebugger;

  timeTravel = new TimeTravel(executionTracer);
  window.timeTravel = timeTravel;

  // 设置事件监听
  setupDebuggerEvents();
  
  console.log('[DebuggerUI] Debugger UI initialized');
}

/**
 * 设置调试器事件监听
 */
function setupDebuggerEvents() {
  if (!workflowDebugger) return;

  workflowDebugger.onBreakpointHit((data) => {
    showBreakpointHitFeedback(data.nodeId);
    showVariableInspector();
    renderVariables(variableInspector.getAllVariablesWithMeta());
  });

  workflowDebugger.onPause((data) => {
    updateDebugControlState('paused');
    if (data.nodeId) {
      applyDebugModeStyle(data.nodeId);
    }
  });

  workflowDebugger.onResume(() => {
    updateDebugControlState('running');
    clearDebugModeStyles();
  });

  workflowDebugger.onStatusChange((data) => {
    console.log('[DebuggerUI] Status changed:', data);
  });

  if (variableInspector) {
    variableInspector.onVariableChange((data) => {
      if (data.type !== 'clear') {
        highlightVariable(data.name);
      }
    });
  }

  if (executionTracer) {
    executionTracer.onTraceUpdate((data) => {
      updateTimeTravelSlider();
    });
  }
}

/**
 * 显示变量监察面板
 */
function showVariableInspector() {
  const panel = document.getElementById('variable-inspector-panel');
  if (panel) {
    panel.style.display = 'flex';
  }
}

/**
 * 隐藏变量监察面板
 */
function hideVariableInspector() {
  const panel = document.getElementById('variable-inspector-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

/**
 * 渲染变量列表
 */
function renderVariables(variablesWithMeta) {
  const container = document.getElementById('variable-list');
  if (!container) return;

  container.innerHTML = '';

  if (!variablesWithMeta || Object.keys(variablesWithMeta).length === 0) {
    container.innerHTML = '<div class="variable-empty">暂无变量</div>';
    return;
  }

  Object.entries(variablesWithMeta).forEach(([name, meta]) => {
    const item = document.createElement('div');
    item.className = 'variable-item' + (meta.changed ? ' changed' : '');
    item.dataset.name = name;

    item.innerHTML = `
      <div class="variable-header">
        <span class="variable-name">${escapeHtml(name)}</span>
        <span class="variable-type">${escapeHtml(meta.type || 'unknown')}</span>
      </div>
      <div class="variable-value">${escapeHtml(variableInspector.formatValue(meta.value, 200))}</div>
    `;

    container.appendChild(item);
  });
}

/**
 * 高亮变量
 */
function highlightVariable(name) {
  const item = document.querySelector(`.variable-item[data-name="${name}"]`);
  if (item) {
    item.classList.add('highlight');
    setTimeout(() => item.classList.remove('highlight'), 1000);
  }
}

/**
 * 显示断点标记
 */
function showBreakpointMarker(nodeId) {
  const node = document.querySelector(`.workflow-node[data-id="${nodeId}"]`);
  if (!node) return;

  // 移除已有的断点标记
  removeBreakpointMarker(nodeId);

  const marker = document.createElement('div');
  marker.className = 'breakpoint-marker';
  marker.dataset.nodeId = nodeId;
  marker.title = '点击删除断点';
  marker.onclick = (e) => {
    e.stopPropagation();
    toggleBreakpoint(nodeId);
  };

  node.appendChild(marker);
}

/**
 * 移除断点标记
 */
function removeBreakpointMarker(nodeId) {
  const marker = document.querySelector(`.breakpoint-marker[data-node-id="${nodeId}"]`);
  if (marker) {
    marker.remove();
  }
}

/**
 * 切换断点
 */
function toggleBreakpoint(nodeId) {
  if (!workflowDebugger) return;

  const hasBp = workflowDebugger.hasBreakpoint(nodeId);
  
  if (hasBp) {
    workflowDebugger.removeBreakpoint(nodeId);
    removeBreakpointMarker(nodeId);
  } else {
    workflowDebugger.addBreakpoint(nodeId);
    showBreakpointMarker(nodeId);
  }
}

/**
 * 显示断点命中反馈
 */
function showBreakpointHitFeedback(nodeId) {
  const node = document.querySelector(`.workflow-node[data-id="${nodeId}"]`);
  if (node) {
    node.classList.add('breakpoint-hit');
    setTimeout(() => node.classList.remove('breakpoint-hit'), 3000);
  }
}

/**
 * 显示调试控制栏
 */
function showDebugControlBar() {
  const bar = document.getElementById('debug-control-bar');
  if (bar) {
    bar.style.display = 'flex';
  }
}

/**
 * 隐藏调试控制栏
 */
function hideDebugControlBar() {
  const bar = document.getElementById('debug-control-bar');
  if (bar) {
    bar.style.display = 'none';
  }
}

/**
 * 更新调试控制状态
 */
function updateDebugControlState(state) {
  const bar = document.getElementById('debug-control-bar');
  if (!bar) return;

  bar.dataset.state = state;

  const resumeBtn = document.getElementById('debug-btn-resume');
  const pauseBtn = document.getElementById('debug-btn-pause');
  const stepOverBtn = document.getElementById('debug-btn-step-over');
  const stepIntoBtn = document.getElementById('debug-btn-step-into');
  const stepOutBtn = document.getElementById('debug-btn-step-out');

  switch (state) {
    case 'paused':
      if (resumeBtn) resumeBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (stepOverBtn) stepOverBtn.disabled = false;
      if (stepIntoBtn) stepIntoBtn.disabled = false;
      if (stepOutBtn) stepOutBtn.disabled = false;
      break;
    case 'running':
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (stepOverBtn) stepOverBtn.disabled = true;
      if (stepIntoBtn) stepIntoBtn.disabled = true;
      if (stepOutBtn) stepOutBtn.disabled = true;
      break;
    case 'idle':
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (stepOverBtn) stepOverBtn.disabled = true;
      if (stepIntoBtn) stepIntoBtn.disabled = true;
      if (stepOutBtn) stepOutBtn.disabled = true;
      break;
  }
}

/**
 * 显示条件编辑器
 */
function showConditionEditor(nodeId, currentCondition) {
  const condition = prompt(`输入断点条件 (JavaScript 表达式):\n当前: ${currentCondition || '(无)'}`,
    currentCondition || '');

  if (condition === null) return; // 用户取消

  if (workflowDebugger) {
    const bp = workflowDebugger.breakpoints.get(nodeId);
    if (bp) {
      bp.condition = condition || null;
    } else {
      workflowDebugger.addBreakpoint(nodeId, condition || null);
      showBreakpointMarker(nodeId);
    }
  }
}

/**
 * 高亮执行路径
 */
function highlightExecutionPath(path) {
  if (!path || path.length === 0) return;

  // 清除之前的高亮
  document.querySelectorAll('.connection-line.highlighted').forEach(el => {
    el.classList.remove('highlighted');
  });

  // 高亮连接线
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    // 查找对应的连接线
    const lines = document.querySelectorAll(`.connection-line[data-from="${from}"][data-to="${to}"]`);
    lines.forEach(line => line.classList.add('highlighted'));
  }
}

/**
 * 显示时间旅行滑块
 */
function showTimeTravelSlider(snapshots) {
  const container = document.getElementById('time-travel-container');
  if (!container) return;

  container.style.display = 'block';

  const slider = document.getElementById('time-travel-slider');
  const valueDisplay = document.getElementById('time-travel-value');

  if (slider) {
    slider.max = snapshots.length - 1;
    slider.value = snapshots.length - 1;
    
    if (valueDisplay) {
      valueDisplay.textContent = `${snapshots.length} snapshots`;
    }

    slider.oninput = () => {
      const index = parseInt(slider.value);
      if (valueDisplay) {
        valueDisplay.textContent = `Snapshot ${index + 1}/${snapshots.length}`;
      }
      previewSnapshot(index);
    };

    slider.onchange = () => {
      const index = parseInt(slider.value);
      applySnapshot(index);
    };
  }
}

/**
 * 预览快照
 */
function previewSnapshot(index) {
  if (!timeTravel) return;

  const snapshot = timeTravel.getSnapshot(index);
  if (!snapshot || !snapshot.state) return;

  // 可以在这里显示预览信息
  console.log('[TimeTravel] Preview snapshot', index, snapshot.state);
}

/**
 * 应用快照
 */
function applySnapshot(index) {
  if (!timeTravel) return;

  const state = timeTravel.travelTo(index);
  if (!state) return;

  // 恢复变量
  if (variableInspector && state.variables) {
    variableInspector.clearVariables();
    Object.entries(state.variables).forEach(([name, value]) => {
      variableInspector.setVariable(name, value);
    });
    renderVariables(variableInspector.getAllVariablesWithMeta());
  }

  // 恢复执行路径高亮
  if (state.executionPath) {
    highlightExecutionPath(state.executionPath);
  }
}

/**
 * 更新时间旅行滑块
 */
function updateTimeTravelSlider() {
  if (!timeTravel) return;

  const snapshots = timeTravel.getAllSnapshots();
  const slider = document.getElementById('time-travel-slider');
  const valueDisplay = document.getElementById('time-travel-value');

  if (slider && snapshots.length > 0) {
    slider.max = snapshots.length - 1;
    slider.value = snapshots.length - 1;
    
    if (valueDisplay) {
      valueDisplay.textContent = `${snapshots.length} snapshots`;
    }
  }
}

/**
 * 显示回放控制
 */
function showReplayControls() {
  const controls = document.getElementById('replay-controls');
  if (controls) {
    controls.style.display = 'flex';
  }
}

/**
 * 隐藏回放控制
 */
function hideReplayControls() {
  const controls = document.getElementById('replay-controls');
  if (controls) {
    controls.style.display = 'none';
  }
}

/**
 * 应用调试模式样式
 */
function applyDebugModeStyle(nodeId) {
  const node = document.querySelector(`.workflow-node[data-id="${nodeId}"]`);
  if (node) {
    node.classList.add('debug-paused');
  }
}

/**
 * 清除调试模式样式
 */
function clearDebugModeStyles() {
  document.querySelectorAll('.workflow-node.debug-paused').forEach(node => {
    node.classList.remove('debug-paused');
  });
}

/**
 * 添加断点点击区域到节点
 */
function addBreakpointAreaToNodes() {
  document.querySelectorAll('.workflow-node').forEach(node => {
    const nodeId = node.dataset.id;
    if (!nodeId) return;

    // 检查是否已有断点标记
    if (!node.querySelector('.breakpoint-area')) {
      const area = document.createElement('div');
      area.className = 'breakpoint-area';
      area.dataset.nodeId = nodeId;
      area.title = '点击切换断点';
      
      // 检查是否有断点
      if (workflowDebugger && workflowDebugger.hasBreakpoint(nodeId)) {
        area.classList.add('has-breakpoint');
      }

      area.onclick = (e) => {
        e.stopPropagation();
        toggleBreakpoint(nodeId);
        area.classList.toggle('has-breakpoint');
      };

      node.insertBefore(area, node.firstChild);
    }
  });
}

/**
 * 工具函数：HTML转义
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// 导出
window.initDebuggerUI = initDebuggerUI;
window.showVariableInspector = showVariableInspector;
window.hideVariableInspector = hideVariableInspector;
window.renderVariables = renderVariables;
window.highlightVariable = highlightVariable;
window.showBreakpointMarker = showBreakpointMarker;
window.removeBreakpointMarker = removeBreakpointMarker;
window.toggleBreakpoint = toggleBreakpoint;
window.showDebugControlBar = showDebugControlBar;
window.showConditionEditor = showConditionEditor;
window.highlightExecutionPath = highlightExecutionPath;
window.showTimeTravelSlider = showTimeTravelSlider;
window.showReplayControls = showReplayControls;
window.applyDebugModeStyle = applyDebugModeStyle;
window.addBreakpointAreaToNodes = addBreakpointAreaToNodes;
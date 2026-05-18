/**
 * Workflow Lazy Components v12
 * Lazy-loaded UI components for debugger, variable inspector, time travel, and perf monitor
 * These are dynamically imported when needed
 */

/**
 * Render debugger control bar content
 */
export function renderDebuggerControls(container, props = {}) {
  const { workflowDebugger } = props;
  
  const html = `
    <span style="font-size:11px;color:var(--text-dim);">调试模式</span>
    <button class="debug-btn pause" id="debug-btn-pause" onclick="debugPause()">⏸ 暂停</button>
    <button class="debug-btn resume" id="debug-btn-resume" onclick="debugResume()" style="display:none">▶ 继续</button>
    <button class="debug-btn" id="debug-btn-step-over" onclick="debugStepOver()" disabled>→⏭ 单步跳过</button>
    <button class="debug-btn" id="debug-btn-step-into" onclick="debugStepInto()" disabled>↓⏭ 单步进入</button>
    <button class="debug-btn" id="debug-btn-step-out" onclick="debugStepOut()" disabled>↑⏭ 单步退出</button>
    <button class="debug-btn stop" id="debug-btn-stop" onclick="debugStop()">⏹ 停止</button>
    <div style="flex:1"></div>
    <button class="debug-btn" id="debug-btn-variables" onclick="toggleVariableInspector()">📊 变量</button>
    <button class="debug-btn" id="debug-btn-timetravel" onclick="toggleTimeTravel()">⏪ 时间旅行</button>
    <button class="debug-btn" onclick="exitDebuggerMode()">❌ 退出</button>
  `;
  
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  
  if (!container) return;
  
  container.innerHTML = html;
  container.classList.add('visible');
  
  return {
    destroy: () => {
      container.classList.remove('visible');
      container.innerHTML = '';
    }
  };
}

/**
 * Render variable inspector panel content
 */
export function renderVariableInspector(container, props = {}) {
  const { variableInspector, variables = {} } = props;
  
  const html = `
    <div class="variable-inspector-header">
      <span>📊 变量监察</span>
      <button class="debug-btn" onclick="hideVariableInspector()" style="padding:2px 6px;font-size:10px;">×</button>
    </div>
    <div class="variable-list" id="variable-list">
      ${renderVariableList(variables)}
    </div>
  `;
  
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  
  if (!container) return;
  
  container.innerHTML = html;
  container.classList.add('visible');
  
  return {
    update: (newProps) => {
      const listEl = container.querySelector('#variable-list');
      if (listEl) {
        listEl.innerHTML = renderVariableList(newProps.variables || {});
      }
    },
    destroy: () => {
      container.classList.remove('visible');
    }
  };
}

/**
 * Render variable list items
 */
function renderVariableList(variables) {
  const entries = Object.entries(variables);
  
  if (entries.length === 0) {
    return '<div class="variable-empty">暂无变量</div>';
  }
  
  return entries.map(([name, data]) => {
    const value = data?.value ?? data;
    const type = data?.type ?? typeof value;
    const changed = data?.changed ?? false;
    
    return `
      <div class="variable-item ${changed ? 'changed' : ''}">
        <div class="variable-header">
          <span class="variable-name">${escapeHtml(name)}</span>
          <span class="variable-type">${type}</span>
        </div>
        <div class="variable-value">${escapeHtml(formatValue(value, 50))}</div>
      </div>
    `;
  }).join('');
}

/**
 * Render time travel container content
 */
export function renderTimeTravel(container, props = {}) {
  const { timeTravel } = props;
  const snapshots = timeTravel?.getAllSnapshots() || [];
  
  const html = `
    <span class="time-travel-label">⏪ 时间旅行</span>
    <input type="range" 
           class="time-travel-slider" 
           id="time-travel-slider" 
           min="0" 
           max="${snapshots.length - 1}" 
           value="${snapshots.length - 1}"
           ${snapshots.length === 0 ? 'disabled' : ''}>
    <span class="time-travel-value" id="time-travel-value">
      ${snapshots.length} snapshots
    </span>
  `;
  
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  
  if (!container) return;
  
  container.innerHTML = html;
  container.classList.add('visible');
  
  // Set up slider handler
  const slider = container.querySelector('#time-travel-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const index = parseInt(e.target.value);
      updateTimeTravelValue(index, snapshots);
      if (timeTravel) {
        const state = timeTravel.travelTo(index);
        if (state && window.applyTimeTravelState) {
          window.applyTimeTravelState(state);
        }
      }
    });
  }
  
  return {
    update: (newProps) => {
      const newSnapshots = newProps.timeTravel?.getAllSnapshots() || [];
      const slider = container.querySelector('#time-travel-slider');
      const valueEl = container.querySelector('#time-travel-value');
      
      if (slider) {
        slider.max = newSnapshots.length - 1;
        slider.disabled = newSnapshots.length === 0;
      }
      if (valueEl) {
        valueEl.textContent = `${newSnapshots.length} snapshots`;
      }
    },
    destroy: () => {
      container.classList.remove('visible');
    }
  };
}

/**
 * Update time travel slider value display
 */
function updateTimeTravelValue(index, snapshots) {
  const valueEl = document.getElementById('time-travel-value');
  if (valueEl && snapshots[index]) {
    const snapshot = snapshots[index];
    const date = new Date(snapshot.timestamp);
    valueEl.textContent = date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

/**
 * Render performance monitor panel content
 */
export function renderPerfMonitor(container, props = {}) {
  const { perfMonitor } = props;
  
  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-weight:600;font-size:12px;">📊 性能监控</span>
      <button id="perf-monitor-close" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:14px;">×</button>
    </div>
    <div class="perf-monitor-content">
      <div class="perf-row">
        <span class="perf-label">FPS</span>
        <span class="perf-value" id="perf-fps">0</span>
      </div>
      <div class="perf-row">
        <span class="perf-label">节点</span>
        <span class="perf-value" id="perf-nodes">0</span>
      </div>
      <div class="perf-row">
        <span class="perf-label">连接</span>
        <span class="perf-value" id="perf-conns">0</span>
      </div>
      <div class="perf-row">
        <span class="perf-label">内存</span>
        <span class="perf-value" id="perf-memory">-</span>
      </div>
      <div class="perf-row">
        <span class="perf-label">帧时间</span>
        <span class="perf-value" id="perf-frame-time">0ms</span>
      </div>
      <div class="perf-row">
        <span class="perf-label">虚拟化</span>
        <span class="perf-value" id="perf-virtualized">-</span>
      </div>
      <div class="perf-row">
        <span class="perf-label">懒加载</span>
        <span class="perf-value" id="perf-lazy">-</span>
      </div>
    </div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
      <div class="perf-label" style="margin-bottom:4px;">FPS 历史</div>
      <canvas id="perf-fps-graph" width="196" height="40" style="background:var(--bg-dark);border-radius:4px;"></canvas>
    </div>
  `;
  
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  
  if (!container) return;
  
  container.innerHTML = html;
  
  // Set up close button
  const closeBtn = container.querySelector('#perf-monitor-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (perfMonitor) perfMonitor.hide();
    });
  }
  
  // Set up update callback
  if (perfMonitor) {
    perfMonitor.onStatsUpdate = (stats) => {
      updatePerfMonitorUI(stats);
    };
  }
  
  return {
    update: (newProps) => {
      if (newProps.perfMonitor) {
        newProps.perfMonitor.onStatsUpdate = updatePerfMonitorUI;
      }
    },
    destroy: () => {
      if (perfMonitor) {
        perfMonitor.onStatsUpdate = null;
      }
    }
  };
}

/**
 * Update performance monitor UI with latest stats
 */
function updatePerfMonitorUI(stats) {
  if (!stats) return;
  
  const fpsEl = document.getElementById('perf-fps');
  if (fpsEl) {
    fpsEl.textContent = stats.fps || 0;
    fpsEl.className = 'perf-value ' + ((stats.fps || 0) >= 50 ? 'good' : (stats.fps || 0) >= 30 ? 'warning' : 'bad');
  }
  
  const nodesEl = document.getElementById('perf-nodes');
  if (nodesEl) nodesEl.textContent = stats.nodeCount || 0;
  
  const connsEl = document.getElementById('perf-conns');
  if (connsEl) connsEl.textContent = stats.connCount || 0;
  
  const memoryEl = document.getElementById('perf-memory');
  if (memoryEl) {
    memoryEl.textContent = stats.memory ? `${stats.memory} MB` : '-';
  }
  
  const frameTimeEl = document.getElementById('perf-frame-time');
  if (frameTimeEl) {
    frameTimeEl.textContent = `${(stats.frameTime || 0).toFixed(1)}ms`;
  }
  
  // Update virtualized stat
  const virtualizedEl = document.getElementById('perf-virtualized');
  if (virtualizedEl && stats.virtualizerStats) {
    const { renderedNodes, totalNodes } = stats.virtualizerStats;
    virtualizedEl.textContent = `${renderedNodes}/${totalNodes}`;
  }
  
  // Update lazy stat
  const lazyEl = document.getElementById('perf-lazy');
  if (lazyEl && stats.lazyStats) {
    const { loaded } = stats.lazyStats.moduleStats || {};
    lazyEl.textContent = loaded > 0 ? `${loaded}L` : '-';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format value for display
 */
function formatValue(value, maxLength = 100) {
  if (value === null || value === undefined) {
    return String(value);
  }
  
  let str;
  if (typeof value === 'object') {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }
  
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
}

// Export a render function for dynamic import
export default {
  renderDebuggerControls,
  renderVariableInspector,
  renderTimeTravel,
  renderPerfMonitor
};

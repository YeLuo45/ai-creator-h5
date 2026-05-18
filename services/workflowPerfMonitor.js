/**
 * Workflow Performance Monitor v12
 * Real-time performance tracking: FPS, node count, connection count, memory, lazy stats
 */
export class WorkflowPerfMonitor {
  constructor() {
    this.isRunning = false;
    this.panel = null;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.lastFrameTime = 0;
    
    // Performance metrics
    this.metrics = {
      fps: 0,
      nodeCount: 0,
      connCount: 0,
      memory: 0,
      lazyStats: null,
      renderTime: 0,
      updateTime: 0,
      frameTime: 0,
      droppedFrames: 0,
      totalFrames: 0
    };
    
    // FPS calculation
    this.fpsHistory = [];
    this.maxFpsHistory = 60;
    
    // Memory monitoring
    this.memoryCheckInterval = null;
    this.lastMemoryCheck = 0;
    
    // Animation frame ID
    this.rafId = null;
    
    // Stats callbacks
    this.onStatsUpdate = null;
    
    // Throttling
    this.updateThrottleMs = 100; // Update UI every 100ms
    this.lastUiUpdate = 0;
  }

  init(panelElement) {
    this.panel = panelElement || this._createPanel();
    this.isRunning = true;
    
    // Start monitoring loop
    this._startMonitoring();
    
    // Set up memory monitoring if available
    this._setupMemoryMonitoring();
    
    // Listen for lazy loader stats
    window.addEventListener('lazyLoaderStats', (e) => {
      this.metrics.lazyStats = e.detail;
    });
    
    return this;
  }

  _createPanel() {
    // Check if panel already exists
    let panel = document.getElementById('perf-monitor-panel');
    if (panel) return panel;
    
    // Create panel
    panel = document.createElement('div');
    panel.id = 'perf-monitor-panel';
    panel.className = 'perf-monitor-panel';
    panel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      width: 220px;
      background: var(--bg-panel, #1A1A2E);
      border: 1px solid var(--border, #333355);
      border-radius: 8px;
      padding: 12px;
      font-size: 11px;
      color: var(--text, #E0E0FF);
      z-index: 1000;
      display: none;
    `;
    
    panel.innerHTML = this._getPanelHTML();
    document.body.appendChild(panel);
    
    return panel;
  }

  _getPanelHTML() {
    return `
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
  }

  _setupStyle() {
    if (document.getElementById('perf-monitor-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'perf-monitor-styles';
    style.textContent = `
      .perf-monitor-panel .perf-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
      }
      .perf-monitor-panel .perf-label {
        color: var(--text-dim, #8888AA);
      }
      .perf-monitor-panel .perf-value {
        font-family: monospace;
        font-weight: 500;
      }
      .perf-monitor-panel .perf-value.good { color: #10B981; }
      .perf-monitor-panel .perf-value.warning { color: #F59E0B; }
      .perf-monitor-panel .perf-value.bad { color: #EF4444; }
    `;
    document.head.appendChild(style);
  }

  _startMonitoring() {
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = this.lastFrameTime;
    this._monitorLoop();
  }

  _monitorLoop() {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Update FPS
    this.frameCount++;
    this.fpsHistory.push(1000 / deltaTime);
    if (this.fpsHistory.length > this.maxFpsHistory) {
      this.fpsHistory.shift();
    }
    
    // Calculate average FPS
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    this.fps = Math.round(avgFps);
    
    // Track frame time
    this.metrics.frameTime = deltaTime;
    this.metrics.totalFrames++;
    
    // Detect dropped frames (frame time > 33ms = < 30fps)
    if (deltaTime > 33) {
      this.metrics.droppedFrames++;
    }
    
    // Update memory periodically
    if (now - this.lastMemoryCheck > 1000) {
      this._updateMemory();
      this.lastMemoryCheck = now;
    }
    
    // Update UI periodically (throttled)
    if (now - this.lastUiUpdate > this.updateThrottleMs) {
      this._updateUI();
      this.lastUiUpdate = now;
    }
    
    // Continue loop
    this.rafId = requestAnimationFrame(() => this._monitorLoop());
  }

  _updateMemory() {
    // Try to get memory info if available (Chrome only)
    if (performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      this.metrics.memory = usedMB;
    } else if (performance.measureMemory) {
      // New API (experimental)
      performance.measureMemory().then(result => {
        const usedMB = (result.bytes / 1048576).toFixed(1);
        this.metrics.memory = usedMB;
      }).catch(() => {});
    }
  }

  _updateUI() {
    if (!this.panel || this.panel.style.display === 'none') return;
    
    this._setupStyle();
    
    // Update FPS with color coding
    const fpsEl = document.getElementById('perf-fps');
    if (fpsEl) {
      fpsEl.textContent = this.fps;
      fpsEl.className = 'perf-value ' + (this.fps >= 50 ? 'good' : this.fps >= 30 ? 'warning' : 'bad');
    }
    
    // Update node/connection counts from state
    const state = window.state;
    if (state && state.workflow) {
      this.metrics.nodeCount = state.workflow.nodes.length;
      this.metrics.connCount = state.workflow.connections.length;
    }
    
    document.getElementById('perf-nodes').textContent = this.metrics.nodeCount;
    document.getElementById('perf-conns').textContent = this.metrics.connCount;
    document.getElementById('perf-memory').textContent = 
      this.metrics.memory ? `${this.metrics.memory} MB` : '-';
    document.getElementById('perf-frame-time').textContent = 
      `${this.metrics.frameTime.toFixed(1)}ms`;
    
    // Virtualization stats
    const virtualizer = window.getVirtualizer?.();
    if (virtualizer) {
      const stats = virtualizer.getStats();
      document.getElementById('perf-virtualized').textContent = 
        `${stats.renderedNodes}/${stats.totalNodes}`;
    } else {
      document.getElementById('perf-virtualized').textContent = '-';
    }
    
    // Lazy loader stats
    const lazyLoader = window.getLazyLoader?.();
    if (lazyLoader) {
      const stats = lazyLoader.getStats();
      document.getElementById('perf-lazy').textContent = 
        stats.moduleStats.loaded > 0 ? `${stats.moduleStats.loaded}L` : '-';
    } else {
      document.getElementById('perf-lazy').textContent = '-';
    }
    
    // Update FPS graph
    this._updateFpsGraph();
    
    // Notify callback
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.metrics);
    }
  }

  _updateFpsGraph() {
    const canvas = document.getElementById('perf-fps-graph');
    if (!canvas || this.fpsHistory.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear
    ctx.fillStyle = 'var(--bg-dark, #0F0F1A)';
    ctx.fillRect(0, 0, w, h);
    
    // Draw FPS line
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const step = w / (this.maxFpsHistory - 1);
    for (let i = 0; i < this.fpsHistory.length; i++) {
      const x = i * step;
      const y = h - (this.fpsHistory[i] / 60) * h;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw 30fps threshold line
    ctx.strokeStyle = '#F59E0B';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, h - (30 / 60) * h);
    ctx.lineTo(w, h - (30 / 60) * h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  show() {
    if (!this.panel) this.panel = this._createPanel();
    this.panel.style.display = 'block';
    
    // Set up close button
    const closeBtn = document.getElementById('perf-monitor-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.hide();
    }
  }

  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  toggle() {
    if (this.panel && this.panel.style.display !== 'none') {
      this.hide();
    } else {
      this.show();
    }
  }

  // Manual metrics update (called from canvas/virtualizer)
  updateMetrics(data) {
    if (data.nodeCount !== undefined) this.metrics.nodeCount = data.nodeCount;
    if (data.connCount !== undefined) this.metrics.connCount = data.connCount;
    if (data.renderTime !== undefined) this.metrics.renderTime = data.renderTime;
    if (data.updateTime !== undefined) this.metrics.updateTime = data.updateTime;
  }

  getStats() {
    return {
      ...this.metrics,
      fpsHistory: [...this.fpsHistory],
      avgFps: this.fps,
      droppedFrameRate: this.metrics.totalFrames > 0 
        ? ((this.metrics.droppedFrames / this.metrics.totalFrames) * 100).toFixed(1)
        : 0
    };
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}

// Singleton
let instance = null;

export function getPerfMonitor() {
  if (!instance) {
    instance = new WorkflowPerfMonitor();
  }
  return instance;
}

export function initPerfMonitor(panelElement) {
  const monitor = getPerfMonitor();
  monitor.init(panelElement);
  return monitor;
}

window.WorkflowPerfMonitor = WorkflowPerfMonitor;
window.getPerfMonitor = getPerfMonitor;
window.initPerfMonitor = initPerfMonitor;

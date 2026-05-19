/**
 * workflow-v12.js - Main ES Module for Workflow v12
 * Integrates: Canvas Virtualization, Lazy Loading, Performance Monitor
 * Preserves all v11 features: breakpoints, variable inspector, time travel, step controls
 */
import { WorkflowCanvasVirtualizer, initVirtualizer, getVirtualizer } from './workflowCanvasVirtualizer.js';
import { WorkflowLazyLoader, initLazyLoader, getLazyLoader } from './workflowLazyLoader.js';
import { WorkflowPerfMonitor, initPerfMonitor, getPerfMonitor } from './workflowPerfMonitor.js';

// Service module imports - loaded dynamically on demand
let workflowDebugger = null;
let variableInspector = null;
let timeTravel = null;
let executionTracer = null;
let workflowDebuggerUI = null;

// State
const state = {
  workflow: {
    id: null,
    name: '未命名工作流',
    description: '',
    nodes: [],
    connections: []
  },
  selectedNodeId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  isPanning: false,
  panStart: null,
  draggingNode: null,
  dragOffset: null,
  connecting: null,
  executionResults: {},
  versions: [],
  undoStack: [],
  redoStack: [],
  isLogPanelCollapsed: false,
  currentTab: 'properties'
};

// Performance tracking
let perfMonitor = null;
let lazyLoader = null;
let virtualizer = null;
let debuggerActive = false;

/**
 * Initialize v12 performance systems
 */
export async function initV12Systems() {
  console.log('[v12] Initializing performance systems...');
  
  // Initialize lazy loader
  lazyLoader = initLazyLoader();
  
  // Initialize canvas virtualizer
  virtualizer = initVirtualizer({
    bufferSize: 300,
    maxVisibleNodes: 100,
    throttleMs: 16
  });
  
  // Initialize performance monitor
  perfMonitor = initPerfMonitor();
  
  // Preload critical modules in background
  requestIdleCallback(() => {
    lazyLoader.prewarm().catch(() => {});
  });
  
  console.log('[v12] Performance systems initialized');
}

/**
 * Load debugger services lazily (ES dynamic import)
 */
export async function loadDebuggerServices() {
  if (workflowDebugger) return workflowDebugger;
  
  console.log('[v12] Loading debugger services lazily...');
  
  try {
    // Dynamic import of debugger module
    const debuggerModule = await import('./workflowDebugger.js');
    workflowDebugger = new debuggerModule.WorkflowDebugger(window.WorkflowEngine);
    
    // Dynamic import of variable inspector
    const viModule = await import('./variableInspector.js');
    variableInspector = new viModule.VariableInspector();
    window.variableInspector = variableInspector; // For debugger access
    
    // Dynamic import of time travel
    const ttModule = await import('./timeTravel.js');
    executionTracer = await import('./executionTracer.js').then(m => new m.ExecutionTracer());
    timeTravel = new ttModule.TimeTravel(executionTracer);
    
    // Dynamic import of debugger UI
    const uiModule = await import('./workflowDebuggerUI.js');
    workflowDebuggerUI = uiModule;
    
    console.log('[v12] Debugger services loaded');
    
    return {
      workflowDebugger,
      variableInspector,
      timeTravel,
      executionTracer,
      workflowDebuggerUI
    };
  } catch (err) {
    console.error('[v12] Failed to load debugger services:', err);
    throw err;
  }
}

/**
 * Get lazy loader stats
 */
export function getLazyStats() {
  return lazyLoader?.getStats() || {};
}

/**
 * Get virtualizer stats
 */
export function getVirtualizationStats() {
  return virtualizer?.getStats() || {};
}

/**
 * Get performance stats
 */
export function getPerformanceStats() {
  const stats = {
    perf: perfMonitor?.getStats() || {},
    virtualization: getVirtualizationStats(),
    lazy: getLazyStats()
  };
  return stats;
}

/**
 * Show performance monitor
 */
export function showPerfMonitor() {
  perfMonitor?.show();
}

/**
 * Hide performance monitor
 */
export function hidePerfMonitor() {
  perfMonitor?.hide();
}

/**
 * Toggle performance monitor
 */
export function togglePerfMonitor() {
  perfMonitor?.toggle();
}

/**
 * Register a node with the virtualizer
 */
export function registerNode(nodeId, element, x, y) {
  virtualizer?.registerNode(nodeId, element, x, y);
}

/**
 * Unregister a node from the virtualizer
 */
export function unregisterNode(nodeId) {
  virtualizer?.unregisterNode(nodeId);
}

/**
 * Update node position in virtualizer
 */
export function updateNodePosition(nodeId, x, y) {
  virtualizer?.updateNodePosition(nodeId, x, y);
}

/**
 * Enable canvas virtualization
 */
export function enableVirtualization() {
  virtualizer?.enable();
}

/**
 * Disable canvas virtualization
 */
export function disableVirtualization() {
  virtualizer?.disable();
}

/**
 * Load a property editor lazily
 */
export async function loadPropertyEditor(nodeType, nodeSubtype) {
  return lazyLoader?.loadPropertyEditor(nodeType, nodeSubtype);
}

/**
 * Track node rendering performance
 */
export function trackNodeRender(nodeId, renderTime) {
  if (perfMonitor) {
    perfMonitor.updateMetrics({ renderTime });
  }
}

/**
 * Debugger mode control
 */
export async function enterDebuggerMode() {
  await loadDebuggerServices();
  debuggerActive = true;
  addBreakpointAreaToNodes();
  
  // Initialize debugger UI
  if (workflowDebuggerUI?.initDebuggerUI) {
    workflowDebuggerUI.initDebuggerUI();
  }
  
  document.getElementById('debug-control-bar')?.classList.add('visible');
  showToast('调试模式已开启');
}

export function exitDebuggerMode() {
  debuggerActive = false;
  document.getElementById('debug-control-bar')?.classList.remove('visible');
  
  // Remove breakpoint markers
  document.querySelectorAll('.breakpoint-marker').forEach(m => m.remove());
  document.querySelectorAll('.breakpoint-area').forEach(a => a.remove());
  document.querySelectorAll('.breakpoint-hit').forEach(n => n.classList.remove('breakpoint-hit'));
  document.querySelectorAll('.debug-paused').forEach(n => n.classList.remove('debug-paused'));
}

/**
 * Add breakpoint areas to nodes (for debugger mode)
 */
function addBreakpointAreaToNodes() {
  document.querySelectorAll('.workflow-node').forEach(node => {
    if (node.querySelector('.breakpoint-area')) return;
    
    const area = document.createElement('div');
    area.className = 'breakpoint-area';
    area.dataset.nodeId = node.dataset.nodeId;
    
    area.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBreakpoint(node.dataset.nodeId);
    });
    
    node.appendChild(area);
  });
}

/**
 * Toggle breakpoint for a node
 */
async function toggleBreakpoint(nodeId) {
  await loadDebuggerServices();
  
  if (!workflowDebugger) return;
  
  if (workflowDebugger.hasBreakpoint(nodeId)) {
    workflowDebugger.removeBreakpoint(nodeId);
    document.querySelector(`.breakpoint-area[data-node-id="${nodeId}"]`)?.classList.remove('has-breakpoint');
  } else {
    workflowDebugger.addBreakpoint(nodeId);
    document.querySelector(`.breakpoint-area[data-node-id="${nodeId}"]`)?.classList.add('has-breakpoint');
  }
}

/**
 * Debug control functions
 */
export function debugPause() {
  workflowDebugger?.pause();
  updateDebugControlState('paused');
}

export function debugResume() {
  workflowDebugger?.resume();
  updateDebugControlState('running');
}

export function debugStepOver() {
  workflowDebugger?.stepOver();
}

export function debugStepInto() {
  workflowDebugger?.stepInto();
}

export function debugStepOut() {
  workflowDebugger?.stepOut();
}

export function debugStop() {
  workflowDebugger?.stop();
  exitDebuggerMode();
}

function updateDebugControlState(status) {
  const pauseBtn = document.getElementById('debug-btn-pause');
  const resumeBtn = document.getElementById('debug-btn-resume');
  
  if (status === 'paused') {
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = '';
  } else {
    pauseBtn.style.display = '';
    resumeBtn.style.display = 'none';
  }
}

/**
 * Variable inspector panel control
 */
export function showVariableInspector() {
  const panel = document.getElementById('variable-inspector-panel');
  if (panel) {
    panel.classList.add('visible');
    if (variableInspector) {
      renderVariables(variableInspector.getAllVariablesWithMeta());
    }
  }
}

export function hideVariableInspector() {
  const panel = document.getElementById('variable-inspector-panel');
  if (panel) {
    panel.classList.remove('visible');
  }
}

export function toggleVariableInspector() {
  const panel = document.getElementById('variable-inspector-panel');
  if (panel) {
    if (panel.classList.contains('visible')) {
      hideVariableInspector();
    } else {
      showVariableInspector();
    }
  }
}

/**
 * Time travel panel control
 */
export function showTimeTravel() {
  const container = document.getElementById('time-travel-container');
  if (container) {
    container.classList.add('visible');
    if (timeTravel) {
      const snapshots = timeTravel.getAllSnapshots();
      showTimeTravelSlider(snapshots);
    }
  }
}

export function hideTimeTravel() {
  const container = document.getElementById('time-travel-container');
  if (container) {
    container.classList.remove('visible');
  }
}

export function toggleTimeTravel() {
  const container = document.getElementById('time-travel-container');
  if (container) {
    if (container.classList.contains('visible')) {
      hideTimeTravel();
    } else {
      showTimeTravel();
    }
  }
}

function showTimeTravelSlider(snapshots) {
  const slider = document.getElementById('time-travel-slider');
  const value = document.getElementById('time-travel-value');
  
  if (slider) {
    slider.max = snapshots.length - 1;
    slider.disabled = snapshots.length === 0;
  }
  if (value) {
    value.textContent = `${snapshots.length} snapshots`;
  }
}

/**
 * Render variables in inspector panel
 */
function renderVariables(variables) {
  const list = document.getElementById('variable-list');
  if (!list) return;
  
  const entries = Object.entries(variables);
  
  if (entries.length === 0) {
    list.innerHTML = '<div class="variable-empty">暂无变量</div>';
    return;
  }
  
  list.innerHTML = entries.map(([name, data]) => {
    const value = data?.value ?? data;
    const type = data?.type ?? typeof value;
    const changed = data?.changed ?? false;
    
    return `
      <div class="variable-item ${changed ? 'changed' : ''}">
        <div class="variable-header">
          <span class="variable-name">${name}</span>
          <span class="variable-type">${type}</span>
        </div>
        <div class="variable-value">${escapeHtml(formatValue(value, 50))}</div>
      </div>
    `;
  }).join('');
}

/**
 * Escape HTML
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

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }
}

// Export all state and functions needed by workflow.html
export {
  state,
  perfMonitor,
  lazyLoader,
  virtualizer,
  workflowDebugger,
  variableInspector,
  timeTravel,
  executionTracer,
  debuggerActive
};

export default {
  initV12Systems,
  loadDebuggerServices,
  getLazyStats,
  getVirtualizationStats,
  getPerformanceStats,
  showPerfMonitor,
  hidePerfMonitor,
  togglePerfMonitor,
  registerNode,
  unregisterNode,
  updateNodePosition,
  enableVirtualization,
  disableVirtualization,
  loadPropertyEditor,
  trackNodeRender,
  enterDebuggerMode,
  exitDebuggerMode,
  debugPause,
  debugResume,
  debugStepOver,
  debugStepInto,
  debugStepOut,
  debugStop,
  showVariableInspector,
  hideVariableInspector,
  toggleVariableInspector,
  showTimeTravel,
  hideTimeTravel,
  toggleTimeTravel,
  state
};

/**
 * Workflow Canvas Virtualizer v12
 * Canvas virtualization for 500+ nodes using Intersection Observer
 * Only renders nodes visible in the viewport + buffer zone
 */
export class WorkflowCanvasVirtualizer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.canvasContainer = options.container || document.getElementById('canvas-container');
    this.nodes = new Map(); // nodeId -> { el, x, y, width, height, visible }
    this.visibleNodeIds = new Set();
    this.virtualizedNodes = new Map(); // nodeId -> { el }
    
    // Configuration
    this.bufferSize = options.bufferSize || 200; // pixels outside viewport to pre-render
    this.throttleMs = options.throttleMs || 16; // ~60fps
    this.maxVisibleNodes = options.maxVisibleNodes || 100; // hard limit on visible nodes
    
    // State
    this.viewportRect = { left: 0, top: 0, right: 0, bottom: 0 };
    this.transform = { x: 0, y: 0, scale: 1 };
    this.lastUpdateTime = 0;
    this.updateScheduled = false;
    this.isEnabled = true;
    this.totalNodes = 0;
    this.renderedNodes = 0;
    
    // Intersection Observer for efficient visibility detection
    this.observer = null;
    this.observedElements = new WeakSet();
    
    // Pending updates queue
    this.pendingUpdates = new Set();
    
    this._init();
  }

  _init() {
    // Create intersection observer for viewport tracking
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this._handleIntersection(entries),
        {
          root: this.canvasContainer,
          rootMargin: `${this.bufferSize}px`,
          threshold: 0
        }
      );
    }
    
    // Listen for transform changes
    this._setupTransformListener();
  }

  _setupTransformListener() {
    // Override canvas transform application to track viewport
    const originalApplyTransform = window.applyTransform;
    if (originalApplyTransform) {
      window.applyTransform = (...args) => {
        const result = originalApplyTransform.apply(window, args);
        this._onTransformChange();
        return result;
      };
    }
    
    // Listen for pan/zoom events
    this.canvasContainer?.addEventListener('wheel', () => this._scheduleUpdate(), { passive: true });
    this.canvasContainer?.addEventListener('mousedown', () => this._scheduleUpdate());
    this.canvasContainer?.addEventListener('mousemove', () => this._scheduleUpdate());
  }

  _onTransformChange() {
    // Extract transform from canvas style
    const canvas = document.getElementById('workflow-canvas');
    if (!canvas) return;
    
    const style = window.getComputedStyle(canvas);
    const transform = style.transform;
    
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      this.transform.x = matrix.m41;
      this.transform.y = matrix.m42;
      this.transform.scale = matrix.a;
    }
    
    this._scheduleUpdate();
  }

  _scheduleUpdate() {
    if (this.updateScheduled) return;
    
    this.updateScheduled = true;
    requestAnimationFrame(() => {
      this._updateViewport();
      this.updateScheduled = false;
    });
  }

  _updateViewport() {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.throttleMs && this.lastUpdateTime !== 0) {
      this._scheduleUpdate();
      return;
    }
    this.lastUpdateTime = now;
    
    if (!this.isEnabled) return;
    
    const rect = this.canvasContainer.getBoundingClientRect();
    const scrollLeft = this.canvasContainer.scrollLeft || 0;
    const scrollTop = this.canvasContainer.scrollTop || 0;
    
    // Calculate visible area in canvas coordinates
    this.viewportRect = {
      left: (-this.transform.x + scrollLeft) / this.transform.scale - this.bufferSize,
      top: (-this.transform.y + scrollTop) / this.transform.scale - this.bufferSize,
      right: (rect.width - this.transform.x + scrollLeft) / this.transform.scale + this.bufferSize,
      bottom: (rect.height - this.transform.y + scrollTop) / this.transform.scale + this.bufferSize
    };
    
    this._updateVisibleNodes();
  }

  _updateVisibleNodes() {
    const previouslyVisible = new Set(this.visibleNodeIds);
    this.visibleNodeIds.clear();
    
    // Determine which nodes are now visible
    let visibleCount = 0;
    for (const [nodeId, nodeData] of this.nodes) {
      if (visibleCount >= this.maxVisibleNodes) break;
      
      const isVisible = this._isNodeInViewport(nodeData);
      
      if (isVisible) {
        this.visibleNodeIds.add(nodeId);
        visibleCount++;
      }
    }
    
    // Hide nodes that are no longer visible (virtualize them)
    for (const nodeId of previouslyVisible) {
      if (!this.visibleNodeIds.has(nodeId)) {
        this._hideNode(nodeId);
      }
    }
    
    // Show nodes that are now visible
    for (const nodeId of this.visibleNodeIds) {
      if (!previouslyVisible.has(nodeId)) {
        this._showNode(nodeId);
      }
    }
    
    this.renderedNodes = this.visibleNodeIds.size;
  }

  _isNodeInViewport(nodeData) {
    const { x, y, width, height } = nodeData;
    
    // Account for node dimensions (approximate if not measured)
    const nodeWidth = width || 160;
    const nodeHeight = height || 80;
    
    return (
      x + nodeWidth >= this.viewportRect.left &&
      x <= this.viewportRect.right &&
      y + nodeHeight >= this.viewportRect.top &&
      y <= this.viewportRect.bottom
    );
  }

  _hideNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || !nodeData.el) return;
    
    // Store in virtualized map and remove from DOM
    this.virtualizedNodes.set(nodeId, { el: nodeData.el });
    nodeData.el.style.display = 'none';
    nodeData.el.setAttribute('data-virtualized', 'true');
  }

  _showNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (!nodeData || !nodeData.el) return;
    
    // Restore from virtualized map
    nodeData.el.style.display = '';
    nodeData.el.removeAttribute('data-virtualized');
    this.virtualizedNodes.delete(nodeId);
  }

  _handleIntersection(entries) {
    for (const entry of entries) {
      const nodeId = entry.target.dataset.nodeId;
      if (!nodeId) continue;
      
      const nodeData = this.nodes.get(nodeId);
      if (!nodeData) continue;
      
      nodeData.visible = entry.isIntersecting;
      
      if (entry.isIntersecting) {
        this.visibleNodeIds.add(nodeId);
        if (this.virtualizedNodes.has(nodeId)) {
          this._showNode(nodeId);
        }
      } else {
        this.visibleNodeIds.delete(nodeId);
        if (!this.virtualizedNodes.has(nodeId)) {
          this._hideNode(nodeId);
        }
      }
    }
    
    this.renderedNodes = this.visibleNodeIds.size;
  }

  // Public API
  
  registerNode(nodeId, element, x, y) {
    const nodeData = {
      el: element,
      x,
      y,
      width: element.offsetWidth || 160,
      height: element.offsetHeight || 80,
      visible: true
    };
    
    this.nodes.set(nodeId, nodeData);
    this.totalNodes = this.nodes.size;
    
    // Measure actual dimensions after layout
    requestAnimationFrame(() => {
      if (this.nodes.has(nodeId)) {
        const data = this.nodes.get(nodeId);
        data.width = element.offsetWidth || 160;
        data.height = element.offsetHeight || 80;
      }
    });
    
    // Observe with Intersection Observer if available
    if (this.observer && !this.observedElements.has(element)) {
      this.observer.observe(element);
      this.observedElements.add(element);
    }
    
    this._scheduleUpdate();
  }

  unregisterNode(nodeId) {
    const nodeData = this.nodes.get(nodeId);
    if (nodeData && nodeData.el && this.observer) {
      this.observer.unobserve(nodeData.el);
    }
    
    this.nodes.delete(nodeId);
    this.virtualizedNodes.delete(nodeId);
    this.visibleNodeIds.delete(nodeId);
    this.totalNodes = this.nodes.size;
    this.renderedNodes = this.visibleNodeIds.size;
  }

  updateNodePosition(nodeId, x, y) {
    const nodeData = this.nodes.get(nodeId);
    if (nodeData) {
      nodeData.x = x;
      nodeData.y = y;
      this._scheduleUpdate();
    }
  }

  onViewportChange() {
    this._scheduleUpdate();
  }

  enable() {
    this.isEnabled = true;
    // Restore all virtualized nodes
    for (const [nodeId] of this.virtualizedNodes) {
      this._showNode(nodeId);
    }
    this._scheduleUpdate();
  }

  disable() {
    this.isEnabled = false;
    // Show all nodes when disabled
    for (const [nodeId] of this.virtualizedNodes) {
      this._showNode(nodeId);
    }
    this.renderedNodes = this.totalNodes;
  }

  getStats() {
    return {
      totalNodes: this.totalNodes,
      renderedNodes: this.renderedNodes,
      virtualizedNodes: this.totalNodes - this.renderedNodes,
      isEnabled: this.isEnabled,
      viewportRect: { ...this.viewportRect },
      transform: { ...this.transform },
      bufferSize: this.bufferSize
    };
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.nodes.clear();
    this.virtualizedNodes.clear();
    this.visibleNodeIds.clear();
  }
}

// Export singleton instance getter
let instance = null;
export function getVirtualizer() {
  if (!instance) {
    const canvas = document.getElementById('workflow-canvas');
    instance = new WorkflowCanvasVirtualizer(canvas);
  }
  return instance;
}

export function initVirtualizer(options) {
  if (instance) {
    instance.destroy();
  }
  instance = new WorkflowCanvasVirtualizer(
    document.getElementById('workflow-canvas'),
    options
  );
  return instance;
}

window.WorkflowCanvasVirtualizer = WorkflowCanvasVirtualizer;
window.initVirtualizer = initVirtualizer;
window.getVirtualizer = getVirtualizer;

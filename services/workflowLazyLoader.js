/**
 * Workflow Lazy Loader v12
 * Lazy loading for toolbar nodes + property panel editors
 * Uses Intersection Observer and dynamic imports for code splitting
 */
export class WorkflowLazyLoader {
  constructor() {
    this.lazyModules = new Map(); // moduleName -> { loaded: boolean, module: any, promise: Promise }
    this.lazyComponents = new Map(); // componentName -> { loaded: boolean, render: Function }
    this.initialized = false;
    
    // Module paths for dynamic imports
    this.modulePaths = {
      'workflowDebugger': '../services/workflowDebugger.js',
      'workflowDebuggerUI': '../services/workflowDebuggerUI.js',
      'variableInspector': '../services/variableInspector.js',
      'timeTravel': '../services/timeTravel.js',
      'executionTracer': '../services/executionTracer.js'
    };
    
    // Component lazy load definitions
    this.componentDefinitions = {
      'debuggerControls': {
        load: () => import('./workflowLazyComponents.js').then(m => m.renderDebuggerControls),
        container: '#debug-control-bar'
      },
      'variableInspector': {
        load: () => import('./workflowLazyComponents.js').then(m => m.renderVariableInspector),
        container: '#variable-inspector-panel'
      },
      'timeTravel': {
        load: () => import('./workflowLazyComponents.js').then(m => m.renderTimeTravel),
        container: '#time-travel-container'
      },
      'perfMonitor': {
        load: () => import('./workflowLazyComponents.js').then(m => m.renderPerfMonitor),
        container: '#perf-monitor-panel'
      }
    };
    
    // Module load stats
    this.loadStats = {
      loaded: 0,
      pending: 0,
      failed: 0,
      totalLoadTime: 0,
      lazyLoads: 0
    };
    
    // Performance tracking
    this.perfEntries = new Map(); // nodeId -> { loadTime, renderTime }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Set up Intersection Observer for lazy component loading
    this._setupComponentObserver();
    
    // Preload critical modules on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this._preloadCriticalModules());
    } else {
      setTimeout(() => this._preloadCriticalModules(), 100);
    }
  }

  _setupComponentObserver() {
    // Lazy load components when they become visible
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const componentName = entry.target.dataset.lazyComponent;
              if (componentName) {
                this.loadComponent(componentName);
              }
            }
          }
        },
        { rootMargin: '100px' }
      );
      
      // Observe lazy component containers
      document.querySelectorAll('[data-lazy-component]').forEach(el => {
        observer.observe(el);
      });
      
      this.componentObserver = observer;
    }
  }

  async _preloadCriticalModules() {
    // Preload modules that are likely to be used soon
    const criticalModules = ['variableInspector']; // Only preload what's likely needed immediately
    for (const moduleName of criticalModules) {
      if (!this.lazyModules.has(moduleName)) {
        this.loadModule(moduleName).catch(() => {}); // Ignore errors for preloading
      }
    }
  }

  // Dynamic import for ES modules
  async loadModule(moduleName) {
    if (this.lazyModules.has(moduleName)) {
      const mod = this.lazyModules.get(moduleName);
      if (mod.loaded) return mod.module;
      if (mod.promise) return mod.promise;
    }
    
    const startTime = performance.now();
    this.loadStats.pending++;
    
    const mod = {
      loaded: false,
      module: null,
      promise: null
    };
    
    this.lazyModules.set(moduleName, mod);
    
    const path = this.modulePaths[moduleName];
    if (!path) {
      console.warn(`[LazyLoader] Unknown module: ${moduleName}`);
      this.loadStats.failed++;
      this.loadStats.pending--;
      return null;
    }
    
    mod.promise = import(/* webpackIgnore: true */ path)
      .then(module => {
        const loadTime = performance.now() - startTime;
        mod.loaded = true;
        mod.module = module;
        mod.promise = null;
        this.loadStats.loaded++;
        this.loadStats.pending--;
        this.loadStats.totalLoadTime += loadTime;
        this.loadStats.lazyLoads++;
        
        console.log(`[LazyLoader] Loaded ${moduleName} in ${loadTime.toFixed(2)}ms`);
        return module;
      })
      .catch(err => {
        console.error(`[LazyLoader] Failed to load ${moduleName}:`, err);
        this.loadStats.failed++;
        this.loadStats.pending--;
        mod.promise = null;
        return null;
      });
    
    return mod.promise;
  }

  // Lazy load a component
  async loadComponent(componentName) {
    if (this.lazyComponents.has(componentName)) {
      const comp = this.lazyComponents.get(componentName);
      if (comp.loaded) return comp.render;
    }
    
    const definition = this.componentDefinitions[componentName];
    if (!definition) {
      console.warn(`[LazyLoader] Unknown component: ${componentName}`);
      return null;
    }
    
    const comp = {
      loaded: false,
      render: null
    };
    
    this.lazyComponents.set(componentName, comp);
    
    try {
      comp.render = await definition.load();
      comp.loaded = true;
      return comp.render;
    } catch (err) {
      console.error(`[LazyLoader] Failed to load component ${componentName}:`, err);
      return null;
    }
  }

  // Render a lazy component
  async renderComponent(componentName, container, props = {}) {
    const definition = this.componentDefinitions[componentName];
    if (!definition) return;
    
    // Check if already loaded
    if (this.lazyComponents.has(componentName)) {
      const comp = this.lazyComponents.get(componentName);
      if (comp.loaded && comp.render) {
        return comp.render(container, props);
      }
    }
    
    // Load and render
    const render = await this.loadComponent(componentName);
    if (render) {
      return render(container, props);
    }
  }

  // Lazy toolbar node loading
  async loadToolbarNode(nodeType) {
    const cacheKey = `toolbar_${nodeType}`;
    
    // Check if already cached
    if (this.perfEntries.has(cacheKey)) {
      return this.perfEntries.get(cacheKey);
    }
    
    const startTime = performance.now();
    
    // Simulate lazy loading (actual nodes are always rendered, but configs can be lazy)
    await new Promise(resolve => setTimeout(resolve, 5)); // Micro-delay for chunking
    
    const loadTime = performance.now() - startTime;
    this.perfEntries.set(cacheKey, { loadTime, type: 'toolbarNode' });
    
    return { loadTime, type: 'toolbarNode' };
  }

  // Lazy property panel editor loading
  async loadPropertyEditor(nodeType, nodeSubtype) {
    const cacheKey = `editor_${nodeType}_${nodeSubtype}`;
    
    if (this.perfEntries.has(cacheKey)) {
      return this.perfEntries.get(cacheKey);
    }
    
    const startTime = performance.now();
    
    // Dynamic import for editor modules based on node type
    const editorModules = {
      'creator-character': () => import('./lazyEditors/characterEditor.js'),
      'creator-music': () => import('./lazyEditors/musicEditor.js'),
      'creator-tts': () => import('./lazyEditors/ttsEditor.js'),
      'loop-forLoop': () => import('./lazyEditors/forLoopEditor.js'),
      'loop-whileLoop': () => import('./lazyEditors/whileLoopEditor.js'),
      'loop-doWhileLoop': () => import('./lazyEditors/doWhileLoopEditor.js'),
      'logic-condition': () => import('./lazyEditors/conditionEditor.js'),
      'plugin': () => import('./lazyEditors/pluginEditor.js')
    };
    
    const editorKey = `${nodeType}-${nodeSubtype}`;
    const loader = editorModules[editorKey] || editorModules['plugin'];
    
    try {
      const module = await loader();
      const loadTime = performance.now() - startTime;
      this.perfEntries.set(cacheKey, { loadTime, module, type: 'propertyEditor' });
      return { loadTime, module, type: 'propertyEditor' };
    } catch (err) {
      const loadTime = performance.now() - startTime;
      console.warn(`[LazyLoader] Editor not found for ${editorKey}`);
      return { loadTime, module: null, type: 'propertyEditor' };
    }
  }

  // Track lazy loading stats
  getStats() {
    const entryStats = {};
    let totalEditorTime = 0;
    
    for (const [key, entry] of this.perfEntries) {
      entryStats[key] = entry.loadTime;
      if (entry.type === 'propertyEditor' || entry.type === 'toolbarNode') {
        totalEditorTime += entry.loadTime;
      }
    }
    
    return {
      moduleStats: {
        loaded: this.loadStats.loaded,
        pending: this.loadStats.pending,
        failed: this.loadStats.failed,
        totalLoadTime: this.loadStats.totalLoadTime,
        lazyLoads: this.loadStats.lazyLoads,
        avgLoadTime: this.loadStats.loaded > 0 
          ? (this.loadStats.totalLoadTime / this.loadStats.loaded).toFixed(2) 
          : 0
      },
      componentStats: {
        loaded: Array.from(this.lazyComponents.values()).filter(c => c.loaded).length,
        total: this.lazyComponents.size
      },
      editorStats: {
        uniqueEditors: this.perfEntries.size,
        totalEditorTime: totalEditorTime.toFixed(2)
      },
      entries: entryStats
    };
  }

  // Prewarm lazy systems
  async prewarm() {
    console.log('[LazyLoader] Prewarming lazy systems...');
    
    // Preload all component definitions
    const loadPromises = Object.keys(this.componentDefinitions).map(name => 
      this.loadComponent(name).catch(() => null)
    );
    
    await Promise.allSettled(loadPromises);
    console.log('[LazyLoader] Prewarm complete');
  }

  destroy() {
    if (this.componentObserver) {
      this.componentObserver.disconnect();
    }
    this.lazyModules.clear();
    this.lazyComponents.clear();
    this.perfEntries.clear();
  }
}

// Singleton instance
let instance = null;

export function getLazyLoader() {
  if (!instance) {
    instance = new WorkflowLazyLoader();
  }
  return instance;
}

export function initLazyLoader() {
  const loader = getLazyLoader();
  loader.init();
  return loader;
}

window.WorkflowLazyLoader = WorkflowLazyLoader;
window.getLazyLoader = getLazyLoader;
window.initLazyLoader = initLazyLoader;

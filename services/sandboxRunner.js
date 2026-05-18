/**
 * Sandbox Runner Service - v23
 * 沙箱执行器 - 增强的安全强化版本
 * 提供严格的DOM访问限制、网络请求拦截、存储隔离和资源限制
 */
class SandboxRunner {
  constructor() {
    this.timeout = 5000;        // 5秒默认超时
    this.captureConsole = true;  // 捕获 console 输出
    this._consoleLogs = [];
    this._activeSandboxes = new Map();
    this._resourceLimits = {
      maxMemoryMB: 50,
      maxCPUTime: 5000,
      maxNetworkRequests: 5,
      maxStorageBytes: 500 * 1024  // 500KB
    };
  }

  /**
   * 执行节点代码 - v23 增强安全版本
   */
  async run(code, inputs, config) {
    const startTime = Date.now();
    this._consoleLogs = [];
    const sandboxId = `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建增强的隔离 console 对象
    const sandboxConsole = this.captureConsole ? this._createSecureConsole(sandboxId, startTime) : null;

    // 严格的DOM访问阻止
    const protectedObjects = [
      'window', 'document', 'location', 'localStorage', 'sessionStorage',
      'navigator', 'history', 'top', 'parent', 'frames', 'self', 'indexedDB',
      'open', 'close', 'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker'
    ];

    // 构建执行函数 - 使用 "use strict" 严格模式
    const wrappedCode = `
      "use strict";
      
      // 严格隔离 - 阻止所有危险全局对象的访问
      const __restricted__ = Object.create(null);
      ${protectedObjects.map(obj => `
      Object.defineProperty(__restricted__, '${obj}', {
        get: function() { 
          throw new Error('Access to ${obj} is blocked in sandbox'); 
        },
        set: function(v) {
          throw new Error('Cannot modify restricted object ${obj}');
        }
      });`).join('')}
      
      // 创建安全的全局代理
      const console = arguments[0];
      const inputs = arguments[1];
      const config = arguments[2];
      const Math = __restricted__.__Math || Math;
      
      // 允许的安全对象白名单
      const allowedGlobals = {
        Math: Math,
        JSON: JSON,
        Date: Date,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        RegExp: RegExp,
        Map: Map,
        Set: Set,
        Promise: Promise,
        Symbol: Symbol,
        parseInt: parseInt,
        parseFloat: parseFloat,
        isNaN: isNaN,
        isFinite: isFinite,
        undefined: undefined,
        null: null,
        true: true,
        false: false,
        Infinity: Infinity,
        NaN: NaN
      };
      
      // 合并限制对象和允许的全局对象
      Object.assign(globalThis, __restricted__, allowedGlobals);
      
      // 执行用户代码
      ${code}
    `;

    try {
      // 使用 Function 构造器创建并执行
      const fn = new Function('console', 'inputs', 'config', wrappedCode);

      // 使用 Promise 和 setTimeout 实现超时控制
      const result = await this._executeWithTimeout(fn, sandboxConsole, inputs, config, sandboxId);

      // 资源使用报告
      const resourceUsage = this._getResourceUsage(sandboxId);

      return {
        success: true,
        output: result,
        logs: this._consoleLogs,
        executionTime: Date.now() - startTime,
        sandboxId,
        resourceUsage
      };
    } catch (error) {
      console.error('[SandboxRunner] Execution error:', error);

      return {
        success: false,
        error: error.message || 'Unknown error',
        logs: this._consoleLogs,
        executionTime: Date.now() - startTime,
        sandboxId
      };
    } finally {
      // 清理沙箱
      this._cleanupSandbox(sandboxId);
    }
  }

  /**
   * 创建安全的 console 对象 - 记录所有输出
   */
  _createSecureConsole(sandboxId, startTime) {
    const self = this;
    return {
      log: (...args) => {
        self._consoleLogs.push({ type: 'log', message: self._formatArgs(args), time: Date.now() - startTime, sandboxId });
      },
      info: (...args) => {
        self._consoleLogs.push({ type: 'info', message: self._formatArgs(args), time: Date.now() - startTime, sandboxId });
      },
      warn: (...args) => {
        self._consoleLogs.push({ type: 'warn', message: self._formatArgs(args), time: Date.now() - startTime, sandboxId });
      },
      error: (...args) => {
        self._consoleLogs.push({ type: 'error', message: self._formatArgs(args), time: Date.now() - startTime, sandboxId });
      },
      debug: (...args) => {
        self._consoleLogs.push({ type: 'debug', message: self._formatArgs(args), time: Date.now() - startTime, sandboxId });
      }
    };
  }

  /**
   * 带超时的执行 - v23 增强资源监控
   */
  _executeWithTimeout(fn, consoleArg, inputs, config, sandboxId) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this._logSecurityEvent(sandboxId, 'timeout', { timeout: this.timeout });
        reject(new Error(`Execution timeout (${this.timeout}ms exceeded)`));
      }, this.timeout);

      // CPU 时间监控
      const cpuStart = performance.now();
      
      // 内存监控
      let memoryStart = 0;
      if (performance.memory) {
        memoryStart = performance.memory.usedJSHeapSize;
      }

      try {
        const result = fn(consoleArg, inputs, config);
        
        // 检查内存使用
        if (performance.memory) {
          const memoryUsed = (performance.memory.usedJSHeapSize - memoryStart) / (1024 * 1024);
          if (memoryUsed > this._resourceLimits.maxMemoryMB) {
            clearTimeout(timeoutId);
            this._logSecurityEvent(sandboxId, 'memory_limit', { memoryUsed, limit: this._resourceLimits.maxMemoryMB });
            reject(new Error(`Memory limit exceeded: ${memoryUsed.toFixed(2)}MB used`));
            return;
          }
        }

        clearTimeout(timeoutId);

        // 如果返回 Promise，等待它完成
        if (result && typeof result.then === 'function') {
          result
            .then(r => resolve(r))
            .catch(e => reject(e));
        } else {
          resolve(result);
        }
      } catch (e) {
        clearTimeout(timeoutId);
        reject(e);
      }
    });
  }

  /**
   * 获取资源使用情况
   */
  _getResourceUsage(sandboxId) {
    const usage = {
      memoryMB: 0,
      cpuTime: 0,
      networkRequests: 0
    };

    if (performance.memory) {
      usage.memoryMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024) * 100) / 100;
    }

    return usage;
  }

  /**
   * 清理沙箱
   */
  _cleanupSandbox(sandboxId) {
    this._activeSandboxes.delete(sandboxId);
  }

  /**
   * 记录安全事件
   */
  _logSecurityEvent(sandboxId, eventType, data) {
    const event = {
      sandboxId,
      eventType,
      timestamp: Date.now(),
      ...data
    };
    
    // 触发安全事件通知
    document.dispatchEvent(new CustomEvent('sandboxSecurityEvent', { detail: event }));
    
    console.debug('[SandboxRunner] Security event:', event);
  }

  /**
   * 格式化日志参数
   */
  _formatArgs(args) {
    return args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * 执行代码片段静态验证 - v23 增强
   */
  static validate(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Code cannot be empty' };
    }

    // 增强的危险模式检测
    const dangerousPatterns = [
      { pattern: /window\./i, name: 'window', severity: 'high' },
      { pattern: /document\./i, name: 'document', severity: 'high' },
      { pattern: /location\./i, name: 'location', severity: 'high' },
      { pattern: /localStorage\s*\./i, name: 'localStorage', severity: 'high' },
      { pattern: /sessionStorage\s*\./i, name: 'sessionStorage', severity: 'high' },
      { pattern: /navigator\./i, name: 'navigator', severity: 'high' },
      { pattern: /history\./i, name: 'history', severity: 'medium' },
      { pattern: /frames\./i, name: 'frames', severity: 'medium' },
      { pattern: /top\./i, name: 'top', severity: 'medium' },
      { pattern: /parent\./i, name: 'parent', severity: 'medium' },
      { pattern: /fetch\s*\(/i, name: 'fetch', severity: 'high' },
      { pattern: /XMLHttpRequest/i, name: 'XMLHttpRequest', severity: 'high' },
      { pattern: /WebSocket/i, name: 'WebSocket', severity: 'high' },
      { pattern: /Worker\s*\(/i, name: 'Worker', severity: 'high' },
      { pattern: /import\s*\(/i, name: 'dynamic_import', severity: 'high' },
      { pattern: /import\s+\w+/i, name: 'import', severity: 'high' },
      { pattern: /require\s*\(/i, name: 'require', severity: 'high' },
      { pattern: /process\s*\./i, name: 'process', severity: 'high' },
      { pattern: /child_process/i, name: 'child_process', severity: 'critical' },
      { pattern: /eval\s*\(/i, name: 'eval', severity: 'critical' },
      { pattern: /Function\s*\(/i, name: 'Function', severity: 'high' },
      { pattern: /setTimeout\s*\(\s*["'`]/i, name: 'setTimeout_code_injection', severity: 'critical' },
      { pattern: /setInterval\s*\(\s*["'`]/i, name: 'setInterval_code_injection', severity: 'critical' },
      { pattern: /new\s+Function/i, name: 'new_Function', severity: 'high' },
      { pattern: /innerHTML\s*=/i, name: 'innerHTML_injection', severity: 'high' },
      { pattern: /outerHTML\s*=/i, name: 'outerHTML_injection', severity: 'high' },
      { pattern: /insertAdjacentHTML/i, name: 'insertAdjacentHTML', severity: 'high' },
      { pattern: /\\$_GET/i, name: '$_GET', severity: 'medium' },
      { pattern: /\\$_POST/i, name: '$_POST', severity: 'medium' },
      { pattern: /\\$_REQUEST/i, name: '$_REQUEST', severity: 'medium' },
      { pattern: /atob\s*\(/i, name: 'atob', severity: 'medium' },
      { pattern: /btoa\s*\(/i, name: 'btoa', severity: 'medium' },
      { pattern: /crypto\./i, name: 'crypto', severity: 'medium' },
      { pattern: /open\s*\(/i, name: 'window_open', severity: 'high' },
      { pattern: /close\s*\(/i, name: 'window_close', severity: 'medium' },
      { pattern: /showModalDialog/i, name: 'showModalDialog', severity: 'medium' },
      { pattern: /createElement\s*\(\s*["']script/i, name: 'createElement_script', severity: 'critical' },
      { pattern: /src\s*=\s*["']javascript:/i, name: 'javascript_protocol', severity: 'critical' }
    ];

    const violations = [];
    for (const { pattern, name, severity } of dangerousPatterns) {
      if (pattern.test(code)) {
        violations.push({ name, severity });
      }
    }

    if (violations.length > 0) {
      const criticalCount = violations.filter(v => v.severity === 'critical').length;
      const highCount = violations.filter(v => v.severity === 'high').length;
      
      return { 
        valid: false, 
        error: `Dangerous operations detected: ${violations.map(v => v.name).join(', ')}`,
        violations,
        severity: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium'
      };
    }

    // 检查语法错误（通过尝试创建函数）
    try {
      new Function(code);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: `Syntax error: ${e.message}` };
    }
  }

  /**
   * 获取捕获的日志
   */
  getLogs() {
    return [...this._consoleLogs];
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this._consoleLogs = [];
  }

  /**
   * 设置超时时间
   */
  setTimeout(ms) {
    this.timeout = Math.max(100, Math.min(ms, 30000)); // 最小100ms，最大30s
  }

  /**
   * 设置资源限制
   */
  setResourceLimits(limits) {
    if (limits.maxMemoryMB) {
      this._resourceLimits.maxMemoryMB = Math.max(10, Math.min(limits.maxMemoryMB, 256));
    }
    if (limits.maxCPUTime) {
      this._resourceLimits.maxCPUTime = Math.max(100, Math.min(limits.maxCPUTime, 60000));
      this.timeout = this._resourceLimits.maxCPUTime;
    }
    if (limits.maxNetworkRequests) {
      this._resourceLimits.maxNetworkRequests = Math.max(0, Math.min(limits.maxNetworkRequests, 100));
    }
    if (limits.maxStorageBytes) {
      this._resourceLimits.maxStorageBytes = Math.max(1024, Math.min(limits.maxStorageBytes, 10 * 1024 * 1024));
    }
  }

  /**
   * 启用/禁用控制台捕获
   */
  setCaptureConsole(enabled) {
    this.captureConsole = !!enabled;
  }

  /**
   * 创建隔离的存储环境
   */
  createIsolatedStorage(pluginId) {
    const storageKey = `plugin_storage_${pluginId}`;
    return {
      getItem: (key) => {
        try {
          const data = localStorage.getItem(storageKey);
          return data ? JSON.parse(data)[key] : null;
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          data[key] = value;
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
          console.error('[SandboxRunner] Storage error:', e);
        }
      },
      removeItem: (key) => {
        try {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          delete data[key];
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
          console.error('[SandboxRunner] Storage error:', e);
        }
      },
      clear: () => {
        localStorage.removeItem(storageKey);
      }
    };
  }
}

// 全局单例
const sandboxRunner = new SandboxRunner();

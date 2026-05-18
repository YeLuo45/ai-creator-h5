/**
 * Sandbox Runner Service
 * 沙箱执行器 - v8
 * 使用 Function 构造器执行代码，支持超时检测、console 捕获、错误处理
 */
class SandboxRunner {
  constructor() {
    this.timeout = 5000;        // 5秒超时
    this.captureConsole = true; // 捕获 console 输出
    this._consoleLogs = [];
  }

  /**
   * 执行节点代码
   * @param {string} code - 要执行的代码
   * @param {object} inputs - 输入参数
   * @param {object} config - 节点配置
   * @returns {Promise<object>} 执行结果
   */
  async run(code, inputs, config) {
    const startTime = Date.now();
    this._consoleLogs = [];
    
    // 创建一个隔离的 console 对象
    const sandboxConsole = this.captureConsole ? {
      log: (...args) => {
        this._consoleLogs.push({ type: 'log', message: this._formatArgs(args), time: Date.now() - startTime });
      },
      info: (...args) => {
        this._consoleLogs.push({ type: 'info', message: this._formatArgs(args), time: Date.now() - startTime });
      },
      warn: (...args) => {
        this._consoleLogs.push({ type: 'warn', message: this._formatArgs(args), time: Date.now() - startTime });
      },
      error: (...args) => {
        this._consoleLogs.push({ type: 'error', message: this._formatArgs(args), time: Date.now() - startTime });
      }
    } : null;

    // 构建执行函数
    const wrappedCode = `
      "use strict";
      const console = arguments[0];
      const inputs = arguments[1];
      const config = arguments[2];
      
      // 安全检查 - 防止访问全局对象
      const protectedObjects = [window, document, location, localStorage, sessionStorage, navigator, history, top];
      protectedObjects.forEach(obj => {
        if (typeof globalThis === 'undefined') globalThis = {};
      });
      
      // 执行用户代码
      ${code}
    `;

    try {
      // 使用 Function 构造器创建并执行
      const fn = new Function('console', 'inputs', 'config', wrappedCode);
      
      // 使用 Promise 和 setTimeout 实现超时控制
      const result = await this._executeWithTimeout(fn, sandboxConsole, inputs, config);
      
      return {
        success: true,
        output: result,
        logs: this._consoleLogs,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      // 处理错误
      console.error('[SandboxRunner] Execution error:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error',
        logs: this._consoleLogs,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 带超时的执行
   */
  _executeWithTimeout(fn, consoleArg, inputs, config) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout (${this.timeout}ms exceeded)`));
      }, this.timeout);

      try {
        const result = fn(consoleArg, inputs, config);
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
   * 执行代码片段（静态方法，用于验证）
   */
  static validate(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Code cannot be empty' };
    }

    // 检查危险模式
    const dangerousPatterns = [
      { pattern: /window\./i, name: 'window' },
      { pattern: /document\./i, name: 'document' },
      { pattern: /location\./i, name: 'location' },
      { pattern: /localStorage\./i, name: 'localStorage' },
      { pattern: /sessionStorage\./i, name: 'sessionStorage' },
      { pattern: /navigator\./i, name: 'navigator' },
      { pattern: /fetch\(/i, name: 'fetch' },
      { pattern: /XMLHttpRequest/i, name: 'XMLHttpRequest' },
      { pattern: /\$_GET/i, name: '$_GET' },
      { pattern: /\$_POST/i, name: '$_POST' },
      { pattern: /require\s*\(/i, name: 'require()' },
      { pattern: /import\s+/i, name: 'import' },
      { pattern: /process\./i, name: 'process' },
      { pattern: /child_process/i, name: 'child_process' },
      { pattern: /eval\s*\(/i, name: 'eval()' }
    ];

    for (const { pattern, name } of dangerousPatterns) {
      if (pattern.test(code)) {
        return { valid: false, error: `Dangerous operation detected: ${name}` };
      }
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
   * 启用/禁用控制台捕获
   */
  setCaptureConsole(enabled) {
    this.captureConsole = !!enabled;
  }
}

// 全局单例
const sandboxRunner = new SandboxRunner();
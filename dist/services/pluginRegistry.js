/**
 * Plugin Registry Service
 * 插件注册与管理服务 - v8
 */
class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.nodeTypes = new Map();
    this.storageKey = 'ai-creator-plugins-v8';
    this.builtInPlugins = this._initBuiltInPlugins();
  }

  // 初始化内置插件
  _initBuiltInPlugins() {
    return [
      {
        id: 'data-transform',
        name: '数据转换',
        description: 'JSON解析、CSV转换、日期格式化等数据处理节点',
        version: '1.0.0',
        author: '系统',
        category: 'data',
        icon: '📊',
        nodes: [
          {
            id: 'jsonParser',
            name: 'JSON Parser',
            description: '解析 JSON 字符串为对象',
            inputs: [
              { name: 'jsonString', type: 'string', label: 'JSON字符串', required: true }
            ],
            outputs: [
              { name: 'data', type: 'object', label: '解析结果' }
            ],
            code: `try { return JSON.parse(inputs.jsonString); } catch(e) { throw new Error('Invalid JSON: ' + e.message); }`,
            category: 'data-transform'
          },
          {
            id: 'csvToJson',
            name: 'CSV to JSON',
            description: '将 CSV 格式转换为 JSON 数组',
            inputs: [
              { name: 'csv', type: 'string', label: 'CSV数据', required: true }
            ],
            outputs: [
              { name: 'data', type: 'array', label: 'JSON数组' }
            ],
            code: `const lines = inputs.csv.trim().split('\\n'); const headers = lines[0].split(','); return lines.slice(1).map(line => { const values = line.split(','); const obj = {}; headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim()); return obj; });`,
            category: 'data-transform'
          },
          {
            id: 'dateFormatter',
            name: 'Date Formatter',
            description: '格式化日期时间',
            inputs: [
              { name: 'timestamp', type: 'number', label: '时间戳', required: true },
              { name: 'format', type: 'string', label: '格式', required: false }
            ],
            outputs: [
              { name: 'formatted', type: 'string', label: '格式化结果' }
            ],
            code: `return new Date(inputs.timestamp).toLocaleString(inputs.format || 'zh-CN');`,
            category: 'data-transform'
          }
        ]
      },
      {
        id: 'string-handle',
        name: '字符串处理',
        description: '正则匹配、替换、模板渲染等字符串操作节点',
        version: '1.0.0',
        author: '系统',
        category: 'string',
        icon: '✂️',
        nodes: [
          {
            id: 'regexMatch',
            name: 'Regex Match',
            description: '使用正则表达式匹配文本',
            inputs: [
              { name: 'text', type: 'string', label: '文本', required: true },
              { name: 'pattern', type: 'string', label: '正则模式', required: true }
            ],
            outputs: [
              { name: 'matches', type: 'array', label: '匹配结果' }
            ],
            code: `const re = new RegExp(inputs.pattern, 'g'); return inputs.text.match(re) || [];`,
            category: 'string-handle'
          },
          {
            id: 'stringReplace',
            name: 'String Replace',
            description: '替换字符串中的内容',
            inputs: [
              { name: 'text', type: 'string', label: '原文本', required: true },
              { name: 'search', type: 'string', label: '搜索内容', required: true },
              { name: 'replace', type: 'string', label: '替换内容', required: true }
            ],
            outputs: [
              { name: 'result', type: 'string', label: '结果' }
            ],
            code: `return inputs.text.split(inputs.search).join(inputs.replace);`,
            category: 'string-handle'
          },
          {
            id: 'templateRender',
            name: 'Template Render',
            description: '使用模板引擎渲染文本',
            inputs: [
              { name: 'template', type: 'string', label: '模板', required: true },
              { name: 'data', type: 'object', label: '数据', required: true }
            ],
            outputs: [
              { name: 'result', type: 'string', label: '渲染结果' }
            ],
            code: `return inputs.template.replace(/\\{(\\w+)\\}/g, (m, k) => inputs.data[k] ?? m);`,
            category: 'string-handle'
          }
        ]
      },
      {
        id: 'math-calc',
        name: '数学计算',
        description: '表达式求值、单位转换、随机数生成等数学计算节点',
        version: '1.0.0',
        author: '系统',
        category: 'math',
        icon: '🔢',
        nodes: [
          {
            id: 'expressionEval',
            name: 'Expression Eval',
            description: '计算数学表达式',
            inputs: [
              { name: 'expression', type: 'string', label: '表达式', required: true }
            ],
            outputs: [
              { name: 'result', type: 'number', label: '计算结果' }
            ],
            code: `return Function('"use strict"; return (' + inputs.expression + ')')();`,
            category: 'math-calc'
          },
          {
            id: 'unitConverter',
            name: 'Unit Converter',
            description: '长度单位转换',
            inputs: [
              { name: 'value', type: 'number', label: '数值', required: true },
              { name: 'from', type: 'string', label: '源单位', required: true },
              { name: 'to', type: 'string', label: '目标单位', required: true }
            ],
            outputs: [
              { name: 'result', type: 'number', label: '转换结果' }
            ],
            code: `const factors = { m: 1, cm: 0.01, mm: 0.001, km: 1000, in: 0.0254, ft: 0.3048 }; const f = factors[inputs.from], t = factors[inputs.to]; if (!f || !t) throw new Error('Unknown unit'); return inputs.value * f / t;`,
            category: 'math-calc'
          },
          {
            id: 'randomNumber',
            name: 'Random Number',
            description: '生成指定范围的随机整数',
            inputs: [
              { name: 'min', type: 'number', label: '最小值', required: true },
              { name: 'max', type: 'number', label: '最大值', required: true }
            ],
            outputs: [
              { name: 'result', type: 'number', label: '随机数' }
            ],
            code: `return Math.floor(Math.random() * (inputs.max - inputs.min + 1)) + inputs.min;`,
            category: 'math-calc'
          }
        ]
      }
    ];
  }

  // 初始化，加载已安装插件
  init() {
    this._registerBuiltInNodes();
    this.loadInstalledPlugins();
    console.log('[PluginRegistry] Initialized with', this.plugins.size, 'plugins');
  }

  // 注册内置节点
  _registerBuiltInNodes() {
    this.builtInPlugins.forEach(plugin => {
      this.registerPlugin(plugin);
    });
  }

  // 注册插件
  registerPlugin(plugin) {
    if (!plugin || !plugin.id) {
      console.warn('[PluginRegistry] Invalid plugin:', plugin);
      return false;
    }
    this.plugins.set(plugin.id, plugin);
    // 注册插件中的所有节点
    if (plugin.nodes && Array.isArray(plugin.nodes)) {
      plugin.nodes.forEach(node => {
        this.nodeTypes.set(node.id, { ...node, pluginId: plugin.id });
      });
    }
    console.log('[PluginRegistry] Registered plugin:', plugin.id);
    return true;
  }

  // 卸载插件
  unregisterPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    
    // 移除插件的所有节点
    if (plugin.nodes && Array.isArray(plugin.nodes)) {
      plugin.nodes.forEach(node => {
        this.nodeTypes.delete(node.id);
      });
    }
    this.plugins.delete(pluginId);
    console.log('[PluginRegistry] Unregistered plugin:', pluginId);
    return true;
  }

  // 获取插件信息
  getPlugin(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  // 列出所有插件（内置+已安装）
  listPlugins() {
    return Array.from(this.plugins.values());
  }

  // 列出所有节点类型（内置+插件）
  listNodeTypes() {
    return Array.from(this.nodeTypes.values());
  }

  // 获取节点类型详情
  getNodeType(nodeId) {
    return this.nodeTypes.get(nodeId) || null;
  }

  // 保存到 localStorage
  saveInstalledPlugins() {
    try {
      const pluginData = [];
      this.plugins.forEach((plugin, id) => {
        // 不保存内置插件
        if (!this._isBuiltInPlugin(id)) {
          pluginData.push(plugin);
        }
      });
      localStorage.setItem(this.storageKey, JSON.stringify(pluginData));
      console.log('[PluginRegistry] Saved', pluginData.length, 'installed plugins');
    } catch (e) {
      console.error('[PluginRegistry] Failed to save plugins:', e);
    }
  }

  // 从 localStorage 加载
  loadInstalledPlugins() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const plugins = JSON.parse(data);
        plugins.forEach(plugin => {
          this.registerPlugin(plugin);
        });
        console.log('[PluginRegistry] Loaded', plugins.length, 'installed plugins');
      }
    } catch (e) {
      console.error('[PluginRegistry] Failed to load plugins:', e);
    }
  }

  // 判断是否为内置插件
  _isBuiltInPlugin(pluginId) {
    return this.builtInPlugins.some(p => p.id === pluginId);
  }

  // 判断插件是否已安装
  isPluginInstalled(pluginId) {
    return this.plugins.has(pluginId);
  }

  // 按分类获取节点
  getNodesByCategory(category) {
    const nodes = [];
    this.nodeTypes.forEach(node => {
      if (node.category === category) {
        nodes.push(node);
      }
    });
    return nodes;
  }

  // 按插件获取节点
  getNodesByPlugin(pluginId) {
    const nodes = [];
    this.nodeTypes.forEach(node => {
      if (node.pluginId === pluginId) {
        nodes.push(node);
      }
    });
    return nodes;
  }

  // 验证节点代码（简单检查）
  validateNodeCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: '代码不能为空' };
    }
    // 检查危险操作
    const dangerousPatterns = [
      /window\./i,
      /document\./i,
      /location\./i,
      /localStorage\./i,
      /fetch\(/i,
      /XMLHttpRequest/i,
      /eval\(/i,
      /Function\(/i  // Function构造函数可能被滥用，但我们的SandboxRunner会处理
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return { valid: false, error: `代码包含危险操作: ${pattern}` };
      }
    }
    return { valid: true };
  }

  // 获取插件分类列表
  getCategories() {
    const categories = new Map();
    this.plugins.forEach(plugin => {
      if (!categories.has(plugin.category)) {
        categories.set(plugin.category, {
          id: plugin.category,
          name: plugin.name,
          icon: plugin.icon
        });
      }
    });
    return Array.from(categories.values());
  }
}

// 全局单例
const pluginRegistry = new PluginRegistry();
/**
 * Node Builder Service
 * 自定义节点构建器 - v8
 */
class NodeBuilder {
  constructor() {
    this.registry = window.pluginRegistry || pluginRegistry;
    this.customNodes = new Map();
    this.storageKey = 'ai-creator-custom-nodes-v8';
  }

  // 初始化
  init() {
    this.loadCustomNodes();
    console.log('[NodeBuilder] Initialized with', this.customNodes.size, 'custom nodes');
  }

  // 验证节点定义
  validateDefinition(definition) {
    const errors = [];

    // 必需字段
    if (!definition.id) {
      errors.push('节点ID不能为空');
    } else if (typeof definition.id !== 'string') {
      errors.push('节点ID必须是字符串');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(definition.id)) {
      errors.push('节点ID只能包含字母、数字、下划线和连字符');
    }

    if (!definition.name) {
      errors.push('节点名称不能为空');
    }

    if (!definition.code) {
      errors.push('执行代码不能为空');
    }

    // 验证输入输出
    if (!Array.isArray(definition.inputs)) {
      errors.push('输入定义必须是数组');
    }
    if (!Array.isArray(definition.outputs)) {
      errors.push('输出定义必须是数组');
    }

    // 验证代码安全性
    const codeValidation = this.registry.validateNodeCode(definition.code);
    if (!codeValidation.valid) {
      errors.push(codeValidation.error);
    }

    // 检查ID是否冲突
    const existingNode = this.registry.getNodeType(definition.id);
    if (existingNode) {
      errors.push(`节点ID "${definition.id}" 已存在`);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // 注册节点到 registry
  registerNode(definition) {
    const validation = this.validateDefinition(definition);
    if (!validation.valid) {
      console.error('[NodeBuilder] Validation failed:', validation.errors);
      return { success: false, errors: validation.errors };
    }

    // 添加默认属性
    const nodeDef = {
      id: definition.id,
      name: definition.name || definition.id,
      description: definition.description || '',
      category: definition.category || 'custom',
      inputs: definition.inputs || [],
      outputs: definition.outputs || [],
      code: definition.code,
      isCustom: true,
      configFields: definition.configFields || []
    };

    // 保存到自定义节点
    this.customNodes.set(definition.id, nodeDef);

    // 注册到全局 registry
    this.registry.nodeTypes.set(definition.id, nodeDef);

    // 保存到 localStorage
    this.saveCustomNodes();

    console.log('[NodeBuilder] Registered custom node:', definition.id);
    return { success: true, node: nodeDef };
  }

  // 卸载自定义节点
  unregisterNode(nodeId) {
    if (!this.customNodes.has(nodeId)) {
      return false;
    }
    this.customNodes.delete(nodeId);
    this.registry.nodeTypes.delete(nodeId);
    this.saveCustomNodes();
    console.log('[NodeBuilder] Unregistered custom node:', nodeId);
    return true;
  }

  // 创建节点 DOM 元素
  createNodeElement(nodeDefinition, nodeData) {
    const el = document.createElement('div');
    el.className = 'workflow-node custom-node';
    el.dataset.nodeId = nodeData.id;
    el.dataset.type = 'plugin';
    el.dataset.subtype = nodeDefinition.id;
    el.style.left = nodeData.x + 'px';
    el.style.top = nodeData.y + 'px';

    el.innerHTML = `
      <div class="node-header">
        <div class="node-icon" style="background: var(--primary);">🔧</div>
        <span class="node-name">${nodeDefinition.name}</span>
        <div class="node-status-badge"></div>
      </div>
      <div class="node-progress"><div class="node-progress-bar"></div></div>
      <div class="node-body">${nodeDefinition.description || ''}</div>
      <div class="node-port in"></div>
      <div class="node-port out"></div>
    `;

    return el;
  }

  // 生成配置表单
  generateConfigForm(nodeType, config) {
    const nodeDef = this.registry.getNodeType(nodeType);
    if (!nodeDef) {
      return '<div class="panel-section"><div class="panel-label">错误：未找到节点类型</div></div>';
    }

    let html = '';

    // 通用配置字段
    if (nodeDef.configFields && nodeDef.configFields.length > 0) {
      nodeDef.configFields.forEach(field => {
        const value = config[field.name] || field.default || '';
        const required = field.required ? '<span style="color:red">*</span>' : '';
        
        if (field.type === 'select') {
          html += `
            <div class="panel-section">
              <div class="panel-label">${field.label}${required}</div>
              <select class="panel-select" id="node-config-${field.name}" ${field.required ? 'required' : ''}>
                ${field.options.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          `;
        } else if (field.type === 'textarea') {
          html += `
            <div class="panel-section">
              <div class="panel-label">${field.label}${required}</div>
              <textarea class="panel-input" id="node-config-${field.name}" rows="3" ${field.required ? 'required' : ''}>${this._escHtml(value)}</textarea>
            </div>
          `;
        } else {
          html += `
            <div class="panel-section">
              <div class="panel-label">${field.label}${required}</div>
              <input type="${field.type || 'text'}" class="panel-input" id="node-config-${field.name}" value="${this._escHtml(value)}" ${field.required ? 'required' : ''}>
            </div>
          `;
        }
      });
    }

    // 如果没有配置字段，显示说明
    if (!html) {
      html = '<div class="panel-section"><div class="panel-label" style="color:var(--text-dim);font-size:12px;">此节点无额外配置</div></div>';
    }

    return html;
  }

  // 验证配置
  validateConfig(nodeType, config) {
    const nodeDef = this.registry.getNodeType(nodeType);
    if (!nodeDef) {
      return { valid: false, error: '未找到节点类型' };
    }

    // 验证必需的配置字段
    if (nodeDef.configFields) {
      for (const field of nodeDef.configFields) {
        if (field.required && !config[field.name]) {
          return { valid: false, error: `${field.label}不能为空` };
        }
      }
    }

    // 验证必需的输入
    for (const input of nodeDef.inputs) {
      if (input.required && !config.inputs?.[input.name]) {
        // 输入值可能在运行时才确定，这里只做预留检查
      }
    }

    return { valid: true };
  }

  // 保存自定义节点到 localStorage
  saveCustomNodes() {
    try {
      const nodesArray = Array.from(this.customNodes.values());
      localStorage.setItem(this.storageKey, JSON.stringify(nodesArray));
      console.log('[NodeBuilder] Saved', nodesArray.length, 'custom nodes');
    } catch (e) {
      console.error('[NodeBuilder] Failed to save custom nodes:', e);
    }
  }

  // 从 localStorage 加载自定义节点
  loadCustomNodes() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const nodes = JSON.parse(data);
        nodes.forEach(node => {
          node.isCustom = true;
          this.customNodes.set(node.id, node);
          this.registry.nodeTypes.set(node.id, node);
        });
        console.log('[NodeBuilder] Loaded', nodes.length, 'custom nodes');
      }
    } catch (e) {
      console.error('[NodeBuilder] Failed to load custom nodes:', e);
    }
  }

  // 获取所有自定义节点
  getCustomNodes() {
    return Array.from(this.customNodes.values());
  }

  // 获取自定义节点定义
  getCustomNode(nodeId) {
    return this.customNodes.get(nodeId) || null;
  }

  // HTML 转义
  _escHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// 全局单例
const nodeBuilder = new NodeBuilder();
/**
 * Plugin Market UI Service
 * 插件市场 UI 适配器 - v8
 */

/**
 * 初始化插件市场页面
 */
function initPluginMarket() {
  console.log('[PluginMarketUI] Initializing...');
  
  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupPluginMarketEventListeners();
      loadPluginList();
    });
  } else {
    setupPluginMarketEventListeners();
    loadPluginList();
  }
}

/**
 * 设置事件监听
 */
function setupPluginMarketEventListeners() {
  // 搜索
  const searchInput = document.getElementById('plugin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handlePluginSearch, 300));
  }

  // 分类筛选
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', handleCategoryFilter);
  });

  // 安装按钮事件代理
  document.addEventListener('click', e => {
    const installBtn = e.target.closest('.install-btn');
    if (installBtn) {
      const pluginId = installBtn.dataset.pluginId;
      if (installBtn.textContent.includes('已安装')) {
        uninstallPlugin(pluginId);
      } else {
        installPluginById(pluginId);
      }
    }
  });
}

/**
 * 加载插件列表
 */
function loadPluginList() {
  const container = document.getElementById('plugin-list-container');
  if (!container) {
    console.warn('[PluginMarketUI] Plugin list container not found');
    return;
  }

  const plugins = pluginRegistry.listPlugins();
  renderPluginList(plugins);
  updateCategoryButtons(plugins);
}

/**
 * 渲染插件卡片列表
 */
function renderPluginList(plugins) {
  const container = document.getElementById('plugin-list-container');
  if (!container) return;

  if (plugins.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <div class="empty-title">暂无插件</div>
        <div class="empty-desc">插件市场正在努力扩充中</div>
      </div>
    `;
    return;
  }

  let html = '';
  plugins.forEach(plugin => {
    const isInstalled = pluginRegistry.isPluginInstalled(plugin.id);
    const isBuiltIn = pluginRegistry._isBuiltInPlugin(plugin.id);
    
    html += `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <div class="plugin-header">
          <div class="plugin-icon">${plugin.icon || '📦'}</div>
          <div class="plugin-info">
            <div class="plugin-name">${escHtml(plugin.name)}</div>
            <div class="plugin-version">v${plugin.version || '1.0.0'}</div>
          </div>
          <span class="plugin-badge ${isInstalled ? 'installed' : ''}">${isInstalled ? '已安装' : (isBuiltIn ? '内置' : '未安装')}</span>
        </div>
        <div class="plugin-desc">${escHtml(plugin.description || '')}</div>
        <div class="plugin-meta">
          <span class="plugin-category">${getCategoryName(plugin.category)}</span>
          <span class="plugin-nodes">${plugin.nodes?.length || 0} 个节点</span>
        </div>
        <div class="plugin-actions">
          <button class="btn-small ${isInstalled ? 'danger' : 'primary'} install-btn" data-plugin-id="${plugin.id}">
            ${isInstalled ? '卸载' : '安装'}
          </button>
          <button class="btn-small" onclick="showPluginDetail('${plugin.id}')">详情</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * 显示插件详情弹窗
 */
function showPluginDetail(pluginId) {
  const plugin = pluginRegistry.getPlugin(pluginId);
  if (!plugin) {
    showToast('插件不存在');
    return;
  }

  const modal = document.getElementById('plugin-detail-modal');
  if (!modal) {
    console.warn('[PluginMarketUI] Detail modal not found');
    return;
  }

  // 填充详情
  const detailContent = document.getElementById('plugin-detail-content');
  if (detailContent) {
    let nodesHtml = '';
    if (plugin.nodes && plugin.nodes.length > 0) {
      nodesHtml = '<div class="detail-section"><div class="detail-title">节点列表</div>';
      plugin.nodes.forEach(node => {
        nodesHtml += `
          <div class="node-preview">
            <div class="node-preview-header">
              <span class="node-name">${escHtml(node.name)}</span>
              <span class="node-id">${escHtml(node.id)}</span>
            </div>
            <div class="node-desc">${escHtml(node.description || '')}</div>
            <div class="node-ports">
              <div class="node-inputs">
                <span class="port-label">输入:</span>
                ${node.inputs?.map(i => `<span class="port-item">${escHtml(i.label || i.name)}</span>`).join('') || '<span class="port-item">无</span>'}
              </div>
              <div class="node-outputs">
                <span class="port-label">输出:</span>
                ${node.outputs?.map(o => `<span class="port-item">${escHtml(o.label || o.name)}</span>`).join('') || '<span class="port-item">无</span>'}
              </div>
            </div>
          </div>
        `;
      });
      nodesHtml += '</div>';
    }

    detailContent.innerHTML = `
      <div class="detail-header">
        <div class="detail-icon">${plugin.icon || '📦'}</div>
        <div class="detail-info">
          <div class="detail-name">${escHtml(plugin.name)}</div>
          <div class="detail-version">版本 ${plugin.version || '1.0.0'}</div>
          <div class="detail-author">作者: ${escHtml(plugin.author || '未知')}</div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-title">描述</div>
        <div class="detail-desc">${escHtml(plugin.description || '暂无描述')}</div>
      </div>
      ${nodesHtml}
    `;
  }

  modal.classList.add('active');
}

/**
 * 安装插件
 */
function installPluginById(pluginId) {
  // 获取插件定义（从内置插件列表中获取）
  const builtInPlugins = getBuiltInPluginDefinitions();
  const pluginDef = builtInPlugins.find(p => p.id === pluginId);
  
  if (!pluginDef) {
    showToast('插件不存在');
    return;
  }

  // 注册插件
  pluginRegistry.registerPlugin(pluginDef);
  pluginRegistry.saveInstalledPlugins();
  
  showToast(`插件 "${pluginDef.name}" 安装成功`);
  loadPluginList();
}

/**
 * 卸载插件
 */
function uninstallPlugin(pluginId) {
  if (!confirm('确定要卸载此插件吗？')) return;

  pluginRegistry.unregisterPlugin(pluginId);
  pluginRegistry.saveInstalledPlugins();
  
  showToast('插件已卸载');
  loadPluginList();
}

/**
 * 显示自定义节点创建器
 */
function showNodeBuilder() {
  const modal = document.getElementById('node-builder-modal');
  if (!modal) {
    console.warn('[PluginMarketUI] Node builder modal not found');
    return;
  }

  // 重置表单
  const form = document.getElementById('node-builder-form');
  if (form) form.reset();

  // 清空预览
  const preview = document.getElementById('node-preview');
  if (preview) preview.innerHTML = '';

  // 清空错误
  const errorDiv = document.getElementById('node-builder-error');
  if (errorDiv) errorDiv.textContent = '';

  modal.classList.add('active');
}

/**
 * 渲染节点预览
 */
function renderNodePreview(definition) {
  const preview = document.getElementById('node-preview');
  if (!preview) return;

  if (!definition || !definition.name) {
    preview.innerHTML = '<div class="preview-placeholder">填写左侧信息后预览</div>';
    return;
  }

  preview.innerHTML = `
    <div class="preview-node">
      <div class="preview-header">
        <div class="preview-icon">🔧</div>
        <span class="preview-name">${escHtml(definition.name || '')}</span>
      </div>
      <div class="preview-desc">${escHtml(definition.description || '')}</div>
      <div class="preview-ports">
        <div class="preview-inputs">
          <span class="port-label">输入:</span>
          ${(definition.inputs || []).map(i => `<span class="port-tag">${escHtml(i.label || i.name)}</span>`).join('') || '<span class="port-tag none">无</span>'}
        </div>
        <div class="preview-outputs">
          <span class="port-label">输出:</span>
          ${(definition.outputs || []).map(o => `<span class="port-tag">${escHtml(o.label || o.name)}</span>`).join('') || '<span class="port-tag none">无</span>'}
        </div>
      </div>
    </div>
  `;
}

/**
 * 验证节点代码
 */
function validateNodeCode(code) {
  return SandboxRunner.validate(code);
}

/**
 * 提交节点定义
 */
function submitNodeDefinition(formData) {
  const definition = {
    id: formData.nodeId,
    name: formData.nodeName,
    description: formData.description,
    category: 'custom',
    inputs: parsePorts(formData.inputs),
    outputs: parsePorts(formData.outputs),
    code: formData.code,
    configFields: []
  };

  const nodeBuilder = window.nodeBuilder || nodeBuilder;
  const result = nodeBuilder.registerNode(definition);

  if (result.success) {
    showToast('节点创建成功');
    closeModal('node-builder-modal');
    
    // 触发自定义节点面板更新
    if (typeof onCustomNodeCreated === 'function') {
      onCustomNodeCreated(definition);
    }
  } else {
    const errorDiv = document.getElementById('node-builder-error');
    if (errorDiv) {
      errorDiv.textContent = result.errors.join(', ');
    }
  }
}

/**
 * 解析端口字符串
 */
function parsePorts(portStr) {
  if (!portStr) return [];
  return portStr.split(',').map(p => {
    const [name, label, type] = p.trim().split(':');
    return {
      name: name || '',
      label: label || name || '',
      type: type || 'string'
    };
  }).filter(p => p.name);
}

/**
 * 处理搜索
 */
function handlePluginSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const plugins = pluginRegistry.listPlugins();

  if (!query) {
    renderPluginList(plugins);
    return;
  }

  const filtered = plugins.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.description?.toLowerCase().includes(query) ||
    p.id.toLowerCase().includes(query)
  );

  renderPluginList(filtered);
}

/**
 * 处理分类筛选
 */
function handleCategoryFilter(e) {
  const category = e.target.dataset.category;
  
  // 更新按钮状态
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  const plugins = pluginRegistry.listPlugins();
  if (!category || category === 'all') {
    renderPluginList(plugins);
  } else {
    const filtered = plugins.filter(p => p.category === category);
    renderPluginList(filtered);
  }
}

/**
 * 更新分类按钮
 */
function updateCategoryButtons(plugins) {
  const categories = new Map();
  plugins.forEach(p => {
    if (!categories.has(p.category)) {
      categories.set(p.category, getCategoryName(p.category));
    }
  });

  const container = document.getElementById('category-filters');
  if (!container) return;

  let html = `<button class="category-btn active" data-category="all">全部</button>`;
  categories.forEach((name, id) => {
    html += `<button class="category-btn" data-category="${id}">${name}</button>`;
  });
  container.innerHTML = html;

  // 重新绑定事件
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', handleCategoryFilter);
  });
}

/**
 * 获取分类名称
 */
function getCategoryName(category) {
  const names = {
    data: '数据处理',
    string: '字符串',
    math: '数学计算',
    custom: '自定义',
    all: '全部'
  };
  return names[category] || category;
}

/**
 * 获取内置插件定义
 */
function getBuiltInPluginDefinitions() {
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

/**
 * HTML 转义
 */
function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 防抖
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 导出初始化函数
window.initPluginMarket = initPluginMarket;
window.showPluginDetail = showPluginDetail;
window.showNodeBuilder = showNodeBuilder;
window.renderNodePreview = renderNodePreview;
window.validateNodeCode = validateNodeCode;
window.submitNodeDefinition = submitNodeDefinition;
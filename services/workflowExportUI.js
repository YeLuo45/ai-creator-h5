/**
 * Workflow Export UI Service - v10
 * 导出 UI 适配器：导出面板、调度面板、触发器面板
 */

/**
 * 初始化导出面板
 */
function initExportPanel() {
  // 在 body 末尾添加导出相关的 DOM 结构
  const exportUI = document.createElement('div');
  exportUI.id = 'export-ui';
  exportUI.innerHTML = getExportUITemplate();
  document.body.appendChild(exportUI);
  
  // 绑定导出按钮事件
  bindExportEvents();
  
  console.log('[ExportUI] Export panel initialized');
}

/**
 * 获取导出 UI 模板
 */
function getExportUITemplate() {
  return `
    <!-- Export Modal -->
    <div class="modal-overlay" id="export-modal">
      <div class="modal" style="width: 560px;">
        <div class="modal-header">
          <span>📤 导出工作流</span>
          <button class="modal-close" onclick="closeModal('export-modal')">×</button>
        </div>
        <div class="modal-body" id="export-modal-body">
          <!-- 内容动态填充 -->
        </div>
      </div>
    </div>

    <!-- Scheduler Panel (Sidebar) -->
    <div class="scheduler-panel" id="scheduler-panel" style="
      position: fixed;
      right: -400px;
      top: 0;
      width: 380px;
      height: 100vh;
      background: var(--bg-panel);
      border-left: 1px solid var(--border);
      z-index: 900;
      transition: right 0.3s;
      overflow-y: auto;
      padding: 20px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: var(--text);">⏰ 调度任务</h3>
        <button class="modal-close" onclick="hideSchedulerPanel()">×</button>
      </div>
      <div id="scheduler-task-list">
        <!-- 任务列表动态填充 -->
      </div>
      <div style="margin-top: 20px;">
        <button class="toolbar-btn primary" style="width: 100%;" onclick="showAddSchedulerModal()">
          ➕ 添加调度任务
        </button>
      </div>
    </div>

    <!-- Trigger Panel (Sidebar) -->
    <div class="trigger-panel" id="trigger-panel" style="
      position: fixed;
      right: -400px;
      top: 0;
      width: 380px;
      height: 100vh;
      background: var(--bg-panel);
      border-left: 1px solid var(--border);
      z-index: 900;
      transition: right 0.3s;
      overflow-y: auto;
      padding: 20px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: var(--text);">⚡ 触发器</h3>
        <button class="modal-close" onclick="hideTriggerPanel()">×</button>
      </div>
      <div id="trigger-list">
        <!-- 触发器列表动态填充 -->
      </div>
      <div style="margin-top: 20px;">
        <button class="toolbar-btn primary" style="width: 100%;" onclick="showAddTriggerModal()">
          ➕ 添加触发器
        </button>
      </div>
    </div>

    <!-- Execution Report Modal -->
    <div class="modal-overlay" id="report-modal">
      <div class="modal" style="width: 600px;">
        <div class="modal-header">
          <span>📊 执行报告</span>
          <button class="modal-close" onclick="closeModal('report-modal')">×</button>
        </div>
        <div class="modal-body" id="report-modal-body">
          <!-- 报告内容动态填充 -->
        </div>
      </div>
    </div>

    <!-- Add Scheduler Modal -->
    <div class="modal-overlay" id="add-scheduler-modal">
      <div class="modal" style="width: 480px;">
        <div class="modal-header">
          <span>添加调度任务</span>
          <button class="modal-close" onclick="closeModal('add-scheduler-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="panel-section">
            <div class="panel-label">任务名称</div>
            <input type="text" class="panel-input" id="scheduler-name" placeholder="输入任务名称">
          </div>
          <div class="panel-section">
            <div class="panel-label">执行类型</div>
            <select class="panel-select" id="scheduler-type" onchange="updateSchedulerOptions()">
              <option value="interval">间隔执行</option>
              <option value="cron">Cron 表达式</option>
              <option value="oneshot">单次执行</option>
            </select>
          </div>
          <div class="panel-section" id="scheduler-interval-section">
            <div class="panel-label">执行间隔</div>
            <select class="panel-select" id="scheduler-interval">
              <option value="60000">每分钟</option>
              <option value="300000">每5分钟</option>
              <option value="900000">每15分钟</option>
              <option value="1800000">每30分钟</option>
              <option value="3600000" selected>每小时</option>
              <option value="86400000">每天</option>
            </select>
          </div>
          <div class="panel-section" id="scheduler-cron-section" style="display:none;">
            <div class="panel-label">Cron 表达式</div>
            <input type="text" class="panel-input" id="scheduler-cron" placeholder="* * * * *">
            <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">
              格式: 分 时 日 月 周<br>
              例如: 0 * * * * = 每小时
            </div>
          </div>
          <div style="margin-top: 20px;">
            <button class="btn-small primary" style="width:100%;" onclick="addSchedulerTask()">确认添加</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Trigger Modal -->
    <div class="modal-overlay" id="add-trigger-modal">
      <div class="modal" style="width: 480px;">
        <div class="modal-header">
          <span>添加触发器</span>
          <button class="modal-close" onclick="closeModal('add-trigger-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="panel-section">
            <div class="panel-label">触发器名称</div>
            <input type="text" class="panel-input" id="trigger-name" placeholder="输入触发器名称">
          </div>
          <div class="panel-section">
            <div class="panel-label">触发类型</div>
            <select class="panel-select" id="trigger-type">
              <option value="webhook">Webhook</option>
              <option value="schedule">定时触发</option>
              <option value="data_change">数据变化</option>
            </select>
          </div>
          <div class="panel-section" id="trigger-webhook-section">
            <div class="panel-label">Webhook URL</div>
            <div style="padding:8px 12px;background:var(--bg-dark);border-radius:6px;font-family:monospace;font-size:12px;color:var(--primary);word-break:break-all;" id="trigger-webhook-url">
              保存后生成
            </div>
          </div>
          <div class="panel-section" id="trigger-condition-section">
            <div class="panel-label">触发条件 (可选)</div>
            <input type="text" class="panel-input" id="trigger-condition-field" placeholder="字段路径，如 data.type">
            <select class="panel-select" id="trigger-condition-op" style="margin-top:8px;">
              <option value="equals">等于</option>
              <option value="not_equals">不等于</option>
              <option value="contains">包含</option>
              <option value="exists">存在</option>
            </select>
            <input type="text" class="panel-input" id="trigger-condition-value" placeholder="条件值" style="margin-top:8px;">
          </div>
          <div style="margin-top: 20px;">
            <button class="btn-small primary" style="width:100%;" onclick="addTriggerHandler()">确认添加</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Preview Modal -->
    <div class="modal-overlay" id="code-preview-modal">
      <div class="modal" style="width: 800px; max-height: 80vh;">
        <div class="modal-header">
          <span id="code-preview-title">代码预览</span>
          <button class="modal-close" onclick="closeModal('code-preview-modal')">×</button>
        </div>
        <div style="padding: 0 20px 16px; display: flex; gap: 8px;">
          <button class="btn-small primary" onclick="copyCode()">📋 复制代码</button>
          <button class="btn-small" onclick="downloadCode()">💾 下载</button>
        </div>
        <div class="modal-body" style="max-height: 500px; padding: 0 20px 20px;">
          <pre id="code-preview-content" style="
            background: var(--bg-dark);
            padding: 16px;
            border-radius: 8px;
            overflow: auto;
            max-height: 400px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.6;
            margin: 0;
          "></pre>
        </div>
      </div>
    </div>
  `;
}

/**
 * 绑定导出相关事件
 */
function bindExportEvents() {
  // 导出按钮
  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.onclick = showExportModal;
  }
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      showExportModal();
    }
  });
}

/**
 * 显示导出弹窗
 */
function showExportModal() {
  const modal = document.getElementById('export-modal');
  const body = document.getElementById('export-modal-body');
  
  if (!modal || !body) return;
  
  body.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div class="panel-label">导出格式</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
        <button class="toolbar-btn" onclick="selectExportFormat('json')" id="export-btn-json" style="padding: 16px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">📄</span>
          <span>JSON</span>
        </button>
        <button class="toolbar-btn" onclick="selectExportFormat('png')" id="export-btn-png" style="padding: 16px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">🖼️</span>
          <span>PNG</span>
        </button>
        <button class="toolbar-btn" onclick="selectExportFormat('html')" id="export-btn-html" style="padding: 16px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">🌐</span>
          <span>HTML</span>
        </button>
        <button class="toolbar-btn" onclick="selectExportFormat('js')" id="export-btn-js" style="padding: 16px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">📜</span>
          <span>JavaScript</span>
        </button>
        <button class="toolbar-btn" onclick="selectExportFormat('python')" id="export-btn-python" style="padding: 16px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">🐍</span>
          <span>Python</span>
        </button>
        <button class="toolbar-btn" onclick="selectExportFormat('code')" id="export-btn-code" style="padding: 16px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">💻</span>
          <span>代码预览</span>
        </button>
      </div>
    </div>
    <div id="export-options" style="display: none;">
      <!-- 导出选项动态填充 -->
    </div>
    <div id="export-preview" style="display: none; margin-top: 16px;">
      <!-- 预览内容 -->
    </div>
  `;
  
  modal.classList.add('active');
  
  // 默认选择 JSON
  window.currentExportFormat = 'json';
  document.getElementById('export-btn-json').classList.add('primary');
}

/**
 * 选择导出格式
 */
function selectExportFormat(format) {
  // 更新按钮状态
  document.querySelectorAll('[id^="export-btn-"]').forEach(btn => {
    btn.classList.remove('primary');
  });
  const selectedBtn = document.getElementById('export-btn-' + format);
  if (selectedBtn) {
    selectedBtn.classList.add('primary');
  }
  
  window.currentExportFormat = format;
  
  // 显示对应选项
  const optionsEl = document.getElementById('export-options');
  const previewEl = document.getElementById('export-preview');
  
  optionsEl.style.display = 'block';
  previewEl.style.display = 'block';
  
  renderExportOptions(format);
}

/**
 * 渲染导出选项
 */
function renderExportOptions(format) {
  const optionsEl = document.getElementById('export-options');
  const previewEl = document.getElementById('export-preview');
  
  let optionsHtml = '';
  let previewHtml = '';
  
  switch (format) {
    case 'json':
      optionsHtml = `
        <div style="padding: 12px; background: var(--bg-node); border-radius: 8px;">
          <div style="font-size: 13px; color: var(--text-dim);">
            导出完整的 JSON 格式工作流定义，包含所有节点、连接和配置信息。
          </div>
          <button class="btn-small primary" style="margin-top: 12px; width: 100%;" onclick="executeExport('json')">
            立即导出
          </button>
        </div>
      `;
      previewHtml = `<div style="color: var(--text-dim); font-size: 12px;">点击"立即导出"下载 JSON 文件</div>`;
      break;
      
    case 'png':
      optionsHtml = `
        <div style="padding: 12px; background: var(--bg-node); border-radius: 8px;">
          <div style="font-size: 13px; color: var(--text-dim);">
            将工作流导出为 PNG 图片，包含所有节点和连接线。
          </div>
          <button class="btn-small primary" style="margin-top: 12px; width: 100%;" onclick="executeExport('png')">
            立即导出
          </button>
        </div>
      `;
      previewHtml = `<div style="color: var(--text-dim); font-size: 12px;">点击"立即导出"下载 PNG 图片</div>`;
      break;
      
    case 'html':
      optionsHtml = `
        <div style="padding: 12px; background: var(--bg-node); border-radius: 8px;">
          <div style="font-size: 13px; color: var(--text-dim);">
            导出为独立的 HTML 文件，可直接在浏览器中打开和运行。
          </div>
          <button class="btn-small primary" style="margin-top: 12px; width: 100%;" onclick="executeExport('html')">
            立即导出
          </button>
        </div>
      `;
      previewHtml = `<div style="color: var(--text-dim); font-size: 12px;">点击"立即导出"下载 HTML 文件</div>`;
      break;
      
    case 'js':
      optionsHtml = `
        <div style="padding: 12px; background: var(--bg-node); border-radius: 8px;">
          <div style="font-size: 13px; color: var(--text-dim);">
            生成可执行的 JavaScript 代码，可在 Node.js 或浏览器中运行。
          </div>
          <button class="btn-small primary" style="margin-top: 12px; width: 100%;" onclick="executeExport('js')">
            立即导出
          </button>
        </div>
      `;
      previewHtml = `<div style="color: var(--text-dim); font-size: 12px;">点击"立即导出"下载 JS 文件</div>`;
      break;
      
    case 'python':
      optionsHtml = `
        <div style="padding: 12px; background: var(--bg-node); border-radius: 8px;">
          <div style="font-size: 13px; color: var(--text-dim);">
            生成可执行的 Python 代码，支持异步执行。
          </div>
          <button class="btn-small primary" style="margin-top: 12px; width: 100%;" onclick="executeExport('python')">
            立即导出
          </button>
        </div>
      `;
      previewHtml = `<div style="color: var(--text-dim); font-size: 12px;">点击"立即导出"下载 Python 文件</div>`;
      break;
      
    case 'code':
      optionsHtml = `
        <div style="padding: 12px; background: var(--bg-node); border-radius: 8px;">
          <div style="margin-bottom: 12px;">
            <div class="panel-label">选择代码语言</div>
            <select class="panel-select" id="code-language-select" onchange="updateCodePreview()">
              <option value="js">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
        </div>
      `;
      previewEl.innerHTML = '';
      setTimeout(() => updateCodePreview(), 0);
      break;
  }
  
  optionsEl.innerHTML = optionsHtml;
  if (format !== 'code') {
    previewEl.innerHTML = previewHtml;
  }
}

/**
 * 更新代码预览
 */
function updateCodePreview() {
  const language = document.getElementById('code-language-select')?.value || 'js';
  const previewEl = document.getElementById('export-preview');
  
  if (typeof codeGenerator === 'undefined') {
    previewEl.innerHTML = '<div style="color: var(--error);">代码生成器未加载</div>';
    return;
  }
  
  let code;
  if (language === 'js') {
    code = codeGenerator.generateJavaScript(state.workflow);
  } else {
    code = codeGenerator.generatePython(state.workflow);
  }
  
  previewEl.innerHTML = `
    <div style="max-height: 300px; overflow: auto; background: var(--bg-dark); border-radius: 8px; padding: 12px;">
      <pre style="margin: 0; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${escapeHtml(code)}</pre>
    </div>
    <div style="margin-top: 12px; display: flex; gap: 8px;">
      <button class="btn-small" onclick="showCodePreview('${language}')">全屏预览</button>
      <button class="btn-small primary" onclick="executeExport('${language}')">下载文件</button>
    </div>
  `;
  
  window.currentPreviewCode = code;
  window.currentPreviewLanguage = language;
}

/**
 * 显示代码预览（弹窗）
 */
function showCodePreview(language) {
  if (!window.currentPreviewCode) {
    updateCodePreview();
  }
  
  const modal = document.getElementById('code-preview-modal');
  const title = document.getElementById('code-preview-title');
  const content = document.getElementById('code-preview-content');
  
  if (title) title.textContent = language === 'python' ? 'Python 代码预览' : 'JavaScript 代码预览';
  if (content) content.textContent = window.currentPreviewCode;
  
  if (modal) modal.classList.add('active');
}

/**
 * 执行导出
 */
function executeExport(format) {
  if (!state.workflow || state.workflow.nodes.length === 0) {
    showToast('请先创建工作流');
    return;
  }
  
  const workflow = state.workflow;
  const filename = (workflow.name || 'workflow').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  
  switch (format) {
    case 'json':
      const json = workflowExport.exportToJSON(workflow);
      workflowExport.generateFile(JSON.stringify(json, null, 2), filename + '.json', 'application/json');
      showToast('已导出 JSON');
      WorkflowLogger?.success('已导出工作流 JSON');
      break;
      
    case 'png':
      workflowExport.exportToPNG(workflow).then(dataUrl => {
        workflowExport.generateFile(dataUrl, filename + '.png', 'image/png');
        showToast('已导出 PNG');
        WorkflowLogger?.success('已导出工作流 PNG');
      }).catch(err => {
        showToast('PNG 导出失败: ' + err.message);
      });
      return; // 异步操作
      
    case 'html':
      const html = workflowExport.exportToHTML(workflow);
      workflowExport.generateFile(html, filename + '.html', 'text/html');
      showToast('已导出 HTML');
      WorkflowLogger?.success('已导出工作流 HTML');
      break;
      
    case 'js':
      const jsCode = codeGenerator.generateJavaScript(workflow);
      workflowExport.generateFile(jsCode, filename + '.js', 'text/javascript');
      showToast('已导出 JavaScript');
      WorkflowLogger?.success('已导出工作流 JavaScript');
      break;
      
    case 'python':
      const pyCode = codeGenerator.generatePython(workflow);
      workflowExport.generateFile(pyCode, filename + '.py', 'text/x-python');
      showToast('已导出 Python');
      WorkflowLogger?.success('已导出工作流 Python');
      break;
  }
  
  closeModal('export-modal');
}

/**
 * 复制代码
 */
function copyCode() {
  if (window.currentPreviewCode) {
    navigator.clipboard.writeText(window.currentPreviewCode).then(() => {
      showToast('代码已复制到剪贴板');
    }).catch(() => {
      showToast('复制失败');
    });
  }
}

/**
 * 下载代码
 */
function downloadCode() {
  if (window.currentPreviewCode) {
    const ext = window.currentPreviewLanguage === 'python' ? 'py' : 'js';
    const mime = window.currentPreviewLanguage === 'python' ? 'text/x-python' : 'text/javascript';
    const filename = (state.workflow?.name || 'workflow').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    workflowExport.generateFile(window.currentPreviewCode, filename + '.' + ext, mime);
    showToast('代码已下载');
  }
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==================== 调度面板 ====================

/**
 * 显示调度管理面板
 */
function showSchedulerPanel() {
  const panel = document.getElementById('scheduler-panel');
  if (panel) {
    panel.style.right = '0';
    renderSchedulerTasks(scheduler.getTasks());
  }
}

/**
 * 隐藏调度管理面板
 */
function hideSchedulerPanel() {
  const panel = document.getElementById('scheduler-panel');
  if (panel) {
    panel.style.right = '-400px';
  }
}

/**
 * 渲染调度任务列表
 */
function renderSchedulerTasks(tasks) {
  const listEl = document.getElementById('scheduler-task-list');
  if (!listEl) return;
  
  if (tasks.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-dim);">
        <div style="font-size: 32px; margin-bottom: 12px;">⏰</div>
        <div>暂无调度任务</div>
        <div style="font-size: 12px; margin-top: 8px;">点击下方按钮添加定时调度</div>
      </div>
    `;
    return;
  }
  
  let html = '';
  tasks.forEach(task => {
    const nextRun = task.nextRun ? new Date(task.nextRun).toLocaleString('zh-CN') : 'N/A';
    const lastRun = task.lastRun ? new Date(task.lastRun).toLocaleString('zh-CN') : '从未执行';
    const intervalText = task.interval >= 86400000 ? Math.floor(task.interval / 86400000) + ' 天' :
                        task.interval >= 3600000 ? Math.floor(task.interval / 3600000) + ' 小时' :
                        task.interval >= 60000 ? Math.floor(task.interval / 60000) + ' 分钟' :
                        task.interval + ' ms';
    
    html += `
      <div style="background: var(--bg-node); border-radius: 8px; padding: 12px; margin-bottom: 12px; border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="font-size: 13px; font-weight: 500;">${escapeHtml(task.name)}</div>
          <label style="position: relative; display: inline-block; width: 40px; height: 20px;">
            <input type="checkbox" ${task.enabled ? 'checked' : ''} onchange="toggleSchedulerTask('${task.id}', this.checked)" 
                   style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${task.enabled ? 'var(--primary)' : 'var(--border)'}; transition: 0.3s; border-radius: 20px;">
              <span style="position: absolute; content: ''; height: 14px; width: 14px; left: ${task.enabled ? '22px' : '3px'}; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
        <div style="font-size: 11px; color: var(--text-dim);">
          <div style="margin-bottom: 4px;">间隔: ${intervalText}</div>
          <div style="margin-bottom: 4px;">下次执行: ${nextRun}</div>
          <div style="margin-bottom: 4px;">上次执行: ${lastRun}</div>
          <div>执行次数: ${task.runCount}</div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button class="btn-small" onclick="runSchedulerTaskNow('${task.id}')">▶ 立即执行</button>
          <button class="btn-small danger" onclick="deleteSchedulerTask('${task.id}')">🗑️ 删除</button>
        </div>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
}

/**
 * 显示添加调度弹窗
 */
function showAddSchedulerModal() {
  document.getElementById('scheduler-name').value = state.workflow?.name || '';
  document.getElementById('scheduler-interval').value = '3600000';
  document.getElementById('scheduler-cron').value = '';
  updateSchedulerOptions();
  openModal('add-scheduler-modal');
}

/**
 * 更新调度选项显示
 */
function updateSchedulerOptions() {
  const type = document.getElementById('scheduler-type')?.value;
  const intervalSection = document.getElementById('scheduler-interval-section');
  const cronSection = document.getElementById('scheduler-cron-section');
  
  if (intervalSection && cronSection) {
    intervalSection.style.display = type === 'interval' ? 'block' : 'none';
    cronSection.style.display = type === 'cron' ? 'block' : 'none';
  }
}

/**
 * 添加调度任务
 */
function addSchedulerTask() {
  const name = document.getElementById('scheduler-name')?.value?.trim();
  const type = document.getElementById('scheduler-type')?.value;
  const interval = parseInt(document.getElementById('scheduler-interval')?.value) || 3600000;
  const cron = document.getElementById('scheduler-cron')?.value;
  
  if (!name) {
    showToast('请输入任务名称');
    return;
  }
  
  const taskId = scheduler.addTask({
    name: name,
    workflowId: state.workflow?.id,
    workflow: state.workflow,
    type: type,
    interval: interval,
    cron: cron,
    enabled: true
  });
  
  closeModal('add-scheduler-modal');
  renderSchedulerTasks(scheduler.getTasks());
  showToast('调度任务已添加');
  WorkflowLogger?.info('已添加调度任务: ' + name);
}

/**
 * 切换调度任务状态
 */
function toggleSchedulerTask(taskId, enabled) {
  if (enabled) {
    scheduler.enableTask(taskId);
  } else {
    scheduler.disableTask(taskId);
  }
  renderSchedulerTasks(scheduler.getTasks());
}

/**
 * 立即执行调度任务
 */
async function runSchedulerTaskNow(taskId) {
  showToast('正在执行...');
  await scheduler.runTaskNow(taskId);
  renderSchedulerTasks(scheduler.getTasks());
}

/**
 * 删除调度任务
 */
function deleteSchedulerTask(taskId) {
  if (confirm('确定删除此调度任务？')) {
    scheduler.removeTask(taskId);
    renderSchedulerTasks(scheduler.getTasks());
    showToast('调度任务已删除');
  }
}

// ==================== 触发器面板 ====================

/**
 * 显示触发器管理面板
 */
function showTriggerPanel() {
  const panel = document.getElementById('trigger-panel');
  if (panel) {
    panel.style.right = '0';
    renderTriggerList(triggerManager.getAllTriggers());
  }
}

/**
 * 隐藏触发器管理面板
 */
function hideTriggerPanel() {
  const panel = document.getElementById('trigger-panel');
  if (panel) {
    panel.style.right = '-400px';
  }
}

/**
 * 渲染触发器列表
 */
function renderTriggerList(triggers) {
  const listEl = document.getElementById('trigger-list');
  if (!listEl) return;
  
  if (triggers.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-dim);">
        <div style="font-size: 32px; margin-bottom: 12px;">⚡</div>
        <div>暂无触发器</div>
        <div style="font-size: 12px; margin-top: 8px;">点击下方按钮添加触发器</div>
      </div>
    `;
    return;
  }
  
  let html = '';
  triggers.forEach(trigger => {
    const typeLabels = {
      webhook: '🌐 Webhook',
      schedule: '⏰ 定时',
      data_change: '📊 数据变化'
    };
    
    const lastTriggered = trigger.lastTriggered ? 
      new Date(trigger.lastTriggered).toLocaleString('zh-CN') : '从未触发';
    
    html += `
      <div style="background: var(--bg-node); border-radius: 8px; padding: 12px; margin-bottom: 12px; border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="font-size: 13px; font-weight: 500;">${escapeHtml(trigger.name)}</div>
          <label style="position: relative; display: inline-block; width: 40px; height: 20px;">
            <input type="checkbox" ${trigger.enabled ? 'checked' : ''} onchange="toggleTriggerHandler('${trigger.id}', this.checked)" 
                   style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${trigger.enabled ? 'var(--primary)' : 'var(--border)'}; transition: 0.3s; border-radius: 20px;">
              <span style="position: absolute; content: ''; height: 14px; width: 14px; left: ${trigger.enabled ? '22px' : '3px'}; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
        <div style="font-size: 11px; color: var(--text-dim);">
          <div style="margin-bottom: 4px;">类型: ${typeLabels[trigger.type] || trigger.type}</div>
          ${trigger.webhookUrl ? `<div style="margin-bottom: 4px; word-break: break-all;">URL: <span style="color: var(--primary);">${trigger.webhookUrl}</span></div>` : ''}
          <div style="margin-bottom: 4px;">触发次数: ${trigger.triggerCount}</div>
          <div>上次触发: ${lastTriggered}</div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          ${trigger.type === 'webhook' ? `<button class="btn-small" onclick="testTrigger('${trigger.id}')">🧪 测试</button>` : ''}
          <button class="btn-small danger" onclick="deleteTriggerHandler('${trigger.id}')">🗑️ 删除</button>
        </div>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
}

/**
 * 显示添加触发器弹窗
 */
function showAddTriggerModal() {
  document.getElementById('trigger-name').value = state.workflow?.name ? state.workflow.name + ' 触发器' : '';
  document.getElementById('trigger-type').value = 'webhook';
  document.getElementById('trigger-condition-field').value = '';
  document.getElementById('trigger-condition-value').value = '';
  updateTriggerOptions();
  openModal('add-trigger-modal');
}

/**
 * 更新触发器选项显示
 */
function updateTriggerOptions() {
  const type = document.getElementById('trigger-type')?.value;
  const webhookSection = document.getElementById('trigger-webhook-section');
  const conditionSection = document.getElementById('trigger-condition-section');
  
  if (webhookSection) {
    webhookSection.style.display = type === 'webhook' ? 'block' : 'none';
  }
  if (conditionSection) {
    conditionSection.style.display = type === 'webhook' ? 'block' : 'none';
  }
}

/**
 * 添加触发器
 */
function addTriggerHandler() {
  const name = document.getElementById('trigger-name')?.value?.trim();
  const type = document.getElementById('trigger-type')?.value;
  const conditionField = document.getElementById('trigger-condition-field')?.value;
  const conditionOp = document.getElementById('trigger-condition-op')?.value;
  const conditionValue = document.getElementById('trigger-condition-value')?.value;
  
  if (!name) {
    showToast('请输入触发器名称');
    return;
  }
  
  const conditions = [];
  if (conditionField) {
    conditions.push({
      field: conditionField,
      operator: conditionOp,
      value: conditionValue
    });
  }
  
  const triggerId = triggerManager.addTrigger({
    name: name,
    workflowId: state.workflow?.id,
    workflow: state.workflow,
    type: type,
    enabled: true,
    conditions: conditions
  });
  
  // 更新 webhook URL 显示
  const newTrigger = triggerManager.getAllTriggers().find(t => t.id === triggerId);
  if (newTrigger && newTrigger.webhookUrl) {
    document.getElementById('trigger-webhook-url').textContent = newTrigger.webhookUrl;
  }
  
  closeModal('add-trigger-modal');
  renderTriggerList(triggerManager.getAllTriggers());
  showToast('触发器已添加');
  WorkflowLogger?.info('已添加触发器: ' + name);
}

/**
 * 切换触发器状态
 */
function toggleTriggerHandler(triggerId, enabled) {
  if (enabled) {
    triggerManager.enableTrigger(triggerId);
  } else {
    triggerManager.disableTrigger(triggerId);
  }
  renderTriggerList(triggerManager.getAllTriggers());
}

/**
 * 测试触发器
 */
function testTrigger(triggerId) {
  triggerManager.simulateWebhook(triggerId, { _test: true });
  showToast('触发器已触发（测试）');
}

/**
 * 删除触发器
 */
function deleteTriggerHandler(triggerId) {
  if (confirm('确定删除此触发器？')) {
    triggerManager.removeTrigger(triggerId);
    renderTriggerList(triggerManager.getAllTriggers());
    showToast('触发器已删除');
  }
}

// ==================== 执行报告 ====================

/**
 * 显示执行报告
 */
function showExecutionReport(report) {
  const modal = document.getElementById('report-modal');
  const body = document.getElementById('report-modal-body');
  
  if (!modal || !body) return;
  
  const statusLabels = {
    success: '<span style="color: var(--success);">✅ 成功</span>',
    error: '<span style="color: var(--error);">❌ 失败</span>',
    running: '<span style="color: var(--warning);">⏳ 执行中</span>'
  };
  
  body.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 14px; font-weight: 600;">${escapeHtml(report.taskName || report.triggerName || '执行报告')}</div>
        ${statusLabels[report.status] || statusLabels.success}
      </div>
      <div style="font-size: 12px; color: var(--text-dim);">
        <div style="margin-bottom: 4px;">开始时间: ${report.startTime ? new Date(report.startTime).toLocaleString('zh-CN') : 'N/A'}</div>
        <div style="margin-bottom: 4px;">结束时间: ${report.endTime ? new Date(report.endTime).toLocaleString('zh-CN') : 'N/A'}</div>
        <div style="margin-bottom: 4px;">执行耗时: ${report.duration || 0}ms</div>
        ${report.runCount !== undefined ? `<div>执行次数: ${report.runCount}</div>` : ''}
        ${report.triggerCount !== undefined ? `<div>触发次数: ${report.triggerCount}</div>` : ''}
        ${report.error ? `<div style="color: var(--error); margin-top: 8px;">错误: ${escapeHtml(report.error)}</div>` : ''}
      </div>
    </div>
    ${report.results ? `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 8px;">执行结果</div>
        <pre style="background: var(--bg-dark); padding: 12px; border-radius: 6px; font-size: 11px; overflow: auto; max-height: 200px;">${escapeHtml(JSON.stringify(report.results, null, 2))}</pre>
      </div>
    ` : ''}
    <div style="text-align: right;">
      <button class="btn-small" onclick="closeModal('report-modal')">关闭</button>
    </div>
  `;
  
  modal.classList.add('active');
}

/**
 * 请求浏览器通知权限
 */
function requestNotification(title, body) {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🎨' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '🎨' });
        }
      });
    }
  }
}

// ==================== Toast 提示 ====================

/**
 * 显示 Toast 提示
 */
function showToast(message, duration = 2000) {
  let toast = document.getElementById('toast-message');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--bg-panel);
      border: 1px solid var(--border);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 2000;
      opacity: 0;
      transition: all 0.3s;
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, duration);
}

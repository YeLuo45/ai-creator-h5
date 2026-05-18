/**
 * Chat Editor UI Adapter
 * 对话编辑 UI 适配器
 */

// Chat panel state
let chatPanelVisible = false;
let chatInputEl = null;
let chatHistoryEl = null;

/**
 * Initialize chat editor
 */
function initChatEditor() {
  // Create chat panel HTML if not exists
  ensureChatPanelExists();
  
  // Get references
  chatInputEl = document.getElementById('chat-input');
  chatHistoryEl = document.getElementById('chat-history');
  
  // Bind events
  bindChatEvents();
  
  console.log('[ChatEditor] Initialized');
}

/**
 * Ensure chat panel exists in DOM
 */
function ensureChatPanelExists() {
  // Check if already exists
  if (document.getElementById('chat-panel')) return;
  
  // Create panel element
  const panel = document.createElement('div');
  panel.id = 'chat-panel';
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <span>💬 对话编辑</span>
      <button class="chat-close" id="chat-close-btn">×</button>
    </div>
    <div class="chat-history" id="chat-history">
      <div class="chat-welcome">
        <p>👋 欢迎使用对话编辑</p>
        <p>你可以用自然语言编辑工作流：</p>
        <ul>
          <li>• "在角色生成前添加配音节点"</li>
          <li>• "删除第3个节点"</li>
          <li>• "把配乐生成改名为背景音乐"</li>
          <li>• "在工作流中插入循环"</li>
        </ul>
      </div>
    </div>
    <div class="chat-input-container">
      <input type="text" id="chat-input" placeholder="输入命令..." class="chat-input">
      <button id="chat-send-btn" class="chat-send-btn">发送</button>
    </div>
  `;
  
  // Append to property panel
  const propPanel = document.querySelector('.property-panel .panel-content');
  if (propPanel) {
    propPanel.appendChild(panel);
  } else {
    document.body.appendChild(panel);
  }
  
  // Add chat panel styles
  injectChatStyles();
}

/**
 * Inject chat panel CSS styles
 */
function injectChatStyles() {
  if (document.getElementById('chat-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'chat-styles';
  style.textContent = `
    .chat-panel {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-top: 16px;
      display: none;
      flex-direction: column;
      height: 300px;
    }
    
    .chat-panel.active {
      display: flex;
    }
    
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 500;
    }
    
    .chat-close {
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 16px;
      padding: 0;
    }
    
    .chat-close:hover {
      color: var(--text);
    }
    
    .chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .chat-welcome {
      color: var(--text-dim);
    }
    
    .chat-welcome p {
      margin-bottom: 8px;
    }
    
    .chat-welcome ul {
      margin: 0;
      padding-left: 16px;
    }
    
    .chat-welcome li {
      margin-bottom: 4px;
    }
    
    .chat-message {
      margin-bottom: 10px;
      padding: 8px 10px;
      border-radius: 6px;
    }
    
    .chat-message.user {
      background: var(--primary);
      color: white;
      margin-left: 20px;
    }
    
    .chat-message.ai {
      background: var(--bg-node);
      color: var(--text);
      margin-right: 20px;
    }
    
    .chat-message.error {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error);
    }
    
    .chat-message .sender {
      font-size: 10px;
      opacity: 0.7;
      margin-bottom: 2px;
    }
    
    .chat-input-container {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid var(--border);
    }
    
    .chat-input {
      flex: 1;
      padding: 8px 10px;
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 12px;
    }
    
    .chat-input:focus {
      outline: none;
      border-color: var(--primary);
    }
    
    .chat-send-btn {
      padding: 8px 16px;
      background: var(--primary);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 12px;
    }
    
    .chat-send-btn:hover {
      background: var(--primary-dark);
    }
    
    /* AI Assistant section in palette */
    .ai-assist-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    
    .ai-assist-title {
      font-size: 11px;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .ai-input-container {
      display: flex;
      gap: 6px;
    }
    
    .ai-input {
      flex: 1;
      padding: 8px 10px;
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 12px;
    }
    
    .ai-input:focus {
      outline: none;
      border-color: var(--primary);
    }
    
    .ai-gen-btn {
      padding: 8px 12px;
      background: var(--primary);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
    }
    
    .ai-gen-btn:hover {
      background: var(--primary-dark);
    }
    
    /* Node recommendations */
    .recommend-section {
      margin-top: 12px;
    }
    
    .recommend-title {
      font-size: 11px;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .recommend-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .recommend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: var(--bg-node);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    .recommend-item:hover {
      border-color: var(--primary);
      background: var(--bg-dark);
    }
    
    .recommend-item .icon {
      font-size: 14px;
    }
    
    .recommend-item .label {
      flex: 1;
    }
    
    .recommend-item .reason {
      font-size: 10px;
      color: var(--text-dim);
    }
    
    /* Intent router config in property panel */
    .intent-config-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    
    .intent-rule-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: var(--bg-dark);
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .intent-rule-item .rule-name {
      flex: 1;
      font-size: 12px;
    }
    
    .intent-rule-item .rule-pattern {
      font-family: monospace;
      font-size: 11px;
      color: var(--primary);
    }
    
    .intent-rule-item .rule-actions {
      display: flex;
      gap: 4px;
    }
    
    .intent-rule-item button {
      padding: 4px 8px;
      background: none;
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 10px;
    }
    
    .intent-rule-item button:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Bind chat input events
 */
function bindChatEvents() {
  // Send button
  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) {
    sendBtn.onclick = handleChatSubmit;
  }
  
  // Enter key in input
  if (chatInputEl) {
    chatInputEl.onkeydown = e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
      }
    };
  }
  
  // Close button
  const closeBtn = document.getElementById('chat-close-btn');
  if (closeBtn) {
    closeBtn.onclick = hideChatPanel;
  }
}

/**
 * Handle chat submit
 */
function handleChatSubmit() {
  if (!chatInputEl || !chatEditor) return;
  
  const message = chatInputEl.value.trim();
  if (!message) return;
  
  // Add user message
  addUserMessage(message);
  chatInputEl.value = '';
  
  // Process command
  const result = chatEditor.processCommand(message);
  
  // Add AI response
  addAIMessage(result.message, result.success ? 'ai' : 'error');
  
  // If changes were made, update canvas
  if (result.changes && result.success) {
    if (typeof renderAllNodes === 'function') {
      renderAllNodes();
    }
    if (typeof renderConnections === 'function') {
      renderConnections();
    }
    if (typeof saveToURL === 'function') {
      saveToURL();
    }
    if (typeof updateNodeCount === 'function') {
      updateNodeCount();
    }
  }
}

/**
 * Show chat panel
 */
function showChatPanel() {
  const panel = document.getElementById('chat-panel');
  if (panel) {
    panel.classList.add('active');
    chatPanelVisible = true;
  }
}

/**
 * Hide chat panel
 */
function hideChatPanel() {
  const panel = document.getElementById('chat-panel');
  if (panel) {
    panel.classList.remove('active');
    chatPanelVisible = false;
  }
}

/**
 * Toggle chat panel visibility
 */
function toggleChatPanel() {
  if (chatPanelVisible) {
    hideChatPanel();
  } else {
    showChatPanel();
  }
}

/**
 * Render chat history
 */
function renderChatHistory(messages) {
  if (!chatHistoryEl) return;
  
  let html = '';
  messages.forEach(msg => {
    html += `<div class="chat-message user"><div class="sender">你</div>${escHtml(msg.user)}</div>`;
    html += `<div class="chat-message ai"><div class="sender">AI</div>${escHtml(msg.ai)}</div>`;
  });
  
  chatHistoryEl.innerHTML = html || '<div class="chat-welcome"><p>暂无对话记录</p></div>';
  scrollToBottom();
}

/**
 * Add user message to chat
 */
function addUserMessage(text) {
  if (!chatHistoryEl) return;
  
  const welcome = chatHistoryEl.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message user';
  msgDiv.innerHTML = `<div class="sender">你</div>${escHtml(text)}`;
  chatHistoryEl.appendChild(msgDiv);
  scrollToBottom();
}

/**
 * Add AI message to chat
 */
function addAIMessage(text, type = 'ai') {
  if (!chatHistoryEl) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${type}`;
  
  // Handle multi-line text (structure display)
  if (text.includes('\n')) {
    const lines = text.split('\n').map(line => {
      if (line.startsWith('📋') || line.startsWith('节点') || line.startsWith('连接')) {
        return `<div style="margin:4px 0;">${escHtml(line)}</div>`;
      }
      if (line.match(/^\d+\./)) {
        return `<div style="margin:4px 0 4px 16px;">${escHtml(line)}</div>`;
      }
      return escHtml(line);
    }).join('');
    msgDiv.innerHTML = `<div class="sender">AI</div>${lines}`;
  } else {
    msgDiv.innerHTML = `<div class="sender">AI</div>${escHtml(text)}`;
  }
  
  chatHistoryEl.appendChild(msgDiv);
  scrollToBottom();
}

/**
 * Render command execution result
 */
function renderCommandResult(result) {
  if (result.success) {
    addAIMessage(`✓ ${result.message}`, 'ai');
  } else {
    addAIMessage(`✗ ${result.message}`, 'error');
  }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  if (chatHistoryEl) {
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
  }
}

/**
 * Escape HTML helper
 */
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/**
 * Initialize node recommender UI
 */
function initNodeRecommender() {
  // Add recommendation section to palette
  const palette = document.querySelector('.node-palette');
  if (!palette) return;
  
  // Check if already initialized
  if (document.getElementById('recommend-section')) return;
  
  const recommendSection = document.createElement('div');
  recommendSection.id = 'recommend-section';
  recommendSection.className = 'recommend-section';
  recommendSection.innerHTML = `
    <div class="recommend-title">🌟 为你推荐</div>
    <div class="recommend-list" id="recommend-list">
      <div style="color:var(--text-dim);font-size:11px;text-align:center;padding:8px;">加载中...</div>
    </div>
  `;
  
  palette.appendChild(recommendSection);
  
  // Load recommendations
  updateNodeRecommendations();
}

/**
 * Update node recommendations display
 */
function updateNodeRecommendations() {
  const listEl = document.getElementById('recommend-list');
  if (!listEl) return;
  
  // Get recommendations from nodeRecommender
  const recommendations = nodeRecommender?.getRecommendations?.({
    selectedNode: state?.selectedNodeId ? state.workflow.nodes.find(n => n.id === state.selectedNodeId) : null,
    existingNodes: state?.workflow?.nodes || [],
    connections: state?.workflow?.connections || []
  }) || [];
  
  if (recommendations.length === 0) {
    listEl.innerHTML = '<div style="color:var(--text-dim);font-size:11px;text-align:center;padding:8px;">暂无推荐</div>';
    return;
  }
  
  let html = '';
  recommendations.forEach(rec => {
    const reasonLabel = {
      'compatible': '可连接',
      'sequential': '推荐顺序',
      'popular': '热门'
    };
    html += `
      <div class="recommend-item" data-type="${rec.type}" data-subtype="${rec.subtype}" title="${rec.desc || ''}">
        <span class="icon">${rec.icon || '📦'}</span>
        <span class="label">${rec.label || rec.subtype}</span>
        <span class="reason">${reasonLabel[rec.reason] || rec.reason || ''}</span>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
  
  // Bind click events
  listEl.querySelectorAll('.recommend-item').forEach(item => {
    item.onclick = () => {
      const type = item.dataset.type;
      const subtype = item.dataset.subtype;
      if (type && subtype && typeof addNode === 'function') {
        // Add at center of canvas
        const canvas = document.getElementById('canvas-container');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = (rect.width / 2 - state.pan.x) / state.zoom;
          const y = (rect.height / 2 - state.pan.y) / state.zoom;
          pushUndoState();
          addNode(type, subtype, x, y);
          showToast(`已添加 ${item.querySelector('.label').textContent}`);
        }
      }
    };
  });
}

/**
 * Generate workflow from natural language (AI assist)
 */
function handleAIGenerate(input) {
  if (!input || !workflowAIGen) return;
  
  try {
    const workflow = workflowAIGen.generateWorkflow(input);
    const preview = workflowAIGen.previewWorkflow(workflow);
    
    // Show preview to user
    const previewText = `📋 预览工作流: ${workflow.name}
节点数: ${preview.nodeCount}
连接数: ${preview.connectionCount}
流程: ${preview.flow}
预估时间: ${Math.round(preview.estimatedTime / 1000)}s

是否导入到画布？`;
    
    // Create confirm dialog
    const confirmed = confirm(previewText);
    if (confirmed) {
      // Import to canvas
      const imported = workflowAIGen.importToCanvas(workflow);
      state.workflow = imported;
      renderAllNodes();
      renderConnections();
      saveToURL();
      updateNodeCount();
      showToast('工作流已导入');
    }
  } catch (e) {
    showToast('生成失败: ' + e.message);
  }
}

/**
 * Add AI assist input to palette
 */
function initAIAssistInput() {
  const palette = document.querySelector('.node-palette');
  if (!palette) return;
  
  if (document.getElementById('ai-assist-section')) return;
  
  const aiSection = document.createElement('div');
  aiSection.id = 'ai-assist-section';
  aiSection.className = 'ai-assist-section';
  aiSection.innerHTML = `
    <div class="ai-assist-title">✨ AI 助手</div>
    <div class="ai-input-container">
      <input type="text" id="ai-gen-input" class="ai-input" placeholder="描述想要的工作流...">
      <button id="ai-gen-btn" class="ai-gen-btn">生成</button>
    </div>
  `;
  
  palette.appendChild(aiSection);
  
  // Bind events
  const aiInput = document.getElementById('ai-gen-input');
  const aiBtn = document.getElementById('ai-gen-btn');
  
  if (aiBtn) {
    aiBtn.onclick = () => {
      const input = aiInput?.value.trim();
      if (input) {
        handleAIGenerate(input);
        aiInput.value = '';
      }
    };
  }
  
  if (aiInput) {
    aiInput.onkeydown = e => {
      if (e.key === 'Enter') {
        const input = aiInput.value.trim();
        if (input) {
          handleAIGenerate(input);
          aiInput.value = '';
        }
      }
    };
  }
}
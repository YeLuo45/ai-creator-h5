// ============ v27 Knowledge Panel UI Service ============
// Knowledge graph visualization, search UI, and recommendation display

const WorkflowKnowledgePanel = {
  panel: null,
  canvas: null,
  ctx: null,
  isOpen: false,

  // Canvas state
  canvasState: {
    nodes: [],
    edges: [],
    selectedNode: null,
    hoveredNode: null,
    dragging: null,
    panning: false,
    panOffset: { x: 0, y: 0 },
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },

  // Initialize panel
  init() {
    this.panel = document.getElementById('knowledge-panel');
    this.canvas = document.getElementById('knowledge-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupCanvas();
      this.bindCanvasEvents();
    }
    console.log('[KnowledgePanel] Knowledge Panel UI initialized');
  },

  // Show knowledge panel
  showKnowledgePanel() {
    if (!this.panel) this.init();
    this.panel = document.getElementById('knowledge-panel');
    if (this.panel) {
      this.panel.classList.add('active');
      this.isOpen = true;
      this.refreshPanel();
    }
  },

  // Close knowledge panel
  closeKnowledgePanel() {
    if (this.panel) {
      this.panel.classList.remove('active');
      this.isOpen = false;
    }
  },

  // Toggle knowledge panel
  toggleKnowledgePanel() {
    if (this.isOpen) {
      this.closeKnowledgePanel();
    } else {
      this.showKnowledgePanel();
    }
  },

  // Refresh panel content
  refreshPanel() {
    this.loadGraphTab();
    this.updateStats();
  },

  // Load graph tab content
  loadGraphTab() {
    const content = document.getElementById('knowledge-content');
    if (!content) return;

    const vizData = WorkflowKnowledgeGraph.getVisualizationData({ showAll: true });
    this.canvasState.nodes = vizData.nodes;
    this.canvasState.edges = vizData.edges;

    content.innerHTML = `
      <div class="knowledge-toolbar">
        <button class="knowledge-tool-btn" onclick="WorkflowKnowledgePanel.zoomIn()">➕ 放大</button>
        <button class="knowledge-tool-btn" onclick="WorkflowKnowledgePanel.zoomOut()">➖ 缩小</button>
        <button class="knowledge-tool-btn" onclick="WorkflowKnowledgePanel.resetView()">🏠 重置</button>
        <button class="knowledge-tool-btn" onclick="WorkflowKnowledgePanel.fitToScreen()">📐 适应屏幕</button>
        <button class="knowledge-tool-btn" onclick="WorkflowKnowledgePanel.refreshGraph()">🔄 刷新</button>
      </div>
      <div class="knowledge-canvas-container">
        <canvas id="knowledge-canvas" width="700" height="350"></canvas>
      </div>
      <div class="knowledge-node-info" id="knowledge-node-info">
        <div class="knowledge-info-placeholder">点击节点查看详情</div>
      </div>
    `;

    // Re-init canvas after DOM update
    setTimeout(() => {
      this.canvas = document.getElementById('knowledge-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.bindCanvasEvents();
        this.render();
      }
    }, 10);
  },

  // Load search tab content
  loadSearchTab() {
    const content = document.getElementById('knowledge-content');
    if (!content) return;

    content.innerHTML = `
      <div class="knowledge-search-box">
        <input type="text" id="knowledge-search-input" class="knowledge-search-input"
               placeholder="搜索节点、关系... (支持语义搜索)"
               oninput="WorkflowKnowledgePanel.handleSearchInput(this.value)"
               onkeydown="if(event.key==='Enter')WorkflowKnowledgePanel.executeSearch()">
        <button class="knowledge-search-btn" onclick="WorkflowKnowledgePanel.executeSearch()">🔍 搜索</button>
      </div>
      <div class="knowledge-search-suggestions" id="knowledge-search-suggestions"></div>
      <div class="knowledge-search-results" id="knowledge-search-results">
        <div class="knowledge-search-placeholder">输入关键词搜索知识图谱中的节点和关系</div>
      </div>
      <div class="knowledge-search-history">
        <div class="knowledge-section-title">📜 搜索历史</div>
        <div class="knowledge-history-list" id="knowledge-history-list">
          ${this.renderSearchHistory()}
        </div>
      </div>
    `;
  },

  // Render search history
  renderSearchHistory() {
    const history = WorkflowKnowledgeGraph.search.history.slice(-10).reverse();
    if (history.length === 0) {
      return '<div class="knowledge-empty-text">暂无搜索历史</div>';
    }
    return history.map(h => `
      <div class="knowledge-history-item" onclick="WorkflowKnowledgePanel.replaySearch('${h.query.replace(/'/g, "\\'")}')">
        <span class="knowledge-history-query">${h.query}</span>
        <span class="knowledge-history-time">${this.formatTime(h.timestamp)}</span>
      </div>
    `).join('');
  },

  // Handle search input
  handleSearchInput(value) {
    const suggestionsEl = document.getElementById('knowledge-search-suggestions');
    if (!suggestionsEl) return;

    if (value.length < 2) {
      suggestionsEl.innerHTML = '';
      return;
    }

    const suggestions = WorkflowKnowledgeGraph.getSearchSuggestions(value);
    if (suggestions.length > 0) {
      suggestionsEl.innerHTML = suggestions.map(s => `
        <div class="knowledge-suggestion-item" onclick="WorkflowKnowledgePanel.selectSuggestion('${s.query.replace(/'/g, "\\'")}')">
          ${s.isCommon ? '<span class="knowledge-suggestion-common">常用</span>' : ''}
          <span class="knowledge-suggestion-text">${s.query}</span>
          ${s.frequency > 0 ? `<span class="knowledge-suggestion-freq">${s.frequency}次</span>` : ''}
        </div>
      `).join('');
    } else {
      suggestionsEl.innerHTML = '';
    }
  },

  // Select suggestion
  selectSuggestion(query) {
    document.getElementById('knowledge-search-input').value = query;
    document.getElementById('knowledge-search-suggestions').innerHTML = '';
    this.executeSearch();
  },

  // Replay search from history
  replaySearch(query) {
    document.getElementById('knowledge-search-input').value = query;
    this.executeSearch();
  },

  // Execute search
  executeSearch() {
    const input = document.getElementById('knowledge-search-input');
    const resultsEl = document.getElementById('knowledge-search-results');
    if (!input || !resultsEl) return;

    const query = input.value.trim();
    if (!query) return;

    // Get context boost from currently selected node
    const contextBoost = {};
    if (state && state.selectedNodeId) {
      contextBoost.nodeId = state.selectedNodeId;
      contextBoost.type = 'workflow_node';
    }

    const results = WorkflowKnowledgeGraph.semanticSearch(query, {
      limit: 15,
      contextBoost
    });

    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="knowledge-no-results">
          <div class="knowledge-no-results-icon">🔍</div>
          <div>未找到匹配结果</div>
          <div class="knowledge-no-results-hint">尝试使用不同的关键词</div>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = `
      <div class="knowledge-results-header">
        <span>找到 ${results.length} 个结果</span>
      </div>
      <div class="knowledge-results-list">
        ${results.map(r => this.renderSearchResult(r)).join('')}
      </div>
    `;
  },

  // Render search result item
  renderSearchResult(result) {
    const { entity, score, matchedTokens } = result;
    const scorePercent = Math.round(score * 100);
    const scoreClass = scorePercent > 70 ? 'high' : scorePercent > 40 ? 'medium' : 'low';

    return `
      <div class="knowledge-result-item" onclick="WorkflowKnowledgePanel.selectEntity('${entity.id}')">
        <div class="knowledge-result-header">
          <span class="knowledge-result-type">${this.getEntityTypeIcon(entity.type)}</span>
          <span class="knowledge-result-label">${entity.label}</span>
          <span class="knowledge-result-score ${scoreClass}">${scorePercent}%</span>
        </div>
        <div class="knowledge-result-props">
          ${Object.entries(entity.properties || {}).slice(0, 3).map(([k, v]) =>
            `<span class="knowledge-result-prop"><b>${k}:</b> ${JSON.stringify(v).slice(0, 30)}</span>`
          ).join('')}
        </div>
        ${matchedTokens.length > 0 ? `
          <div class="knowledge-result-matched">
            ${matchedTokens.map(t => `<span class="knowledge-matched-token">${t}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  // Get entity type icon
  getEntityTypeIcon(type) {
    const icons = {
      'workflow': '📋',
      'workflow_node': '📦',
      'variable': '🔣',
      'connection': '🔗',
      'default': '📌'
    };
    return icons[type] || icons['default'];
  },

  // Select entity in graph
  selectEntity(entityId) {
    const entity = WorkflowKnowledgeGraph.graph.entities[entityId];
    if (!entity) return;

    this.canvasState.selectedNode = entityId;
    this.highlightNode(entityId);
    this.showNodeInfo(entity);
    this.render();
  },

  // Show node info panel
  showNodeInfo(entity) {
    const infoEl = document.getElementById('knowledge-node-info');
    if (!infoEl) return;

    infoEl.innerHTML = `
      <div class="knowledge-info-header">
        <span class="knowledge-info-icon">${this.getEntityTypeIcon(entity.type)}</span>
        <span class="knowledge-info-label">${entity.label}</span>
      </div>
      <div class="knowledge-info-section">
        <div class="knowledge-info-title">基本信息</div>
        <div class="knowledge-info-row"><span>ID:</span><code>${entity.id}</code></div>
        <div class="knowledge-info-row"><span>类型:</span><span>${entity.type}</span></div>
        <div class="knowledge-info-row"><span>创建:</span><span>${this.formatTime(entity.createdAt)}</span></div>
        <div class="knowledge-info-row"><span>更新:</span><span>${this.formatTime(entity.updatedAt)}</span></div>
      </div>
      <div class="knowledge-info-section">
        <div class="knowledge-info-title">属性</div>
        ${Object.entries(entity.properties || {}).map(([k, v]) => `
          <div class="knowledge-info-row"><span>${k}:</span><span>${JSON.stringify(v)}</span></div>
        `).join('')}
      </div>
      <div class="knowledge-info-section">
        <div class="knowledge-info-title">关系</div>
        <div class="knowledge-info-relations">
          ${this.getEntityRelations(entity.id)}
        </div>
      </div>
      <div class="knowledge-info-actions">
        <button class="knowledge-action-btn" onclick="WorkflowKnowledgePanel.focusOnNode('${entity.id}')">🔍 聚焦</button>
        <button class="knowledge-action-btn" onclick="WorkflowKnowledgePanel.showNodeRecommendations('${entity.id}')">💡 推荐</button>
      </div>
    `;
  },

  // Get entity relations HTML
  getEntityRelations(entityId) {
    const relations = WorkflowKnowledgeGraph.graph.relations.filter(r =>
      r.source === entityId || r.target === entityId
    );

    if (relations.length === 0) {
      return '<div class="knowledge-empty-text">暂无关系</div>';
    }

    return relations.slice(0, 5).map(r => {
      const otherId = r.source === entityId ? r.target : r.source;
      const other = WorkflowKnowledgeGraph.graph.entities[otherId];
      const direction = r.source === entityId ? '→' : '←';
      return `
        <div class="knowledge-relation-item" onclick="WorkflowKnowledgePanel.selectEntity('${otherId}')">
          <span>${direction}</span>
          <span>${this.getEntityTypeIcon(other?.type)}</span>
          <span>${other?.label || otherId}</span>
          <span class="knowledge-relation-type">${r.type}</span>
        </div>
      `;
    }).join('');
  },

  // Load recommendations tab
  loadRecommendationsTab() {
    const content = document.getElementById('knowledge-content');
    if (!content) return;

    const nodeRecs = state.selectedNodeId
      ? WorkflowKnowledgeGraph.getNodeRecommendations(state.selectedNodeId, { limit: 8 })
      : [];

    const collabRecs = WorkflowKnowledgeGraph.getCollaborativeRecommendations('current_user', { limit: 8 });
    const realtimeUpdates = WorkflowKnowledgeGraph.getRealTimeUpdates();

    content.innerHTML = `
      <div class="knowledge-recommendations-grid">
        <div class="knowledge-rec-section">
          <div class="knowledge-section-title">📦 节点推荐</div>
          ${state.selectedNodeId ? `
            <div class="knowledge-rec-context">基于当前选中节点: <b>${WorkflowKnowledgeGraph.graph.entities[state.selectedNodeId]?.label || state.selectedNodeId}</b></div>
            <div class="knowledge-rec-list">
              ${nodeRecs.length > 0 ? nodeRecs.map(r => this.renderRecommendation(r)).join('') : '<div class="knowledge-empty-text">暂无推荐</div>'}
            </div>
          ` : '<div class="knowledge-empty-text">选择一个节点查看推荐</div>'}
        </div>

        <div class="knowledge-rec-section">
          <div class="knowledge-section-title">👥 热门节点</div>
          <div class="knowledge-rec-list">
            ${collabRecs.length > 0 ? collabRecs.map(r => this.renderCollabRecommendation(r)).join('') : '<div class="knowledge-empty-text">暂无数据</div>'}
          </div>
        </div>

        <div class="knowledge-rec-section">
          <div class="knowledge-section-title">⚡ 实时更新</div>
          <div class="knowledge-rec-list">
            ${realtimeUpdates.length > 0 ? realtimeUpdates.map(u => `
              <div class="knowledge-realtime-item">
                <span class="knowledge-realtime-icon">${u.icon || '💡'}</span>
                <span class="knowledge-realtime-text">${u.message}</span>
                <span class="knowledge-realtime-time">${this.formatTime(u.timestamp)}</span>
              </div>
            `).join('') : '<div class="knowledge-empty-text">暂无实时更新</div>'}
          </div>
        </div>
      </div>
    `;
  },

  // Render recommendation item
  renderRecommendation(rec) {
    const { entity, reason, score, relationType } = rec;
    const scorePercent = Math.round(score * 100);
    const reasonLabels = {
      'connected': '已连接',
      'similar_type': '同类型',
      'complementary': '可搭配'
    };

    return `
      <div class="knowledge-rec-item" onclick="WorkflowKnowledgePanel.selectEntity('${entity.id}')">
        <div class="knowledge-rec-header">
          <span class="knowledge-rec-icon">${this.getEntityTypeIcon(entity.type)}</span>
          <span class="knowledge-rec-label">${entity.label}</span>
          <span class="knowledge-rec-score">${scorePercent}%</span>
        </div>
        <div class="knowledge-rec-meta">
          <span class="knowledge-rec-reason">${reasonLabels[reason] || reason}</span>
          <span class="knowledge-rec-type">${relationType}</span>
        </div>
      </div>
    `;
  },

  // Render collaborative recommendation
  renderCollabRecommendation(rec) {
    const { nodeType, confidence, reason, basedOn } = rec;
    const scorePercent = Math.round(confidence * 100);

    return `
      <div class="knowledge-rec-item collab">
        <div class="knowledge-rec-header">
          <span class="knowledge-rec-icon">📦</span>
          <span class="knowledge-rec-label">${nodeType}</span>
          <span class="knowledge-rec-score">${scorePercent}%</span>
        </div>
        <div class="knowledge-rec-meta">
          <span class="knowledge-rec-reason">${reason}</span>
          <span class="knowledge-rec-type">${basedOn}</span>
        </div>
      </div>
    `;
  },

  // Show node recommendations
  showNodeRecommendations(nodeId) {
    this.switchTab('recommendations');
    // Force reload with specific node
    const content = document.getElementById('knowledge-content');
    if (content) {
      const recs = WorkflowKnowledgeGraph.getNodeRecommendations(nodeId, { limit: 8 });
      // Update just the node recommendations section
      const recSection = content.querySelector('.knowledge-rec-section');
      if (recSection) {
        recSection.innerHTML = `
          <div class="knowledge-section-title">📦 节点推荐</div>
          <div class="knowledge-rec-context">基于选中节点</div>
          <div class="knowledge-rec-list">
            ${recs.length > 0 ? recs.map(r => this.renderRecommendation(r)).join('') : '<div class="knowledge-empty-text">暂无推荐</div>'}
          </div>
        `;
      }
    }
  },

  // Load analytics tab
  loadAnalyticsTab() {
    const content = document.getElementById('knowledge-content');
    if (!content) return;

    const searchStats = WorkflowKnowledgeGraph.getSearchStats();
    const graphStats = WorkflowKnowledgeGraph.getGraphStats();

    content.innerHTML = `
      <div class="knowledge-analytics-grid">
        <div class="knowledge-analytics-section">
          <div class="knowledge-section-title">📊 搜索分析</div>
          <div class="knowledge-analytics-stats">
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${searchStats.totalSearches}</div>
              <div class="knowledge-stat-label">总搜索次数</div>
            </div>
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${searchStats.searchesLastDay}</div>
              <div class="knowledge-stat-label">今日搜索</div>
            </div>
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${searchStats.uniqueQueries}</div>
              <div class="knowledge-stat-label">独立查询</div>
            </div>
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${searchStats.avgClickPosition}</div>
              <div class="knowledge-stat-label">平均点击位置</div>
            </div>
          </div>
          <div class="knowledge-section-subtitle">🔥 热门搜索</div>
          <div class="knowledge-top-queries">
            ${searchStats.topQueries.slice(0, 5).map(q => `
              <div class="knowledge-top-query">
                <span class="knowledge-top-query-text">${q.query}</span>
                <span class="knowledge-top-query-count">${q.count}次</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="knowledge-analytics-section">
          <div class="knowledge-section-title">🕸️ 知识图谱统计</div>
          <div class="knowledge-analytics-stats">
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${graphStats.totalEntities}</div>
              <div class="knowledge-stat-label">实体数量</div>
            </div>
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${graphStats.totalRelations}</div>
              <div class="knowledge-stat-label">关系数量</div>
            </div>
            <div class="knowledge-stat-card">
              <div class="knowledge-stat-value">${graphStats.embeddingCount}</div>
              <div class="knowledge-stat-label">向量嵌入</div>
            </div>
          </div>
          <div class="knowledge-section-subtitle">📂 实体类型分布</div>
          <div class="knowledge-distribution">
            ${Object.entries(graphStats.entityTypes).map(([type, count]) => `
              <div class="knowledge-dist-item">
                <span class="knowledge-dist-label">${type}</span>
                <div class="knowledge-dist-bar">
                  <div class="knowledge-dist-fill" style="width: ${(count / graphStats.totalEntities * 100)}%"></div>
                </div>
                <span class="knowledge-dist-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="knowledge-analytics-section">
          <div class="knowledge-section-title">🔗 关系类型分布</div>
          <div class="knowledge-distribution">
            ${Object.entries(graphStats.relationTypes).map(([type, count]) => `
              <div class="knowledge-dist-item">
                <span class="knowledge-dist-label">${type}</span>
                <div class="knowledge-dist-bar">
                  <div class="knowledge-dist-fill relation" style="width: ${(count / graphStats.totalRelations * 100)}%"></div>
                </div>
                <span class="knowledge-dist-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // Update stats in header
  updateStats() {
    const statsEl = document.getElementById('knowledge-stats');
    if (!statsEl) return;

    const graphStats = WorkflowKnowledgeGraph.getGraphStats();
    const searchStats = WorkflowKnowledgeGraph.getSearchStats();

    statsEl.innerHTML = `
      <span class="knowledge-stat">📦 ${graphStats.totalEntities}</span>
      <span class="knowledge-stat">🔗 ${graphStats.totalRelations}</span>
      <span class="knowledge-stat">🔍 ${searchStats.totalSearches}</span>
    `;
  },

  // ============ Canvas Rendering ============

  // Setup canvas
  setupCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 700;
    this.canvas.height = rect.height || 350;
    this.render();
  },

  // Bind canvas events
  bindCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
  },

  // Get mouse position relative to canvas
  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.canvasState.offsetX) / this.canvasState.scale,
      y: (e.clientY - rect.top - this.canvasState.offsetY) / this.canvasState.scale
    };
  },

  // Find node at position
  findNodeAt(x, y) {
    const hitRadius = 30;
    for (let i = this.canvasState.nodes.length - 1; i >= 0; i--) {
      const node = this.canvasState.nodes[i];
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  },

  // Mouse down handler
  onMouseDown(e) {
    const pos = this.getMousePos(e);
    const node = this.findNodeAt(pos.x, pos.y);

    if (node) {
      this.canvasState.dragging = node;
      this.canvasState.selectedNode = node.id;
    } else {
      this.canvasState.panning = true;
      this.canvasState.panStart = { x: e.clientX, y: e.clientY };
    }
  },

  // Mouse move handler
  onMouseMove(e) {
    const pos = this.getMousePos(e);

    if (this.canvasState.dragging) {
      // Drag node
      this.canvasState.dragging.x = pos.x;
      this.canvasState.dragging.y = pos.y;
      WorkflowKnowledgeGraph.updateNodePosition(this.canvasState.dragging.id, pos.x, pos.y);
      this.render();
    } else if (this.canvasState.panning) {
      // Pan canvas
      const dx = e.clientX - this.canvasState.panStart.x;
      const dy = e.clientY - this.canvasState.panStart.y;
      this.canvasState.offsetX += dx;
      this.canvasState.offsetY += dy;
      this.canvasState.panStart = { x: e.clientX, y: e.clientY };
      this.render();
    } else {
      // Hover effect
      const node = this.findNodeAt(pos.x, pos.y);
      this.canvasState.hoveredNode = node?.id || null;
      this.canvas.style.cursor = node ? 'pointer' : 'grab';
      this.render();
    }
  },

  // Mouse up handler
  onMouseUp(e) {
    if (this.canvasState.dragging) {
      // Record user action
      WorkflowKnowledgeGraph.recordUserAction('move', 'node', this.canvasState.dragging.id);
    }
    this.canvasState.dragging = null;
    this.canvasState.panning = false;
  },

  // Wheel handler for zoom
  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, this.canvasState.scale * delta));

    // Zoom towards mouse position
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.canvasState.offsetX = mouseX - (mouseX - this.canvasState.offsetX) * (newScale / this.canvasState.scale);
    this.canvasState.offsetY = mouseY - (mouseY - this.canvasState.offsetY) * (newScale / this.canvasState.scale);
    this.canvasState.scale = newScale;

    this.render();
  },

  // Double click handler
  onDoubleClick(e) {
    const pos = this.getMousePos(e);
    const node = this.findNodeAt(pos.x, pos.y);
    if (node) {
      this.selectEntity(node.id);
      this.showNodeRecommendations(node.id);
    }
  },

  // Zoom in
  zoomIn() {
    this.canvasState.scale = Math.min(3, this.canvasState.scale * 1.2);
    this.render();
  },

  // Zoom out
  zoomOut() {
    this.canvasState.scale = Math.max(0.3, this.canvasState.scale * 0.8);
    this.render();
  },

  // Reset view
  resetView() {
    this.canvasState.scale = 1;
    this.canvasState.offsetX = 0;
    this.canvasState.offsetY = 0;
    this.render();
  },

  // Fit to screen
  fitToScreen() {
    if (this.canvasState.nodes.length === 0) return;

    const xs = this.canvasState.nodes.map(n => n.x);
    const ys = this.canvasState.nodes.map(n => n.y);
    const minX = Math.min(...xs) - 50;
    const maxX = Math.max(...xs) + 50;
    const minY = Math.min(...ys) - 50;
    const maxY = Math.max(...ys) + 50;

    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    const scaleX = canvasW / graphW;
    const scaleY = canvasH / graphH;
    this.canvasState.scale = Math.min(scaleX, scaleY, 2);

    this.canvasState.offsetX = (canvasW - graphW * this.canvasState.scale) / 2 - minX * this.canvasState.scale;
    this.canvasState.offsetY = (canvasH - graphH * this.canvasState.scale) / 2 - minY * this.canvasState.scale;

    this.render();
  },

  // Refresh graph
  refreshGraph() {
    const vizData = WorkflowKnowledgeGraph.getVisualizationData({ showAll: true });
    this.canvasState.nodes = vizData.nodes;
    this.canvasState.edges = vizData.edges;
    this.fitToScreen();
  },

  // Focus on specific node
  focusOnNode(nodeId) {
    const node = this.canvasState.nodes.find(n => n.id === nodeId);
    if (node) {
      this.canvasState.offsetX = this.canvas.width / 2 - node.x * this.canvasState.scale;
      this.canvasState.offsetY = this.canvas.height / 2 - node.y * this.canvasState.scale;
      this.canvasState.selectedNode = nodeId;
      this.render();
    }
  },

  // Highlight node
  highlightNode(nodeId) {
    // Find connected nodes and highlight them
    const connected = WorkflowKnowledgeGraph.bfs(nodeId, 1).map(n => n.id);
    this.canvasState.highlightedNodes = new Set([nodeId, ...connected]);
    this.render();
  },

  // Main render function
  render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const canvas = this.canvas;

    // Clear canvas
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(this.canvasState.offsetX, this.canvasState.offsetY);
    ctx.scale(this.canvasState.scale, this.canvasState.scale);

    // Draw edges
    this.canvasState.edges.forEach(edge => {
      const sourceNode = this.canvasState.nodes.find(n => n.id === edge.source);
      const targetNode = this.canvasState.nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        this.drawEdge(ctx, sourceNode, targetNode, edge);
      }
    });

    // Draw nodes
    this.canvasState.nodes.forEach(node => {
      this.drawNode(ctx, node);
    });

    ctx.restore();
  },

  // Draw edge
  drawEdge(ctx, source, target, edge) {
    const isHighlighted = this.canvasState.highlightedNodes?.has(source.id) &&
                         this.canvasState.highlightedNodes?.has(target.id);

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);

    // Curved line
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const curve = isHighlighted ? 0.2 : 0.1;
    const ctrlX = midX - dy * curve;
    const ctrlY = midY + dx * curve;

    ctx.quadraticCurveTo(ctrlX, ctrlY, target.x, target.y);

    ctx.strokeStyle = isHighlighted ? '#6366F1' : '#333355';
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();

    // Draw arrow
    const angle = Math.atan2(target.y - ctrlY, target.x - ctrlX);
    const arrowLen = 8;
    const arrowX = target.x - 25 * Math.cos(angle);
    const arrowY = target.y - 25 * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle - 0.4), arrowY - arrowLen * Math.sin(angle - 0.4));
    ctx.lineTo(arrowX - arrowLen * Math.cos(angle + 0.4), arrowY - arrowLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = isHighlighted ? '#6366F1' : '#333355';
    ctx.fill();
  },

  // Draw node
  drawNode(ctx, node) {
    const isSelected = this.canvasState.selectedNode === node.id;
    const isHovered = this.canvasState.hoveredNode === node.id;
    const isHighlighted = this.canvasState.highlightedNodes?.has(node.id);

    const radius = 25;
    const color = this.getNodeColor(node.type);

    // Glow effect for selected/hovered
    if (isSelected || isHovered || isHighlighted) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#FFFFFF' : '#4A4A6A';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getEntityTypeIcon(node.type), node.x, node.y);

    // Label
    ctx.fillStyle = '#E0E0FF';
    ctx.font = '11px sans-serif';
    ctx.fillText(node.label.slice(0, 12), node.x, node.y + radius + 14);
  },

  // Get node color by type
  getNodeColor(type) {
    const colors = {
      'workflow': '#6366F1',
      'workflow_node': '#10B981',
      'variable': '#F59E0B',
      'connection': '#EF4444',
      'default': '#8B5CF6'
    };
    return colors[type] || colors['default'];
  },

  // ============ Tab Switching ============

  currentTab: 'graph',

  // Switch tab
  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.knowledge-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Load tab content
    switch (tab) {
      case 'graph':
        this.loadGraphTab();
        break;
      case 'search':
        this.loadSearchTab();
        break;
      case 'recommendations':
        this.loadRecommendationsTab();
        break;
      case 'analytics':
        this.loadAnalyticsTab();
        break;
    }
  },

  // ============ Utility Functions ============

  formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

    return date.toLocaleDateString('zh-CN');
  }
};

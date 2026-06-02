// ============ v27 Knowledge Graph Service ============
// Knowledge graph integration, semantic search, and intelligent recommendation

const WorkflowKnowledgeGraph = {
  // Graph data structure
  graph: {
    entities: {},    // nodeId -> { id, type, label, properties, embeddings }
    relations: [],   // [{ source, target, type, weight, properties }]
    embeddings: {}   // entityId -> TF-IDF vector
  },

  // Search system
  search: {
    history: [],          // [{ query, timestamp, results }]
    contextCache: {},     // cached search contexts
    tfidfModel: null      // TF-IDF model
  },

  // Recommendation system
  recommendation: {
    userBehavior: {},     // { nodeType: count }
    collaborativeData: [], // simulated collaborative filtering data
    realTimeUpdates: []   // pending real-time updates
  },

  // Initialize knowledge graph
  init() {
    this.loadGraph();
    this.initTFIDF();
    this.loadSearchHistory();
    this.loadUserBehavior();
    this.buildGraphFromWorkflow();
    console.log('[KnowledgeGraph] Knowledge Graph Service initialized');
  },

  // ============ Knowledge Graph Core ============

  // Load graph from localStorage
  loadGraph() {
    try {
      const saved = localStorage.getItem('wf_knowledge_graph');
      if (saved) {
        const data = JSON.parse(saved);
        this.graph = data.graph || this.graph;
        this.search.history = data.searchHistory || [];
        this.recommendation.userBehavior = data.userBehavior || {};
      }
    } catch (e) {
      console.warn('[KnowledgeGraph] Failed to load graph:', e);
    }
  },

  // Save graph to localStorage
  saveGraph() {
    try {
      localStorage.setItem('wf_knowledge_graph', JSON.stringify({
        graph: this.graph,
        searchHistory: this.search.history,
        userBehavior: this.recommendation.userBehavior
      }));
    } catch (e) {
      console.warn('[KnowledgeGraph] Failed to save graph:', e);
    }
  },

  // Build graph from current workflow
  buildGraphFromWorkflow() {
    if (!state || !state.workflow) return;

    // Add workflow entity
    this.addEntity('workflow', 'workflow', state.workflow.name || 'Current Workflow', {
      nodeCount: state.workflow.nodes?.length || 0,
      connectionCount: state.workflow.connections?.length || 0
    });

    // Add node entities
    (state.workflow.nodes || []).forEach(node => {
      this.addEntity(node.id, 'workflow_node', node.name || nodeNames[node.type] || node.type, {
        type: node.type,
        status: node.status || 'idle',
        config: node.config || {}
      });
    });

    // Add connection relations
    (state.workflow.connections || []).forEach(conn => {
      this.addRelation(conn.source, conn.target, 'data_flow', 1.0, {});
    });

    // Add node type relationships
    this.inferTypeRelations();
  },

  // Add entity to graph
  addEntity(id, type, label, properties = {}) {
    const entity = {
      id,
      type,
      label,
      properties,
      createdAt: this.graph.entities[id]?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    this.graph.entities[id] = entity;

    // Generate embedding for text fields
    if (label) {
      this.graph.embeddings[id] = this.computeEmbedding(label + ' ' + JSON.stringify(properties));
    }

    return entity;
  },

  // Add relation to graph
  addRelation(source, target, type, weight = 1.0, properties = {}) {
    const relation = {
      id: `${source}_${type}_${target}`,
      source,
      target,
      type,
      weight,
      properties,
      createdAt: Date.now()
    };

    // Remove existing relation if present
    this.graph.relations = this.graph.relations.filter(r =>
      !(r.source === source && r.target === target && r.type === type)
    );

    this.graph.relations.push(relation);
    return relation;
  },

  // Infer type-based relationships
  inferTypeRelations() {
    const nodesByType = {};
    (state.workflow.nodes || []).forEach(node => {
      const type = node.type;
      if (!nodesByType[type]) nodesByType[type] = [];
      nodesByType[type].push(node.id);
    });

    // Connect nodes of same type
    Object.entries(nodesByType).forEach(([type, nodeIds]) => {
      if (nodeIds.length > 1) {
        for (let i = 0; i < nodeIds.length - 1; i++) {
          this.addRelation(nodeIds[i], nodeIds[i + 1], 'same_type', 0.5, { type });
        }
      }
    });
  },

  // ============ Graph Traversal & Reasoning ============

  // DFS traversal from a node
  dfs(startId, maxDepth = 3) {
    const visited = new Set();
    const result = [];

    const traverse = (nodeId, depth) => {
      if (depth > maxDepth || visited.has(nodeId)) return;
      visited.add(nodeId);

      const entity = this.graph.entities[nodeId];
      if (entity) {
        result.push({ ...entity, depth });
      }

      // Find outgoing relations
      this.graph.relations
        .filter(r => r.source === nodeId)
        .forEach(r => traverse(r.target, depth + 1));
    };

    traverse(startId, 0);
    return result;
  },

  // BFS traversal from a node
  bfs(startId, maxDepth = 3) {
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];
    const result = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth > maxDepth || visited.has(id)) continue;
      visited.add(id);

      const entity = this.graph.entities[id];
      if (entity) {
        result.push({ ...entity, depth });
      }

      // Add children to queue
      this.graph.relations
        .filter(r => r.source === id)
        .forEach(r => queue.push({ id: r.target, depth: depth + 1 }));
    }

    return result;
  },

  // Find path between two nodes
  findPath(startId, endId) {
    const visited = new Set();
    const path = [];

    const dfs = (nodeId, targetId) => {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);
      path.push(nodeId);

      if (nodeId === targetId) return true;

      const children = this.graph.relations
        .filter(r => r.source === nodeId)
        .map(r => r.target);

      for (const child of children) {
        if (dfs(child, targetId)) return true;
      }

      path.pop();
      return false;
    };

    return dfs(startId, endId) ? path : null;
  },

  // Reasoning engine - infer new relationships
  inferRelationships() {
    const newRelations = [];

    // Infer based on co-occurrence
    Object.entries(this.graph.entities).forEach(([id, entity]) => {
      if (entity.type === 'workflow_node') {
        // Find related nodes by type
        const sameTypeNodes = Object.values(this.graph.entities)
          .filter(e => e.type === 'workflow_node' && e.properties.type === entity.properties.type && e.id !== id);

        sameTypeNodes.forEach(related => {
          if (!this.hasRelation(id, related.id)) {
            newRelations.push(this.addRelation(id, related.id, 'inferred_related', 0.3, { reason: 'same_type' }));
          }
        });
      }
    });

    return newRelations;
  },

  // Check if relation exists
  hasRelation(source, target) {
    return this.graph.relations.some(r =>
      (r.source === source && r.target === target) ||
      (r.source === target && r.target === source)
    );
  },

  // ============ Semantic Search (TF-IDF) ============

  // Initialize TF-IDF model
  initTFIDF() {
    this.search.tfidfModel = {
      documents: [],
      vocabulary: {},
      idf: {}
    };
  },

  // Compute TF-IDF embedding for text
  computeEmbedding(text) {
    const tokens = this.tokenize(text);
    const tf = {};
    tokens.forEach(token => {
      tf[token] = (tf[token] || 0) + 1;
    });

    // Normalize TF
    const maxTf = Math.max(...Object.values(tf), 1);
    Object.keys(tf).forEach(token => {
      tf[token] = tf[token] / maxTf;
    });

    return { tf, tokens };
  },

  // Simple tokenization
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  },

  // Compute IDF values
  computeIDF(documents) {
    const N = documents.length;
    const df = {};

    documents.forEach(doc => {
      const tokens = new Set(this.tokenize(doc));
      tokens.forEach(token => {
        df[token] = (df[token] || 0) + 1;
      });
    });

    const idf = {};
    Object.keys(df).forEach(token => {
      idf[token] = Math.log(N / df[token]) + 1;
    });

    return idf;
  },

  // Compute cosine similarity between two vectors
  cosineSimilarity(vec1, vec2) {
    const allTokens = new Set([...Object.keys(vec1.tf || {}), ...Object.keys(vec2.tf || {})]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allTokens.forEach(token => {
      const v1 = vec1.tf?.[token] || 0;
      const v2 = vec2.tf?.[token] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });

    return norm1 && norm2 ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
  },

  // Search entities by semantic similarity
  semanticSearch(query, options = {}) {
    const { limit = 10, minScore = 0.1, contextBoost = {} } = options;

    const queryEmbedding = this.computeEmbedding(query);
    const results = [];

    Object.entries(this.graph.entities).forEach(([id, entity]) => {
      const entityEmbedding = this.graph.embeddings[id] || this.computeEmbedding(entity.label);

      let score = this.cosineSimilarity(queryEmbedding, entityEmbedding);

      // Apply context boost
      if (contextBoost.nodeId && this.isConnected(id, contextBoost.nodeId)) {
        score *= 1.5;
      }
      if (contextBoost.type && entity.type === contextBoost.type) {
        score *= 1.2;
      }

      // Boost by relation weight
      if (contextBoost.nodeId) {
        const relation = this.graph.relations.find(r =>
          (r.source === contextBoost.nodeId && r.target === id) ||
          (r.target === contextBoost.nodeId && r.source === id)
        );
        if (relation) {
          score *= (0.8 + relation.weight * 0.4);
        }
      }

      if (score >= minScore) {
        results.push({
          entity,
          score,
          matchedTokens: this.getMatchedTokens(queryEmbedding, entityEmbedding)
        });
      }
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Learn from this search
    this.learnFromSearch(query, results.slice(0, 5));

    return results.slice(0, limit);
  },

  // Get matched tokens between query and entity
  getMatchedTokens(queryEmb, entityEmb) {
    const matched = [];
    const queryTokens = new Set(queryEmb.tokens || []);
    (entityEmb.tokens || []).forEach(token => {
      if (queryTokens.has(token)) {
        matched.push(token);
      }
    });
    return matched;
  },

  // Check if two nodes are connected
  isConnected(nodeId1, nodeId2) {
    return this.graph.relations.some(r =>
      (r.source === nodeId1 && r.target === nodeId2) ||
      (r.source === nodeId2 && r.target === nodeId1)
    );
  },

  // ============ Search History Learning ============

  // Load search history
  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('wf_search_history');
      if (saved) {
        this.search.history = JSON.parse(saved);
      }
    } catch (e) {
      this.search.history = [];
    }
  },

  // Save search history
  saveSearchHistory() {
    try {
      // Keep last 100 searches
      this.search.history = this.search.history.slice(-100);
      localStorage.setItem('wf_search_history', JSON.stringify(this.search.history));
    } catch (e) {
      console.warn('[KnowledgeGraph] Failed to save search history:', e);
    }
  },

  // Learn from search query and results
  learnFromSearch(query, topResults) {
    this.search.history.push({
      query,
      timestamp: Date.now(),
      resultIds: topResults.map(r => r.entity.id),
      scores: topResults.map(r => r.score)
    });

    this.saveSearchHistory();
    this.updateSearchContextCache(query, topResults);
  },

  // Update context cache
  updateSearchContextCache(query, results) {
    const tokens = this.tokenize(query);
    tokens.forEach(token => {
      if (!this.search.contextCache[token]) {
        this.search.contextCache[token] = { count: 0, relatedEntities: [] };
      }
      this.search.contextCache[token].count++;

      results.forEach(r => {
        if (!this.search.contextCache[token].relatedEntities.includes(r.entity.id)) {
          this.search.contextCache[token].relatedEntities.push(r.entity.id);
        }
      });
    });
  },

  // Get search suggestions based on history
  getSearchSuggestions(prefix) {
    const prefixLower = prefix.toLowerCase();
    const suggestions = [];

    this.search.history.forEach(item => {
      if (item.query.toLowerCase().startsWith(prefixLower)) {
        const existing = suggestions.find(s => s.query === item.query);
        if (!existing) {
          suggestions.push({
            query: item.query,
            frequency: 1,
            lastUsed: item.timestamp
          });
        } else {
          existing.frequency++;
        }
      }
    });

    // Add common workflow terms as suggestions
    const commonTerms = ['触发', '循环', '条件', '保存', 'API', 'HTTP', '数据', '文件', '文本'];
    commonTerms.forEach(term => {
      if (term.toLowerCase().includes(prefixLower)) {
        suggestions.push({
          query: term,
          frequency: 0,
          isCommon: true
        });
      }
    });

    return suggestions.sort((a, b) => b.frequency - a.frequency).slice(0, 8);
  },

  // ============ Intelligent Recommendation ============

  // Load user behavior data
  loadUserBehavior() {
    try {
      const saved = localStorage.getItem('wf_user_behavior');
      if (saved) {
        this.recommendation.userBehavior = JSON.parse(saved);
      }
    } catch (e) {
      this.recommendation.userBehavior = {};
    }
  },

  // Save user behavior
  saveUserBehavior() {
    try {
      localStorage.setItem('wf_user_behavior', JSON.stringify(this.recommendation.userBehavior));
    } catch (e) {
      console.warn('[KnowledgeGraph] Failed to save user behavior:', e);
    }
  },

  // Record user action for behavior learning
  recordUserAction(action, nodeType, nodeId) {
    const key = `${action}_${nodeType}`;
    this.recommendation.userBehavior[key] = (this.recommendation.userBehavior[key] || 0) + 1;
    this.recommendation.userBehavior.lastAction = { action, nodeType, nodeId, timestamp: Date.now() };
    this.saveUserBehavior();
  },

  // Get graph-based recommendations for a node
  getNodeRecommendations(nodeId, options = {}) {
    const { limit = 5, includeSimilar = true, includeComplementary = true } = options;
    const recommendations = [];

    // Get connected nodes (BFS with depth 1-2)
    const connected = this.bfs(nodeId, 2).filter(n => n.id !== nodeId);

    // Score connected nodes
    connected.forEach(item => {
      let score = 1.0 / (item.depth + 1);

      // Boost by relation weight
      const relation = this.graph.relations.find(r =>
        (r.source === nodeId && r.target === item.id) ||
        (r.target === nodeId && r.source === item.id)
      );
      if (relation) {
        score *= relation.weight;
      }

      recommendations.push({
        entity: item,
        reason: 'connected',
        score,
        relationType: relation?.type || 'unknown'
      });
    });

    // Add similar nodes based on type
    if (includeSimilar) {
      const currentNode = this.graph.entities[nodeId];
      if (currentNode?.properties?.type) {
        const similarNodes = Object.values(this.graph.entities)
          .filter(e => e.type === 'workflow_node' &&
                       e.properties.type === currentNode.properties.type &&
                       e.id !== nodeId);

        similarNodes.forEach(similar => {
          recommendations.push({
            entity: similar,
            reason: 'similar_type',
            score: 0.6,
            relationType: 'same_type'
          });
        });
      }
    }

    // Add complementary nodes (nodes that often follow this type)
    if (includeComplementary) {
      const complementaryMap = {
        'trigger': ['api', 'http', 'schedule'],
        'api': ['transform', 'condition', 'save'],
        'http': ['transform', 'condition'],
        'transform': ['save', 'api', 'notify'],
        'condition': ['loop', 'api'],
        'loop': ['condition', 'save'],
        'save': ['notify', 'trigger']
      };

      const currentType = this.graph.entities[nodeId]?.properties?.type;
      if (currentType && complementaryMap[currentType]) {
        complementaryMap[currentType].forEach(compType => {
          const compNodes = Object.values(this.graph.entities)
            .filter(e => e.type === 'workflow_node' && e.properties.type === compType);

          compNodes.forEach(comp => {
            recommendations.push({
              entity: comp,
              reason: 'complementary',
              score: 0.4,
              relationType: 'complementary'
            });
          });
        });
      }
    }

    // Sort and deduplicate
    recommendations.sort((a, b) => b.score - a.score);
    const seen = new Set();
    const unique = recommendations.filter(r => {
      if (seen.has(r.entity.id)) return false;
      seen.add(r.entity.id);
      return true;
    });

    return unique.slice(0, limit);
  },

  // Collaborative filtering simulation
  getCollaborativeRecommendations(userId, options = {}) {
    const { limit = 5 } = options;

    // Simulate collaborative filtering based on aggregate user behavior
    const aggregateBehavior = this.getAggregateBehavior();
    const recommendations = [];

    Object.entries(aggregateBehavior).forEach(([key, count]) => {
      const [action, nodeType] = key.split('_');
      if (action === 'add' && nodeType) {
        recommendations.push({
          nodeType,
          confidence: Math.min(count / 50, 1),
          reason: 'popular_choice',
          basedOn: count + ' similar actions'
        });
      }
    });

    recommendations.sort((a, b) => b.confidence - a.confidence);
    return recommendations.slice(0, limit);
  },

  // Get aggregate behavior from all users (simulated)
  getAggregateBehavior() {
    // This would normally come from a server
    // Simulating with local data + some defaults
    return {
      ...this.recommendation.userBehavior,
      'add_trigger': 45,
      'add_api': 38,
      'add_save': 32,
      'add_condition': 28,
      'add_loop': 22,
      'add_transform': 18,
      'add_notify': 15
    };
  },

  // Real-time recommendation updates
  queueRealTimeUpdate(recommendation) {
    this.recommendation.realTimeUpdates.push({
      ...recommendation,
      timestamp: Date.now()
    });

    // Keep only last 10 updates
    if (this.recommendation.realTimeUpdates.length > 10) {
      this.recommendation.realTimeUpdates.shift();
    }
  },

  getRealTimeUpdates() {
    const now = Date.now();
    // Return updates from last 5 minutes
    return this.recommendation.realTimeUpdates.filter(u => now - u.timestamp < 300000);
  },

  // ============ Graph Visualization Data ============

  // Get nodes and edges for visualization
  getVisualizationData(options = {}) {
    const { showAll = true, centerOn = null, maxDepth = 2 } = options;

    let nodesToInclude = new Set();

    if (centerOn && this.graph.entities[centerOn]) {
      // BFS from center node
      const reachable = this.bfs(centerOn, maxDepth);
      reachable.forEach(n => nodesToInclude.add(n.id));
    }

    if (showAll) {
      Object.keys(this.graph.entities).forEach(id => nodesToInclude.add(id));
    }

    // Build visualization data
    const nodes = [];
    const edges = [];

    nodesToInclude.forEach(id => {
      const entity = this.graph.entities[id];
      if (entity) {
        nodes.push({
          id: entity.id,
          label: entity.label,
          type: entity.type,
          properties: entity.properties,
          x: entity.x || Math.random() * 600 + 100,
          y: entity.y || Math.random() * 400 + 100
        });
      }
    });

    this.graph.relations.forEach(rel => {
      if (nodesToInclude.has(rel.source) && nodesToInclude.has(rel.target)) {
        edges.push({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          weight: rel.weight
        });
      }
    });

    return { nodes, edges };
  },

  // Update node position in graph
  updateNodePosition(nodeId, x, y) {
    if (this.graph.entities[nodeId]) {
      this.graph.entities[nodeId].x = x;
      this.graph.entities[nodeId].y = y;
      this.saveGraph();
    }
  },

  // ============ Search Analytics ============

  // Get search statistics
  getSearchStats() {
    const history = this.search.history;
    const now = Date.now();
    const dayAgo = now - 86400000;
    const weekAgo = now - 604800000;

    const searchesLastDay = history.filter(h => h.timestamp > dayAgo).length;
    const searchesLastWeek = history.filter(h => h.timestamp > weekAgo).length;

    // Top queries
    const queryCounts = {};
    history.forEach(h => {
      queryCounts[h.query] = (queryCounts[h.query] || 0) + 1;
    });
    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Average result clicked position
    let totalPosition = 0;
    let clickCount = 0;
    history.forEach(h => {
      if (h.resultIds && h.resultIds.length > 0) {
        // Simulate click on first result
        totalPosition += 1;
        clickCount++;
      }
    });

    return {
      totalSearches: history.length,
      searchesLastDay,
      searchesLastWeek,
      topQueries,
      avgClickPosition: clickCount > 0 ? (totalPosition / clickCount).toFixed(1) : 'N/A',
      uniqueQueries: Object.keys(queryCounts).length
    };
  },

  // Get knowledge graph statistics
  getGraphStats() {
    const entityTypes = {};
    const relationTypes = {};

    Object.values(this.graph.entities).forEach(e => {
      entityTypes[e.type] = (entityTypes[e.type] || 0) + 1;
    });

    this.graph.relations.forEach(r => {
      relationTypes[r.type] = (relationTypes[r.type] || 0) + 1;
    });

    return {
      totalEntities: Object.keys(this.graph.entities).length,
      totalRelations: this.graph.relations.length,
      entityTypes,
      relationTypes,
      embeddingCount: Object.keys(this.graph.embeddings).length
    };
  },

  // ============ Knowledge Management ============

  // Merge external entity into graph
  mergeEntity(externalEntity) {
    const existing = this.graph.entities[externalEntity.id];
    if (existing) {
      // Update existing
      Object.assign(existing.properties, externalEntity.properties);
      existing.updatedAt = Date.now();
    } else {
      // Add new
      this.addEntity(externalEntity.id, externalEntity.type, externalEntity.label, externalEntity.properties);
    }
    this.saveGraph();
  },

  // Remove entity and its relations
  removeEntity(entityId) {
    delete this.graph.entities[entityId];
    delete this.graph.embeddings[entityId];
    this.graph.relations = this.graph.relations.filter(r =>
      r.source !== entityId && r.target !== entityId
    );
    this.saveGraph();
  },

  // Clear all graph data
  clearGraph() {
    this.graph = {
      entities: {},
      relations: [],
      embeddings: {}
    };
    this.search.history = [];
    this.recommendation.userBehavior = {};
    this.saveGraph();
  },

  // Export graph as JSON
  exportGraph() {
    return JSON.stringify({
      graph: this.graph,
      searchHistory: this.search.history,
      userBehavior: this.recommendation.userBehavior,
      exportedAt: Date.now()
    }, null, 2);
  },

  // Import graph from JSON
  importGraph(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.graph) this.graph = data.graph;
      if (data.searchHistory) this.search.history = data.searchHistory;
      if (data.userBehavior) this.recommendation.userBehavior = data.userBehavior;
      this.saveGraph();
      return true;
    } catch (e) {
      console.error('[KnowledgeGraph] Import failed:', e);
      return false;
    }
  }
};

// Initialize on load
WorkflowKnowledgeGraph.init();

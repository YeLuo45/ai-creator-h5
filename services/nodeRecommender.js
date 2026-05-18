/**
 * Node Recommender Service
 * 节点推荐服务 - 基于上下文智能推荐节点
 */

class NodeRecommender {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
    this.usageHistory = this.loadUsageHistory();
    this.popularNodes = this.calculatePopularNodes();
  }

  loadUsageHistory() {
    try {
      const saved = localStorage.getItem('node_recommender_history');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveUsageHistory() {
    try {
      localStorage.setItem('node_recommender_history', JSON.stringify(this.usageHistory));
    } catch (e) {
      console.warn('Failed to save usage history:', e);
    }
  }

  calculatePopularNodes() {
    const counts = {};
    for (const [nodeType, count] of Object.entries(this.usageHistory)) {
      counts[nodeType] = count;
    }
    
    // Sort by usage count
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);
    
    return sorted;
  }

  /**
   * Record node usage
   */
  recordUsage(nodeType) {
    this.usageHistory[nodeType] = (this.usageHistory[nodeType] || 0) + 1;
    this.saveUsageHistory();
    this.popularNodes = this.calculatePopularNodes();
  }

  /**
   * Get recommendations based on context
   * @param {Object} context - { selectedNode, existingNodes, connections }
   * @returns {Array} Recommended nodes
   */
  getRecommendations(context) {
    const recommendations = [];
    
    if (!context) {
      return this.getPopularNodes();
    }

    const { selectedNode, existingNodes, connections } = context;

    // 1. Get compatible nodes based on selected node output type
    if (selectedNode) {
      const compatible = this.getCompatibleNodes(selectedNode);
      recommendations.push(...compatible.map(n => ({ ...n, reason: 'compatible' })));
    }

    // 2. Get sequential nodes based on last node in workflow
    if (existingNodes && existingNodes.length > 0) {
      const lastNode = existingNodes[existingNodes.length - 1];
      const sequential = this.getSequentialNodes(lastNode);
      recommendations.push(...sequential.map(n => ({ ...n, reason: 'sequential' })));
    }

    // 3. Add popular nodes
    const popular = this.getPopularNodes();
    recommendations.push(...popular.map(n => ({ ...n, reason: 'popular' })));

    // Deduplicate and limit
    const seen = new Set();
    const unique = recommendations.filter(n => {
      if (seen.has(n.type + '-' + n.subtype)) return false;
      seen.add(n.type + '-' + n.subtype);
      return true;
    });

    return unique.slice(0, 6);
  }

  /**
   * Get compatible nodes based on output type of selected node
   */
  getCompatibleNodes(selectedNode) {
    const outputTypeMap = {
      'character': 'characterData',
      'music': 'audioData',
      'tts': 'audioData',
      'poster': 'imageData',
      'manual': 'any'
    };

    const inputCompatibility = {
      'characterData': ['character'],
      'audioData': ['tts', 'music'],
      'imageData': ['poster'],
      'any': ['character', 'music', 'tts', 'poster', 'loop', 'save', 'share']
    };

    const outputType = outputTypeMap[selectedNode.subtype] || 'any';
    const compatibleTypes = inputCompatibility[outputType] || inputCompatibility['any'];

    const nodeDefinitions = [
      { type: 'creator', subtype: 'character', label: '角色生成', icon: '👤', desc: '生成角色数据' },
      { type: 'creator', subtype: 'music', label: '配乐生成', icon: '🎵', desc: '生成音乐' },
      { type: 'creator', subtype: 'tts', label: '配音生成', icon: '🎙️', desc: '生成配音' },
      { type: 'creator', subtype: 'poster', label: '海报生成', icon: '🖼️', desc: '生成海报' },
      { type: 'output', subtype: 'save', label: '保存本地', icon: '💾', desc: '保存到本地' },
      { type: 'output', subtype: 'share', label: '分享', icon: '📤', desc: '分享输出' }
    ];

    return nodeDefinitions.filter(n => compatibleTypes.includes(n.subtype));
  }

  /**
   * Get popular nodes (most used)
   */
  getPopularNodes() {
    const popularDefaults = [
      { type: 'creator', subtype: 'character', label: '角色生成', icon: '👤', desc: '生成角色' },
      { type: 'creator', subtype: 'music', label: '配乐生成', icon: '🎵', desc: '生成配乐' },
      { type: 'creator', subtype: 'tts', label: '配音生成', icon: '🎙️', desc: '生成配音' },
      { type: 'output', subtype: 'save', label: '保存本地', icon: '💾', desc: '保存到本地' }
    ];

    if (this.popularNodes.length === 0) {
      return popularDefaults;
    }

    const nodeMap = {
      'character': { type: 'creator', subtype: 'character', label: '角色生成', icon: '👤', desc: '生成角色' },
      'music': { type: 'creator', subtype: 'music', label: '配乐生成', icon: '🎵', desc: '生成配乐' },
      'tts': { type: 'creator', subtype: 'tts', label: '配音生成', icon: '🎙️', desc: '生成配音' },
      'poster': { type: 'creator', subtype: 'poster', label: '海报生成', icon: '🖼️', desc: '生成海报' },
      'save': { type: 'output', subtype: 'save', label: '保存本地', icon: '💾', desc: '保存到本地' },
      'share': { type: 'output', subtype: 'share', label: '分享', icon: '📤', desc: '分享输出' },
      'loop': { type: 'loop', subtype: 'forLoop', label: 'For 循环', icon: '🔁', desc: '循环执行' },
      'condition': { type: 'logic', subtype: 'condition', label: '条件分支', icon: '❓', desc: '条件判断' }
    };

    return this.popularNodes
      .slice(0, 4)
      .map(subtype => nodeMap[subtype])
      .filter(Boolean);
  }

  /**
   * Get sequential nodes - what typically comes next
   */
  getSequentialNodes(lastNode) {
    const flowPatterns = {
      'manual': ['character', 'music', 'poster', 'tts'],
      'character': ['music', 'poster', 'tts', 'save'],
      'music': ['tts', 'save', 'share'],
      'poster': ['share', 'save'],
      'tts': ['save', 'share'],
      'save': ['share'],
      'share': [],
      'forLoop': ['character', 'music', 'poster', 'tts'],
      'whileLoop': ['character', 'music', 'poster', 'tts'],
      'doWhileLoop': ['character', 'music', 'poster', 'tts'],
      'condition': ['character', 'music', 'poster', 'tts', 'save', 'share'],
      'subflowCall': ['save', 'share']
    };

    const nextTypes = flowPatterns[lastNode.subtype] || ['save', 'share'];

    const nodeMap = {
      'character': { type: 'creator', subtype: 'character', label: '角色生成', icon: '👤' },
      'music': { type: 'creator', subtype: 'music', label: '配乐生成', icon: '🎵' },
      'poster': { type: 'creator', subtype: 'poster', label: '海报生成', icon: '🖼️' },
      'tts': { type: 'creator', subtype: 'tts', label: '配音生成', icon: '🎙️' },
      'save': { type: 'output', subtype: 'save', label: '保存本地', icon: '💾' },
      'share': { type: 'output', subtype: 'share', label: '分享', icon: '📤' },
      'forLoop': { type: 'loop', subtype: 'forLoop', label: 'For 循环', icon: '🔁' }
    };

    return nextTypes
      .map(subtype => nodeMap[subtype])
      .filter(Boolean);
  }

  /**
   * Get context-aware recommendations for current workflow state
   */
  getContextRecommendations() {
    if (!this.workflowEngine) {
      return [];
    }

    // Get current workflow nodes if available
    const workflow = this.workflowEngine.getCurrentWorkflow?.();
    if (!workflow || !workflow.nodes) {
      return this.getPopularNodes();
    }

    const context = {
      selectedNode: null,
      existingNodes: workflow.nodes,
      connections: workflow.connections || []
    };

    return this.getRecommendations(context);
  }
}

// Export singleton
const nodeRecommender = new NodeRecommender(typeof WorkflowEngine !== 'undefined' ? WorkflowEngine : null);
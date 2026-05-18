/**
 * Workflow AI Generator Service
 * AI 工作流生成服务 - 通过自然语言描述生成工作流
 */

class WorkflowAIGen {
  constructor() {
    this.templates = WORKFLOW_TEMPLATES;
    this.loadTemplates();
  }

  loadTemplates() {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('workflow_ai_templates');
      if (saved) {
        this.templates = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load custom templates:', e);
    }
  }

  saveTemplates() {
    try {
      localStorage.setItem('workflow_ai_templates', JSON.stringify(this.templates));
    } catch (e) {
      console.warn('Failed to save templates:', e);
    }
  }

  /**
   * Parse natural language input to extract key information
   * @param {string} input - Natural language description
   * @returns {Object} Parsed information
   */
  parseNaturalLanguage(input) {
    const normalized = input.toLowerCase().trim();
    
    const result = {
      keywords: [],
      template: null,
      nodes: [],
      confidence: 0
    };

    // Extract keywords
    const words = normalized.split(/[\s,，、]+/).filter(w => w.length > 1);
    result.keywords = words;

    // Match against templates
    let bestMatch = null;
    let bestScore = 0;

    for (const template of this.templates) {
      let score = 0;
      
      // Check keywords
      for (const kw of template.keywords) {
        if (normalized.includes(kw.toLowerCase())) {
          score += 2;
        }
      }

      // Check name words
      const nameWords = template.name.split(/[\s,，、]/);
      for (const word of nameWords) {
        if (normalized.includes(word.toLowerCase())) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    }

    if (bestMatch && bestScore > 0) {
      result.template = bestMatch;
      result.confidence = Math.min(bestScore / 5, 1);
      result.nodes = [...bestMatch.nodes];
    }

    // Detect additional intent
    if (normalized.includes('自动') || normalized.includes('循环')) {
      result.nodes.push('自动循环');
    }
    if (normalized.includes('保存') || normalized.includes('导出')) {
      result.nodes.push('保存');
    }
    if (normalized.includes('分享')) {
      result.nodes.push('分享');
    }

    return result;
  }

  /**
   * Generate workflow from description
   * @param {string} description - Natural language description
   * @returns {Object} Generated workflow structure
   */
  generateWorkflow(description) {
    const parsed = this.parseNaturalLanguage(description);
    
    if (!parsed.template) {
      // Fallback: try to create a basic workflow
      return this.createBasicWorkflow(parsed);
    }

    const workflow = {
      id: 'wf-' + Date.now(),
      name: this.generateWorkflowName(parsed),
      description: description,
      nodes: [],
      connections: []
    };

    // Map node names to actual node types
    const nodeTypeMap = {
      '作词': { type: 'creator', subtype: 'character', icon: '📝' },
      '作曲': { type: 'creator', subtype: 'music', icon: '🎵' },
      '配乐': { type: 'creator', subtype: 'tts', icon: '🎶' },
      '构思': { type: 'creator', subtype: 'character', icon: '💡' },
      '绘制': { type: 'creator', subtype: 'poster', icon: '🖌️' },
      '上色': { type: 'creator', subtype: 'poster', icon: '🎨' },
      '脚本': { type: 'creator', subtype: 'character', icon: '📜' },
      '拍摄': { type: 'creator', subtype: 'poster', icon: '📹' },
      '剪辑': { type: 'creator', subtype: 'tts', icon: '✂️' },
      '选题': { type: 'creator', subtype: 'character', icon: '📌' },
      '撰写': { type: 'creator', subtype: 'character', icon: '✍️' },
      '校对': { type: 'logic', subtype: 'condition', icon: '✓' },
      '文本': { type: 'trigger', subtype: 'manual', icon: '📄' },
      '配音': { type: 'creator', subtype: 'tts', icon: '🎙️' },
      '合成': { type: 'output', subtype: 'save', icon: '🔗' },
      '自动循环': { type: 'loop', subtype: 'forLoop', icon: '🔁' },
      '保存': { type: 'output', subtype: 'save', icon: '💾' },
      '分享': { type: 'output', subtype: 'share', icon: '📤' }
    };

    // Create nodes
    let x = 100;
    let y = 200;
    let prevNodeId = null;

    // Add trigger node first
    const triggerNode = {
      id: 'n' + Date.now() + '_0',
      type: 'trigger',
      subtype: 'manual',
      x: 80,
      y: 200,
      config: {}
    };
    workflow.nodes.push(triggerNode);
    prevNodeId = triggerNode.id;

    // Add main nodes
    parsed.nodes.forEach((nodeName, index) => {
      const nodeType = nodeTypeMap[nodeName] || { type: 'creator', subtype: 'character', icon: '📦' };
      
      const node = {
        id: 'n' + Date.now() + '_' + (index + 1),
        type: nodeType.type,
        subtype: nodeType.subtype,
        x: x + index * 180,
        y: y,
        config: this.getDefaultConfig(nodeType.subtype)
      };
      
      workflow.nodes.push(node);

      // Create connection
      if (prevNodeId) {
        workflow.connections.push({
          from: prevNodeId,
          fromPort: 'out',
          to: node.id,
          toPort: 'in'
        });
      }
      prevNodeId = node.id;
    });

    // Add save node if needed
    if (parsed.nodes.includes('保存') || parsed.nodes.includes('分享')) {
      const outputNode = {
        id: 'n' + Date.now() + '_output',
        type: 'output',
        subtype: parsed.nodes.includes('分享') ? 'share' : 'save',
        x: x + parsed.nodes.length * 180,
        y: y,
        config: {}
      };
      workflow.nodes.push(outputNode);
      
      if (prevNodeId) {
        workflow.connections.push({
          from: prevNodeId,
          fromPort: 'out',
          to: outputNode.id,
          toPort: 'in'
        });
      }
    }

    return workflow;
  }

  /**
   * Get default config for node subtype
   */
  getDefaultConfig(subtype) {
    const configs = {
      character: { style: 'anime', description: 'AI生成角色' },
      music: { mood: 'happy', duration: 60 },
      tts: { voice: 'female-youth' },
      poster: { template: 'default' },
      forLoop: { variable: 'i', count: 3, maxIterations: 100 },
      whileLoop: { condition: 'i < 5', maxIterations: 100 },
      doWhileLoop: { condition: 'i < 5', maxIterations: 100 }
    };
    return configs[subtype] || {};
  }

  /**
   * Generate workflow name from parsed info
   */
  generateWorkflowName(parsed) {
    if (parsed.template) {
      return parsed.template.name + ' v' + Date.now().toString(36).slice(-2).toUpperCase();
    }
    return '自定义工作流 ' + Date.now().toString(36).slice(-4).toUpperCase();
  }

  /**
   * Create basic workflow when no template matches
   */
  createBasicWorkflow(parsed) {
    const workflow = {
      id: 'wf-' + Date.now(),
      name: '智能工作流',
      description: parsed.keywords.join(', '),
      nodes: [],
      connections: []
    };

    // Add trigger
    const trigger = {
      id: 'n' + Date.now() + '_0',
      type: 'trigger',
      subtype: 'manual',
      x: 80,
      y: 200,
      config: {}
    };
    workflow.nodes.push(trigger);

    // Add creator nodes based on keywords
    let x = 260;
    if (parsed.keywords.some(k => ['song', 'music', '歌曲', '音乐'].includes(k))) {
      workflow.nodes.push({
        id: 'n' + Date.now() + '_1',
        type: 'creator',
        subtype: 'music',
        x: x,
        y: 200,
        config: { mood: 'happy' }
      });
      x += 180;
    }
    if (parsed.keywords.some(k => ['art', 'draw', '画', '插画'].includes(k))) {
      workflow.nodes.push({
        id: 'n' + Date.now() + '_2',
        type: 'creator',
        subtype: 'poster',
        x: x,
        y: 200,
        config: { template: 'default' }
      });
      x += 180;
    }
    if (parsed.keywords.some(k => ['voice', '配音', '语音', 'tts'].includes(k))) {
      workflow.nodes.push({
        id: 'n' + Date.now() + '_3',
        type: 'creator',
        subtype: 'tts',
        x: x,
        y: 200,
        config: { voice: 'female-youth' }
      });
    }

    return workflow;
  }

  /**
   * Match the most similar template
   */
  matchTemplate(keywords) {
    let bestTemplate = null;
    let bestScore = 0;

    for (const template of this.templates) {
      let score = 0;
      for (const kw of keywords) {
        if (template.keywords.some(tk => tk.includes(kw) || kw.includes(tk))) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate;
  }

  /**
   * Adjust template based on parameters
   */
  adjustTemplate(template, params) {
    if (!template) return null;
    
    const adjusted = JSON.parse(JSON.stringify(template));
    
    // Apply parameter adjustments
    if (params.loopCount) {
      adjusted.nodes = adjusted.nodes.map(n => {
        if (typeof n === 'object' && n.loop) {
          n.count = params.loopCount;
        }
        return n;
      });
    }
    
    return adjusted;
  }

  /**
   * Preview workflow (generate preview data)
   */
  previewWorkflow(workflow) {
    return {
      nodeCount: workflow.nodes.length,
      connectionCount: workflow.connections.length,
      estimatedTime: workflow.nodes.length * 1500, // ~1.5s per node
      nodeTypes: [...new Set(workflow.nodes.map(n => n.subtype))],
      flow: workflow.nodes.map(n => n.subtype).join(' → ')
    };
  }

  /**
   * Import workflow to canvas (format for state.workflow)
   */
  importToCanvas(workflow) {
    // Return a clean structure ready for state.workflow
    return {
      id: workflow.id || 'wf-' + Date.now(),
      name: workflow.name || '未命名工作流',
      description: workflow.description || '',
      nodes: workflow.nodes || [],
      connections: workflow.connections || []
    };
  }
}

// Preset template library
const WORKFLOW_TEMPLATES = [
  { 
    name: '古风歌曲创作', 
    keywords: ['song', 'music', '古风', '歌曲', '歌词', '作曲'], 
    nodes: ['作词', '作曲', '配乐'],
    description: '创作古风风格的歌曲，包括作词、作曲和配乐'
  },
  { 
    name: '插画创作', 
    keywords: ['drawing', 'art', '插画', '绘画', '画'], 
    nodes: ['构思', '绘制', '上色'],
    description: '创作插画作品，包含构思、绘制和上色流程'
  },
  { 
    name: '视频制作', 
    keywords: ['video', '视频', '剪辑', '短片'], 
    nodes: ['脚本', '拍摄', '剪辑'],
    description: '制作视频内容，从脚本到拍摄到剪辑'
  },
  { 
    name: '文案写作', 
    keywords: ['text', '文案', '写作', '文章', '内容'], 
    nodes: ['选题', '撰写', '校对'],
    description: '写作各类文案，包含选题、撰写和校对'
  },
  { 
    name: '配音合成', 
    keywords: ['voice', '配音', '语音', 'tts', '合成'], 
    nodes: ['文本', '配音', '合成'],
    description: '文字转语音配音合成流程'
  },
  { 
    name: '动画制作', 
    keywords: ['animation', '动画', 'animate'], 
    nodes: ['脚本', '绘制', '剪辑'],
    description: '制作动画短片'
  },
  { 
    name: '海报设计', 
    keywords: ['poster', '海报', '设计', 'banner'], 
    nodes: ['构思', '绘制', '保存'],
    description: '设计海报作品'
  },
  { 
    name: '音乐混音', 
    keywords: ['mix', '混音', 'remix', '音乐'], 
    nodes: ['配乐', '合成', '保存'],
    description: '音乐混音处理流程'
  }
];

// Export singleton
const workflowAIGen = new WorkflowAIGen();
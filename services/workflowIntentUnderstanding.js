/**
 * Workflow Intent Understanding Service v13
 * Natural language workflow generation, semantic search, autocomplete
 */

class WorkflowIntentUnderstanding {
  constructor() {
    this.synonymDict = this.initSynonymDict();
    this.nodeDescriptors = this.initNodeDescriptors();
    this.intentPatterns = this.initIntentPatterns();
    this.tfidf = new TFIDFIndex();
    this.initTFIDF();
  }

  // ============ Synonym Dictionary ============
  initSynonymDict() {
    return {
      // Data operations
      '获取': ['拉取', '请求', '获取', '抓取', '采集', '读取', '加载'],
      '清洗': ['清洗', '清理', '过滤', '预处理', '去重', '清理'],
      '分析': ['分析', '分析', '统计', '挖掘', '处理', '计算'],
      '导出': ['导出', '输出', '生成', '保存', '下载'],
      '上传': ['上传', '发送', '推送', '提交', '写入'],

      // Node types
      '数据': ['数据', '数据库', 'API', '文件', '输入'],
      'AI': ['AI', '人工智能', '机器学习', '模型', '智能'],
      '分析': ['分析', '统计', '挖掘', 'BI', '报表'],
      '报告': ['报告', '报表', '导出', '文档', '总结'],
      '清洗': ['清洗', '预处理', 'ETL', '数据处理'],
      '角色': ['角色', '人物', '角色生成', '角色设计'],
      '音乐': ['音乐', '配乐', '音频', '背景音乐', 'BGM'],
      '配音': ['配音', 'TTS', '语音', '文字转语音', '语音合成'],
      '海报': ['海报', '封面', '图片', '视觉', '主图'],

      // Actions
      '生成': ['生成', '创建', '制作', '产出', '产生'],
      '保存': ['保存', '存储', '写入', '持久化'],
      '分享': ['分享', '传播', '发布', '推送'],
      '触发': ['触发', '启动', '执行', '运行'],

      // Search related
      '可视化': ['可视化', '图表', 'dashboard', '展示', '展示'],
      '统计': ['统计', '计数', '汇总', '聚合'],
      '预测': ['预测', '预估', '趋势', '预报']
    };
  }

  // ============ Node Descriptors (AI descriptions) ============
  initNodeDescriptors() {
    return {
      'manual': { short: '手动触发', desc: '人工启动工作流执行，可自由控制开始时机', color: '#7C3AED' },
      'character': { short: '生成角色', desc: '基于AI生成创意角色形象，包括外貌、性格、服装等描述', color: '#2563EB' },
      'music': { short: '生成配乐', desc: '根据场景和情感需求生成背景音乐或配乐', color: '#2563EB' },
      'tts': { short: '语音合成', desc: '将文本转换为自然语音，支持多种音色和语速', color: '#2563EB' },
      'poster': { short: '生成海报', desc: 'AI生成精美海报封面图，支持自定义尺寸和风格', color: '#2563EB' },
      'loop': { short: '循环执行', desc: '重复执行一组节点直到满足退出条件', color: '#EC4899' },
      'condition': { short: '条件分支', desc: '根据条件判断结果选择不同的执行路径', color: '#D97706' },
      'save': { short: '保存本地', desc: '将工作流结果保存到本地存储或文件', color: '#059669' },
      'share': { short: '分享', desc: '将生成的内容分享到社交平台或其他渠道', color: '#059669' },
      'forLoop': { short: 'For循环', desc: '指定次数的循环执行，适合批量处理', color: '#EC4899' },
      'whileLoop': { short: 'While循环', desc: '条件为真时持续循环，适合未知次数的场景', color: '#F97316' },
      'doWhileLoop': { short: 'Do-While循环', desc: '先执行后判断，至少会执行一次的循环', color: '#EF4444' },
      'subflowCall': { short: '子流程', desc: '调用其他工作流作为子流程，实现复用', color: '#8B5CF6' },
      'trigger': { short: '触发器', desc: '外部事件触发工作流执行，如定时器或Webhook', color: '#7C3AED' },
      'creator': { short: '创作节点', desc: 'AI创作相关的节点，如生成文字、图片、音频等', color: '#2563EB' },
      'output': { short: '输出节点', desc: '将结果输出到外部系统或存储', color: '#059669' },
      'logic': { short: '逻辑节点', desc: '控制工作流的执行逻辑，如条件、循环等', color: '#D97706' },
      'plugin': { short: '插件节点', desc: '通过插件扩展的自定义功能节点', color: '#6366F1' }
    };
  }

  // ============ Intent Patterns for NL Parsing ============
  initIntentPatterns() {
    return [
      // Pattern: 获取数据类
      { 
        pattern: /(获取|拉取|请求|采集|读取)(数据|信息|内容)/i,
        nodes: [{ type: 'trigger', subtype: 'manual' }],
        desc: '数据获取'
      },
      // Pattern: 数据清洗
      {
        pattern: /(清洗|清理|过滤|预处理|ETL)/i,
        nodes: [{ type: 'logic', subtype: 'condition', name: '数据过滤器' }],
        desc: '数据清洗'
      },
      // Pattern: 数据分析
      {
        pattern: /(分析|统计|挖掘|BI|数据分析)/i,
        nodes: [{ type: 'creator', subtype: 'ai', name: 'AI分析' }],
        desc: 'AI分析'
      },
      // Pattern: 生成报告/导出
      {
        pattern: /(导出|输出|生成报告|生成报表)/i,
        nodes: [{ type: 'output', subtype: 'save', name: '导出报告' }],
        desc: '导出报告'
      },
      // Pattern: 角色生成
      {
        pattern: /角色/,
        nodes: [{ type: 'creator', subtype: 'character' }],
        desc: '角色生成'
      },
      // Pattern: 配乐/音乐
      {
        pattern: /(音乐|配乐|BGM|背景音乐)/,
        nodes: [{ type: 'creator', subtype: 'music' }],
        desc: '配乐生成'
      },
      // Pattern: 配音/TTS
      {
        pattern: /(配音|TTS|语音|文字转语音)/,
        nodes: [{ type: 'creator', subtype: 'tts' }],
        desc: '语音合成'
      },
      // Pattern: 海报
      {
        pattern: /(海报|封面|图片|视觉)/,
        nodes: [{ type: 'creator', subtype: 'poster' }],
        desc: '海报生成'
      },
      // Pattern: 循环
      {
        pattern: /循环/,
        nodes: [{ type: 'loop', subtype: 'forLoop' }],
        desc: '循环执行'
      },
      // Pattern: 条件
      {
        pattern: /条件/,
        nodes: [{ type: 'logic', subtype: 'condition' }],
        desc: '条件分支'
      },
      // Pattern: 保存
      {
        pattern: /(保存|存储|缓存)/,
        nodes: [{ type: 'output', subtype: 'save' }],
        desc: '保存数据'
      },
      // Pattern: 分享
      {
        pattern: /(分享|发布|推送)/,
        nodes: [{ type: 'output', subtype: 'share' }],
        desc: '分享内容'
      }
    ];
  }

  // ============ TF-IDF Semantic Search ============
  initTFIDF() {
    // Build corpus from node descriptors
    const corpus = [];
    const nodeTypes = Object.keys(this.nodeDescriptors);
    
    nodeTypes.forEach(type => {
      const desc = this.nodeDescriptors[type];
      corpus.push({
        id: type,
        text: `${desc.short} ${desc.desc} ${this.getSynonymTerms(type)}`
      });
    });
    
    this.tfidf.buildIndex(corpus);
  }

  getSynonymTerms(type) {
    let terms = '';
    for (const [key, synonyms] of Object.entries(this.synonymDict)) {
      if (synonyms.some(s => s.includes(type) || type.includes(s))) {
        terms += ' ' + synonyms.join(' ');
      }
    }
    return terms;
  }

  // ============ NL to Node Sequence Parsing ============
  parseNaturalLanguage(input) {
    if (!input || !input.trim()) return [];
    
    // Split by common delimiters: → -> , ， 、 and whitespace
    const segments = input.split(/[→,\，、\s]+/).filter(s => s.trim());
    
    const nodes = [];
    let lastNode = null;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (!segment) continue;
      
      // Try to match against intent patterns
      const matched = this.matchSegment(segment);
      
      if (matched) {
        const nodeId = 'n' + Date.now() + Math.random().toString(36).slice(2, 6);
        const node = {
          id: nodeId,
          type: matched.type,
          subtype: matched.subtype,
          name: matched.name || matched.subtype,
          x: 100 + i * 200,
          y: 200,
          config: matched.config || {},
          description: matched.description || this.getNodeDescription(matched.subtype)
        };
        
        // Add connection from last node
        if (lastNode) {
          nodes.push({ node, connection: { from: lastNode.id, to: node.id } });
        } else {
          nodes.push({ node });
        }
        
        lastNode = node;
      }
    }
    
    return nodes;
  }

  matchSegment(segment) {
    // First check exact intent patterns
    for (const intent of this.intentPatterns) {
      if (intent.pattern.test(segment)) {
        const baseNode = intent.nodes[0];
        return {
          type: baseNode.type,
          subtype: baseNode.subtype,
          name: baseNode.name || this.getNodeDescriptor(baseNode.subtype)?.short,
          description: intent.desc
        };
      }
    }
    
    // Try synonym-based matching
    const normalized = this.normalizeWithSynonyms(segment);
    
    // Check for trigger/manual first
    if (/(开始|启动|触发|手动)/.test(normalized)) {
      return { type: 'trigger', subtype: 'manual', name: '手动触发', description: '开始执行' };
    }
    
    // Check for save/output
    if (/(保存|存储|导出|下载)/.test(normalized)) {
      return { type: 'output', subtype: 'save', name: '保存', description: '存储结果' };
    }
    
    // Check for share
    if (/分享/.test(normalized)) {
      return { type: 'output', subtype: 'share', name: '分享', description: '分享内容' };
    }
    
    // Check for loop
    if (/循环/.test(normalized)) {
      return { type: 'loop', subtype: 'forLoop', name: '循环', description: '重复执行' };
    }
    
    // Check for condition
    if (/条件|判断|分支/.test(normalized)) {
      return { type: 'logic', subtype: 'condition', name: '条件', description: '条件分支' };
    }
    
    // Check for character
    if (/角色|人物|形象/.test(normalized)) {
      return { type: 'creator', subtype: 'character', name: '角色生成', description: 'AI角色生成' };
    }
    
    // Check for music
    if (/音乐|配乐|BGM|音频/.test(normalized)) {
      return { type: 'creator', subtype: 'music', name: '配乐生成', description: 'AI音乐生成' };
    }
    
    // Check for TTS
    if (/配音|语音|TTS|说话/.test(normalized)) {
      return { type: 'creator', subtype: 'tts', name: '语音合成', description: '文字转语音' };
    }
    
    // Check for poster
    if (/海报|封面|图片|视觉/.test(normalized)) {
      return { type: 'creator', subtype: 'poster', name: '海报生成', description: 'AI图片生成' };
    }
    
    // Check for AI/analysis
    if (/AI|人工智能|分析|智能|机器学习/.test(normalized)) {
      return { type: 'creator', subtype: 'ai', name: 'AI分析', description: '智能分析' };
    }
    
    // Check for data/database
    if (/数据|数据库|API|接口|请求|获取/.test(normalized)) {
      return { type: 'trigger', subtype: 'manual', name: '数据获取', description: '获取外部数据' };
    }
    
    // Check for report
    if (/报告|报表|导出|总结/.test(normalized)) {
      return { type: 'output', subtype: 'save', name: '导出报告', description: '生成并导出报告' };
    }
    
    // Check for loop types
    if (/For|for|循环/.test(normalized)) {
      return { type: 'loop', subtype: 'forLoop', name: 'For循环', description: '指定次数循环' };
    }
    
    if (/While|while/.test(normalized)) {
      return { type: 'loop', subtype: 'whileLoop', name: 'While循环', description: '条件循环' };
    }
    
    // Default to manual trigger if first segment
    return { type: 'trigger', subtype: 'manual', name: segment, description: segment };
  }

  normalizeWithSynonyms(input) {
    let result = input;
    const added = new Set();
    
    // Replace each word with its first synonym (canonical form)
    for (const [canonical, synonyms] of Object.entries(this.synonymDict)) {
      for (const syn of synonyms) {
        if (input.includes(syn) && !added.has(canonical)) {
          result = result.replace(new RegExp(syn, 'g'), canonical);
          added.add(canonical);
        }
      }
    }
    
    return result;
  }

  // ============ Semantic Search ============
  semanticSearch(query) {
    if (!query) return [];
    
    // First get TF-IDF results
    const results = this.tfidf.search(query);
    
    // Expand with synonym matching
    const expandedTerms = this.expandWithSynonyms(query);
    
    // Combine and dedupe
    const combined = [...results];
    
    for (const term of expandedTerms) {
      for (const [type, desc] of Object.entries(this.nodeDescriptors)) {
        if (desc.short.includes(term) || desc.desc.includes(term) || type.includes(term)) {
          if (!combined.some(r => r.id === type)) {
            combined.push({ id: type, score: 0.5, matched: term });
          }
        }
      }
    }
    
    // Sort by score
    combined.sort((a, b) => b.score - a.score);
    
    return combined.slice(0, 10);
  }

  expandWithSynonyms(query) {
    const terms = [query];
    
    for (const [canonical, synonyms] of Object.entries(this.synonymDict)) {
      for (const syn of synonyms) {
        if (query.includes(syn)) {
          terms.push(canonical);
          terms.push(...synonyms);
        }
      }
    }
    
    return [...new Set(terms)];
  }

  // ============ Autocomplete Suggestions ============
  getAutocompleteSuggestions(input) {
    if (!input || input.length < 1) return [];
    
    const suggestions = [];
    const normalized = this.normalizeWithSynonyms(input);
    const lowerInput = input.toLowerCase();
    
    // Check all patterns and suggestions
    const allSuggestions = [
      // Basic nodes
      '获取数据', '获取信息', '获取内容',
      '数据清洗', '数据过滤', '数据预处理',
      'AI分析', '数据分析', '智能分析', '统计',
      '导出报告', '生成报告', '导出数据',
      '角色生成', '角色设计', '人物生成',
      '配乐生成', '音乐生成', 'BGM',
      '配音生成', '语音合成', 'TTS',
      '海报生成', '封面生成', '图片生成',
      '循环', 'For循环', 'While循环',
      '条件分支', '判断',
      '保存本地', '保存数据',
      '分享', '发布',
      '触发器', '定时触发', 'Webhook',
      
      // Full workflows
      '获取数据→清洗→AI分析→导出报告',
      '角色生成→配音→海报',
      '获取数据→统计分析→可视化',
      '数据采集→清洗→机器学习→预测'
    ];
    
    for (const suggestion of allSuggestions) {
      if (suggestion.toLowerCase().includes(lowerInput)) {
        const score = this.calculateSuggestionScore(input, suggestion);
        suggestions.push({ text: suggestion, score });
      }
    }
    
    // Sort by score
    suggestions.sort((a, b) => b.score - a.score);
    
    return suggestions.slice(0, 8);
  }

  calculateSuggestionScore(input, suggestion) {
    let score = 0;
    const lowerInput = input.toLowerCase();
    const lowerSug = suggestion.toLowerCase();
    
    // Exact prefix match
    if (lowerSug.startsWith(lowerInput)) {
      score += 10;
    }
    
    // Contains match
    if (lowerSug.includes(lowerInput)) {
      score += 5;
    }
    
    // Length penalty (prefer shorter that match)
    score -= (suggestion.length - input.length) * 0.1;
    
    // Check synonym matches
    const expandedInput = this.expandWithSynonyms(input);
    for (const term of expandedInput) {
      if (lowerSug.includes(term.toLowerCase())) {
        score += 3;
      }
    }
    
    return score;
  }

  // ============ Node Description Helpers ============
  getNodeDescription(subtype) {
    const desc = this.nodeDescriptors[subtype];
    return desc ? desc.short : subtype;
  }

  getNodeDescriptor(subtype) {
    return this.nodeDescriptors[subtype] || null;
  }

  getNodeShortDescription(subtype) {
    const desc = this.nodeDescriptors[subtype];
    return desc ? desc.short : subtype;
  }

  getNodeDetailedDescription(subtype) {
    const desc = this.nodeDescriptors[subtype];
    return desc ? desc.desc : '';
  }

  // ============ Connection Label ============
  getConnectionLabel(fromType, toType) {
    const labels = {
      'manual->character': '角色创作',
      'manual->music': '配乐创作',
      'manual->tts': '语音创作',
      'manual->poster': '视觉创作',
      'character->tts': '角色配音',
      'character->poster': '角色展示',
      'music->tts': '音画同步',
      'data->clean': '数据流',
      'clean->analyze': '待分析数据',
      'analyze->report': '分析结果',
      'any->save': '待保存',
      'any->share': '待分享',
      'loop->any': '循环体',
      'condition->any': '条件执行'
    };
    
    return labels[`${fromType}->${toType}`] || '数据流';
  }
}

// ============ TF-IDF Simple Implementation ============
class TFIDFIndex {
  constructor() {
    this.documents = [];
    this.index = {};
    this.docFreq = {};
    this.totalDocs = 0;
  }

  buildIndex(documents) {
    this.documents = documents;
    this.totalDocs = documents.length;
    this.docFreq = {};
    this.index = {};

    // Tokenize and build index
    for (const doc of documents) {
      const terms = this.tokenize(doc.text);
      const uniqueTerms = [...new Set(terms)];
      
      // Document frequency
      for (const term of uniqueTerms) {
        this.docFreq[term] = (this.docFreq[term] || 0) + 1;
      }
      
      // Position index for each term
      for (const term of terms) {
        if (!this.index[term]) {
          this.index[term] = [];
        }
        this.index[term].push(doc.id);
      }
    }
  }

  tokenize(text) {
    // Simple Chinese-aware tokenization
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  search(query) {
    const queryTerms = this.tokenize(query);
    const scores = {};
    
    for (const term of queryTerms) {
      // Direct match
      if (this.index[term]) {
        const idf = Math.log((this.totalDocs + 1) / (this.docFreq[term] + 1));
        
        for (const docId of this.index[term]) {
          scores[docId] = (scores[docId] || 0) + idf;
        }
      }
      
      // Fuzzy match (contains)
      for (const [indexTerm, docIds] of Object.entries(this.index)) {
        if (indexTerm.includes(term) || term.includes(indexTerm)) {
          const idf = Math.log((this.totalDocs + 1) / (this.docFreq[indexTerm] + 1)) * 0.5;
          
          for (const docId of docIds) {
            scores[docId] = (scores[docId] || 0) + idf;
          }
        }
      }
    }
    
    // Convert to result array
    const results = [];
    for (const [docId, score] of Object.entries(scores)) {
      results.push({ id: docId, score });
    }
    
    return results;
  }
}

// Export singleton
const workflowIntentUnderstanding = new WorkflowIntentUnderstanding();

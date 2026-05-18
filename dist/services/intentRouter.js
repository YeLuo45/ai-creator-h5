/**
 * Intent Router Service
 * 意图路由节点服务 - 根据输入内容动态路由到不同分支
 */

class IntentRouter {
  constructor() {
    this.routers = {}; // nodeId -> router config
    this.defaultRules = this.initDefaultRules();
  }

  initDefaultRules() {
    return [
      { name: '视频内容', pattern: 'video', type: 'contains', output: 'video' },
      { name: '音频内容', pattern: 'audio', type: 'contains', output: 'audio' },
      { name: '图片内容', pattern: 'image', type: 'contains', output: 'image' },
      { name: '文本内容', pattern: 'text', type: 'contains', output: 'text' }
    ];
  }

  /**
   * Configure a router node
   * @param {string} nodeId - Node ID
   * @param {Object} config - { inputField, rules, defaultPort }
   */
  configure(nodeId, config) {
    this.routers[nodeId] = {
      inputField: config.inputField || 'input',
      rules: config.rules || [...this.defaultRules],
      defaultPort: config.defaultPort || 'false',
      // Stats
      matchCount: 0,
      lastMatch: null
    };
  }

  /**
   * Remove router config
   */
  removeRouter(nodeId) {
    delete this.routers[nodeId];
  }

  /**
   * Execute intent recognition
   * @param {string} nodeId - Router node ID
   * @param {Object} input - Input data { fieldName: value }
   * @returns {Object} { matchedIntent, confidence, output, matchedRule }
   */
  execute(nodeId, input) {
    const router = this.routers[nodeId];
    if (!router) {
      return { 
        matchedIntent: 'default', 
        confidence: 0, 
        output: null,
        matchedRule: null,
        error: 'Router not configured'
      };
    }

    // Get input value
    const inputValue = input[router.inputField] || JSON.stringify(input);
    const inputStr = typeof inputValue === 'string' ? inputValue : String(inputValue);

    // Match against rules
    for (const rule of router.rules) {
      const matched = this.testPattern(rule.pattern, inputStr, rule.type);
      if (matched) {
        router.matchCount++;
        router.lastMatch = {
          rule: rule.name,
          timestamp: Date.now()
        };
        return {
          matchedIntent: rule.name,
          confidence: 0.95,
          output: rule.output || rule.name,
          matchedRule: rule,
          port: this.getPortForRule(rule)
        };
      }
    }

    // No match - return default
    return {
      matchedIntent: 'default',
      confidence: 0.3,
      output: null,
      matchedRule: null,
      port: router.defaultPort
    };
  }

  /**
   * Test if pattern matches input
   * @param {string} pattern - Pattern to match
   * @param {string} input - Input string
   * @param {string} type - Match type: 'exact', 'contains', 'regex'
   */
  testPattern(pattern, input, type) {
    if (!input || !pattern) return false;

    const inputLower = input.toLowerCase();
    const patternLower = pattern.toLowerCase();

    switch (type) {
      case 'exact':
        return inputLower === patternLower;
      
      case 'contains':
        return inputLower.includes(patternLower);
      
      case 'regex':
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(input);
        } catch (e) {
          console.warn('Invalid regex pattern:', pattern);
          return false;
        }
      
      case 'startsWith':
        return inputLower.startsWith(patternLower);
      
      case 'endsWith':
        return inputLower.endsWith(patternLower);
      
      case 'greaterThan':
        const numInput = parseFloat(input);
        const numPattern = parseFloat(pattern);
        return !isNaN(numInput) && !isNaN(numPattern) && numInput > numPattern;
      
      case 'lessThan':
        const nInput = parseFloat(input);
        const nPattern = parseFloat(pattern);
        return !isNaN(nInput) && !isNaN(nPattern) && nInput < nPattern;
      
      default:
        return inputLower.includes(patternLower);
    }
  }

  /**
   * Get port for matched rule
   */
  getPortForRule(rule) {
    // Map output to port
    if (rule.output === 'video' || rule.output === 'true') return 'true';
    if (rule.output === 'text' || rule.output === 'default') return 'false';
    return rule.output || 'false';
  }

  /**
   * Add a rule to a router
   */
  addRule(nodeId, rule) {
    if (!this.routers[nodeId]) {
      this.configure(nodeId, {});
    }
    this.routers[nodeId].rules.push({
      name: rule.name || '新规则',
      pattern: rule.pattern || '',
      type: rule.type || 'contains',
      output: rule.output || rule.name
    });
  }

  /**
   * Remove a rule from a router
   */
  removeRule(nodeId, ruleName) {
    const router = this.routers[nodeId];
    if (!router) return;
    router.rules = router.rules.filter(r => r.name !== ruleName);
  }

  /**
   * Update a rule
   */
  updateRule(nodeId, oldName, newRule) {
    const router = this.routers[nodeId];
    if (!router) return;
    
    const ruleIndex = router.rules.findIndex(r => r.name === oldName);
    if (ruleIndex >= 0) {
      router.rules[ruleIndex] = {
        name: newRule.name || oldName,
        pattern: newRule.pattern || '',
        type: newRule.type || 'contains',
        output: newRule.output || newRule.name
      };
    }
  }

  /**
   * Get router configuration
   */
  getRouterConfig(nodeId) {
    return this.routers[nodeId] || null;
  }

  /**
   * Get all rules for a router
   */
  getRules(nodeId) {
    const router = this.routers[nodeId];
    return router ? router.rules : [];
  }

  /**
   * Import rules from JSON
   */
  importRules(nodeId, rules) {
    if (!this.routers[nodeId]) {
      this.configure(nodeId, {});
    }
    this.routers[nodeId].rules = rules;
  }

  /**
   * Export rules to JSON
   */
  exportRules(nodeId) {
    const router = this.routers[nodeId];
    return router ? JSON.stringify(router.rules, null, 2) : '[]';
  }

  /**
   * Get router statistics
   */
  getStats(nodeId) {
    const router = this.routers[nodeId];
    if (!router) return null;
    
    return {
      matchCount: router.matchCount,
      lastMatch: router.lastMatch,
      ruleCount: router.rules.length,
      defaultPort: router.defaultPort
    };
  }

  /**
   * Create pre-configured router for common scenarios
   */
  createContentRouter(nodeId) {
    this.configure(nodeId, {
      inputField: 'content',
      rules: [
        { name: '视频', pattern: 'video', type: 'contains', output: 'video' },
        { name: '音频', pattern: 'audio', type: 'contains', output: 'audio' },
        { name: '图片', pattern: 'image', type: 'contains', output: 'image' },
        { name: '文本', pattern: 'text', type: 'contains', output: 'text' }
      ],
      defaultPort: 'text'
    });
  }

  /**
   * Create type-based router
   */
  createTypeRouter(nodeId) {
    this.configure(nodeId, {
      inputField: 'type',
      rules: [
        { name: '创作类', pattern: 'character', type: 'exact', output: 'creator' },
        { name: '音乐类', pattern: 'music', type: 'exact', output: 'creator' },
        { name: '配音类', pattern: 'tts', type: 'exact', output: 'creator' },
        { name: '输出类', pattern: 'save', type: 'exact', output: 'output' },
        { name: '分享类', pattern: 'share', type: 'exact', output: 'output' }
      ],
      defaultPort: 'creator'
    });
  }

  /**
   * Create intent classifier router
   */
  createIntentRouter(nodeId) {
    this.configure(nodeId, {
      inputField: 'query',
      rules: [
        { name: '生成', pattern: '生成', type: 'contains', output: 'create' },
        { name: '保存', pattern: '保存', type: 'contains', output: 'save' },
        { name: '分享', pattern: '分享', type: 'contains', output: 'share' },
        { name: '查询', pattern: '查询', type: 'contains', output: 'query' }
      ],
      defaultPort: 'query'
    });
  }
}

// Export singleton
const intentRouter = new IntentRouter();
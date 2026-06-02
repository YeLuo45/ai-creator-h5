/**
 * CreativePlannerAgent - 创意规划Agent
 * 分析用户需求，输出结构化创作提纲
 * 
 * 功能：
 * - 需求分析：主题、风格、结构
 * - 提纲生成：分步骤创作计划
 * - 多维度思考：支持不同创作角度
 */

'use strict';

// Agent类型常量
const AGENT_TYPE = {
  PLANNER: 'planner',
  GENERATOR: 'generator',
  REVIEWER: 'reviewer',
  ROUTER: 'router'
};

// 内容类型
const CONTENT_TYPE = {
  FICTION: 'fiction',
  NON_FICTION: 'non_fiction',
  MARKETING: 'marketing',
  SOCIAL: 'social',
  ACADEMIC: 'academic'
};

// 风格类型
const STYLE_TYPE = {
  SERIOUS: 'serious',
  HUMOROUS: 'humorous',
  ROMANTIC: 'romantic',
  THRILLER: 'thriller',
  SCI_FI: 'sci_fi',
  FANTASY: 'fantasy',
  REALISTIC: 'realistic'
};

/**
 * CreativePlannerAgent - 创意规划Agent
 * 将用户的模糊创作需求转化为结构化提纲
 */
class CreativePlannerAgent {
  constructor(options = {}) {
    this.name = options.name || 'CreativePlanner';
    this.role = options.role || AGENT_TYPE.PLANNER;
    this.capabilities = ['分析', '规划', '分解', '推理'];
    this.options = {
      maxSteps: options.maxSteps || 6,
      includeSubsteps: options.includeSubsteps !== false,
      ...options
    };
  }

  /**
   * 分析用户需求并生成提纲
   * @param {string} userInput - 用户创作需求描述
   * @returns {Object} 结构化提纲
   */
  analyze(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('Invalid input: userInput must be a non-empty string');
    }

    // 基础分析
    const analysis = this._analyzeInput(userInput);
    
    // 生成提纲
    const outline = {
      originalInput: userInput,
      theme: analysis.theme,
      style: analysis.style,
      structure: this._determineStructure(analysis),
      steps: this._generateSteps(analysis),
      metadata: {
        createdAt: new Date().toISOString(),
        agent: this.name,
        confidence: analysis.confidence
      }
    };

    return outline;
  }

  /**
   * 内部方法：分析用户输入
   */
  _analyzeInput(input) {
    const lowerInput = input.toLowerCase();
    
    // 主题识别
    let theme = '通用创作';
    if (lowerInput.includes('科幻') || lowerInput.includes('时空') || lowerInput.includes('未来')) {
      theme = '科幻';
    } else if (lowerInput.includes('爱情') || lowerInput.includes('浪漫') || lowerInput.includes('甜蜜')) {
      theme = '爱情';
    } else if (lowerInput.includes('友情') || lowerInput.includes('友谊') || lowerInput.includes('温馨')) {
      theme = '友情';
    }

    // 风格识别
    let style = STYLE_TYPE.REALISTIC;
    if (lowerInput.includes('幽默') || lowerInput.includes('搞笑')) {
      style = STYLE_TYPE.HUMOROUS;
    } else if (lowerInput.includes('浪漫') || lowerInput.includes('甜蜜')) {
      style = STYLE_TYPE.ROMANTIC;
    }

    // 长度估算
    let lengthHint = 'short';
    if (lowerInput.includes('长篇') || lowerInput.includes('小说')) {
      lengthHint = 'long';
    }

    // 置信度
    const confidence = theme !== '通用创作' ? 0.85 : 0.6;

    return { theme, style, lengthHint, confidence };
  }

  /**
   * 内部方法：确定内容结构
   */
  _determineStructure(analysis) {
    return {
      type: analysis.lengthHint === 'long' ? 'novel' : 'short_story',
      acts: analysis.lengthHint === 'long' ? 5 : 3,
      hasClimax: true,
      hasResolution: true
    };
  }

  /**
   * 内部方法：生成创作步骤
   */
  _generateSteps(analysis) {
    const steps = [];
    
    if (analysis.lengthHint === 'long') {
      steps.push('第一阶段：世界观/背景设定', '第二阶段：主要人物设定', '第三阶段：情节主线展开', '第四阶段：高潮冲突设计', '第五阶段：结局与反思');
    } else {
      steps.push('开场：建立场景和人物', '发展：引入冲突/问题', '高潮：核心事件/转折', '结尾：解决/反思');
    }

    return steps.map((step, index) => ({
      order: index + 1,
      title: step.split('：')[1] || step,
      phase: step.split('：')[0],
      description: step
    }));
  }

  getState() {
    return { name: this.name, role: this.role, capabilities: this.capabilities, status: 'idle' };
  }

  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  getCapabilities() {
    return [...this.capabilities];
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CreativePlannerAgent, AGENT_TYPE, CONTENT_TYPE, STYLE_TYPE };
}

// Export for browser/global
if (typeof global !== 'undefined') {
  global.CreativePlannerAgent = CreativePlannerAgent;
  global.AGENT_TYPE = AGENT_TYPE;
  global.CONTENT_TYPE = CONTENT_TYPE;
  global.STYLE_TYPE = STYLE_TYPE;
}
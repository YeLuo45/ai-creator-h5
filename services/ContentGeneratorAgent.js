'use strict';

/**
 * ContentGeneratorAgent - 内容生成Agent
   * 基于提纲和步骤生成具体内容
   */
  class ContentGeneratorAgent {
    constructor(options = {}) {
      this.name = options.name || 'ContentGenerator';
      this.role = options.role || 'generator';
      this.capabilities = ['生成', '创作', '写作', '编辑'];
      this.options = {
        maxLength: options.maxLength || 2000,
        temperature: options.temperature || 0.8,
        ...options
      };
      
      // 生成上下文
      this.context = {
        generatedChunks: [],
        characterProfiles: [],
        plotPoints: []
      };
    }

    /**
     * 根据提纲和步骤生成内容
     * @param {Object} outline - 结构化提纲
     * @param {string} stepTitle - 当前步骤标题
     * @param {Object} context - 额外上下文
     * @returns {Object} 生成结果
     */
    generate(outline, stepTitle, context = {}) {
      if (!outline || !outline.theme) {
        throw new Error('Invalid outline: missing theme');
      }
      if (!stepTitle) {
        throw new Error('Invalid step: stepTitle is required');
      }

      const step = outline.steps?.find(s => s.title === stepTitle) || 
                   outline.steps?.find(s => s.description?.includes(stepTitle));

      // 模拟内容生成
      const generatedText = this._generateText(outline, step, context);
      
      // 更新上下文
      this._updateContext(stepTitle, generatedText);

      return {
        text: generatedText,
        step: stepTitle,
        metadata: {
          agent: this.name,
          timestamp: new Date().toISOString(),
          tokens: generatedText.length,
          outline: outline.theme
        }
      };
    }

    /**
     * 批量生成多个步骤的内容
     */
    generateBatch(outline, steps) {
      const results = [];
      for (const stepTitle of steps) {
        const result = this.generate(outline, stepTitle);
        results.push(result);
      }
      return {
        results,
        fullText: results.map(r => r.text).join('\n\n'),
        metadata: {
          totalSteps: results.length,
          totalTokens: results.reduce((sum, r) => sum + r.metadata.tokens, 0)
        }
      };
    }

    /**
     * 内部方法：生成文本内容
     */
    _generateText(outline, step, context) {
      const { theme, style } = outline;
      const stepNum = step?.order || 1;
      const stepTitle = step?.title || step || '开场';
      
      // 模拟生成
      const templates = {
        1: `【${stepTitle}】

        场景缓缓拉开序幕。
        
        ${this._getStyleAdjective(style)}的色调笼罩着整个画面，
        仿佛在诉说着一个关于${theme}的故事。
        
        人物的心境如同这个世界的脉搏，跳动着期待与未知...`,
        2: `【${stepTitle}】

        故事在这一刻开始发酵。
        
        命运的齿轮悄然转动，
        ${theme}的主题在细节中若隐若现。
        
        每一个选择都像是在编织未来的纹理...`,
        3: `【${stepTitle}】

        高潮来临。
        
        所有的伏笔在这一刻交汇，
        ${theme}的精髓在冲突中绽放。
        
        观众的心跳与故事的节奏完美同步...`,
        default: `【${stepTitle}】

        ${theme}的故事继续展开...
        
        在这个关键时刻，
        一切都显得那么意味深长。
        
        结局的影子已经开始显现。`
      };

      return templates[stepNum] || templates.default;
    }

    /**
     * 获取风格形容词
     */
    _getStyleAdjective(style) {
      const adjectives = {
        serious: '沉稳厚重',
        humorous: '轻松诙谐',
        romantic: '温柔缠绵',
        thriller: '紧张刺激',
        sci_fi: '科幻冷冽',
        fantasy: '奇幻绚丽',
        realistic: '真实细腻'
      };
      return adjectives[style] || '独特';
    }

    /**
     * 更新生成上下文
     */
    _updateContext(stepTitle, text) {
      this.context.generatedChunks.push({
        step: stepTitle,
        text,
        timestamp: Date.now()
      });
    }

    /**
     * 获取上下文摘要
     */
    getContextSummary() {
      return {
        totalChunks: this.context.generatedChunks.length,
        totalCharacters: this.context.generatedChunks.reduce((sum, c) => sum + c.text.length, 0),
        lastStep: this.context.generatedChunks[this.context.generatedChunks.length - 1]?.step
      };
    }

    /**
     * 重置上下文
     */
    reset() {
      this.context = {
        generatedChunks: [],
        characterProfiles: [],
        plotPoints: []
      };
    }

    /**
     * 获取Agent状态
     */
    getState() {
      return {
        name: this.name,
        role: this.role,
        capabilities: this.capabilities,
        status: 'idle',
        contextSummary: this.getContextSummary()
      };
    }

    hasCapability(capability) {
      return this.capabilities.includes(capability);
    }

    getCapabilities() {
      return [...this.capabilities];
    }
  }

  // 导出 - 同时设置 module.exports 和 global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContentGeneratorAgent };
  }
  if (typeof global !== 'undefined') {
    global.ContentGeneratorAgent = ContentGeneratorAgent;
  }
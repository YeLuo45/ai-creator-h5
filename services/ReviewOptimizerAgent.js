'use strict';

/**
 * ReviewOptimizerAgent - 审核优化Agent
   */
  class ReviewOptimizerAgent {
    constructor(options = {}) {
      this.name = options.name || 'ReviewOptimizer';
      this.role = options.role || 'reviewer';
      this.capabilities = ['审核', '评估', '优化', '建议'];
      this.options = {
        strictMode: options.strictMode || false,
        ...options
      };
    }

    /**
     * 审核内容
     * @param {Object} content - 待审核内容 { text, type }
     * @returns {Object} 审核结果
     */
    review(content) {
      if (!content || !content.text) {
        throw new Error('Invalid content: missing text');
      }

      const text = content.text;
      const type = content.type || 'general';

      // 多维度评分
      const fluency = this._evaluateFluency(text);
      const creativity = this._evaluateCreativity(text);
      const relevance = this._evaluateRelevance(text, type);
      const styleConsistency = this._evaluateStyleConsistency(text);

      // 综合评分
      const score = Math.round((fluency + creativity + relevance + styleConsistency) / 4 * 10) / 10;

      // 生成建议
      const suggestions = this._generateSuggestions({
        fluency, creativity, relevance, styleConsistency
      }, type);

      return {
        score,
        fluency,
        creativity,
        relevance,
        styleConsistency,
        suggestions,
        issues: this._identifyIssues(fluency, creativity, relevance, styleConsistency),
        metadata: {
          agent: this.name,
          timestamp: new Date().toISOString(),
          textLength: text.length
        }
      };
    }

    /**
     * 评估流畅度
     */
    _evaluateFluency(text) {
      // 简单检查：句子长度、标点、重复词
      const sentences = text.split(/[.!?。！？]/).filter(s => s.trim());
      const avgSentenceLength = text.length / Math.max(sentences.length, 1);
      
      // 计算流畅度分数
      let score = 8;
      if (avgSentenceLength > 100) score -= 0.5;
      if (text.match(/(.)\1{3,}/)) score -= 1; // 重复字符
      if (!text.match(/[。！？.!?]/)) score -= 1; // 无标点
      
      return Math.max(1, Math.min(10, score));
    }

    /**
     * 评估创意性
     */
    _evaluateCreativity(text) {
      let score = 7;
      
      // 检查修辞手法
      const metaphors = text.match(/像|如同|仿佛|似/g);
      if (metaphors && metaphors.length >= 2) score += 1;
      
      // 检查形容词多样性
      const adjectives = text.match(/[的得地]+[\u4e00-\u9fa5]{1,3}/g);
      if (adjectives && adjectives.length >= 5) score += 0.5;
      
      // 检查句式变化
      const shortSentences = text.split(/[，,]/).filter(s => s.length < 10);
      const longSentences = text.split(/[，,]/).filter(s => s.length > 30);
      if (shortSentences.length > 0 && longSentences.length > 0) score += 0.5;

      return Math.max(1, Math.min(10, score));
    }

    /**
     * 评估相关性（风格相关性）
     */
    _evaluateRelevance(text, type) {
      // 默认基于内容长度和完整性
      let score = 8;
      
      if (text.length < 50) score -= 2;
      else if (text.length < 100) score -= 1;
      
      if (!text.match(/[，。、！？]/)) score -= 1;

      return Math.max(1, Math.min(10, score));
    }

    /**
     * 评估风格一致性
     */
    _evaluateStyleConsistency(text) {
      // 简单检查语气词一致性
      const zhengong = (text.match(/啊|呀|吧|呢/g) || []).length;
      const wenyan = (text.match(/矣|焉|哉/g) || []).length;
      
      // 如果同时有两种风格，分数降低
      const score = (zhengong > 0 && wenyan > 0) ? 6 : 8;
      
      return score;
    }

    /**
     * 识别问题
     */
    _identifyIssues(fluency, creativity, relevance, styleConsistency) {
      const issues = [];
      
      if (fluency < 6) issues.push({ type: 'fluency', severity: 'high', message: '语句不够通顺' });
      if (creativity < 6) issues.push({ type: 'creativity', severity: 'medium', message: '创意表达较为平淡' });
      if (relevance < 6) issues.push({ type: 'relevance', severity: 'high', message: '内容相关性不足' });
      if (styleConsistency < 6) issues.push({ type: 'style', severity: 'medium', message: '风格不够统一' });

      return issues;
    }

    /**
     * 生成优化建议
     */
    _generateSuggestions(scores, type) {
      const suggestions = [];
      
      if (scores.fluency < 7) {
        suggestions.push('建议增加过渡句，使文章更流畅');
      }
      if (scores.creativity < 7) {
        suggestions.push('可以加入更多比喻或拟人等修辞手法');
      }
      if (scores.relevance < 7) {
        suggestions.push('建议更紧密围绕主题展开描述');
      }
      if (scores.styleConsistency < 7) {
        suggestions.push('注意保持整体语言风格一致');
      }

      if (suggestions.length === 0) {
        suggestions.push('内容质量良好，可直接使用');
      }

      return suggestions;
    }

    /**
     * 优化内容（简单版本）
     */
    optimize(content, suggestions) {
      let optimizedText = content.text;
      
      // 根据建议做简单优化
      for (const suggestion of suggestions) {
        if (suggestion.includes('过渡')) {
          // 添加过渡词
          optimizedText = optimizedText.replace(
            /([。！？])([\u4e00-\u9fa5])/g,
            '$1因此，$2'
          );
        }
      }

      return {
        original: content.text,
        optimized: optimizedText,
        changes: suggestions.length
      };
    }

    getState() {
      return {
        name: this.name,
        role: this.role,
        capabilities: this.capabilities,
        status: 'idle'
      };
    }

    hasCapability(capability) {
      return this.capabilities.includes(capability);
    }

    getCapabilities() {
      return [...this.capabilities];
    }
  }

  // 导出
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReviewOptimizerAgent };
  }
  if (typeof global !== 'undefined') {
    global.ReviewOptimizerAgent = ReviewOptimizerAgent;
  }
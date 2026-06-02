'use strict';

/**
 * CreativePipeline - 创意生成Pipeline
 * 整合 Planner/Generator/Reviewer/Router 的端到端创意工作流
 * 
 * 流程：
 * 1. 用户输入 → Planner 分析 → 结构化提纲
 * 2. 提纲 + Router → Generator 分步生成
 * 3. 生成内容 → Reviewer 审核
 * 4. 审核结果 → 优化 → 最终输出
 */

// Pipeline状态
const PIPELINE_STATUS = {
  IDLE: 'idle',
  PLANNING: 'planning',
  GENERATING: 'generating',
  REVIEWING: 'reviewing',
  OPTIMIZING: 'optimizing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

// 事件类型
const PIPELINE_EVENT = {
  START: 'start',
  PROGRESS: 'progress',
  STAGE_COMPLETE: 'stage_complete',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCEL: 'cancel'
};

/**
 * CreativePipeline - 创意生成Pipeline
 */
class CreativePipeline {
  constructor(options = {}) {
    this.id = 'pipeline_' + Date.now();
    this.name = options.name || 'CreativePipeline';
    
    // 初始化Agent
    this.planner = options.planner || new global.CreativePlannerAgent();
    this.generator = options.generator || new global.ContentGeneratorAgent();
    this.reviewer = options.reviewer || new global.ReviewOptimizerAgent();
    this.router = options.router || new global.MultiModelRouter();
    
    // 状态
    this.status = PIPELINE_STATUS.IDLE;
    this.currentStage = null;
    this.progress = 0;
    this.result = null;
    this.error = null;
    
    // 事件监听器
    this.listeners = {};
    
    // 配置
    this.options = {
      autoReview: options.autoReview !== false,
      autoOptimize: options.autoOptimize || false,
      maxRetries: options.maxRetries || 3,
      ...options
    };
  }

  execute(userInput, options = {}) {
    if (this.status !== PIPELINE_STATUS.IDLE && this.status !== PIPELINE_STATUS.COMPLETED) {
      throw new Error(`Pipeline is busy: ${this.status}`);
    }

    this._reset();
    this._emit(PIPELINE_EVENT.START, { input: userInput });

    try {
      // Stage 1: 规划
      this.status = PIPELINE_STATUS.PLANNING;
      this.currentStage = 'planning';
      this._emit(PIPELINE_EVENT.PROGRESS, { stage: 'planning', progress: 10 });
      
      const outline = this.planner.analyze(userInput);
      this._emit(PIPELINE_EVENT.STAGE_COMPLETE, { stage: 'planning', data: outline });
      
      // Stage 2: 路由选择
      this._emit(PIPELINE_EVENT.PROGRESS, { stage: 'routing', progress: 20 });
      const route = this.router.route({ type: 'text', subtype: 'fiction' });
      
      // Stage 3: 生成
      this.status = PIPELINE_STATUS.GENERATING;
      this.currentStage = 'generating';
      this._emit(PIPELINE_EVENT.PROGRESS, { stage: 'generating', progress: 30 });
      
      const contentResults = [];
      for (let i = 0; i < outline.steps.length; i++) {
        const step = outline.steps[i];
        const content = this.generator.generate(outline, step.title);
        contentResults.push(content);
        const stepProgress = 30 + Math.round((i + 1) / outline.steps.length * 40);
        this._emit(PIPELINE_EVENT.PROGRESS, { stage: 'generating', progress: stepProgress, step: step.title });
      }
      
      const fullContent = contentResults.map(r => r.text).join('\n\n');
      this._emit(PIPELINE_EVENT.STAGE_COMPLETE, { stage: 'generating', data: contentResults });

      // Stage 4: 审核
      let review = null;
      if (this.options.autoReview) {
        this.status = PIPELINE_STATUS.REVIEWING;
        this.currentStage = 'reviewing';
        this._emit(PIPELINE_EVENT.PROGRESS, { stage: 'reviewing', progress: 75 });
        review = this.reviewer.review({ text: fullContent, type: 'fiction' });
        this._emit(PIPELINE_EVENT.STAGE_COMPLETE, { stage: 'reviewing', data: review });
      }

      // Stage 5: 完成
      this.status = PIPELINE_STATUS.COMPLETED;
      this.currentStage = null;
      this.progress = 100;
      
      this.result = {
        status: 'completed',
        outline,
        route,
        content: contentResults,
        fullText: fullContent,
        review,
        finalText: fullContent,
        metadata: { pipelineId: this.id, completedAt: new Date().toISOString() }
      };

      this._emit(PIPELINE_EVENT.COMPLETE, this.result);
      return this.result;

    } catch (error) {
      this.status = PIPELINE_STATUS.FAILED;
      this.error = error.message;
      this._emit(PIPELINE_EVENT.ERROR, { error: error.message });
      return { status: 'failed', error: error.message };
    }
  }

  cancel() {
    if ([PIPELINE_STATUS.IDLE, PIPELINE_STATUS.COMPLETED, PIPELINE_STATUS.FAILED].includes(this.status)) {
      return false;
    }
    this.status = PIPELINE_STATUS.CANCELLED;
    this._emit(PIPELINE_EVENT.CANCEL, { pipelineId: this.id });
    return true;
  }

  getState() {
    return { id: this.id, status: this.status, currentStage: this.currentStage, progress: this.progress, hasResult: this.result !== null, error: this.error };
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    return this;
  }

  exportState() {
    return { id: this.id, name: this.name, status: this.status, progress: this.progress };
  }

  destroy() {
    this.cancel();
    this.listeners = {};
    this.result = null;
    this.status = PIPELINE_STATUS.IDLE;
  }

  _reset() {
    this.status = PIPELINE_STATUS.IDLE;
    this.currentStage = null;
    this.progress = 0;
    this.result = null;
    this.error = null;
    if (this.generator && typeof this.generator.reset === 'function') this.generator.reset();
  }

  _emit(event, data) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      try { callback(data); } catch (e) { console.error(`Event listener error for ${event}:`, e); }
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CreativePipeline, PIPELINE_STATUS, PIPELINE_EVENT };
}

if (typeof global !== 'undefined') {
  global.CreativePipeline = CreativePipeline;
  global.PIPELINE_STATUS = PIPELINE_STATUS;
  global.PIPELINE_EVENT = PIPELINE_EVENT;
}
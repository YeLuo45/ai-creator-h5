'use strict';

/**
 * MultiModelRouter - 多模型路由
 * 根据内容类型智能选择最佳模型
 * 
 * 功能：
 * - 内容类型识别
 * - 模型选择策略
 * - 成本优化
 */

// 模型提供商常量
const MODEL_PROVIDER = {
  MINIMAX: 'minimax',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  CUSTOM: 'custom'
};

// 内容类型路由配置
const CONTENT_TYPE_ROUTING = {
  TEXT_FICTION: { type: 'text', provider: MODEL_PROVIDER.MINIMAX, model: 'vision-01', weight: 0.9 },
  TEXT_MARKETING: { type: 'text', provider: MODEL_PROVIDER.MINIMAX, model: 'abab6', weight: 0.85 },
  TEXT_ACADEMIC: { type: 'text', provider: MODEL_PROVIDER.OPENAI, model: 'gpt-4', weight: 0.8 },
  TEXT_SOCIAL: { type: 'text', provider: MODEL_PROVIDER.MINIMAX, model: 'abab5.5s', weight: 0.85 },
  TEXT_GENERAL: { type: 'text', provider: MODEL_PROVIDER.MINIMAX, model: 'default', weight: 0.8 },
  IMAGE_ILLUSTRATION: { type: 'image', provider: MODEL_PROVIDER.MINIMAX, model: 'image-01', weight: 0.9 },
  IMAGE_ART: { type: 'image', provider: MODEL_PROVIDER.MINIMAX, model: 'image-01', weight: 0.85 },
  IMAGE_GENERAL: { type: 'image', provider: MODEL_PROVIDER.MINIMAX, model: 'image-01', weight: 0.8 },
  AUDIO_SPEECH: { type: 'audio', provider: MODEL_PROVIDER.MINIMAX, model: 'speech-01', weight: 0.9 },
  AUDIO_MUSIC: { type: 'audio', provider: MODEL_PROVIDER.MINIMAX, model: 'music-01', weight: 0.85 }
};

/**
 * MultiModelRouter - 多模型路由Agent
 */
class MultiModelRouter {
  constructor(options = {}) {
    this.name = options.name || 'MultiModelRouter';
    this.role = options.role || 'router';
    this.capabilities = ['路由', '调度', '优化'];
    this.options = {
      preferCheap: options.preferCheap || false,
      preferFast: options.preferFast !== false,
      ...options
    };
    
    // 路由策略
    this.strategies = {
      quality: this._routeByQuality.bind(this),
      speed: this._routeBySpeed.bind(this),
      cost: this._routeByCost.bind(this),
      auto: this._routeByAuto.bind(this)
    };
  }

  /**
   * 路由请求到最佳模型
   * @param {Object} request - 路由请求 { type, subtype, constraints }
   * @returns {Object} 路由结果
   */
  route(request) {
    if (!request || !request.type) {
      throw new Error('Invalid request: missing type');
    }

    const type = request.type;
    const subtype = request.subtype || 'general';
    const constraints = request.constraints || {};

    // 查找匹配路由
    const routeKey = `${type}_${subtype}`;
    let route = CONTENT_TYPE_ROUTING[routeKey] || CONTENT_TYPE_ROUTING[`${type}_general`] || {
      provider: MODEL_PROVIDER.MINIMAX,
      model: 'default',
      weight: 0.7
    };

    // 应用策略调整
    const strategy = constraints.strategy || 'auto';
    const adjustedRoute = this.strategies[strategy](route, request);

    return {
      provider: adjustedRoute.provider,
      model: adjustedRoute.model,
      confidence: adjustedRoute.weight || adjustedRoute.confidence || 0.8,
      estimatedLatency: this._estimateLatency(adjustedRoute),
      estimatedCost: this._estimateCost(adjustedRoute),
      metadata: {
        originalType: type,
        subtype,
        strategy,
        agent: this.name
      }
    };
  }

  _routeByQuality(route) { return route; }
  _routeBySpeed(route) { return route; }
  _routeByCost(route) { return route; }
  _routeByAuto(route) { return route; }

  _estimateLatency(route) {
    const latencyMap = {
      [MODEL_PROVIDER.OPENAI]: { min: 500, max: 3000 },
      [MODEL_PROVIDER.ANTHROPIC]: { min: 800, max: 5000 },
      [MODEL_PROVIDER.MINIMAX]: { min: 200, max: 1500 },
      [MODEL_PROVIDER.GEMINI]: { min: 300, max: 2000 }
    };
    const range = latencyMap[route.provider] || { min: 500, max: 2000 };
    return Math.floor(Math.random() * (range.max - range.min) + range.min);
  }

  _estimateCost(route) {
    const costMap = {
      [MODEL_PROVIDER.OPENAI]: 0.03,
      [MODEL_PROVIDER.ANTHROPIC]: 0.015,
      [MODEL_PROVIDER.MINIMAX]: 0.001,
      [MODEL_PROVIDER.GEMINI]: 0.0005
    };
    return costMap[route.provider] || 0.01;
  }

  getSupportedTypes() {
    return Object.keys(CONTENT_TYPE_ROUTING);
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
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MultiModelRouter, MODEL_PROVIDER, CONTENT_TYPE_ROUTING };
}

if (typeof global !== 'undefined') {
  global.MultiModelRouter = MultiModelRouter;
  global.MODEL_PROVIDER = MODEL_PROVIDER;
  global.CONTENT_TYPE_ROUTING = CONTENT_TYPE_ROUTING;
}
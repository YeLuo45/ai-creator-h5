/**
 * Workflow REST API Service - v18
 * REST API 暴露服务：Swagger风格文档、配额限制、使用统计
 */
class WorkflowRESTAPI {
  constructor() {
    this.STORAGE_KEY = 'ai_creator_api_quota_v18';
    this.endpoints = new Map();
    this.requestLog = [];
    this.MAX_LOG_SIZE = 500;
    
    this.loadQuota();
    this.registerDefaultEndpoints();
  }

  /**
   * 加载配额数据
   */
  loadQuota() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.quota = parsed.quota || this._defaultQuota();
        this.usage = parsed.usage || this._defaultUsage();
      } else {
        this.quota = this._defaultQuota();
        this.usage = this._defaultUsage();
      }
    } catch (e) {
      this.quota = this._defaultQuota();
      this.usage = this._defaultUsage();
    }
  }

  /**
   * 默认配额
   */
  _defaultQuota() {
    return {
      requestsPerDay: 1000,
      requestsPerHour: 100,
      requestsPerMinute: 20,
      burstLimit: 10
    };
  }

  /**
   * 默认使用统计
   */
  _defaultUsage() {
    const now = Date.now();
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      dailyRequests: 0,
      hourlyRequests: 0,
      minuteRequests: 0,
      lastResetDay: new Date(now).toDateString(),
      lastResetHour: new Date(now).toISOString().slice(0, 13),
      lastResetMinute: new Date(now).toISOString().slice(0, 16),
      requestsByEndpoint: {},
      requestsByWorkflow: {}
    };
  }

  /**
   * 保存配额数据
   */
  _saveQuota() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        quota: this.quota,
        usage: this.usage
      }));
    } catch (e) {
      console.error('Failed to save quota:', e);
    }
  }

  /**
   * 检查配额
   */
  checkQuota() {
    this._resetCountersIfNeeded();
    
    const now = Date.now();
    const canProceed = 
      this.usage.dailyRequests < this.quota.requestsPerDay &&
      this.usage.hourlyRequests < this.quota.requestsPerHour &&
      this.usage.minuteRequests < this.quota.requestsPerMinute;
    
    return {
      allowed: canProceed,
      remaining: {
        day: this.quota.requestsPerDay - this.usage.dailyRequests,
        hour: this.quota.requestsPerHour - this.usage.hourlyRequests,
        minute: this.quota.requestsPerMinute - this.usage.minuteRequests
      },
      quota: this.quota
    };
  }

  /**
   * 重置计数器
   */
  _resetCountersIfNeeded() {
    const now = new Date();
    const currentDay = now.toDateString();
    const currentHour = now.toISOString().slice(0, 13);
    const currentMinute = now.toISOString().slice(0, 16);
    
    if (this.usage.lastResetDay !== currentDay) {
      this.usage.dailyRequests = 0;
      this.usage.lastResetDay = currentDay;
    }
    
    if (this.usage.lastResetHour !== currentHour) {
      this.usage.hourlyRequests = 0;
      this.usage.lastResetHour = currentHour;
    }
    
    if (this.usage.lastResetMinute !== currentMinute) {
      this.usage.minuteRequests = 0;
      this.usage.lastResetMinute = currentMinute;
    }
  }

  /**
   * 记录请求
   */
  recordRequest(endpoint, workflowId, success) {
    this._resetCountersIfNeeded();
    
    this.usage.totalRequests++;
    this.usage.dailyRequests++;
    this.usage.hourlyRequests++;
    this.usage.minuteRequests++;
    
    if (success) {
      this.usage.successfulRequests++;
    } else {
      this.usage.failedRequests++;
    }
    
    this.usage.requestsByEndpoint[endpoint] = (this.usage.requestsByEndpoint[endpoint] || 0) + 1;
    
    if (workflowId) {
      this.usage.requestsByWorkflow[workflowId] = (this.usage.requestsByWorkflow[workflowId] || 0) + 1;
    }
    
    this._saveQuota();
    
    // 记录到请求日志
    this.requestLog.unshift({
      timestamp: Date.now(),
      endpoint,
      workflowId,
      success
    });
    
    if (this.requestLog.length > this.MAX_LOG_SIZE) {
      this.requestLog = this.requestLog.slice(0, this.MAX_LOG_SIZE);
    }
  }

  /**
   * 注册默认端点
   */
  registerDefaultEndpoints() {
    // 健康检查
    this.registerEndpoint('GET', '/api/health', this._healthCheck.bind(this), {
      description: 'API 健康检查',
      auth: false
    });

    // 获取 API 文档
    this.registerEndpoint('GET', '/api/docs', this._getDocs.bind(this), {
      description: '获取 Swagger 风格 API 文档',
      auth: false
    });

    // 获取配额信息
    this.registerEndpoint('GET', '/api/quota', this._getQuota.bind(this), {
      description: '获取 API 配额和使用统计',
      auth: true
    });

    // 获取触发器列表
    this.registerEndpoint('GET', '/api/triggers', this._getTriggers.bind(this), {
      description: '获取所有触发器',
      auth: true
    });

    // 获取任务列表
    this.registerEndpoint('GET', '/api/tasks', this._getTasks.bind(this), {
      description: '获取所有调度任务',
      auth: true
    });

    // 获取工作流列表
    this.registerEndpoint('GET', '/api/workflows', this._getWorkflows.bind(this), {
      description: '获取所有工作流',
      auth: true
    });

    // 获取使用统计
    this.registerEndpoint('GET', '/api/stats', this._getStats.bind(this), {
      description: '获取使用统计',
      auth: true
    });

    // 获取请求日志
    this.registerEndpoint('GET', '/api/logs', this._getLogs.bind(this), {
      description: '获取 API 请求日志',
      auth: true
    });
  }

  /**
   * 注册端点
   */
  registerEndpoint(method, path, handler, options = {}) {
    const key = `${method}:${path}`;
    this.endpoints.set(key, {
      handler,
      method: method.toUpperCase(),
      path,
      description: options.description || '',
      auth: options.auth !== false,
      schema: options.schema || null
    });
  }

  /**
   * 处理请求
   */
  async handleRequest(method, path, data = {}, headers = {}) {
    const quotaCheck = this.checkQuota();
    
    if (!quotaCheck.allowed) {
      return {
        status: 429,
        error: 'Quota exceeded',
        message: `请求超出配额限制。每日: ${quotaCheck.remaining.day}, 每小时: ${quotaCheck.remaining.hour}, 每分钟: ${quotaCheck.remaining.minute}`,
        quota: quotaCheck
      };
    }

    const key = `${method.toUpperCase()}:${path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) {
      this.recordRequest(path, null, false);
      return {
        status: 404,
        error: 'Not Found',
        message: `端点 ${method} ${path} 不存在`
      };
    }

    if (endpoint.auth) {
      const authResult = this._validateRequestAuth(headers);
      if (!authResult.valid) {
        this.recordRequest(path, null, false);
        return {
          status: 401,
          error: 'Unauthorized',
          message: authResult.message
        };
      }
    }

    try {
      const result = await endpoint.handler(data, headers);
      this.recordRequest(path, data.workflowId, true);
      return {
        status: 200,
        ...result
      };
    } catch (error) {
      this.recordRequest(path, data.workflowId, false);
      return {
        status: 500,
        error: 'Internal Error',
        message: error.message
      };
    }
  }

  /**
   * 验证请求认证
   */
  _validateRequestAuth(headers) {
    const apiKey = headers['x-api-key'] || headers['Authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return { valid: false, message: '缺少 API Key' };
    }

    const storedKey = localStorage.getItem('ai_creator_api_key');
    if (apiKey !== storedKey) {
      return { valid: false, message: '无效的 API Key' };
    }

    return { valid: true };
  }

  /**
   * 健康检查
   */
  _healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'v18',
      uptime: Date.now() - (window.__appStartTime || Date.now())
    };
  }

  /**
   * 获取 API 文档
   */
  _getDocs() {
    const docs = {
      swagger: '2.0',
      info: {
        title: 'AI Creator Workflow API',
        version: '1.0.0',
        description: '工作流 REST API 接口文档 - v18',
        contact: {
          name: 'AI Creator Team'
        }
      },
      basePath: '/api',
      schemes: ['https', 'http'],
      paths: {}
    };

    this.endpoints.forEach((endpoint, key) => {
      const [method, path] = key.split(':');
      const cleanPath = path.replace('/api', '');
      
      docs.paths[cleanPath] = {
        [method.toLowerCase()]: {
          summary: endpoint.description,
          description: endpoint.description,
          tags: ['API'],
          security: endpoint.auth ? [{ ApiKeyAuth: [] }] : [],
          responses: {
            '200': { description: '成功' },
            '401': { description: '未授权' },
            '404': { description: '未找到' },
            '429': { description: '超出配额' }
          }
        }
      };
    });

    // 添加 Webhook 端点
    if (typeof triggerManager !== 'undefined') {
      triggerManager.getAllTriggers().forEach(trigger => {
        if (trigger.type === 'webhook' || trigger.type === 'api') {
          docs.paths[trigger.webhookPath] = {
            post: {
              summary: `触发工作流: ${trigger.name}`,
              description: trigger.description || `通过 Webhook 触发工作流 ${trigger.workflow?.name || '未知'}`,
              tags: ['Webhooks'],
              parameters: [
                {
                  name: 'body',
                  in: 'body',
                  required: true,
                  schema: { type: 'object' },
                  description: '触发数据'
                }
              ],
              security: trigger.auth?.type !== 'none' ? [{ ApiKeyAuth: [] }] : [],
              responses: {
                '200': { description: '成功触发' },
                '401': { description: '未授权' },
                '403': { description: '触发器已禁用' }
              }
            }
          };
          
          if (trigger.httpMethod === 'GET') {
            docs.paths[trigger.webhookPath].get = {
              summary: `获取 Webhook: ${trigger.name}`,
              description: '通过 GET 请求触发工作流（查询参数作为数据）',
              tags: ['Webhooks'],
              parameters: [
                {
                  name: 'data',
                  in: 'query',
                  required: false,
                  type: 'string',
                  description: '触发数据（JSON 字符串）'
                }
              ],
              responses: {
                '200': { description: '成功触发' }
              }
            };
          }
        }
      });
    }

    return { docs };
  }

  /**
   * 获取配额信息
   */
  _getQuota() {
    return {
      quota: this.quota,
      usage: {
        totalRequests: this.usage.totalRequests,
        successfulRequests: this.usage.successfulRequests,
        failedRequests: this.usage.failedRequests,
        dailyRequests: this.usage.dailyRequests,
        hourlyRequests: this.usage.hourlyRequests,
        minuteRequests: this.usage.minuteRequests
      },
      remaining: {
        day: this.quota.requestsPerDay - this.usage.dailyRequests,
        hour: this.quota.requestsPerHour - this.usage.hourlyRequests,
        minute: this.quota.requestsPerMinute - this.usage.minuteRequests
      }
    };
  }

  /**
   * 获取触发器列表
   */
  _getTriggers() {
    if (typeof triggerManager === 'undefined') {
      return { triggers: [] };
    }
    
    const triggers = triggerManager.getAllTriggers().map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      enabled: t.enabled,
      webhookUrl: t.webhookUrl,
      httpMethod: t.httpMethod,
      auth: t.auth?.type || 'none',
      triggerCount: t.triggerCount,
      lastTriggered: t.lastTriggered,
      created: t.created
    }));
    
    return { triggers };
  }

  /**
   * 获取任务列表
   */
  _getTasks() {
    if (typeof scheduler === 'undefined') {
      return { tasks: [] };
    }
    
    const tasks = scheduler.getTasks().map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      enabled: t.enabled,
      status: t.status,
      cron: t.cron,
      nextRun: t.nextRun,
      lastRun: t.lastRun,
      runCount: t.runCount,
      created: t.created
    }));
    
    return { tasks };
  }

  /**
   * 获取工作流列表
   */
  _getWorkflows() {
    if (typeof WorkflowStorage === 'undefined') {
      return { workflows: [] };
    }
    
    const workflows = WorkflowStorage.getAllWorkflows().map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      nodeCount: w.nodes?.length || 0,
      updatedAt: w.updatedAt,
      created: w.created
    }));
    
    return { workflows };
  }

  /**
   * 获取使用统计
   */
  _getStats() {
    const stats = {
      api: this._getQuota(),
      triggers: typeof triggerManager !== 'undefined' ? triggerManager.getUsageStats() : null,
      scheduler: typeof scheduler !== 'undefined' ? scheduler.getUsageStats() : null
    };
    
    return stats;
  }

  /**
   * 获取请求日志
   */
  _getLogs(limit = 100) {
    return {
      logs: this.requestLog.slice(0, limit),
      total: this.requestLog.length
    };
  }

  /**
   * 更新配额
   */
  updateQuota(newQuota) {
    this.quota = { ...this.quota, ...newQuota };
    this._saveQuota();
    return { quota: this.quota };
  }

  /**
   * 重置使用统计
   */
  resetUsage() {
    this.usage = this._defaultUsage();
    this._saveQuota();
    return { success: true };
  }

  /**
   * 生成 SDK 代码示例
   */
  generateSDKExample() {
    const apiKey = localStorage.getItem('ai_creator_api_key') || 'YOUR_API_KEY';
    const baseUrl = window.location.origin;
    
    return {
      javascript: `
// AI Creator Workflow SDK Example
const API_KEY = '${apiKey}';
const BASE_URL = '${baseUrl}';

// 触发 Webhook
async function triggerWorkflow(webhookPath, data) {
  const response = await fetch(BASE_URL + webhookPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

// 获取配额
async function getQuota() {
  const response = await fetch(BASE_URL + '/api/quota', {
    headers: { 'X-API-Key': API_KEY }
  });
  return response.json();
}

// 获取触发器列表
async function getTriggers() {
  const response = await fetch(BASE_URL + '/api/triggers', {
    headers: { 'X-API-Key': API_KEY }
  });
  return response.json();
}
      `,
      curl: `
// AI Creator Workflow API Example

# 获取配额
curl -X GET ${baseUrl}/api/quota \\
  -H "X-API-Key: ${apiKey}"

# 触发 Webhook
curl -X POST ${baseUrl}/webhook/trigger_xxx \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"key": "value"}'

# 获取触发器列表
curl -X GET ${baseUrl}/api/triggers \\
  -H "X-API-Key: ${apiKey}"
      `
    };
  }
}

// 导出单例
const workflowRESTAPI = new WorkflowRESTAPI();

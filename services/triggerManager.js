/**
 * Trigger Manager Service - v18
 * 触发器管理服务 v18：Webhook配置、API Key/HMAC认证、重试机制、触发历史
 */
class TriggerManager {
  constructor() {
    this.triggers = [];
    this.webhookListeners = {};
    this.retryLogs = {};
    this.apiKeys = {};
    this.hmacSecrets = {};
    this.STORAGE_KEY = 'ai_creator_triggers_v18';
    this.API_KEY_PREFIX = 'wh_';
    
    this.loadTriggers();
    this._registerWebhooks();
    this._initAPI();
  }

  /**
   * 初始化 API 认证
   */
  _initAPI() {
    // 加载或生成 API Key
    const storedKey = localStorage.getItem('ai_creator_api_key');
    if (storedKey) {
      this.currentApiKey = storedKey;
    } else {
      this.currentApiKey = this.API_KEY_PREFIX + this._generateId();
      localStorage.setItem('ai_creator_api_key', this.currentApiKey);
    }
    
    // 加载 HMAC 密钥
    const storedSecret = localStorage.getItem('ai_creator_hmac_secret');
    if (storedSecret) {
      this.currentHmacSecret = storedSecret;
    } else {
      this.currentHmacSecret = this._generateId() + this._generateId();
      localStorage.setItem('ai_creator_hmac_secret', this.currentHmacSecret);
    }
  }

  /**
   * 生成唯一 ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /**
   * 加载已有触发器
   */
  loadTriggers() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.triggers = parsed.triggers || [];
        this.retryLogs = parsed.retryLogs || {};
        this.apiKeys = parsed.apiKeys || {};
        this.hmacSecrets = parsed.hmacSecrets || {};
      }
    } catch (e) {
      console.error('Failed to load triggers:', e);
      this.triggers = [];
      this.retryLogs = {};
    }
  }

  /**
   * 保存触发器到 localStorage
   */
  _saveTriggers() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        triggers: this.triggers,
        retryLogs: this.retryLogs,
        apiKeys: this.apiKeys,
        hmacSecrets: this.hmacSecrets
      }));
    } catch (e) {
      console.error('Failed to save triggers:', e);
    }
  }

  /**
   * 注册 Webhook 端点
   */
  _registerWebhooks() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'webhook_trigger') {
        this.handleWebhook(event.data.workflowId, event.data.data);
      }
    });
    
    // 监听来自 API 的触发
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'api_trigger') {
        this.handleAPITrigger(event.data);
      }
    });
  }

  /**
   * 添加触发器
   * @param {Object} trigger - 触发器对象
   * @returns {string} 触发器ID
   */
  addTrigger(trigger) {
    const newTrigger = {
      id: 'trigger_' + this._generateId(),
      name: trigger.name || '未命名触发器',
      workflowId: trigger.workflowId,
      workflow: trigger.workflow,
      type: trigger.type || 'webhook', // 'webhook' | 'schedule' | 'data_change' | 'api'
      enabled: trigger.enabled !== false,
      config: trigger.config || {},
      conditions: trigger.conditions || [],
      actions: trigger.actions || [],
      created: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
      // v18 新增字段
      auth: {
        type: trigger.auth?.type || 'none', // 'none' | 'apikey' | 'hmac'
        apiKey: trigger.auth?.apiKey || null,
        hmacSecret: trigger.auth?.hmacSecret || null
      },
      retry: {
        enabled: trigger.retry?.enabled !== false,
        maxRetries: trigger.retry?.maxRetries || 3,
        retryDelay: trigger.retry?.retryDelay || 1000
      },
      httpMethod: trigger.httpMethod || 'POST', // 'GET' | 'POST'
      history: []
    };
    
    // 为 webhook 类型生成唯一路径
    if (newTrigger.type === 'webhook' || newTrigger.type === 'api') {
      newTrigger.webhookPath = '/webhook/' + newTrigger.id;
      newTrigger.webhookUrl = window.location.origin + newTrigger.webhookPath;
    }
    
    this.triggers.push(newTrigger);
    this._saveTriggers();
    
    if (newTrigger.type === 'webhook' || newTrigger.type === 'api') {
      this._registerWebhookListener(newTrigger);
    }
    
    return newTrigger.id;
  }

  /**
   * 更新触发器
   */
  updateTrigger(triggerId, updates) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      Object.assign(trigger, updates);
      this._saveTriggers();
    }
  }

  /**
   * 删除触发器
   */
  removeTrigger(triggerId) {
    const index = this.triggers.findIndex(t => t.id === triggerId);
    if (index !== -1) {
      const trigger = this.triggers[index];
      
      if (trigger.type === 'webhook' && this.webhookListeners[triggerId]) {
        delete this.webhookListeners[triggerId];
      }
      
      this.triggers.splice(index, 1);
      delete this.retryLogs[triggerId];
      this._saveTriggers();
    }
  }

  /**
   * 获取工作流的所有触发器
   */
  getTriggers(workflowId) {
    return this.triggers.filter(t => t.workflowId === workflowId);
  }

  /**
   * 获取所有触发器
   */
  getAllTriggers() {
    return [...this.triggers];
  }

  /**
   * 启用触发器
   */
  enableTrigger(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = true;
      this._saveTriggers();
      
      if (trigger.type === 'webhook' || trigger.type === 'api') {
        this._registerWebhookListener(trigger);
      }
    }
  }

  /**
   * 禁用触发器
   */
  disableTrigger(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = false;
      this._saveTriggers();
      
      if (trigger.type === 'webhook' && this.webhookListeners[triggerId]) {
        delete this.webhookListeners[triggerId];
      }
    }
  }

  /**
   * 注册 Webhook 监听器
   */
  _registerWebhookListener(trigger) {
    this.webhookListeners[trigger.id] = (data, headers = {}) => {
      if (trigger.enabled) {
        // 验证认证
        if (!this._validateAuth(trigger, headers)) {
          return { error: 'Unauthorized', status: 401 };
        }
        this.handleWebhook(trigger.workflowId, data);
        return { success: true };
      }
      return { error: 'Trigger disabled', status: 403 };
    };
  }

  /**
   * 验证认证
   */
  _validateAuth(trigger, headers) {
    const auth = trigger.auth || {};
    
    if (auth.type === 'none') return true;
    
    if (auth.type === 'apikey') {
      const providedKey = headers['x-api-key'] || headers['Authorization'];
      return providedKey === auth.apiKey;
    }
    
    if (auth.type === 'hmac') {
      const providedSig = headers['x-hmac-signature'];
      if (!providedSig) return false;
      const expectedSig = this._computeHMAC(auth.hmacSecret, JSON.stringify(headers['x-hmac-body'] || ''));
      return providedSig === expectedSig;
    }
    
    return true;
  }

  /**
   * 计算 HMAC 签名
   */
  _computeHMAC(secret, data) {
    // 简化实现，实际应使用 Web Crypto API
    let hash = 0;
    const combined = secret + data;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'sig_' + Math.abs(hash).toString(16);
  }

  /**
   * 处理 Webhook 触发
   */
  async handleWebhook(workflowId, data) {
    const trigger = this.triggers.find(t => 
      t.workflowId === workflowId && 
      (t.type === 'webhook' || t.type === 'api') && 
      t.enabled
    );
    
    if (!trigger) {
      console.log('[TriggerManager] No matching webhook trigger found');
      return null;
    }
    
    if (!this._checkConditions(trigger.conditions, data)) {
      console.log('[TriggerManager] Trigger conditions not met');
      return null;
    }
    
    console.log('[TriggerManager] Webhook triggered:', trigger.name);
    
    return await this._executeTriggerWithRetry(trigger, data);
  }

  /**
   * 处理 API 触发
   */
  async handleAPITrigger(data) {
    const { triggerId, payload, headers } = data;
    const trigger = this.triggers.find(t => t.id === triggerId && t.enabled);
    
    if (!trigger) {
      return { error: 'Trigger not found or disabled', status: 404 };
    }
    
    if (!this._validateAuth(trigger, headers)) {
      return { error: 'Unauthorized', status: 401 };
    }
    
    return await this._executeTriggerWithRetry(trigger, payload);
  }

  /**
   * 带重试机制执行触发器
   */
  async _executeTriggerWithRetry(trigger, data, retryCount = 0) {
    const startTime = Date.now();
    
    try {
      const result = await this._executeTrigger(trigger, data);
      
      // 记录成功
      this._addHistoryEntry(trigger.id, {
        type: 'success',
        timestamp: startTime,
        duration: Date.now() - startTime,
        data,
        retryCount
      });
      
      // 清除重试日志
      delete this.retryLogs[trigger.id];
      this._saveTriggers();
      
      return result;
      
    } catch (error) {
      console.error('[TriggerManager] Trigger execution failed:', error);
      
      // 记录失败
      this._addHistoryEntry(trigger.id, {
        type: 'error',
        timestamp: startTime,
        duration: Date.now() - startTime,
        error: error.message,
        data,
        retryCount
      });
      
      // 检查是否需要重试
      if (trigger.retry?.enabled && retryCount < trigger.retry.maxRetries) {
        const delay = trigger.retry.retryDelay * Math.pow(2, retryCount); // 指数退避
        console.log(`[TriggerManager] Retrying in ${delay}ms (attempt ${retryCount + 1}/${trigger.retry.maxRetries})`);
        
        // 记录重试日志
        this.retryLogs[trigger.id] = this.retryLogs[trigger.id] || [];
        this.retryLogs[trigger.id].push({
          attempt: retryCount + 1,
          timestamp: Date.now(),
          error: error.message,
          scheduledRetry: Date.now() + delay
        });
        this._saveTriggers();
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this._executeTriggerWithRetry(trigger, data, retryCount + 1));
          }, delay);
        });
      }
      
      return { error: error.message, status: 500 };
    }
  }

  /**
   * 添加历史记录
   */
  _addHistoryEntry(triggerId, entry) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.history = trigger.history || [];
      trigger.history.unshift(entry);
      // 只保留最近 100 条
      if (trigger.history.length > 100) {
        trigger.history = trigger.history.slice(0, 100);
      }
      trigger.lastTriggered = new Date().toISOString();
      trigger.triggerCount++;
      this._saveTriggers();
    }
  }

  /**
   * 获取触发器历史
   */
  getTriggerHistory(triggerId, limit = 50) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger && trigger.history) {
      return trigger.history.slice(0, limit);
    }
    return [];
  }

  /**
   * 获取重试日志
   */
  getRetryLogs(triggerId) {
    return this.retryLogs[triggerId] || [];
  }

  /**
   * 处理定时触发
   */
  async handleSchedule(trigger) {
    if (!trigger.enabled || trigger.type !== 'schedule') {
      return;
    }
    
    if (!this._checkConditions(trigger.conditions, {})) {
      return;
    }
    
    console.log('[TriggerManager] Schedule triggered:', trigger.name);
    
    await this._executeTriggerWithRetry(trigger, { source: 'schedule' });
  }

  /**
   * 处理数据变化触发
   */
  async handleDataChange(trigger, data) {
    if (!trigger.enabled || trigger.type !== 'data_change') {
      return;
    }
    
    if (!this._checkConditions(trigger.conditions, data)) {
      return;
    }
    
    console.log('[TriggerManager] Data change triggered:', trigger.name);
    
    await this._executeTriggerWithRetry(trigger, data);
  }

  /**
   * 检查触发条件
   */
  _checkConditions(conditions, data) {
    if (!conditions || conditions.length === 0) {
      return true;
    }
    
    return conditions.every(condition => {
      const value = this._getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        case 'not_exists':
          return value === undefined || value === null;
        default:
          return true;
      }
    });
  }

  /**
   * 获取嵌套值
   */
  _getNestedValue(obj, path) {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 执行触发器
   */
  async _executeTrigger(trigger, data) {
    const startTime = Date.now();
    
    try {
      if (trigger.workflow && typeof WorkflowEngine !== 'undefined') {
        await new Promise((resolve, reject) => {
          const originalComplete = WorkflowEngine.onComplete;
          const originalError = WorkflowEngine.onError;
          
          WorkflowEngine.onComplete = (results) => {
            WorkflowEngine.onComplete = originalComplete;
            WorkflowEngine.onError = originalError;
            resolve(results);
          };
          
          WorkflowEngine.onError = (error) => {
            WorkflowEngine.onComplete = originalComplete;
            WorkflowEngine.onError = originalError;
            reject(error);
          };
          
          const workflowWithInput = {
            ...trigger.workflow,
            input: data
          };
          
          WorkflowEngine.run(workflowWithInput);
        });
      }
      
      this._notify('触发器执行成功', `${trigger.name} 已触发执行`);
      
      const report = {
        triggerId: trigger.id,
        triggerName: trigger.name,
        type: trigger.type,
        status: 'success',
        data: data,
        startTime: startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      };
      
      console.log('[TriggerManager] Trigger report:', report);
      
      await this._executeActions(trigger.actions, data);
      
      return { success: true, report };
      
    } catch (error) {
      console.error('[TriggerManager] Trigger execution failed:', error);
      this._notify('触发器执行失败', `${trigger.name} 执行失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 执行触发器动作
   */
  async _executeActions(actions, data) {
    if (!actions || actions.length === 0) return;
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'notification':
            this._notify(action.title || '通知', action.body || '');
            break;
          case 'webhook':
            await fetch(action.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            break;
          case 'log':
            console.log('[Trigger Action Log]:', action.message);
            break;
        }
      } catch (error) {
        console.error('[TriggerManager] Action execution failed:', error);
      }
    }
  }

  /**
   * 发送浏览器通知
   */
  _notify(title, body) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '🎨' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '🎨' });
          }
        });
      }
    }
  }

  /**
   * 模拟触发 Webhook（用于测试）
   */
  simulateWebhook(triggerId, data = {}) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger && (trigger.type === 'webhook' || trigger.type === 'api')) {
      return this.handleWebhook(trigger.workflowId, {
        ...data,
        _simulated: true,
        _timestamp: Date.now()
      });
    }
    return { error: 'Trigger not found or not a webhook', status: 404 };
  }

  /**
   * 生成 API Key
   */
  generateAPIKey(triggerId) {
    const key = 'wh_' + this._generateId() + '_' + this._generateId();
    this.apiKeys[triggerId] = key;
    this._saveTriggers();
    return key;
  }

  /**
   * 生成 HMAC Secret
   */
  generateHMACSecret(triggerId) {
    const secret = 'hmac_' + this._generateId() + '_' + this._generateId();
    this.hmacSecrets[triggerId] = secret;
    this._saveTriggers();
    return secret;
  }

  /**
   * 获取使用统计
   */
  getUsageStats() {
    const stats = {
      totalTriggers: this.triggers.length,
      activeTriggers: this.triggers.filter(t => t.enabled).length,
      totalExecutions: this.triggers.reduce((sum, t) => sum + (t.triggerCount || 0), 0),
      byType: {},
      recentTriggers: []
    };
    
    this.triggers.forEach(t => {
      stats.byType[t.type] = (stats.byType[t.type] || 0) + 1;
    });
    
    // 最近触发的 10 条
    const allHistory = [];
    this.triggers.forEach(t => {
      if (t.history) {
        t.history.slice(0, 5).forEach(h => {
          allHistory.push({ ...h, triggerName: t.name, triggerId: t.id });
        });
      }
    });
    stats.recentTriggers = allHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    return stats;
  }

  /**
   * 获取 API 文档 (Swagger 风格)
   */
  getAPIDocs() {
    const baseUrl = window.location.origin;
    
    return {
      swagger: '2.0',
      info: {
        title: 'AI Creator Workflow API',
        version: '1.0.0',
        description: '工作流 Webhook 和 API 接口文档'
      },
      basePath: '/',
      triggers: this.triggers.filter(t => t.type === 'webhook' || t.type === 'api').map(t => ({
        path: t.webhookPath,
        method: t.httpMethod || 'POST',
        name: t.name,
        description: `触发工作流: ${t.workflow?.name || '未知'}`,
        auth: t.auth?.type || 'none',
        parameters: t.httpMethod === 'GET' ? [] : [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: { type: 'object' },
            description: '触发数据'
          }
        ],
        responses: {
          '200': { description: '成功触发' },
          '401': { description: '未授权' },
          '403': { description: '触发器已禁用' },
          '404': { description: '触发器不存在' }
        }
      }))
    };
  }

  /**
   * 导出配置
   */
  exportConfig(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (!trigger) return null;
    
    return {
      id: trigger.id,
      name: trigger.name,
      type: trigger.type,
      webhookUrl: trigger.webhookUrl,
      auth: trigger.auth,
      httpMethod: trigger.httpMethod,
      retry: trigger.retry,
      conditions: trigger.conditions
    };
  }
}

// 导出单例
const triggerManager = new TriggerManager();

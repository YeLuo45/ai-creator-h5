/**
 * Trigger Manager Service - v10
 * 触发器管理服务：Webhook、定时、数据变化触发
 */
class TriggerManager {
  constructor() {
    this.triggers = [];
    this.webhookListeners = {};
    this.STORAGE_KEY = 'ai_creator_triggers';
    
    this.loadTriggers();
    this._registerWebhooks();
  }

  /**
   * 加载已有触发器
   */
  loadTriggers() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.triggers = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load triggers:', e);
      this.triggers = [];
    }
  }

  /**
   * 保存触发器到 localStorage
   */
  _saveTriggers() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.triggers));
    } catch (e) {
      console.error('Failed to save triggers:', e);
    }
  }

  /**
   * 注册 Webhook 端点
   */
  _registerWebhooks() {
    // 监听 webhook 调用
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'webhook_trigger') {
        this.handleWebhook(event.data.workflowId, event.data.data);
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
      id: 'trigger_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: trigger.name || '未命名触发器',
      workflowId: trigger.workflowId,
      workflow: trigger.workflow,
      type: trigger.type || 'webhook', // 'webhook' | 'schedule' | 'data_change'
      enabled: trigger.enabled !== false,
      config: trigger.config || {},
      conditions: trigger.conditions || [], // 触发条件
      actions: trigger.actions || [], // 触发后动作
      created: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0
    };
    
    // 为 webhook 类型生成唯一路径
    if (newTrigger.type === 'webhook') {
      newTrigger.webhookPath = '/webhook/' + newTrigger.id;
      newTrigger.webhookUrl = window.location.origin + newTrigger.webhookPath;
    }
    
    this.triggers.push(newTrigger);
    this._saveTriggers();
    
    // 注册 webhook 监听
    if (newTrigger.type === 'webhook') {
      this._registerWebhookListener(newTrigger);
    }
    
    return newTrigger.id;
  }

  /**
   * 删除触发器
   * @param {string} triggerId - 触发器ID
   */
  removeTrigger(triggerId) {
    const index = this.triggers.findIndex(t => t.id === triggerId);
    if (index !== -1) {
      const trigger = this.triggers[index];
      
      // 移除 webhook 监听
      if (trigger.type === 'webhook' && this.webhookListeners[triggerId]) {
        delete this.webhookListeners[triggerId];
      }
      
      this.triggers.splice(index, 1);
      this._saveTriggers();
    }
  }

  /**
   * 获取工作流的所有触发器
   * @param {string} workflowId - 工作流ID
   * @returns {Array} 触发器列表
   */
  getTriggers(workflowId) {
    return this.triggers.filter(t => t.workflowId === workflowId);
  }

  /**
   * 启用触发器
   * @param {string} triggerId - 触发器ID
   */
  enableTrigger(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = true;
      this._saveTriggers();
      
      // 重新注册 webhook
      if (trigger.type === 'webhook') {
        this._registerWebhookListener(trigger);
      }
    }
  }

  /**
   * 禁用触发器
   * @param {string} triggerId - 触发器ID
   */
  disableTrigger(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = false;
      this._saveTriggers();
      
      // 移除 webhook 监听
      if (trigger.type === 'webhook' && this.webhookListeners[triggerId]) {
        delete this.webhookListeners[triggerId];
      }
    }
  }

  /**
   * 注册 Webhook 监听器
   */
  _registerWebhookListener(trigger) {
    this.webhookListeners[trigger.id] = (data) => {
      if (trigger.enabled) {
        this.handleWebhook(trigger.workflowId, data);
      }
    };
  }

  /**
   * 处理 Webhook 触发
   * @param {string} workflowId - 工作流ID
   * @param {Object} data - 触发数据
   */
  async handleWebhook(workflowId, data) {
    const trigger = this.triggers.find(t => 
      t.workflowId === workflowId && t.type === 'webhook' && t.enabled
    );
    
    if (!trigger) {
      console.log('[TriggerManager] No matching webhook trigger found');
      return;
    }
    
    // 检查触发条件
    if (!this._checkConditions(trigger.conditions, data)) {
      console.log('[TriggerManager] Trigger conditions not met');
      return;
    }
    
    console.log('[TriggerManager] Webhook triggered:', trigger.name);
    
    await this._executeTrigger(trigger, data);
  }

  /**
   * 处理定时触发
   * @param {Object} trigger - 触发器对象
   */
  async handleSchedule(trigger) {
    if (!trigger.enabled || trigger.type !== 'schedule') {
      return;
    }
    
    // 检查触发条件
    if (!this._checkConditions(trigger.conditions, {})) {
      return;
    }
    
    console.log('[TriggerManager] Schedule triggered:', trigger.name);
    
    await this._executeTrigger(trigger, { source: 'schedule' });
  }

  /**
   * 处理数据变化触发
   * @param {Object} trigger - 触发器对象
   * @param {Object} data - 变化的数据
   */
  async handleDataChange(trigger, data) {
    if (!trigger.enabled || trigger.type !== 'data_change') {
      return;
    }
    
    // 检查触发条件
    if (!this._checkConditions(trigger.conditions, data)) {
      return;
    }
    
    console.log('[TriggerManager] Data change triggered:', trigger.name);
    
    await this._executeTrigger(trigger, data);
  }

  /**
   * 检查触发条件
   * @param {Array} conditions - 条件数组
   * @param {Object} data - 数据对象
   * @returns {boolean} 是否满足条件
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
      // 执行工作流
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
          
          // 传入触发数据作为输入
          const workflowWithInput = {
            ...trigger.workflow,
            input: data
          };
          
          WorkflowEngine.run(workflowWithInput);
        });
      }
      
      // 更新触发器状态
      trigger.lastTriggered = new Date().toISOString();
      trigger.triggerCount++;
      this._saveTriggers();
      
      // 发送通知
      this._notify('触发器执行成功', `${trigger.name} 已触发执行`);
      
      // 生成执行报告
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
      
      // 执行后续动作
      await this._executeActions(trigger.actions, data);
      
    } catch (error) {
      console.error('[TriggerManager] Trigger execution failed:', error);
      
      this._notify('触发器执行失败', `${trigger.name} 执行失败: ${error.message}`);
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
    if (trigger && trigger.type === 'webhook') {
      this.handleWebhook(trigger.workflowId, {
        ...data,
        _simulated: true,
        _timestamp: Date.now()
      });
    }
  }

  /**
   * 获取所有触发器
   */
  getAllTriggers() {
    return [...this.triggers];
  }
}

// 导出单例
const triggerManager = new TriggerManager();

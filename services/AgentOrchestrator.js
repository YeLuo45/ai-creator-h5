/**
 * AgentOrchestrator.js - Multi-Agent Orchestrator
 * 基于 chatdev 多角色协作 + ruflo 层次分解 + nanobot mesh 网络
 * 
 * 核心能力：
 * - 角色注册与生命周期管理
 * - 任务分发与结果聚合
 * - 协作式问题解决
 * - 消息路由与状态同步
 */

(function() {
  'use strict';

  // ========== Agent States ==========
  const AGENT_STATE = {
    IDLE: 'idle',
    BUSY: 'busy',
    WAITING: 'waiting',
    ERROR: 'error',
    TERMINATED: 'terminated'
  };

  const AGENT_ROLE = {
    PLANNER: 'planner',         // 任务规划
    EXECUTOR: 'executor',       // 执行器
    REVIEWER: 'reviewer',       // 审核
    COORDINATOR: 'coordinator',  // 协调
    SPECIALIST: 'specialist'     // 专家
  };

  // ========== Message Types ==========
  const MSG_TYPE = {
    REQUEST: 'request',
    RESPONSE: 'response',
    BROADCAST: 'broadcast',
    HEARTBEAT: 'heartbeat',
    ERROR: 'error'
  };

  // ========== Agent Class ==========
  class Agent {
    constructor(options = {}) {
      this.id = options.id || this._generateId();
      this.name = options.name || `Agent_${this.id}`;
      this.role = options.role || AGENT_ROLE.SPECIALIST;
      this.state = AGENT_STATE.IDLE;
      this.capabilities = options.capabilities || [];
      this.metadata = options.metadata || {};
      this.taskHistory = [];
      this.messageQueue = [];
      this.createdAt = Date.now();
      this.lastActive = Date.now();
    }

    _generateId() {
      return 'agent_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    }

    // 处理消息
    async handleMessage(message) {
      this.lastActive = Date.now();
      
      try {
        const result = await this._processMessage(message);
        this.state = AGENT_STATE.IDLE;
        return result;
      } catch (error) {
        this.state = AGENT_STATE.ERROR;
        return { success: false, error: error.message };
      }
    }

    // 处理任务
    async executeTask(task) {
      this.state = AGENT_STATE.BUSY;
      this.lastActive = Date.now();
      
      const startTime = Date.now();
      const taskRecord = {
        taskId: task.id,
        taskType: task.type,
        startTime,
        status: 'started'
      };

      try {
        const result = await this._executeTaskLogic(task);
        taskRecord.status = 'completed';
        taskRecord.result = result;
        taskRecord.duration = Date.now() - startTime;
        
        this.state = AGENT_STATE.IDLE;
        this.taskHistory.push(taskRecord);
        
        return { success: true, result };
      } catch (error) {
        taskRecord.status = 'failed';
        taskRecord.error = error.message;
        taskRecord.duration = Date.now() - startTime;
        
        this.state = AGENT_STATE.ERROR;
        this.taskHistory.push(taskRecord);
        
        return { success: false, error: error.message };
      }
    }

    // 子类重写：任务执行逻辑
    async _executeTaskLogic(task) {
      // 默认实现
      return { message: 'Task processed', data: task.payload };
    }

    // 子类重写：消息处理逻辑
    async _processMessage(message) {
      // 默认实现
      return { received: true, type: message.type };
    }

    // 获取能力列表
    getCapabilities() {
      return [...this.capabilities];
    }

    // 检查是否有某能力
    hasCapability(capability) {
      return this.capabilities.includes(capability);
    }

    // 获取状态
    getStatus() {
      return {
        id: this.id,
        name: this.name,
        role: this.role,
        state: this.state,
        capabilities: this.capabilities,
        lastActive: this.lastActive,
        taskCount: this.taskHistory.length
      };
    }

    // 获取任务历史
    getTaskHistory(limit = 10) {
      return this.taskHistory.slice(-limit);
    }

    // 重置状态
    reset() {
      this.state = AGENT_STATE.IDLE;
      this.messageQueue = [];
    }

    // 终止
    terminate() {
      this.state = AGENT_STATE.TERMINATED;
    }
  }

  // ========== PlannerAgent ==========
  class PlannerAgent extends Agent {
    constructor(options = {}) {
      super({ ...options, role: AGENT_ROLE.PLANNER, name: options.name || 'PlannerAgent' });
      this.capabilities = ['task_planning', 'goal_decomposition', 'priority_sorting'];
      this.plans = [];
    }

    async _executeTaskLogic(task) {
      const { goals, constraints } = task.payload || {};
      
      // 目标分解
      const subGoals = this._decomposeGoals(goals);
      
      // 优先级排序
      const sortedGoals = this._prioritizeGoals(subGoals);
      
      const plan = {
        id: 'plan_' + Date.now().toString(36),
        goals: sortedGoals,
        constraints: constraints || [],
        createdAt: Date.now()
      };
      
      this.plans.push(plan);
      
      return {
        plan,
        stepCount: sortedGoals.length,
        estimatedDuration: sortedGoals.length * 1000
      };
    }

    _decomposeGoals(goals) {
      if (!goals) return [];
      if (!Array.isArray(goals)) goals = [goals];
      
      return goals.flatMap(goal => {
        if (typeof goal === 'string') {
          return [{ id: 'goal_' + Date.now().toString(36), description: goal, status: 'pending' }];
        }
        return goal;
      });
    }

    _prioritizeGoals(subGoals) {
      return subGoals.sort((a, b) => {
        const priorityA = a.priority || 50;
        const priorityB = b.priority || 50;
        return priorityB - priorityA;
      });
    }
  }

  // ========== ExecutorAgent ==========
  class ExecutorAgent extends Agent {
    constructor(options = {}) {
      super({ ...options, role: AGENT_ROLE.EXECUTOR, name: options.name || 'ExecutorAgent' });
      this.capabilities = ['code_generation', 'api_call', 'data_processing'];
      this.currentTasks = new Map();
    }

    async _executeTaskLogic(task) {
      const { action, target, params } = task.payload || {};
      
      // 模拟执行
      const result = await this._performAction(action, target, params);
      
      return {
        action,
        target,
        result,
        executedAt: Date.now()
      };
    }

    async _performAction(action, target, params) {
      // 根据action类型执行不同操作
      switch (action) {
        case 'generate':
          return { generated: true, target, format: params?.format || 'default' };
        case 'analyze':
          return { analyzed: true, target, findings: ['finding1', 'finding2'] };
        case 'transform':
          return { transformed: true, target, output: 'output_data' };
        default:
          return { action, target, processed: true };
      }
    }
  }

  // ========== ReviewerAgent ==========
  class ReviewerAgent extends Agent {
    constructor(options = {}) {
      super({ ...options, role: AGENT_ROLE.REVIEWER, name: options.name || 'ReviewerAgent' });
      this.capabilities = ['code_review', 'quality_check', 'validation'];
      this.reviews = [];
    }

    async _executeTaskLogic(task) {
      const { content, criteria } = task.payload || {};
      
      const reviewResult = {
        id: 'review_' + Date.now().toString(36),
        content,
        criteria: criteria || ['correctness', 'completeness'],
        results: {},
        approved: false,
        createdAt: Date.now()
      };

      // 执行审核
      reviewResult.results = await this._performReview(content, criteria);
      reviewResult.approved = this._evaluateApproval(reviewResult.results);
      
      this.reviews.push(reviewResult);
      
      return reviewResult;
    }

    async _performReview(content, criteria) {
      // 模拟审核
      const results = {};
      criteria?.forEach(c => {
        results[c] = { score: Math.random() * 40 + 60, passed: true };
      });
      return results;
    }

    _evaluateApproval(results) {
      return Object.values(results).every(r => r.score >= 60);
    }
  }

  // ========== AgentRegistry ==========
  class AgentRegistry {
    constructor() {
      this.agents = new Map();
      this.roleIndex = new Map();
    }

    // 注册Agent
    register(agent) {
      if (!(agent instanceof Agent)) {
        throw new Error('Invalid agent: must be instance of Agent');
      }
      
      this.agents.set(agent.id, agent);
      
      // 按角色索引
      if (!this.roleIndex.has(agent.role)) {
        this.roleIndex.set(agent.role, new Set());
      }
      this.roleIndex.get(agent.role).add(agent.id);
      
      return agent;
    }

    // 注销Agent
    unregister(agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        this.agents.delete(agentId);
        
        const roleAgents = this.roleIndex.get(agent.role);
        if (roleAgents) {
          roleAgents.delete(agentId);
        }
        
        return true;
      }
      return false;
    }

    // 获取Agent
    get(agentId) {
      return this.agents.get(agentId);
    }

    // 按角色获取
    getByRole(role) {
      const agentIds = this.roleIndex.get(role);
      if (!agentIds) return [];
      return [...agentIds].map(id => this.agents.get(id)).filter(Boolean);
    }

    // 获取所有Agent
    getAll() {
      return [...this.agents.values()];
    }

    // 按能力查找
    findByCapability(capability) {
      return [...this.agents.values()].filter(agent => 
        agent.hasCapability(capability)
      );
    }

    // 获取空闲Agent
    getIdleAgents() {
      return [...this.agents.values()].filter(agent => 
        agent.state === AGENT_STATE.IDLE
      );
    }

    // 获取数量
    size() {
      return this.agents.size;
    }
  }

  // ========== TaskRouter ==========
  class TaskRouter {
    constructor(registry) {
      this.registry = registry;
      this.routingRules = [];
    }

    // 添加路由规则
    addRule(pattern, targetRole) {
      this.routingRules.push({ pattern, targetRole, createdAt: Date.now() });
    }

    // 路由任务
    route(task) {
      const { type, requiredCapabilities } = task;
      
      // 按规则匹配
      for (const rule of this.routingRules) {
        if (this._matchPattern(type, rule.pattern)) {
          const agents = this.registry.getByRole(rule.targetRole);
          const available = agents.filter(a => a.state === AGENT_STATE.IDLE);
          
          if (available.length > 0) {
            return available[0];
          }
        }
      }
      
      // 按能力匹配
      if (requiredCapabilities) {
        const capable = this.registry.findByCapability(requiredCapabilities);
        const available = capable.filter(a => a.state === AGENT_STATE.IDLE);
        
        if (available.length > 0) {
          return available[0];
        }
      }
      
      // 默认：返回第一个空闲Agent
      const idle = this.registry.getIdleAgents();
      return idle[0] || null;
    }

    _matchPattern(type, pattern) {
      if (typeof pattern === 'string') {
        return type.includes(pattern);
      }
      if (pattern instanceof RegExp) {
        return pattern.test(type);
      }
      return false;
    }
  }

  // ========== Orchestrator ==========
  class AgentOrchestrator {
    constructor(options = {}) {
      this.id = options.id || 'orchestrator_' + Date.now().toString(36);
      this.registry = new AgentRegistry();
      this.router = new TaskRouter(this.registry);
      this.taskQueue = [];
      this.runningTasks = new Map();
      this.completedTasks = [];
      this.listeners = new Map();
      this.config = {
        maxConcurrentTasks: options.maxConcurrentTasks || 5,
        taskTimeout: options.taskTimeout || 60000,
        retryCount: options.retryCount || 3,
        ...options
      };
      
      // 初始化默认Agent
      this._initDefaultAgents();
      
      // 设置默认路由规则
      this._setupDefaultRoutes();
    }

    _initDefaultAgents() {
      // 创建Planner
      const planner = new PlannerAgent({ name: 'MainPlanner' });
      this.registry.register(planner);
      
      // 创建Executor
      const executor = new ExecutorAgent({ name: 'MainExecutor' });
      this.registry.register(executor);
      
      // 创建Reviewer
      const reviewer = new ReviewerAgent({ name: 'MainReviewer' });
      this.registry.register(reviewer);
    }

    _setupDefaultRoutes() {
      this.router.addRule(/planning|goal/i, AGENT_ROLE.PLANNER);
      this.router.addRule(/generate|create|execute/i, AGENT_ROLE.EXECUTOR);
      this.router.addRule(/review|check|validate/i, AGENT_ROLE.REVIEWER);
    }

    // 提交任务
    async submitTask(task) {
      const taskId = task.id || 'task_' + Date.now().toString(36);
      const wrappedTask = {
        id: taskId,
        type: task.type,
        payload: task.payload,
        priority: task.priority || 50,
        status: 'pending',
        createdAt: Date.now(),
        retries: 0
      };

      // 如果队列未满，直接处理
      if (this.runningTasks.size < this.config.maxConcurrentTasks) {
        return this._executeTask(wrappedTask);
      }
      
      // 否则加入队列
      this.taskQueue.push(wrappedTask);
      this._sortTaskQueue();
      
      return { taskId, status: 'queued', queuePosition: this.taskQueue.length };
    }

    // 执行任务
    async _executeTask(task) {
      task.status = 'running';
      task.startedAt = Date.now();
      this.runningTasks.set(task.id, task);
      
      // 路由到合适的Agent
      const agent = this.router.route(task);
      
      if (!agent) {
        task.status = 'failed';
        task.error = 'No available agent';
        this.runningTasks.delete(task.id);
        this.completedTasks.push(task);
        return { taskId: task.id, status: 'failed', error: 'No agent available' };
      }
      
      try {
        const result = await agent.executeTask(task);
        
        task.status = result.success ? 'completed' : 'failed';
        task.result = result.result || result.error;
        task.completedAt = Date.now();
        
        this.runningTasks.delete(task.id);
        this.completedTasks.push(task);
        
        // 触发事件
        this._emit('taskCompleted', { task, result });
        
        // 处理下一个任务
        this._processNextTask();
        
        return { taskId: task.id, status: task.status, result: task.result };
      } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        task.retries++;
        
        this.runningTasks.delete(task.id);
        
        // 重试
        if (task.retries < this.config.retryCount) {
          this.taskQueue.unshift(task);
        } else {
          this.completedTasks.push(task);
          this._emit('taskFailed', { task, error });
        }
        
        this._processNextTask();
        
        return { taskId: task.id, status: 'failed', error: error.message };
      }
    }

    // 处理下一个任务
    _processNextTask() {
      if (this.taskQueue.length === 0) return;
      if (this.runningTasks.size >= this.config.maxConcurrentTasks) return;
      
      const nextTask = this.taskQueue.shift();
      this._executeTask(nextTask);
    }

    // 排序任务队列
    _sortTaskQueue() {
      this.taskQueue.sort((a, b) => b.priority - a.priority);
    }

    // 注册Agent
    registerAgent(agent) {
      return this.registry.register(agent);
    }

    // 注销Agent
    unregisterAgent(agentId) {
      return this.registry.unregister(agentId);
    }

    // 获取Agent
    getAgent(agentId) {
      return this.registry.get(agentId);
    }

    // 获取所有Agent
    getAllAgents() {
      return this.registry.getAll().map(a => a.getStatus());
    }

    // 添加监听器
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
    }

    // 移除监听器
    off(event, callback) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    }

    // 触发事件
    _emit(event, data) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => {
          try {
            callback(data);
          } catch (e) {
            console.error('Event listener error:', e);
          }
        });
      }
    }

    // 获取状态
    getStatus() {
      return {
        id: this.id,
        agentCount: this.registry.size(),
        runningTasks: this.runningTasks.size,
        queuedTasks: this.taskQueue.length,
        completedTasks: this.completedTasks.length,
        agents: this.getAllAgents()
      };
    }

    // 获取任务状态
    getTaskStatus(taskId) {
      const running = this.runningTasks.get(taskId);
      if (running) return { ...running, location: 'running' };
      
      const queued = this.taskQueue.find(t => t.id === taskId);
      if (queued) return { ...queued, location: 'queued' };
      
      const completed = this.completedTasks.find(t => t.id === taskId);
      if (completed) return { ...completed, location: 'completed' };
      
      return null;
    }

    // 取消任务
    cancelTask(taskId) {
      const queuedIndex = this.taskQueue.findIndex(t => t.id === taskId);
      if (queuedIndex !== -1) {
        this.taskQueue.splice(queuedIndex, 1);
        return true;
      }
      return false;
    }

    // 清空完成的任务记录
    clearCompletedTasks(keepLast = 100) {
      if (this.completedTasks.length > keepLast) {
        this.completedTasks = this.completedTasks.slice(-keepLast);
      }
    }

    // 导出状态
    export() {
      return {
        id: this.id,
        config: this.config,
        agents: this.registry.getAll().map(a => a.getStatus()),
        stats: {
          totalAgents: this.registry.size(),
          runningTasks: this.runningTasks.size,
          queuedTasks: this.taskQueue.length,
          completedTasks: this.completedTasks.length
        }
      };
    }

    // 销毁
    destroy() {
      this.registry.getAll().forEach(a => a.terminate());
      this.taskQueue = [];
      this.runningTasks.clear();
      this.completedTasks = [];
      this.listeners.clear();
    }
  }

  // ========== Export ==========
  window.AgentOrchestrator = {
    // Classes
    Agent,
    PlannerAgent,
    ExecutorAgent,
    ReviewerAgent,
    AgentRegistry,
    TaskRouter,
    AgentOrchestrator,
    
    // Constants
    AGENT_STATE,
    AGENT_ROLE,
    MSG_TYPE
  };

})();
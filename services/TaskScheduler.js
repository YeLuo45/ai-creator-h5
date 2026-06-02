/**
 * TaskScheduler.js - Collaborative Task Scheduler
 * 基于 ruflo 层次分解任务调度 + thunderbolt 反馈循环
 * 
 * 核心能力：
 * - 层次化任务分解
 * - 协作式任务调度
 * - 反馈驱动的自适应调度
 * - 资源感知分配
 */

(function() {
  'use strict';

  // ========== Task Priority ==========
  const TASK_PRIORITY = {
    CRITICAL: 100,
    HIGH: 75,
    NORMAL: 50,
    LOW: 25,
    BACKGROUND: 10
  };

  // ========== Task Status ==========
  const TASK_STATUS = {
    PENDING: 'pending',
    READY: 'ready',
    RUNNING: 'running',
    WAITING: 'waiting',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  // ========== Task States ==========
  const SCHEDULER_STATE = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped'
  };

  // ========== Task Class ==========
  class Task {
    constructor(options = {}) {
      this.id = options.id || this._generateId();
      this.name = options.name || `Task_${this.id}`;
      this.description = options.description || '';
      this.type = options.type || 'general';
      this.priority = options.priority || TASK_PRIORITY.NORMAL;
      this.status = TASK_STATUS.PENDING;
      this.parentId = options.parentId || null;
      this.subTasks = [];
      this.dependencies = options.dependencies || [];
      this.resources = options.resources || {};
      this.result = null;
      this.error = null;
      this.createdAt = Date.now();
      this.startedAt = null;
      this.completedAt = null;
      this.progress = 0;
      this.metadata = options.metadata || {};
    }

    _generateId() {
      return 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    // 更新进度
    updateProgress(progress) {
      this.progress = Math.max(0, Math.min(100, progress));
      return this.progress;
    }

    // 开始任务
    start() {
      this.status = TASK_STATUS.RUNNING;
      this.startedAt = Date.now();
    }

    // 完成任务
    complete(result = null) {
      this.status = TASK_STATUS.COMPLETED;
      this.completedAt = Date.now();
      this.progress = 100;
      this.result = result;
    }

    // 失败任务
    fail(error) {
      this.status = TASK_STATUS.FAILED;
      this.completedAt = Date.now();
      this.error = error;
    }

    // 取消任务
    cancel() {
      this.status = TASK_STATUS.CANCELLED;
      this.completedAt = Date.now();
    }

    // 添加子任务
    addSubTask(subTask) {
      subTask.parentId = this.id;
      this.subTasks.push(subTask);
    }

    // 获取深度
    getDepth() {
      let depth = 0;
      let parent = this.parentId;
      while (parent) {
        depth++;
        parent = null; // 简化，实际需要从调度器查询
      }
      return depth;
    }

    // 估算执行时间
    estimateDuration() {
      const baseDuration = 1000; // 1秒基础
      const priorityFactor = (100 - this.priority) / 100 + 1;
      const complexityFactor = 1 + this.subTasks.length * 0.1;
      return baseDuration * priorityFactor * complexityFactor;
    }

    // 获取状态摘要
    getSummary() {
      return {
        id: this.id,
        name: this.name,
        type: this.type,
        priority: this.priority,
        status: this.status,
        progress: this.progress,
        parentId: this.parentId,
        subTaskCount: this.subTasks.length,
        createdAt: this.createdAt,
        startedAt: this.startedAt,
        completedAt: this.completedAt
      };
    }
  }

  // ========== Task Decomposer ==========
  class TaskDecomposer {
    constructor(options = {}) {
      this.maxDepth = options.maxDepth || 5;
      this.minTaskDuration = options.minTaskDuration || 100;
    }

    // 分解任务
    decompose(task, options = {}) {
      const maxDepth = options.maxDepth || this.maxDepth;
      const currentDepth = options.currentDepth || 0;
      
      if (currentDepth >= maxDepth) {
        return [task];
      }

      const subTasks = this._generateSubTasks(task);
      
      if (subTasks.length === 0) {
        return [task];
      }

      const decomposed = [];
      
      for (const subTask of subTasks) {
        const children = this.decompose(subTask, {
          currentDepth: currentDepth + 1,
          maxDepth
        });
        decomposed.push(...children);
      }

      return decomposed;
    }

    // 生成子任务（子类可重写）
    _generateSubTasks(task) {
      // 默认实现：根据任务类型和复杂度生成子任务
      const subTasks = [];
      
      // 如果任务描述包含分号或换行，分割为多个子任务
      if (task.description) {
        const parts = task.description.split(/[;\n]/).filter(p => p.trim());
        
        if (parts.length > 1) {
          parts.forEach((part, index) => {
            const subTask = new Task({
              name: `${task.name}_sub${index + 1}`,
              description: part.trim(),
              type: task.type,
              priority: Math.max(task.priority - 5, 10),
              parentId: task.id
            });
            subTasks.push(subTask);
          });
        }
      }
      
      return subTasks;
    }

    // 估算分解后的任务数
    estimateTaskCount(task) {
      if (!task.description) return 1;
      
      const parts = task.description.split(/[;\n]/).filter(p => p.trim());
      
      if (parts.length <= 1) return 1;
      
      return Math.min(parts.length, Math.pow(2, this.maxDepth - 1));
    }
  }

  // ========== FeedbackLoop ==========
  class FeedbackLoop {
    constructor(options = {}) {
      this.enabled = options.enabled !== false;
      this.thresholds = {
        successRate: options.successRateThreshold || 0.8,
        avgDuration: options.avgDurationThreshold || 5000,
        queueSize: options.queueSizeThreshold || 10
      };
      this.history = [];
      this.maxHistorySize = options.maxHistorySize || 100;
      this.callbacks = {
        onAdjust: options.onAdjust || null,
        onAlert: options.onAlert || null
      };
    }

    // 记录执行结果
    record(result) {
      if (!this.enabled) return;
      
      this.history.push({
        ...result,
        timestamp: Date.now()
      });
      
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
    }

    // 分析反馈
    analyze() {
      if (this.history.length === 0) {
        return { adjustments: [], alerts: [] };
      }

      const adjustments = [];
      const alerts = [];
      
      // 计算成功率
      const recentHistory = this.history.slice(-20);
      const successCount = recentHistory.filter(h => h.success).length;
      const successRate = successCount / recentHistory.length;
      
      // 计算平均执行时间
      const durations = recentHistory.filter(h => h.duration).map(h => h.duration);
      const avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;
      
      // 检查队列大小
      const currentQueueSize = this.history[this.history.length - 1]?.queueSize || 0;
      
      // 生成调整建议
      if (successRate < this.thresholds.successRate) {
        adjustments.push({
          type: 'retry_strategy',
          message: `Success rate ${(successRate * 100).toFixed(1)}% below threshold`,
          action: 'increase_retry_count'
        });
      }
      
      if (avgDuration > this.thresholds.avgDuration) {
        adjustments.push({
          type: 'concurrency',
          message: `Avg duration ${avgDuration.toFixed(0)}ms exceeds threshold`,
          action: 'reduce_concurrency'
        });
      }
      
      if (currentQueueSize > this.thresholds.queueSize) {
        adjustments.push({
          type: 'priority',
          message: `Queue size ${currentQueueSize} exceeds threshold`,
          action: 'increase_processing_speed'
        });
        
        if (this.callbacks.onAlert) {
          this.callbacks.onAlert({
            type: 'queue_overflow',
            queueSize: currentQueueSize
          });
        }
      }
      
      // 触发调整回调
      if (adjustments.length > 0 && this.callbacks.onAdjust) {
        this.callbacks.onAdjust(adjustments);
      }
      
      return { adjustments, alerts, metrics: { successRate, avgDuration, queueSize: currentQueueSize } };
    }

    // 获取统计
    getStats() {
      if (this.history.length === 0) {
        return { successRate: 0, avgDuration: 0, totalRecords: 0 };
      }
      
      const recentHistory = this.history.slice(-20);
      const successCount = recentHistory.filter(h => h.success).length;
      const durations = recentHistory.filter(h => h.duration).map(h => h.duration);
      
      return {
        successRate: successCount / recentHistory.length,
        avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        totalRecords: this.history.length,
        lastRecord: this.history[this.history.length - 1]
      };
    }
  }

  // ========== ResourceManager ==========
  class ResourceManager {
    constructor(options = {}) {
      this.resources = new Map();
      this.capacity = options.capacity || { cpu: 100, memory: 100, io: 100 };
      this.usage = { cpu: 0, memory: 0, io: 0 };
    }

    // 注册资源
    registerResource(id, type, capacity) {
      this.resources.set(id, {
        id,
        type,
        capacity,
        available: capacity,
        allocated: 0
      });
    }

    // 分配资源
    allocate(taskId, resourceType, amount) {
      const resource = this.resources.get(resourceType);
      
      if (!resource) {
        return { success: false, error: 'Resource type not found' };
      }
      
      if (resource.available < amount) {
        return { success: false, error: 'Insufficient resources' };
      }
      
      resource.available -= amount;
      resource.allocated += amount;
      
      if (!this.usage[resourceType]) {
        this.usage[resourceType] = 0;
      }
      this.usage[resourceType] += amount;
      
      return { success: true, allocated: amount };
    }

    // 释放资源
    release(taskId, resourceType, amount) {
      const resource = this.resources.get(resourceType);
      
      if (!resource) {
        return { success: false, error: 'Resource type not found' };
      }
      
      resource.available = Math.min(resource.capacity, resource.available + amount);
      resource.allocated = Math.max(0, resource.allocated - amount);
      
      this.usage[resourceType] = Math.max(0, this.usage[resourceType] - amount);
      
      return { success: true, released: amount };
    }

    // 获取资源状态
    getStatus() {
      const status = {};
      
      this.resources.forEach((resource, type) => {
        status[type] = {
          total: resource.capacity,
          available: resource.available,
          allocated: resource.allocated,
          usagePercent: ((resource.allocated / resource.capacity) * 100).toFixed(1) + '%'
        };
      });
      
      return status;
    }

    // 检查是否可以分配
    canAllocate(resourceType, amount) {
      const resource = this.resources.get(resourceType);
      return resource && resource.available >= amount;
    }
  }

  // ========== TaskScheduler ==========
  class TaskScheduler {
    constructor(options = {}) {
      this.id = options.id || 'scheduler_' + Date.now().toString(36);
      this.state = SCHEDULER_STATE.IDLE;
      this.tasks = new Map();
      this.taskQueue = [];
      this.runningTasks = new Map();
      this.completedTasks = [];
      this.decomposer = new TaskDecomposer({ maxDepth: options.maxDepth || 4 });
      this.feedbackLoop = new FeedbackLoop({
        onAdjust: (adjustments) => this._applyAdjustments(adjustments)
      });
      this.resourceManager = new ResourceManager(options.resources);
      this.listeners = new Map();
      this.config = {
        maxConcurrent: options.maxConcurrent || 3,
        taskTimeout: options.taskTimeout || 30000,
        enableFeedbackLoop: options.enableFeedbackLoop !== false,
        ...options
      };
      
      this._initializeDefaultResources();
    }

    _initializeDefaultResources() {
      this.resourceManager.registerResource('cpu', 'cpu', 100);
      this.resourceManager.registerResource('memory', 'memory', 100);
      this.resourceManager.registerResource('io', 'io', 100);
    }

    // 提交任务
    submit(taskOptions, options = {}) {
      let task = new Task(taskOptions);
      
      // 分解任务（如果启用）
      if (options.decompose !== false) {
        const decomposed = this.decomposer.decompose(task);
        
        if (decomposed.length > 1) {
          // 使用分解后的任务队列
          const parentTask = task;
          parentTask.subTasks = decomposed.slice(1).map(d => d.id);
          
          this.tasks.set(parentTask.id, parentTask);
          
          // 将第一个子任务加入队列
          task = decomposed[0];
          
          // 存储其他子任务
          decomposed.slice(1).forEach(st => {
            this.tasks.set(st.id, st);
            this._addToQueue(st);
          });
          
          // 父任务状态
          parentTask.status = TASK_STATUS.READY;
        }
      }
      
      this.tasks.set(task.id, task);
      this._addToQueue(task);
      
      return { taskId: task.id, status: task.status, queuePosition: this.taskQueue.length };
    }

    // 添加到队列
    _addToQueue(task) {
      task.status = TASK_STATUS.READY;
      
      // 按优先级插入
      const insertIndex = this.taskQueue.findIndex(t => t.priority < task.priority);
      
      if (insertIndex === -1) {
        this.taskQueue.push(task);
      } else {
        this.taskQueue.splice(insertIndex, 0, task);
      }
    }

    // 开始调度
    start() {
      if (this.state === SCHEDULER_STATE.RUNNING) return;
      
      this.state = SCHEDULER_STATE.RUNNING;
      this._scheduleLoop();
    }

    // 停止调度
    stop() {
      this.state = SCHEDULER_STATE.STOPPED;
    }

    // 暂停调度
    pause() {
      this.state = SCHEDULER_STATE.PAUSED;
    }

    // 恢复调度
    resume() {
      if (this.state !== SCHEDULER_STATE.PAUSED) return;
      
      this.state = SCHEDULER_STATE.RUNNING;
      this._scheduleLoop();
    }

    // 调度循环
    _scheduleLoop() {
      if (this.state !== SCHEDULER_STATE.RUNNING) return;
      
      // 检查是否可以运行更多任务
      while (
        this.runningTasks.size < this.config.maxConcurrent && 
        this.taskQueue.length > 0 &&
        this.state === SCHEDULER_STATE.RUNNING
      ) {
        const task = this._selectNextTask();
        
        if (task) {
          this._executeTask(task);
        }
      }
      
      // 继续调度循环
      if (this.state === SCHEDULER_STATE.RUNNING) {
        setTimeout(() => this._scheduleLoop(), 100);
      }
    }

    // 选择下一个任务
    _selectNextTask() {
      // 从队列头部取出任务
      return this.taskQueue.shift() || null;
    }

    // 执行任务
    _executeTask(task) {
      task.start();
      this.runningTasks.set(task.id, task);
      
      // 模拟任务执行
      const duration = task.estimateDuration();
      
      setTimeout(() => {
        this._completeTask(task.id, { success: true, result: 'completed' });
      }, duration);
    }

    // 完成任务
    _completeTask(taskId, result) {
      const task = this.runningTasks.get(taskId);
      
      if (!task) return;
      
      this.runningTasks.delete(taskId);
      
      if (result.success) {
        task.complete(result.result);
      } else {
        task.fail(result.error || 'Unknown error');
      }
      
      this.completedTasks.push(task);
      
      // 记录到反馈循环
      if (this.config.enableFeedbackLoop) {
        this.feedbackLoop.record({
          taskId: task.id,
          success: result.success,
          duration: task.completedAt - task.startedAt,
          queueSize: this.taskQueue.length
        });
      }
      
      // 触发事件
      this._emit('taskCompleted', { task, result });
      
      // 检查父任务
      if (task.parentId) {
        this._checkParentCompletion(task.parentId);
      }
    }

    // 检查父任务完成情况
    _checkParentCompletion(parentId) {
      const parent = this.tasks.get(parentId);
      
      if (!parent) return;
      
      const childTasks = [...this.tasks.values()].filter(t => t.parentId === parentId);
      const completedChildren = childTasks.filter(t => t.status === TASK_STATUS.COMPLETED);
      
      // 更新父任务进度
      if (childTasks.length > 0) {
        parent.updateProgress((completedChildren.length / childTasks.length) * 100);
      }
      
      // 如果所有子任务完成，父任务也完成
      if (completedChildren.length === childTasks.length) {
        parent.complete({ subTaskCount: childTasks.length });
      }
    }

    // 应用调整
    _applyAdjustments(adjustments) {
      adjustments.forEach(adj => {
        switch (adj.type) {
          case 'concurrency':
            if (adj.action === 'reduce_concurrency') {
              this.config.maxConcurrent = Math.max(1, this.config.maxConcurrent - 1);
            }
            break;
          case 'retry_strategy':
            // 调整重试策略
            break;
        }
      });
    }

    // 获取任务状态
    getTaskStatus(taskId) {
      return this.tasks.get(taskId)?.getSummary() || null;
    }

    // 取消任务
    cancelTask(taskId) {
      const task = this.tasks.get(taskId);
      
      if (!task) return false;
      
      // 如果在队列中，直接移除
      const queueIndex = this.taskQueue.findIndex(t => t.id === taskId);
      if (queueIndex !== -1) {
        this.taskQueue.splice(queueIndex, 1);
        task.cancel();
        return true;
      }
      
      // 如果在运行中，中止
      if (this.runningTasks.has(taskId)) {
        this.runningTasks.delete(taskId);
        task.cancel();
        return true;
      }
      
      return false;
    }

    // 获取状态
    getStatus() {
      return {
        id: this.id,
        state: this.state,
        totalTasks: this.tasks.size,
        queuedTasks: this.taskQueue.length,
        runningTasks: this.runningTasks.size,
        completedTasks: this.completedTasks.length,
        config: this.config,
        resources: this.resourceManager.getStatus(),
        feedback: this.feedbackLoop.getStats()
      };
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

    // 导出状态
    export() {
      return {
        id: this.id,
        state: this.state,
        config: this.config,
        stats: {
          totalTasks: this.tasks.size,
          queuedTasks: this.taskQueue.length,
          runningTasks: this.runningTasks.size,
          completedTasks: this.completedTasks.length
        },
        resources: this.resourceManager.getStatus()
      };
    }

    // 销毁
    destroy() {
      this.stop();
      this.tasks.clear();
      this.taskQueue = [];
      this.runningTasks.clear();
      this.completedTasks = [];
      this.listeners.clear();
    }
  }

  // ========== Export ==========
  window.TaskScheduler = {
    // Classes
    Task,
    TaskDecomposer,
    FeedbackLoop,
    ResourceManager,
    TaskScheduler,
    
    // Constants
    TASK_PRIORITY,
    TASK_STATUS,
    SCHEDULER_STATE
  };

})();
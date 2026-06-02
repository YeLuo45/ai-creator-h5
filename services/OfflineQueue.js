'use strict';

/**
 * OfflineQueue - 离线生成任务队列
 * 网络断开时保存生成任务，恢复后自动继续执行
 */

const TASK_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued', 
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

const STORAGE_KEY = 'ai_creator_offline_queue';

/**
 * 离线任务项
 */
class OfflineTask {
  constructor({ id, type, params, status = TASK_STATUS.PENDING, createdAt = Date.now() }) {
    this.id = id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.type = type; // 'image' | 'music' | 'tts' | 'code'
    this.params = params; // 生成参数
    this.status = status;
    this.createdAt = createdAt;
    this.startedAt = null;
    this.completedAt = null;
    this.error = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }
  
  canRetry() {
    return this.retryCount < this.maxRetries && this.status === TASK_STATUS.FAILED;
  }
  
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      params: this.params,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      error: this.error,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
  
  static fromJSON(json) {
    const task = new OfflineTask(json);
    task.startedAt = json.startedAt;
    task.completedAt = json.completedAt;
    task.error = json.error;
    task.retryCount = json.retryCount || 0;
    task.maxRetries = json.maxRetries || 3;
    return task;
  }
}

/**
 * OfflineQueue - 离线任务队列管理器
 */
class OfflineQueue {
  constructor() {
    this.tasks = [];
    this.listeners = {};
    this._loadFromStorage();
  }
  
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.tasks = (data.tasks || []).map(t => OfflineTask.fromJSON(t));
      }
    } catch (e) {
      this.tasks = [];
    }
  }
  
  _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tasks: this.tasks.map(t => t.toJSON()),
        savedAt: Date.now()
      }));
    } catch (e) {
      console.error('OfflineQueue: Failed to save to storage', e);
    }
  }
  
  /**
   * 添加任务到队列
   */
  enqueue(type, params) {
    const task = new OfflineTask({ type, params, status: TASK_STATUS.QUEUED });
    this.tasks.unshift(task); // 新任务在前面
    this._saveToStorage();
    this._emit('enqueue', task);
    return task.id;
  }
  
  /**
   * 获取下一个待处理任务
   */
  dequeue() {
    const task = this.tasks.find(t => t.status === TASK_STATUS.QUEUED);
    if (task) {
      task.status = TASK_STATUS.PENDING;
      this._saveToStorage();
    }
    return task;
  }
  
  /**
   * 获取所有待处理任务
   */
  getPendingTasks() {
    return this.tasks.filter(t => 
      t.status === TASK_STATUS.QUEUED || t.status === TASK_STATUS.PENDING
    );
  }
  
  /**
   * 更新任务状态
   */
  updateTaskStatus(taskId, status, error = null) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    task.status = status;
    if (status === TASK_STATUS.GENERATING) {
      task.startedAt = Date.now();
    } else if (status === TASK_STATUS.COMPLETED || status === TASK_STATUS.FAILED) {
      task.completedAt = Date.now();
      if (error) task.error = error;
    }
    
    this._saveToStorage();
    this._emit('statusChange', task);
    return task;
  }
  
  /**
   * 标记任务失败，可选择重试
   */
  failTask(taskId, error) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.status = TASK_STATUS.FAILED;
    task.error = error;
    task.retryCount++;
    
    if (task.canRetry()) {
      task.status = TASK_STATUS.QUEUED;
      this._emit('retry', task);
    }
    
    this._saveToStorage();
    this._emit('failed', task);
  }
  
  /**
   * 完成一个任务
   */
  completeTask(taskId) {
    return this.updateTaskStatus(taskId, TASK_STATUS.COMPLETED);
  }
  
  /**
   * 取消任务
   */
  cancelTask(taskId) {
    return this.updateTaskStatus(taskId, TASK_STATUS.CANCELLED);
  }
  
  /**
   * 按状态获取任务
   */
  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }
  
  /**
   * 获取任务统计
   */
  getStats() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === TASK_STATUS.QUEUED).length,
      generating: this.tasks.filter(t => t.status === TASK_STATUS.GENERATING).length,
      completed: this.tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
      failed: this.tasks.filter(t => t.status === TASK_STATUS.FAILED).length
    };
  }
  
  /**
   * 清空已完成的任务
   */
  clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== TASK_STATUS.COMPLETED);
    this._saveToStorage();
    this._emit('cleared');
  }
  
  /**
   * 清空失败任务
   */
  clearFailed() {
    this.tasks = this.tasks.filter(t => t.status !== TASK_STATUS.FAILED);
    this._saveToStorage();
    this._emit('cleared');
  }
  
  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  
  _emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
  
  /**
   * 从存储恢复并尝试继续处理
   */
  resume() {
    const pending = this.getPendingTasks();
    pending.forEach(task => {
      if (task.retryCount < task.maxRetries) {
        task.status = TASK_STATUS.QUEUED;
        this._emit('resume', task);
      }
    });
    this._saveToStorage();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TASK_STATUS, OfflineTask, OfflineQueue };
}
if (typeof global !== 'undefined') {
  global.TASK_STATUS = TASK_STATUS;
  global.OfflineTask = OfflineTask;
  global.OfflineQueue = OfflineQueue;
}
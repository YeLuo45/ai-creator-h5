/**
 * Scheduler Service - v10
 * 调度服务：定时任务调度管理
 */
class Scheduler {
  constructor() {
    this.tasks = [];
    this.timer = null;
    this.STORAGE_KEY = 'ai_creator_schedules';
    this.TIMER_INTERVAL = 60000; // 1分钟检查一次
    
    this.loadTasks();
    this._startTimer();
  }

  /**
   * 加载已有调度任务
   */
  loadTasks() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.tasks = JSON.parse(data);
        // 重新调度定时器
        this.tasks.forEach(task => {
          if (task.enabled && task.type === 'interval') {
            this._scheduleNext(task);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load scheduled tasks:', e);
      this.tasks = [];
    }
  }

  /**
   * 保存任务到 localStorage
   */
  _saveTasks() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.error('Failed to save scheduled tasks:', e);
    }
  }

  /**
   * 添加调度任务
   * @param {Object} task - 任务对象
   * @returns {string} 任务ID
   */
  addTask(task) {
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: task.name || '未命名任务',
      workflowId: task.workflowId,
      workflow: task.workflow,
      type: task.type || 'interval', // 'interval' | 'cron' | 'oneshot'
      enabled: task.enabled !== false,
      interval: task.interval || 3600000, // 默认1小时
      cron: task.cron, // cron 表达式
      nextRun: null,
      lastRun: null,
      runCount: 0,
      created: new Date().toISOString(),
      config: task.config || {}
    };
    
    this.tasks.push(newTask);
    this._saveTasks();
    
    if (newTask.enabled) {
      this._scheduleNext(newTask);
    }
    
    return newTask.id;
  }

  /**
   * 删除调度任务
   * @param {string} taskId - 任务ID
   */
  removeTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.tasks[index];
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      this.tasks.splice(index, 1);
      this._saveTasks();
    }
  }

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {Object} updates - 更新内容
   */
  updateTask(taskId, updates) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      // 清除旧的定时器
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      
      // 更新任务
      Object.assign(task, updates, { modified: new Date().toISOString() });
      
      this._saveTasks();
      
      // 重新调度
      if (task.enabled) {
        this._scheduleNext(task);
      }
    }
  }

  /**
   * 获取所有任务
   * @returns {Array} 任务列表
   */
  getTasks() {
    return [...this.tasks];
  }

  /**
   * 获取单个任务
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务对象
   */
  getTask(taskId) {
    return this.tasks.find(t => t.id === taskId) || null;
  }

  /**
   * 启用任务
   * @param {string} taskId - 任务ID
   */
  enableTask(taskId) {
    this.updateTask(taskId, { enabled: true });
  }

  /**
   * 暂停任务
   * @param {string} taskId - 任务ID
   */
  disableTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
        task.timeoutId = null;
      }
      task.enabled = false;
      this._saveTasks();
    }
  }

  /**
   * 计算下次执行时间
   * @param {Object} task - 任务对象
   * @returns {Date|null} 下次执行时间
   */
  _scheduleNext(task) {
    const now = Date.now();
    let nextRun;
    
    if (task.type === 'interval') {
      // 间隔执行
      const interval = task.interval || 3600000;
      if (task.lastRun) {
        nextRun = task.lastRun + interval;
        // 如果下次时间已过，从现在算起
        if (nextRun < now) {
          nextRun = now + interval;
        }
      } else {
        nextRun = now + interval;
      }
    } else if (task.type === 'cron' && task.cron) {
      // Cron 表达式解析（简化版）
      nextRun = this._parseCronNext(task.cron, now);
    } else {
      return null;
    }
    
    task.nextRun = nextRun;
    
    // 设置定时器
    const delay = nextRun - now;
    if (delay > 0 && delay < 2147483647) { // setTimeout 最大值
      task.timeoutId = setTimeout(() => {
        this._executeTask(task);
      }, delay);
    }
    
    return nextRun;
  }

  /**
   * 简化的 Cron 解析（仅支持简单格式）
   * @param {string} cron - cron 表达式
   * @param {number} now - 当前时间戳
   * @returns {number} 下次执行时间戳
   */
  _parseCronNext(cron, now) {
    // 简化支持: 每分钟、每小时、每天、每周
    const date = new Date(now);
    
    if (cron === '* * * * *') {
      // 每分钟
      date.setMinutes(date.getMinutes() + 1, 0, 0);
    } else if (cron === '0 * * * *') {
      // 每小时
      date.setHours(date.getHours() + 1, 0, 0, 0);
    } else if (cron === '0 0 * * *') {
      // 每天
      date.setDate(date.getDate() + 1, 0, 0, 0);
    } else if (cron === '0 0 * * 0') {
      // 每周
      date.setDate(date.getDate() + (7 - date.getDay()), 0, 0, 0);
    } else {
      // 默认: 1小时后
      return now + 3600000;
    }
    
    return date.getTime();
  }

  /**
   * 执行任务
   * @param {Object} task - 任务对象
   */
  async _executeTask(task) {
    if (!task.enabled) return;
    
    console.log(`[Scheduler] Executing task: ${task.name}`);
    
    try {
      // 记录开始时间
      const startTime = Date.now();
      
      // 执行工作流
      if (task.workflow && typeof WorkflowEngine !== 'undefined') {
        // 保存当前状态
        const previousResults = window.state?.executionResults;
        
        // 执行工作流
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
          
          WorkflowEngine.run(task.workflow);
        });
        
        // 恢复之前的状态
        if (previousResults) {
          window.state.executionResults = previousResults;
        }
      }
      
      // 更新任务状态
      task.lastRun = Date.now();
      task.runCount++;
      
      // 生成执行报告
      const report = {
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        startTime: startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        runCount: task.runCount
      };
      
      // 发送浏览器通知
      this._notify('任务执行成功', `${task.name} 已完成，耗时 ${report.duration}ms`);
      
      // 记录日志
      console.log(`[Scheduler] Task completed: ${task.name}`, report);
      
    } catch (error) {
      console.error(`[Scheduler] Task failed: ${task.name}`, error);
      
      // 发送失败通知
      this._notify('任务执行失败', `${task.name} 执行失败: ${error.message}`);
      
      // 生成错误报告
      const report = {
        taskId: task.id,
        taskName: task.name,
        status: 'error',
        error: error.message,
        time: Date.now()
      };
    }
    
    // 重新调度下次执行
    if (task.enabled && task.type !== 'oneshot') {
      this._scheduleNext(task);
    }
    
    this._saveTasks();
  }

  /**
   * 启动定时检查
   */
  _startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = setInterval(() => {
      const now = Date.now();
      this.tasks.forEach(task => {
        if (task.enabled && task.nextRun && task.nextRun <= now) {
          this._executeTask(task);
        }
      });
    }, this.TIMER_INTERVAL);
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
   * 停止调度器
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.tasks.forEach(task => {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
    });
  }

  /**
   * 手动触发任务执行
   * @param {string} taskId - 任务ID
   */
  async runTaskNow(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      await this._executeTask(task);
    }
  }
}

// 导出单例
const scheduler = new Scheduler();

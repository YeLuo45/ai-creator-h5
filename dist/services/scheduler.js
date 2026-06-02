/**
 * Scheduler Service - v18
 * 调度服务 v18：Cron表达式解析、一次性/周期性任务、任务管理
 */
class Scheduler {
  constructor() {
    this.tasks = [];
    this.timer = null;
    this.STORAGE_KEY = 'ai_creator_schedules_v18';
    this.TIMER_INTERVAL = 1000; // 1秒检查一次（更精确）
    this.runningTasks = new Set();
    
    this.loadTasks();
    this._startTimer();
  }

  /**
   * Cron 表达式字段索引
   */
  static CRON_FIELDS = {
    SECOND: 0,
    MINUTE: 1,
    HOUR: 2,
    DAY_OF_MONTH: 3,
    MONTH: 4,
    DAY_OF_WEEK: 5
  };

  /**
   * 加载已有调度任务
   */
  loadTasks() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.tasks = JSON.parse(data);
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
      id: 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      name: task.name || '未命名任务',
      workflowId: task.workflowId,
      workflow: task.workflow,
      type: task.type || 'interval', // 'interval' | 'cron' | 'oneshot'
      enabled: task.enabled !== false,
      interval: task.interval || 3600000, // 默认1小时
      cron: task.cron, // v18: 支持完整 cron 表达式
      cronFields: task.cronFields || {}, // v18: 结构化 cron 字段
      nextRun: null,
      lastRun: null,
      runCount: 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      config: task.config || {},
      // v18 新增字段
      schedule: {
        type: task.schedule?.type || 'recurring', // 'recurring' | 'one-time'
        startTime: task.schedule?.startTime || null,
        endTime: task.schedule?.endTime || null,
        timezone: task.schedule?.timezone || 'local'
      },
      history: [],
      status: 'idle' // 'idle' | 'running' | 'paused' | 'completed'
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
   */
  removeTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.tasks[index];
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      if (task.intervalId) {
        clearInterval(task.intervalId);
      }
      this.runningTasks.delete(taskId);
      this.tasks.splice(index, 1);
      this._saveTasks();
    }
  }

  /**
   * 更新任务
   */
  updateTask(taskId, updates) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
      if (task.intervalId) {
        clearInterval(task.intervalId);
      }
      
      Object.assign(task, updates, { modified: new Date().toISOString() });
      
      this._saveTasks();
      
      if (task.enabled) {
        this._scheduleNext(task);
      }
    }
  }

  /**
   * 获取所有任务
   */
  getTasks() {
    return [...this.tasks];
  }

  /**
   * 获取单个任务
   */
  getTask(taskId) {
    return this.tasks.find(t => t.id === taskId) || null;
  }

  /**
   * 启用任务
   */
  enableTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.enabled) {
      task.enabled = true;
      task.status = 'idle';
      this._saveTasks();
      this._scheduleNext(task);
    }
  }

  /**
   * 暂停任务
   */
  disableTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
        task.timeoutId = null;
      }
      if (task.intervalId) {
        clearInterval(task.intervalId);
        task.intervalId = null;
      }
      task.enabled = false;
      task.status = 'paused';
      this.runningTasks.delete(taskId);
      this._saveTasks();
    }
  }

  /**
   * 计算下次执行时间
   */
  _scheduleNext(task) {
    const now = Date.now();
    
    // 检查是否在时间范围内
    if (task.schedule?.startTime && now < new Date(task.schedule.startTime).getTime()) {
      return null;
    }
    if (task.schedule?.endTime && now > new Date(task.schedule.endTime).getTime()) {
      task.status = 'completed';
      task.enabled = false;
      this._saveTasks();
      return null;
    }
    
    let nextRun;
    
    if (task.type === 'interval') {
      nextRun = this._calculateNextInterval(task, now);
    } else if (task.type === 'cron' || task.cron) {
      nextRun = this._parseCronNext(task, now);
    } else if (task.type === 'oneshot') {
      nextRun = task.schedule?.startTime 
        ? new Date(task.schedule.startTime).getTime() 
        : now + 1000;
    } else {
      return null;
    }
    
    task.nextRun = nextRun;
    
    if (nextRun && nextRun > now) {
      const delay = Math.min(nextRun - now, 2147483647);
      task.timeoutId = setTimeout(() => {
        this._executeTask(task);
      }, delay);
    } else if (nextRun && nextRun <= now) {
      // 立即执行
      this._executeTask(task);
    }
    
    return nextRun;
  }

  /**
   * 计算间隔任务的下次执行时间
   */
  _calculateNextInterval(task, now) {
    const interval = task.interval || 3600000;
    
    if (task.lastRun) {
      let nextRun = task.lastRun + interval;
      if (nextRun < now) {
        nextRun = now + interval;
      }
      return nextRun;
    }
    
    return now + interval;
  }

  /**
   * 解析 Cron 表达式 (v18: 支持秒级精度)
   * 支持格式: 
   *   - "30 * * * * *" = 每分钟30秒
   *   - "0 * * * * *" = 每分钟整秒
   *   - "0 0 * * * *" = 每小时整点
   *   - "0 0 0 * * *" = 每天午夜
   *   - "0 0 12 * * *" = 每天中午
   *   - "0 0 * * * 0" = 每周日午夜
   *   - 结构化: { second: 30, minute: '*', hour: '*', day: '*', month: '*', weekday: '*' }
   */
  _parseCronNext(task, now) {
    const date = new Date(now);
    
    let cronStr = task.cron;
    let fields;
    
    if (task.cronFields && Object.keys(task.cronFields).length > 0) {
      // 使用结构化字段
      fields = {
        second: task.cronFields.second ?? '*',
        minute: task.cronFields.minute ?? '*',
        hour: task.cronFields.hour ?? '*',
        day: task.cronFields.day ?? '*',
        month: task.cronFields.month ?? '*',
        weekday: task.cronFields.weekday ?? '*'
      };
    } else if (cronStr) {
      // 解析字符串 cron 表达式
      const parts = cronStr.trim().split(/\s+/);
      if (parts.length === 5) {
        // 标准 5 字段: 分 时 日 月 周
        fields = {
          second: '0',
          minute: parts[0],
          hour: parts[1],
          day: parts[2],
          month: parts[3],
          weekday: parts[4]
        };
      } else if (parts.length === 6) {
        // 6 字段: 秒 分 时 日 月 周
        fields = {
          second: parts[0],
          minute: parts[1],
          hour: parts[2],
          day: parts[3],
          month: parts[4],
          weekday: parts[5]
        };
      } else {
        return now + 60000; // 默认 1 分钟
      }
    } else {
      return now + 60000;
    }
    
    // 计算下次匹配时间
    return this._findNextCronMatch(fields, date);
  }

  /**
   * 查找下次匹配的时间
   */
  _findNextCronMatch(fields, fromDate) {
    const date = new Date(fromDate);
    date.setMilliseconds(0);
    
    const maxIterations = 525600; // 最多遍历 1 年（以分钟计）
    
    for (let i = 0; i < maxIterations; i++) {
      if (this._matchesCronFields(date, fields)) {
        return date.getTime();
      }
      date.setSeconds(date.getSeconds() + 1);
    }
    
    return null;
  }

  /**
   * 检查日期是否匹配 cron 字段
   */
  _matchesCronFields(date, fields) {
    const second = date.getSeconds();
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // JS 月份是 0-11
    const weekday = date.getDay(); // 0 = 周日
    
    return (
      this._matchesCronPart(second, fields.second) &&
      this._matchesCronPart(minute, fields.minute) &&
      this._matchesCronPart(hour, fields.hour) &&
      this._matchesCronPart(day, fields.day) &&
      this._matchesCronPart(month, fields.month) &&
      this._matchesCronPart(weekday, fields.weekday)
    );
  }

  /**
   * 检查单个字段是否匹配
   */
  _matchesCronPart(value, pattern) {
    if (pattern === '*') return true;
    
    if (typeof pattern === 'number') {
      return value === pattern;
    }
    
    if (typeof pattern === 'string') {
      // 列表: "1,2,3"
      if (pattern.includes(',')) {
        return pattern.split(',').some(p => this._matchesCronPart(value, p.trim()));
      }
      
      // 范围: "1-5"
      if (pattern.includes('-')) {
        const [start, end] = pattern.split('-').map(Number);
        return value >= start && value <= end;
      }
      
      // 步长: "*/5" 或 "0-59/5"
      if (pattern.includes('/')) {
        const [range, stepStr] = pattern.split('/');
        const step = parseInt(stepStr, 10);
        let rangeStart, rangeEnd;
        
        if (range === '*') {
          rangeStart = 0;
          rangeEnd = 59;
        } else if (range.includes('-')) {
          [rangeStart, rangeEnd] = range.split('-').map(Number);
        } else {
          rangeStart = parseInt(range, 10);
          rangeEnd = 59;
        }
        
        return value >= rangeStart && value <= rangeEnd && (value - rangeStart) % step === 0;
      }
      
      return value === parseInt(pattern, 10);
    }
    
    return false;
  }

  /**
   * 验证 cron 表达式
   */
  validateCron(cronStr) {
    try {
      const parts = cronStr.trim().split(/\s+/);
      if (parts.length !== 5 && parts.length !== 6) {
        return { valid: false, error: 'Cron 表达式必须是 5 或 6 个字段' };
      }
      
      // 验证每个字段
      const fieldNames = parts.length === 5 
        ? ['minute', 'hour', 'day', 'month', 'weekday']
        : ['second', 'minute', 'hour', 'day', 'month', 'weekday'];
      
      const ranges = parts.length === 5 
        ? [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]]
        : [[0, 59], [0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part !== '*' && !/^(\d+(-\d+)?(\/\d+)?)(,\d+(-\d+)?(\/\d+)?)*$/.test(part)) {
          return { valid: false, error: `字段 ${fieldNames[i]} 格式无效: ${part}` };
        }
      }
      
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  /**
   * 获取 cron 表达式的人类可读描述
   */
  describeCron(cronStr) {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length === 5) {
      parts.unshift('0'); // 添加秒字段
    }
    
    const [second, minute, hour, day, month, weekday] = parts;
    
    const descriptions = [];
    
    if (second !== '*') descriptions.push(`每秒第 ${second} 秒`);
    if (minute !== '*') descriptions.push(`第 ${minute} 分钟`);
    if (hour !== '*') descriptions.push(`第 ${hour} 小时`);
    
    if (day === '*' && weekday === '*') {
      descriptions.push('每天');
    } else if (day !== '*' && weekday === '*') {
      descriptions.push(`每月第 ${day} 天`);
    } else if (day === '*' && weekday !== '*') {
      const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      descriptions.push(`每週${weekdayNames[parseInt(weekday, 10)] || weekday}`);
    }
    
    if (month !== '*') descriptions.push(`第 ${month} 月`);
    
    return descriptions.join(' ') || '无效表达式';
  }

  /**
   * 执行任务
   */
  async _executeTask(task) {
    if (!task.enabled || this.runningTasks.has(task.id)) {
      return;
    }
    
    this.runningTasks.add(task.id);
    task.status = 'running';
    this._saveTasks();
    
    console.log(`[Scheduler] Executing task: ${task.name}`);
    
    const startTime = Date.now();
    
    try {
      if (task.workflow && typeof WorkflowEngine !== 'undefined') {
        const previousResults = window.state?.executionResults;
        
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
        
        if (previousResults) {
          window.state.executionResults = previousResults;
        }
      }
      
      task.lastRun = Date.now();
      task.runCount++;
      task.status = 'idle';
      
      const report = {
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        startTime: startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        runCount: task.runCount
      };
      
      this._addHistoryEntry(task.id, report);
      this._notify('任务执行成功', `${task.name} 已完成，耗时 ${report.duration}ms`);
      console.log(`[Scheduler] Task completed: ${task.name}`, report);
      
    } catch (error) {
      console.error(`[Scheduler] Task failed: ${task.name}`, error);
      
      const report = {
        taskId: task.id,
        taskName: task.name,
        status: 'error',
        error: error.message,
        startTime: startTime,
        endTime: Date.now()
      };
      
      this._addHistoryEntry(task.id, report);
      this._notify('任务执行失败', `${task.name} 执行失败: ${error.message}`);
    }
    
    this.runningTasks.delete(task.id);
    
    // 重新调度下次执行
    if (task.enabled && task.type !== 'oneshot' && task.schedule?.type !== 'one-time') {
      this._scheduleNext(task);
    } else if (task.type === 'oneshot' || task.schedule?.type === 'one-time') {
      task.status = 'completed';
      task.enabled = false;
    }
    
    this._saveTasks();
  }

  /**
   * 添加历史记录
   */
  _addHistoryEntry(taskId, entry) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.history = task.history || [];
      task.history.unshift({
        ...entry,
        timestamp: Date.now()
      });
      if (task.history.length > 100) {
        task.history = task.history.slice(0, 100);
      }
    }
  }

  /**
   * 获取任务历史
   */
  getTaskHistory(taskId, limit = 50) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.history) {
      return task.history.slice(0, limit);
    }
    return [];
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
        if (task.enabled && task.nextRun && task.nextRun <= now && !this.runningTasks.has(task.id)) {
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
      if (task.intervalId) {
        clearInterval(task.intervalId);
      }
    });
    this.runningTasks.clear();
  }

  /**
   * 手动触发任务执行
   */
  async runTaskNow(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !this.runningTasks.has(taskId)) {
      await this._executeTask(task);
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    return {
      id: task.id,
      name: task.name,
      status: task.status,
      enabled: task.enabled,
      nextRun: task.nextRun,
      lastRun: task.lastRun,
      runCount: task.runCount,
      isRunning: this.runningTasks.has(taskId)
    };
  }

  /**
   * 获取所有任务的使用统计
   */
  getUsageStats() {
    const stats = {
      totalTasks: this.tasks.length,
      activeTasks: this.tasks.filter(t => t.enabled).length,
      runningTasks: this.runningTasks.size,
      totalExecutions: this.tasks.reduce((sum, t) => sum + (t.runCount || 0), 0),
      byType: {},
      upcomingTasks: []
    };
    
    this.tasks.forEach(t => {
      stats.byType[t.type] = (stats.byType[t.type] || 0) + 1;
    });
    
    // 即将执行的任务
    stats.upcomingTasks = this.tasks
      .filter(t => t.enabled && t.nextRun)
      .sort((a, b) => a.nextRun - b.nextRun)
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.name,
        nextRun: t.nextRun,
        type: t.type
      }));
    
    return stats;
  }

  /**
   * 暂停正在运行的任务
   */
  pauseTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
        task.timeoutId = null;
      }
      task.status = 'paused';
      this._saveTasks();
    }
  }

  /**
   * 恢复暂停的任务
   */
  resumeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'paused') {
      task.status = 'idle';
      task.enabled = true;
      this._scheduleNext(task);
      this._saveTasks();
    }
  }

  /**
   * 清除任务历史
   */
  clearHistory(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.history = [];
      this._saveTasks();
    }
  }

  /**
   * 清除所有已完成的任务
   */
  clearCompletedTasks() {
    this.tasks = this.tasks.filter(t => t.status !== 'completed');
    this._saveTasks();
  }
}

// 导出单例
const scheduler = new Scheduler();

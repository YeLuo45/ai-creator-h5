const TaskStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
};
class Task {
  constructor(id, name, fn, options = {}) {
    this.id = id;
    this.name = name;
    this.fn = fn;
    this.status = TaskStatus.PENDING;
    this.result = null;
    this.error = null;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.progress = 0;
    this.options = {
      timeout: 6e4,
      // 默认60秒超时
      retries: 0,
      ...options
    };
    this._resolve = null;
    this._reject = null;
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }
  run() {
    this.status = TaskStatus.RUNNING;
    this.startedAt = Date.now();
    const timeout = setTimeout(() => {
      this.fail(new Error("Task timeout"));
    }, this.options.timeout);
    try {
      Promise.resolve(this.fn(this)).then((result) => {
        clearTimeout(timeout);
        this.complete(result);
      }).catch((err) => {
        clearTimeout(timeout);
        this.fail(err);
      });
    } catch (err) {
      clearTimeout(timeout);
      this.fail(err);
    }
    return this.promise;
  }
  complete(result) {
    this.status = TaskStatus.COMPLETED;
    this.result = result;
    this.completedAt = Date.now();
    this.progress = 100;
    this._resolve(result);
  }
  fail(error) {
    if (this.status === TaskStatus.CANCELLED) return;
    this.status = TaskStatus.FAILED;
    this.error = error;
    this.completedAt = Date.now();
    this._reject(error);
  }
  cancel() {
    if (this.status === TaskStatus.RUNNING || this.status === TaskStatus.PENDING) {
      this.status = TaskStatus.CANCELLED;
      this.completedAt = Date.now();
      this._reject(new Error("Task cancelled"));
    }
  }
  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
  }
}
class TaskQueue {
  constructor(options = {}) {
    this.tasks = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
    this.maxConcurrent = options.maxConcurrent || 3;
    this.runningCount = 0;
    this.queue = [];
  }
  // 订阅任务状态变化
  subscribe(taskId, callback) {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, []);
    }
    this.listeners.get(taskId).push(callback);
    return () => {
      const callbacks = this.listeners.get(taskId);
      if (callbacks) {
        const idx = callbacks.indexOf(callback);
        if (idx !== -1) callbacks.splice(idx, 1);
      }
    };
  }
  // 广播任务状态变化
  _broadcast(taskId, event, data) {
    const callbacks = this.listeners.get(taskId);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event, data));
    }
  }
  // 添加任务到队列
  enqueue(name, fn, options = {}) {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const task = new Task(id, name, fn, options);
    this.tasks.set(id, task);
    this._broadcast(id, "created", task);
    if (this.runningCount < this.maxConcurrent) {
      this._runTask(task);
    } else {
      this.queue.push(id);
    }
    return task;
  }
  // 执行任务
  _runTask(task) {
    this.runningCount++;
    this._broadcast(task.id, "started", task);
    task.run().catch(() => {
    });
  }
  // 任务完成处理
  _onTaskComplete(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    this.runningCount--;
    this._broadcast(taskId, task.status, task);
    if (this.queue.length > 0) {
      const nextId = this.queue.shift();
      const nextTask = this.tasks.get(nextId);
      if (nextTask && nextTask.status === TaskStatus.PENDING) {
        this._runTask(nextTask);
      }
    }
  }
  // 获取任务
  getTask(id) {
    return this.tasks.get(id);
  }
  // 获取所有任务
  getAllTasks() {
    return Array.from(this.tasks.values());
  }
  // 获取任务列表（按状态过滤）
  getTasksByStatus(status) {
    return this.getAllTasks().filter((t) => t.status === status);
  }
  // 取消任务
  cancel(id) {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.cancel();
    this._onTaskComplete(id);
    return true;
  }
  // 取消所有任务
  cancelAll() {
    this.tasks.forEach((task) => {
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.RUNNING) {
        task.cancel();
      }
    });
    this.queue = [];
  }
  // 移除已完成的任务
  cleanup(completedOnly = true) {
    for (const [id, task] of this.tasks) {
      if (completedOnly) {
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED || task.status === TaskStatus.CANCELLED) {
          this.tasks.delete(id);
        }
      } else {
        this.tasks.delete(id);
      }
    }
  }
  // 批量添加任务（并行）
  enqueueBatch(tasks) {
    return tasks.map((t) => this.enqueue(t.name, t.fn, t.options));
  }
  // 等待所有任务完成
  waitAll(taskIds) {
    const tasks = taskIds.map((id) => this.tasks.get(id)).filter(Boolean);
    return Promise.all(tasks.map((t) => t.promise));
  }
  // 获取队列状态
  getStatus() {
    return {
      total: this.tasks.size,
      pending: this.getTasksByStatus(TaskStatus.PENDING).length,
      running: this.getTasksByStatus(TaskStatus.RUNNING).length,
      completed: this.getTasksByStatus(TaskStatus.COMPLETED).length,
      failed: this.getTasksByStatus(TaskStatus.FAILED).length,
      cancelled: this.getTasksByStatus(TaskStatus.CANCELLED).length,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}
const taskQueue = new TaskQueue({ maxConcurrent: 3 });
export {
  TaskStatus as T,
  taskQueue as t
};
//# sourceMappingURL=TaskQueue-DOQ0hbkZ.js.map

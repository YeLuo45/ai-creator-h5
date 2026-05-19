/**
 * WorkflowHistory - 执行历史服务
 * 使用 IndexedDB 存储执行历史记录（最多100条）
 */
const WorkflowHistory = {
  dbName: 'ai-creator-workflow',
  dbVersion: 1,
  storeName: 'execution_history',
  db: null,

  // 初始化 IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('workflowName', 'workflowName', { unique: false });
        }
      };
    });
  },

  // 确保数据库已初始化
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  },

  // 保存执行记录
  async saveExecutionRecord(record) {
    await this.ensureDB();
    
    const entry = {
      workflowId: record.workflowId || null,
      workflowName: record.workflowName || '未命名',
      workflowData: record.workflowData || null,
      status: record.status, // completed, error, stopped
      nodeStats: record.nodeStats || [],
      totalDuration: record.totalDuration || 0,
      progress: record.progress || 0,
      timestamp: Date.now(),
      outputs: record.outputs || {}
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(entry);
      
      request.onsuccess = () => {
        const id = request.result;
        // 清理旧记录（最多100条）
        this.cleanupOldRecords();
        resolve(id);
      };
      
      request.onerror = () => reject(request.error);
    });
  },

  // 获取执行历史
  async getExecutionHistory(limit = 50) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const results = [];
      
      // 使用倒序获取最新的记录
      const cursorRequest = index.openCursor(null, 'prev');
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push({ id: cursor.value.id, ...cursor.value });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  },

  // 获取单条记录详情
  async getExecutionById(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  // 删除执行记录
  async deleteExecution(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  // 清空所有历史
  async clearHistory() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  // 重新执行
  async retryExecution(id) {
    const record = await this.getExecutionById(id);
    if (!record) {
      throw new Error('执行记录不存在');
    }
    
    if (!record.workflowData) {
      throw new Error('工作流数据不存在');
    }
    
    return {
      workflow: record.workflowData,
      record: record
    };
  },

  // 清理旧记录（最多100条）
  async cleanupOldRecords() {
    const count = await this.getRecordCount();
    if (count <= 100) return;
    
    const toDelete = count - 100;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const cursorRequest = index.openCursor();
      let deleted = 0;
      
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && deleted < toDelete) {
          store.delete(cursor.value.id);
          deleted++;
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
      
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  },

  // 获取记录数量
  async getRecordCount() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 获取统计数据
  async getStats() {
    const history = await this.getExecutionHistory(1000);
    const total = history.length;
    const success = history.filter(r => r.status === 'completed').length;
    const failed = history.filter(r => r.status === 'error').length;
    const avgDuration = total > 0 
      ? history.reduce((sum, r) => sum + (r.totalDuration || 0), 0) / total 
      : 0;
    
    return {
      total,
      success,
      failed,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      avgDuration: Math.round(avgDuration)
    };
  }
};

// 导出
window.WorkflowHistory = WorkflowHistory;
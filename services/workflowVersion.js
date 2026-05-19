/**
 * WorkflowVersion - 版本管理服务
 * 使用 IndexedDB 存储版本数据（最多50个版本）
 */
class WorkflowVersion {
  constructor(storage) {
    this.storage = storage;
    this.dbName = 'ai-creator-workflow-version';
    this.dbVersion = 1;
    this.storeName = 'versions';
    this.branchStoreName = 'branches';
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('workflowId', 'workflowId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('branch', 'branch', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.branchStoreName)) {
          const branchStore = db.createObjectStore(this.branchStoreName, { keyPath: 'id' });
          branchStore.createIndex('workflowId', 'workflowId', { unique: false });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) await this.init();
    return this.db;
  }

  /**
   * 保存新版本
   * @param {Object} workflow - 工作流数据
   * @param {Object} metadata - 版本元数据
   * @returns {string} 版本ID
   */
  async saveVersion(workflow, metadata = {}) {
    await this.ensureDB();
    
    const version = {
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      workflowId: workflow.id || 'local',
      name: metadata.name || workflow.name || '未命名版本',
      summary: metadata.summary || this.generateSummary(workflow),
      timestamp: Date.now(),
      nodeCount: workflow.nodes?.length || 0,
      author: metadata.author || 'local',
      isBranch: false,
      parentId: metadata.parentId || null,
      branch: metadata.branch || 'main',
      nodes: JSON.parse(JSON.stringify(workflow.nodes || [])),
      connections: JSON.parse(JSON.stringify(workflow.connections || [])),
      config: JSON.parse(JSON.stringify(workflow.config || {}))
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.add(version);
      
      request.onsuccess = () => {
        this.cleanupOldVersions(version.workflowId, version.branch);
        resolve(version.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 生成版本摘要
   */
  generateSummary(workflow) {
    const nodeTypes = {};
    (workflow.nodes || []).forEach(n => {
      const type = n.subtype || n.type || 'unknown';
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    });
    const parts = Object.entries(nodeTypes).map(([k, v]) => `${k}×${v}`);
    return parts.length > 0 ? parts.join(', ') : '空工作流';
  }

  /**
   * 获取版本列表
   * @param {string} workflowId - 工作流ID
   * @param {number} limit - 最大数量
   * @returns {Array} 版本列表
   */
  async getVersionList(workflowId, limit = 50) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('workflowId');
      const results = [];
      
      const cursorRequest = index.openCursor(null, 'prev');
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          if (!workflowId || cursor.value.workflowId === workflowId) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  /**
   * 获取所有分支的版本列表
   */
  async getAllVersions(limit = 50) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const results = [];
      
      const cursorRequest = store.openCursor(null, 'prev');
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  /**
   * 获取单版本详情
   * @param {string} id - 版本ID
   * @returns {Object} 版本数据
   */
  async getVersion(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 回滚到指定版本
   * @param {string} versionId - 版本ID
   * @returns {Object} 工作流数据
   */
  async rollback(versionId) {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error('版本不存在');
    }
    
    const workflow = {
      id: version.workflowId,
      name: version.name,
      nodes: JSON.parse(JSON.stringify(version.nodes)),
      connections: JSON.parse(JSON.stringify(version.connections)),
      config: JSON.parse(JSON.stringify(version.config || {}))
    };
    
    // 保存当前状态作为新版本（回滚前备份）
    await this.saveVersion(workflow, {
      name: version.name + ' (回滚前备份)',
      summary: '自动备份',
      parentId: versionId,
      branch: version.branch
    });
    
    return workflow;
  }

  /**
   * 创建分支
   * @param {string} versionId - 基于的版本ID
   * @param {string} name - 分支名称
   * @returns {string} 分支ID
   */
  async createBranch(versionId, name) {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error('版本不存在');
    }
    
    const branchId = 'branch_' + Date.now();
    
    // 创建分支版本
    const branchVersion = {
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      workflowId: version.workflowId,
      name: name,
      summary: `从 ${version.name} 创建分支`,
      timestamp: Date.now(),
      nodeCount: version.nodeCount,
      author: 'local',
      isBranch: true,
      parentId: versionId,
      branch: branchId,
      nodes: JSON.parse(JSON.stringify(version.nodes)),
      connections: JSON.parse(JSON.stringify(version.connections)),
      config: JSON.parse(JSON.stringify(version.config || {}))
    };

    // 保存分支信息
    const branch = {
      id: branchId,
      name: name,
      workflowId: version.workflowId,
      createdAt: Date.now(),
      createdFrom: versionId,
      currentVersion: branchVersion.id
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName, this.branchStoreName], 'readwrite');
      
      tx.objectStore(this.storeName).add(branchVersion);
      tx.objectStore(this.branchStoreName).add(branch);
      
      tx.oncomplete = () => resolve(branchId);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * 列出所有分支
   * @param {string} workflowId - 工作流ID
   * @returns {Array} 分支列表
   */
  async listBranches(workflowId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.branchStoreName, 'readonly');
      const store = tx.objectStore(this.branchStoreName);
      const results = [];
      
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (!workflowId || cursor.value.workflowId === workflowId) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  /**
   * 切换分支
   * @param {string} branchId - 分支ID
   * @returns {Object} 分支最新版本的工作流数据
   */
  async switchBranch(branchId) {
    const branches = await this.listBranches();
    const branch = branches.find(b => b.id === branchId);
    
    if (!branch) {
      throw new Error('分支不存在');
    }
    
    const version = await this.getVersion(branch.currentVersion);
    if (!version) {
      throw new Error('分支版本不存在');
    }
    
    return {
      id: version.workflowId,
      name: version.name,
      nodes: JSON.parse(JSON.stringify(version.nodes)),
      connections: JSON.parse(JSON.stringify(version.connections)),
      config: JSON.parse(JSON.stringify(version.config || {})),
      branch: branchId
    };
  }

  /**
   * 合并分支
   * @param {string} branchId - 要合并的分支ID
   * @param {string} targetBranchId - 目标分支ID（可选，默认 main）
   * @returns {Object} 合并后的工作流数据
   */
  async merge(branchId, targetBranchId = 'main') {
    const branches = await this.listBranches();
    const sourceBranch = branches.find(b => b.id === branchId);
    
    if (!sourceBranch) {
      throw new Error('源分支不存在');
    }
    
    // 获取源分支最新版本
    const sourceVersion = await this.getVersion(sourceBranch.currentVersion);
    if (!sourceVersion) {
      throw new Error('源分支版本不存在');
    }
    
    // 获取目标分支最新版本（main 或指定分支）
    let targetVersion;
    if (targetBranchId === 'main') {
      const allVersions = await this.getAllVersions(100);
      const mainVersions = allVersions.filter(v => v.branch === 'main');
      targetVersion = mainVersions[0];
    } else {
      const targetBranch = branches.find(b => b.id === targetBranchId);
      if (targetBranch) {
        targetVersion = await this.getVersion(targetBranch.currentVersion);
      }
    }
    
    // 简单合并策略：直接使用源分支的版本
    const mergedWorkflow = {
      id: sourceVersion.workflowId,
      name: sourceVersion.name + ' (已合并)',
      nodes: JSON.parse(JSON.stringify(sourceVersion.nodes)),
      connections: JSON.parse(JSON.stringify(sourceVersion.connections)),
      config: JSON.parse(JSON.stringify(sourceVersion.config || {})),
      branch: targetBranchId
    };
    
    // 保存合并后的新版本
    const newVersionId = await this.saveVersion(mergedWorkflow, {
      name: mergedWorkflow.name,
      summary: `合并分支 ${sourceBranch.name}`,
      parentId: sourceVersion.id,
      branch: targetBranchId
    });
    
    // 更新目标分支当前版本
    if (targetBranchId !== 'main') {
      await this.ensureDB();
      const tx = this.db.transaction(this.branchStoreName, 'readwrite');
      const store = tx.objectStore(this.branchStoreName);
      const request = store.get(targetBranchId);
      request.onsuccess = () => {
        const branch = request.result;
        if (branch) {
          branch.currentVersion = newVersionId;
          store.put(branch);
        }
      };
    }
    
    return mergedWorkflow;
  }

  /**
   * 删除分支
   * @param {string} branchId - 分支ID
   */
  async deleteBranch(branchId) {
    if (branchId === 'main') {
      throw new Error('不能删除 main 分支');
    }
    
    await this.ensureDB();
    
    // 删除分支版本
    const versions = await this.getAllVersions(100);
    const branchVersions = versions.filter(v => v.branch === branchId);
    
    const tx = this.db.transaction([this.storeName, this.branchStoreName], 'readwrite');
    
    branchVersions.forEach(v => {
      tx.objectStore(this.storeName).delete(v.id);
    });
    
    tx.objectStore(this.branchStoreName).delete(branchId);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * 清理旧版本（每个分支最多50个）
   */
  async cleanupOldVersions(workflowId, branch) {
    const versions = await this.getAllVersions(100);
    const branchVersions = versions.filter(v => v.branch === branch && v.workflowId === workflowId);
    
    if (branchVersions.length <= 50) return;
    
    const toDelete = branchVersions.slice(50);
    
    await this.ensureDB();
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    toDelete.forEach(v => store.delete(v.id));
  }
}

// 导出
window.WorkflowVersion = WorkflowVersion;
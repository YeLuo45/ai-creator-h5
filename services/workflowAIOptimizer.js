/**
 * Workflow AI Optimizer Service v17
 * AI智能优化服务 - 执行数据分析、优化建议、自动调优、优化历史追踪
 */
class WorkflowAIOptimizer {
  constructor() {
    this.dbName = 'WorkflowAIOptimizerDB';
    this.dbVersion = 1;
    this.db = null;
    this.storeNames = {
      executionHistory: 'executionHistory',
      optimizationHistory: 'optimizationHistory',
      learnedParams: 'learnedParams',
      abTests: 'abTests'
    };
  }

  // ============ IndexedDB初始化 ============
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 执行历史存储
        if (!db.objectStoreNames.contains(this.storeNames.executionHistory)) {
          const execStore = db.createObjectStore(this.storeNames.executionHistory, { keyPath: 'id', autoIncrement: true });
          execStore.createIndex('workflowId', 'workflowId', { unique: false });
          execStore.createIndex('timestamp', 'timestamp', { unique: false });
          execStore.createIndex('status', 'status', { unique: false });
          execStore.createIndex('nodeId', 'nodeId', { unique: false });
        }
        
        // 优化历史存储
        if (!db.objectStoreNames.contains(this.storeNames.optimizationHistory)) {
          const optStore = db.createObjectStore(this.storeNames.optimizationHistory, { keyPath: 'id', autoIncrement: true });
          optStore.createIndex('workflowId', 'workflowId', { unique: false });
          optStore.createIndex('timestamp', 'timestamp', { unique: false });
          optStore.createIndex('type', 'type', { unique: false });
        }
        
        // 学习参数存储
        if (!db.objectStoreNames.contains(this.storeNames.learnedParams)) {
          const paramStore = db.createObjectStore(this.storeNames.learnedParams, { keyPath: 'key' });
          paramStore.createIndex('nodeType', 'nodeType', { unique: false });
          paramStore.createIndex('successRate', 'successRate', { unique: false });
        }
        
        // A/B测试存储
        if (!db.objectStoreNames.contains(this.storeNames.abTests)) {
          const abStore = db.createObjectStore(this.storeNames.abTests, { keyPath: 'id', autoIncrement: true });
          abStore.createIndex('workflowId', 'workflowId', { unique: false });
          abStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // ============ 执行历史记录 ============
  async recordExecution(executionData) {
    const record = {
      workflowId: executionData.workflowId || 'default',
      workflowName: executionData.workflowName || 'Unnamed',
      timestamp: Date.now(),
      status: executionData.status, // 'completed', 'error', 'stopped'
      totalDuration: executionData.totalDuration || 0,
      nodeExecutions: executionData.nodeExecutions || [],
      nodeDurations: executionData.nodeDurations || {},
      nodeSuccess: executionData.nodeSuccess || {},
      variables: executionData.variables || {},
      progress: executionData.progress || 0
    };
    
    return this._addRecord(this.storeNames.executionHistory, record);
  }

  async _addRecord(storeName, record) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async _getAllRecords(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async _getRecordsByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ 执行数据分析 ============
  async analyzeExecutionHistory(workflowId) {
    const records = workflowId 
      ? await this._getRecordsByIndex(this.storeNames.executionHistory, 'workflowId', workflowId)
      : await this._getAllRecords(this.storeNames.executionHistory);
    
    if (records.length === 0) {
      return { error: 'No execution history found', suggestions: [] };
    }

    const analysis = {
      totalExecutions: records.length,
      successCount: records.filter(r => r.status === 'completed').length,
      errorCount: records.filter(r => r.status === 'error').length,
      avgDuration: 0,
      nodeStats: {},
      bottlenecks: [],
      lowSuccessNodes: [],
      abnormalPatterns: []
    };

    // 计算平均执行时间
    const completedRecords = records.filter(r => r.status === 'completed');
    if (completedRecords.length > 0) {
      analysis.avgDuration = completedRecords.reduce((sum, r) => sum + (r.totalDuration || 0), 0) / completedRecords.length;
    }

    // 节点统计分析
    const nodeMap = {};
    records.forEach(record => {
      if (record.nodeExecutions) {
        record.nodeExecutions.forEach(nodeId => {
          if (!nodeMap[nodeId]) {
            nodeMap[nodeId] = { totalTime: 0, count: 0, errors: 0, durations: [] };
          }
          nodeMap[nodeId].count++;
          if (record.nodeDurations && record.nodeDurations[nodeId]) {
            nodeMap[nodeId].totalTime += record.nodeDurations[nodeId];
            nodeMap[nodeId].durations.push(record.nodeDurations[nodeId]);
          }
          if (record.nodeSuccess && record.nodeSuccess[nodeId] === false) {
            nodeMap[nodeId].errors++;
          }
        });
      }
    });

    analysis.nodeStats = nodeMap;

    // 识别瓶颈节点（执行时间长且错误率高）
    const threshold = analysis.avgDuration * 0.3; // 超过平均时间30%的节点
    Object.keys(nodeMap).forEach(nodeId => {
      const stats = nodeMap[nodeId];
      const avgNodeTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
      const errorRate = stats.errors / stats.count;
      
      if (avgNodeTime > threshold && stats.count >= 2) {
        analysis.bottlenecks.push({
          nodeId,
          avgTime: avgNodeTime,
          totalExecutions: stats.count,
          errorRate,
          severity: avgNodeTime > threshold * 2 ? 'high' : 'medium'
        });
      }
      
      if (errorRate > 0.2) {
        analysis.lowSuccessNodes.push({
          nodeId,
          errorRate,
          totalExecutions: stats.count
        });
      }
    });

    // 异常模式检测
    analysis.abnormalPatterns = this._detectAbnormalPatterns(records);

    return analysis;
  }

  _detectAbnormalPatterns(records) {
    const patterns = [];
    
    // 检测执行时间异常波动
    const durations = records.filter(r => r.totalDuration > 0).map(r => r.totalDuration);
    if (durations.length >= 3) {
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      
      durations.forEach((d, i) => {
        if (Math.abs(d - mean) > stdDev * 3) {
          patterns.push({
            type: 'duration_spike',
            recordIndex: i,
            value: d,
            expected: mean,
            deviation: ((d - mean) / mean * 100).toFixed(1) + '%'
          });
        }
      });
    }

    // 检测连续失败
    let consecutiveErrors = 0;
    let lastErrorIndex = -1;
    records.forEach((record, index) => {
      if (record.status === 'error') {
        if (lastErrorIndex === index - 1) {
          consecutiveErrors++;
        } else {
          consecutiveErrors = 1;
        }
        lastErrorIndex = index;
        
        if (consecutiveErrors >= 3) {
          patterns.push({
            type: 'consecutive_errors',
            startIndex: index - consecutiveErrors + 1,
            count: consecutiveErrors
          });
        }
      } else {
        consecutiveErrors = 0;
      }
    });

    return patterns;
  }

  // ============ AI优化建议生成 ============
  generateSuggestions(analysis) {
    const suggestions = [];

    if (!analysis || analysis.error) return suggestions;

    // 瓶颈节点优化建议
    analysis.bottlenecks.forEach(bottleneck => {
      const nodeId = bottleneck.nodeId;
      const avgTime = bottleneck.avgTime;
      
      // 并行化建议
      suggestions.push({
        id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: 'parallelization',
        nodeId,
        title: '节点并行化',
        description: `节点 "${nodeId}" 平均执行时间 ${this._formatDuration(avgTime)}，可考虑并行化处理`,
        impact: 'time',
        timeEstimate: `-${Math.min(30, (bottleneck.severity === 'high' ? 25 : 15)).toFixed(0)}%`,
        successEstimate: '+0%',
        apply: () => this._applyParallelization(nodeId)
      });

      // 缓存建议
      if (bottleneck.count >= 5) {
        suggestions.push({
          id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'caching',
          nodeId,
          title: '启用结果缓存',
          description: `节点 "${nodeId}" 执行频率高，启用缓存可减少重复计算`,
          impact: 'time',
          timeEstimate: '-40%',
          successEstimate: '+0%',
          apply: () => this._applyCaching(nodeId)
        });
      }

      // 参数调整建议
      suggestions.push({
        id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: 'parameter',
        nodeId,
        title: '参数优化',
        description: `调整节点 "${nodeId}" 的执行参数以提升性能`,
        impact: 'both',
        timeEstimate: '-15%',
        successEstimate: '+5%',
        apply: () => this._suggestParamAdjustment(nodeId)
      });
    });

    // 低成功率节点优化建议
    analysis.lowSuccessNodes.forEach(node => {
      suggestions.push({
        id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: 'simplify',
        nodeId: node.nodeId,
        title: '简化节点逻辑',
        description: `节点 "${node.nodeId}" 错误率 ${(node.errorRate * 100).toFixed(0)}%，建议简化处理逻辑`,
        impact: 'success',
        timeEstimate: '-10%',
        successEstimate: `+${Math.min(20, (node.errorRate * 100 * 0.5)).toFixed(0)}%`,
        apply: () => this._applySimplify(node.nodeId)
      });
    });

    // 异常模式处理建议
    analysis.abnormalPatterns.forEach(pattern => {
      if (pattern.type === 'duration_spike') {
        suggestions.push({
          id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'timeout',
          nodeId: 'global',
          title: '添加超时控制',
          description: `检测到执行时间异常波动，添加超时控制可防止无限等待`,
          impact: 'time',
          timeEstimate: '-5%',
          successEstimate: '+3%',
          apply: () => this._applyTimeout()
        });
      }
    });

    return suggestions;
  }

  _formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  _applyParallelization(nodeId) {
    return {
      action: 'parallelize',
      nodeId,
      params: { parallelMode: true, maxParallel: 3 }
    };
  }

  _applyCaching(nodeId) {
    return {
      action: 'cache',
      nodeId,
      params: { cacheEnabled: true, cacheTTL: 300 }
    };
  }

  _suggestParamAdjustment(nodeId) {
    return {
      action: 'adjust_params',
      nodeId,
      params: { timeout: 5000, retries: 2 }
    };
  }

  _applySimplify(nodeId) {
    return {
      action: 'simplify',
      nodeId,
      params: { simplifyLevel: 'medium' }
    };
  }

  _applyTimeout() {
    return {
      action: 'set_timeout',
      nodeId: 'global',
      params: { globalTimeout: 300000 }
    };
  }

  // ============ 自动调优 ============
  async learnOptimalParams(nodeType, successfulRecords) {
    if (successfulRecords.length < 3) return null;

    const key = `params_${nodeType}`;
    const params = {
      key,
      nodeType,
      timestamp: Date.now(),
      sampleSize: successfulRecords.length,
      avgDuration: successfulRecords.reduce((s, r) => s + (r.totalDuration || 0), 0) / successfulRecords.length,
      successRate: 1.0,
      optimalTimeout: this._calculateOptimalTimeout(successfulRecords),
      optimalRetries: this._calculateOptimalRetries(successfulRecords)
    };

    await this._putRecord(this.storeNames.learnedParams, params);
    return params;
  }

  _calculateOptimalTimeout(records) {
    const durations = records.map(r => r.totalDuration || 0).filter(d => d > 0);
    if (durations.length === 0) return 30000;
    const max = Math.max(...durations);
    return Math.min(max * 1.5, 300000); // 最多5分钟
  }

  _calculateOptimalRetries(records) {
    const hasErrors = records.some(r => r.status === 'error');
    return hasErrors ? 2 : 0;
  }

  async _putRecord(storeName, record) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getLearnedParams(nodeType) {
    const records = await this._getAllRecords(this.storeNames.learnedParams);
    return records.find(r => r.nodeType === nodeType);
  }

  // ============ A/B测试 ============
  async createABTest(workflowId, testConfig) {
    const test = {
      workflowId,
      name: testConfig.name,
      controlConfig: testConfig.control,
      testConfig: testConfig.test,
      status: 'pending',
      startTime: null,
      results: { control: [], test: [] },
      createdAt: Date.now()
    };

    return this._addRecord(this.storeNames.abTests, test);
  }

  async recordABResult(testId, variant, result) {
    const tests = await this._getAllRecords(this.storeNames.abTests);
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    test.results[variant].push({
      ...result,
      timestamp: Date.now()
    });

    await this._putRecord(this.storeNames.abTests, test);
  }

  async completeABTest(testId) {
    const tests = await this._getAllRecords(this.storeNames.abTests);
    const test = tests.find(t => t.id === testId);
    if (!test) return null;

    test.status = 'completed';
    test.endTime = Date.now();
    test.winner = this._determineWinner(test.results);

    await this._putRecord(this.storeNames.abTests, test);
    return test;
  }

  _determineWinner(results) {
    const controlAvg = this._avgMetric(results.control, 'duration');
    const testAvg = this._avgMetric(results.test, 'duration');
    
    if (testAvg < controlAvg * 0.9) return 'test';
    if (controlAvg < testAvg * 0.9) return 'control';
    return 'inconclusive';
  }

  _avgMetric(results, metric) {
    if (!results || results.length === 0) return Infinity;
    return results.reduce((sum, r) => sum + (r[metric] || 0), 0) / results.length;
  }

  // ============ 优化历史 ============
  async recordOptimization(optimization) {
    const record = {
      workflowId: optimization.workflowId || 'default',
      type: optimization.type,
      nodeId: optimization.nodeId,
      title: optimization.title,
      description: optimization.description,
      beforeMetrics: optimization.beforeMetrics || {},
      afterMetrics: optimization.afterMetrics || {},
      appliedAt: Date.now(),
      success: optimization.success
    };

    return this._addRecord(this.storeNames.optimizationHistory, record);
  }

  async getOptimizationHistory(workflowId) {
    return workflowId 
      ? await this._getRecordsByIndex(this.storeNames.optimizationHistory, 'workflowId', workflowId)
      : await this._getAllRecords(this.storeNames.optimizationHistory);
  }

  async getOptimizationStats(workflowId) {
    const history = await this.getOptimizationHistory(workflowId);
    
    const stats = {
      totalOptimizations: history.length,
      byType: {},
      successRate: 0,
      avgTimeImprovement: 0,
      avgSuccessImprovement: 0
    };

    history.forEach(opt => {
      stats.byType[opt.type] = (stats.byType[opt.type] || 0) + 1;
      
      const timeBefore = opt.beforeMetrics.avgDuration || 0;
      const timeAfter = opt.afterMetrics.avgDuration || 0;
      if (timeBefore > 0) {
        stats.avgTimeImprovement += ((timeBefore - timeAfter) / timeBefore * 100);
      }

      const successBefore = opt.beforeMetrics.successRate || 0;
      const successAfter = opt.afterMetrics.successRate || 0;
      if (successBefore > 0) {
        stats.avgSuccessImprovement += ((successAfter - successBefore) / successBefore * 100);
      }

      if (opt.success) stats.successRate++;
    });

    if (history.length > 0) {
      stats.avgTimeImprovement /= history.length;
      stats.avgSuccessImprovement /= history.length;
      stats.successRate /= history.length;
    }

    return stats;
  }

  // ============ 敏感度分析 ============
  async sensitivityAnalysis(nodeId, paramName, values) {
    const results = [];
    
    for (const value of values) {
      const records = await this._getAllRecords(this.storeNames.executionHistory);
      const matchingRecords = records.filter(r => 
        r.nodeExecutions && r.nodeExecutions.includes(nodeId)
      );

      // 模拟不同参数值的影响
      const baseDuration = matchingRecords.length > 0
        ? matchingRecords.reduce((s, r) => s + (r.nodeDurations?.[nodeId] || 0), 0) / matchingRecords.length
        : 1000;

      results.push({
        paramValue: value,
        estimatedDuration: baseDuration * this._estimateParamImpact(paramName, value),
        estimatedSuccess: this._estimateSuccessImpact(paramName, value)
      });
    }

    return results;
  }

  _estimateParamImpact(paramName, value) {
    // 简化的参数影响估算
    const impacts = {
      timeout: (v) => v > 0 ? 0.9 : 1.1,
      retries: (v) => v > 0 ? 0.95 : 1.0,
      maxParallel: (v) => v > 1 ? 0.8 : 1.0,
      cacheTTL: (v) => v > 0 ? 0.7 : 1.0
    };
    return impacts[paramName] ? impacts[paramName](value) : 1.0;
  }

  _estimateSuccessImpact(paramName, value) {
    const impacts = {
      timeout: (v) => v >= 5000 ? 0.95 : 0.8,
      retries: (v) => v > 0 ? 0.95 : 0.85,
      maxParallel: () => 0.95,
      cacheTTL: () => 0.98
    };
    return impacts[paramName] ? impacts[paramName](value) : 0.9;
  }
}

// Singleton instance
const workflowAIOptimizer = new WorkflowAIOptimizer();

/**
 * DreamConsolidation.js - 两阶段记忆巩固系统
 * 基于 nanobot Dream Memory 两阶段记忆巩固机制
 * 
 * 阶段1 (Capture):  实时记录重要记忆片段
 * 阶段2 (Consolidate): 空闲时整合、归纳、淘汰
 */

(function() {
  'use strict';

  // ========== DreamConsolidation Class ==========
  class DreamConsolidation {
    constructor(options = {}) {
      this.id = options.id || this._generateId();
      this.enabled = options.enabled !== false;
      this.minIdleTime = options.minIdleTime || 5000; // 最小空闲时间(ms)
      this.maxBatchSize = options.maxBatchSize || 50;
      this.consolidationInterval = options.consolidationInterval || 60000; // 60秒
      this.retentionThreshold = options.retentionThreshold || 0.3;
      
      this.isRunning = false;
      this.lastConsolidation = null;
      this.pendingEntries = [];
      this.consolidatedCount = 0;
      
      this.callbacks = {
        onConsolidate: options.onConsolidate || null,
        onPromote: options.onPromote || null,
        onEvict: options.onEvict || null,
        onCapture: options.onCapture || null
      };

      this._idleTimer = null;
      this._consolidationTimer = null;
      this._activityDetector = null;
    }

    _generateId() {
      return 'dream_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    }

    // 启动记忆巩固系统
    start() {
      if (this.isRunning) return;
      
      this.isRunning = true;
      this._startConsolidationTimer();
      this._setupActivityDetector();
      
      console.log(`[DreamConsolidation] Started: ${this.id}`);
    }

    // 停止记忆巩固系统
    stop() {
      if (!this.isRunning) return;
      
      this.isRunning = false;
      this._clearTimers();
      
      console.log(`[DreamConsolidation] Stopped: ${this.id}`);
    }

    // ========== Phase 1: Capture ==========
    
    /**
     * 捕获记忆条目
     * @param {Object} entry - 记忆条目 { key, value, layer, tags, priority }
     * @returns {Object} 捕获结果
     */
    capture(entry) {
      if (!this.enabled) {
        return { captured: false, reason: 'consolidation_disabled' };
      }

      // 优先级判断：高优先级立即进入巩固队列
      const priorityThreshold = 80;
      
      if (entry.priority >= priorityThreshold) {
        // 高优先级：立即处理
        this.pendingEntries.push({
          ...entry,
          capturedAt: Date.now(),
          phase: 'capture'
        });
        
        // 触发回调
        if (this.callbacks.onCapture) {
          this.callbacks.onCapture(entry);
        }
        
        return {
          captured: true,
          priority: 'high',
          immediate: true,
          queueSize: this.pendingEntries.length
        };
      } else {
        // 低优先级：进入待巩固队列
        this.pendingEntries.push({
          ...entry,
          capturedAt: Date.now(),
          phase: 'capture'
        });
        
        return {
          captured: true,
          priority: 'normal',
          queueSize: this.pendingEntries.length
        };
      }
    }

    /**
     * 批量捕获记忆
     */
    captureBatch(entries) {
      const results = entries.map(entry => this.capture(entry));
      return {
        total: entries.length,
        captured: results.filter(r => r.captured).length,
        highPriority: results.filter(r => r.priority === 'high').length,
        queueSize: this.pendingEntries.length
      };
    }

    // ========== Phase 2: Consolidate ==========

    /**
     * 执行记忆巩固
     * @returns {Object} 巩固结果
     */
    consolidate() {
      if (!this.enabled || this.pendingEntries.length === 0) {
        return { consolidated: 0, promoted: 0, evicted: 0 };
      }

      const startTime = Date.now();
      const results = {
        consolidated: 0,
        promoted: [],
        evicted: [],
        duration: 0,
        entries: []
      };

      // 分批处理
      const batch = this.pendingEntries.splice(0, this.maxBatchSize);
      
      batch.forEach(entry => {
        const analysis = this._analyzeEntry(entry);
        
        if (analysis.shouldPromote) {
          // 提升到更高层
          results.promoted.push({
            entry,
            fromLayer: entry.layer,
            toLayer: analysis.targetLayer,
            reason: analysis.promotionReason
          });
          
          if (this.callbacks.onPromote) {
            this.callbacks.onPromote(entry, analysis.targetLayer);
          }
        } else if (analysis.shouldEvict) {
          // 淘汰
          results.evicted.push({
            entry,
            reason: analysis.evictionReason
          });
          
          if (this.callbacks.onEvict) {
            this.callbacks.onEvict(entry);
          }
        } else {
          // 保留在当前层
          results.entries.push({
            entry,
            retained: true,
            reinforcement: analysis.reinforcement
          });
          results.consolidated++;
        }
      });

      results.duration = Date.now() - startTime;
      this.lastConsolidation = Date.now();
      this.consolidatedCount += results.consolidated;

      // 触发巩固完成回调
      if (this.callbacks.onConsolidate) {
        this.callbacks.onConsolidate(results);
      }

      return results;
    }

    /**
     * 分析记忆条目
     * @private
     */
    _analyzeEntry(entry) {
      const now = Date.now();
      const age = now - entry.timestamp;
      const accessCount = entry.metadata?.accessCount || 1;
      const priority = entry.priority || 50;

      // 提升判断：高频访问 + 高优先级 + 较新
      const promotionScore = (
        (accessCount * 2) + 
        (priority / 10) + 
        (age < 86400000 ? 10 : 0) // 24小时内
      );

      // 淘汰判断：低访问 + 低优先级 + 较旧
      const evictionScore = (
        (10 - Math.min(accessCount, 10)) +
        (100 - priority) / 20 +
        (age > 604800000 ? 20 : 0) // 7天以上
      );

      return {
        shouldPromote: promotionScore > 25 && age < 259200000, // 3天内
        shouldEvict: evictionScore > 30 && age > 172800000, // 2天以上
        targetLayer: this._getNextLayer(entry.layer),
        promotionReason: `score=${promotionScore.toFixed(1)}, accesses=${accessCount}, age=${age}`,
        evictionReason: `score=${evictionScore.toFixed(1)}, priority=${priority}, age=${age}`,
        reinforcement: accessCount > 3
      };
    }

    /**
     * 获取下一层
     * @private
     */
    _getNextLayer(currentLayer) {
      const layerOrder = ['L0_META', 'L1_INDEX', 'L2_GLOBAL', 'L3_SKILL', 'L4_SESSION'];
      const currentIndex = layerOrder.indexOf(currentLayer);
      
      if (currentIndex === -1 || currentIndex >= layerOrder.length - 1) {
        return currentLayer; // 已是最高层或未知
      }
      
      return layerOrder[currentIndex + 1];
    }

    // ========== Idle Detection ==========

    /**
     * 设置活动检测器
     * @private
     */
    _setupActivityDetector() {
      let lastActivity = Date.now();
      
      // 检测用户活动（鼠标、键盘、滚动等）
      const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      
      const updateActivity = () => {
        lastActivity = Date.now();
      };

      activityEvents.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
      });

      this._activityDetector = {
        lastActivity,
        getIdleTime: () => Date.now() - lastActivity,
        isIdle: () => Date.now() - lastActivity > this.minIdleTime
      };
    }

    /**
     * 启动定期巩固计时器
     * @private
     */
    _startConsolidationTimer() {
      this._consolidationTimer = setInterval(() => {
        if (!this.isRunning) return;
        
        // 检查是否空闲
        if (this._activityDetector && this._activityDetector.isIdle()) {
          this.consolidate();
        }
      }, this.consolidationInterval);
    }

    /**
     * 清除所有计时器
     * @private
     */
    _clearTimers() {
      if (this._idleTimer) {
        clearInterval(this._idleTimer);
        this._idleTimer = null;
      }
      if (this._consolidationTimer) {
        clearInterval(this._consolidationTimer);
        this._consolidationTimer = null;
      }
    }

    // ========== Utility Methods ==========

    /**
     * 强制执行巩固（用于测试或手动触发）
     */
    forceConsolidate() {
      return this.consolidate();
    }

    /**
     * 获取待巩固队列大小
     */
    getQueueSize() {
      return this.pendingEntries.length;
    }

    /**
     * 获取统计信息
     */
    getStats() {
      return {
        id: this.id,
        enabled: this.enabled,
        isRunning: this.isRunning,
        queueSize: this.pendingEntries.length,
        consolidatedCount: this.consolidatedCount,
        lastConsolidation: this.lastConsolidation,
        minIdleTime: this.minIdleTime,
        consolidationInterval: this.consolidationInterval
      };
    }

    /**
     * 重置统计
     */
    resetStats() {
      this.consolidatedCount = 0;
      this.lastConsolidation = null;
    }

    /**
     * 清空待巩固队列
     */
    clearQueue() {
      const count = this.pendingEntries.length;
      this.pendingEntries = [];
      return { cleared: count };
    }

    /**
     * 设置回调
     */
    setCallback(event, callback) {
      if (['onConsolidate', 'onPromote', 'onEvict', 'onCapture'].includes(event)) {
        this.callbacks[event] = callback;
      }
    }

    /**
     * 销毁实例
     */
    destroy() {
      this.stop();
      this.pendingEntries = [];
      this.callbacks = {
        onConsolidate: null,
        onPromote: null,
        onEvict: null,
        onCapture: null
      };
    }
  }

  // ========== DreamManager ==========
  class DreamManager {
    constructor(options = {}) {
      this.id = options.id || 'dream_manager_' + Date.now().toString(36);
      this.consolidators = {};
      this.globalStats = {
        totalConsolidated: 0,
        totalPromoted: 0,
        totalEvicted: 0,
        startTime: Date.now()
      };
    }

    /**
     * 创建记忆巩固器
     * @param {string} name - 巩固器名称
     * @param {Object} options - 配置选项
     * @returns {DreamConsolidation}
     */
    createConsolidator(name, options = {}) {
      const consolidator = new DreamConsolidation({
        ...options,
        id: `${this.id}_${name}`
      });

      this.consolidators[name] = consolidator;

      // 绑定回调用于全局统计
      consolidator.setCallback('onConsolidate', (results) => {
        this.globalStats.totalConsolidated += results.consolidated;
        this.globalStats.totalPromoted += results.promoted.length;
        this.globalStats.totalEvicted += results.evicted.length;
      });

      return consolidator;
    }

    /**
     * 获取巩固器
     */
    getConsolidator(name) {
      return this.consolidators[name];
    }

    /**
     * 启动所有巩固器
     */
    startAll() {
      Object.values(this.consolidators).forEach(c => c.start());
    }

    /**
     * 停止所有巩固器
     */
    stopAll() {
      Object.values(this.consolidators).forEach(c => c.stop());
    }

    /**
     * 对所有巩固器执行巩固
     */
    consolidateAll() {
      const results = {};
      
      Object.entries(this.consolidators).forEach(([name, consolidator]) => {
        results[name] = consolidator.consolidate();
      });

      return results;
    }

    /**
     * 获取全局统计
     */
    getStats() {
      const consolidatorStats = {};
      
      Object.entries(this.consolidators).forEach(([name, consolidator]) => {
        consolidatorStats[name] = consolidator.getStats();
      });

      return {
        ...this.globalStats,
        uptime: Date.now() - this.globalStats.startTime,
        consolidators: Object.keys(this.consolidators),
        consolidatorStats
      };
    }

    /**
     * 销毁所有巩固器
     */
    destroy() {
      this.stopAll();
      this.consolidators = {};
    }
  }

  // ========== Export ==========
  window.DreamConsolidation = {
    DreamConsolidation,
    DreamManager
  };

  // 别名
  window.DreamMemory = window.DreamConsolidation;

})();
// ============ v25 AI Prediction Service ============
// AI-driven execution prediction, smart scheduling, and adaptive nodes

const WorkflowPrediction = {
  // Historical data storage
  history: {},
  
  // Statistics cache
  stats: {},
  
  // Prediction model parameters
  modelParams: {
    confidenceLevel: 0.95,
    minSamplesForTrend: 5,
    trendSmoothingFactor: 0.3,
    anomalyThreshold: 2.5 // standard deviations
  },

  // Initialize prediction system
  init() {
    this.loadHistory();
    this.computeStatistics();
    console.log('[Prediction] AI Prediction Service initialized');
  },

  // Load historical execution data from localStorage
  loadHistory() {
    try {
      const saved = localStorage.getItem('wf_prediction_history');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      this.history = {};
    }
  },

  // Save historical data
  saveHistory() {
    try {
      localStorage.setItem('wf_prediction_history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('[Prediction] Failed to save history:', e);
    }
  },

  // Record execution result for a node
  recordExecution(nodeId, execution) {
    if (!this.history[nodeId]) {
      this.history[nodeId] = [];
    }
    
    this.history[nodeId].push({
      timestamp: Date.now(),
      duration: execution.duration || 0,
      success: execution.success !== false,
      error: execution.error || null,
      resourceUsage: execution.resourceUsage || { cpu: 0, memory: 0 },
      inputSize: execution.inputSize || 0,
      outputSize: execution.outputSize || 0
    });

    // Keep only last 1000 records per node
    if (this.history[nodeId].length > 1000) {
      this.history[nodeId] = this.history[nodeId].slice(-1000);
    }

    this.saveHistory();
    this.computeStatistics();
  },

  // Compute statistics for each node
  computeStatistics() {
    for (const nodeId in this.history) {
      const records = this.history[nodeId];
      if (records.length === 0) continue;

      const durations = records.map(r => r.duration).filter(d => d > 0);
      const successes = records.filter(r => r.success);
      const resources = records.map(r => r.resourceUsage);

      if (durations.length > 0) {
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
        const stdDev = Math.sqrt(variance);
        
        // Compute trend using simple linear regression
        const trend = this.computeTrend(durations);
        
        this.stats[nodeId] = {
          mean,
          variance,
          stdDev,
          min: Math.min(...durations),
          max: Math.max(...durations),
          median: this.percentile(durations, 50),
          p95: this.percentile(durations, 95),
          p99: this.percentile(durations, 99),
          trend,
          successRate: successes.length / records.length,
          totalExecutions: records.length,
          recentAvg: durations.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, durations.length),
          resourceStats: this.computeResourceStats(resources)
        };
      }
    }
  },

  // Compute trend using simple moving average comparison
  computeTrend(values) {
    if (values.length < this.modelParams.minSamplesForTrend) {
      return { direction: 'stable', slope: 0 };
    }

    const n = values.length;
    const recentWindow = Math.min(10, Math.floor(n / 3));
    const recentAvg = values.slice(-recentWindow).reduce((a, b) => a + b, 0) / recentWindow;
    const olderAvg = values.slice(0, recentWindow).reduce((a, b) => a + b, 0) / recentWindow;

    const change = (recentAvg - olderAvg) / olderAvg;
    
    let direction = 'stable';
    if (change > 0.1) direction = 'increasing';
    else if (change < -0.1) direction = 'decreasing';

    return { direction, slope: change, recentAvg, olderAvg };
  },

  // Compute resource statistics
  computeResourceStats(resources) {
    if (!resources || resources.length === 0) {
      return { cpu: { mean: 0, max: 0 }, memory: { mean: 0, max: 0 } };
    }

    const cpuValues = resources.map(r => r.cpu || 0);
    const memValues = resources.map(r => r.memory || 0);

    return {
      cpu: {
        mean: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
        max: Math.max(...cpuValues),
        trend: this.computeTrend(cpuValues)
      },
      memory: {
        mean: memValues.reduce((a, b) => a + b, 0) / memValues.length,
        max: Math.max(...memValues),
        trend: this.computeTrend(memValues)
      }
    };
  },

  // Calculate percentile
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  },

  // Predict execution time for a node
  predictExecutionTime(nodeId, context = {}) {
    const stat = this.stats[nodeId];
    
    if (!stat) {
      // No history - return default estimate based on node type
      return this.getDefaultEstimate(nodeId, context);
    }

    // Base prediction is the mean
    let predicted = stat.mean;

    // Adjust based on trend
    if (stat.trend.direction === 'increasing') {
      predicted *= (1 + stat.trend.slope);
    } else if (stat.trend.direction === 'decreasing') {
      predicted *= (1 + stat.trend.slope);
    }

    // Adjust based on input size if provided
    if (context.inputSize && stat.resourceStats) {
      // Estimate based on input size ratio
      const avgInputSize = (context.inputSize || 0);
      if (avgInputSize > 0) {
        const sizeRatio = context.inputSize / avgInputSize;
        predicted *= Math.max(0.5, Math.min(2, sizeRatio));
      }
    }

    // Add uncertainty margin based on variance
    const uncertaintyMargin = stat.stdDev * 1.96; // 95% confidence

    return {
      estimated: predicted,
      lower: Math.max(0, predicted - uncertaintyMargin),
      upper: predicted + uncertaintyMargin,
      confidence: this.calculateConfidence(stat),
      basedOn: stat.totalExecutions
    };
  },

  // Get default estimate for nodes without history
  getDefaultEstimate(nodeId, context) {
    const defaults = {
      'trigger': 10,
      'character': 5000,
      'music': 8000,
      'tts': 3000,
      'poster': 6000,
      'loop': 100,
      'condition': 5,
      'save': 100,
      'share': 500,
      'http': 1000
    };

    const nodeType = nodeId.split('_')[0];
    const baseTime = defaults[nodeType] || 1000;

    return {
      estimated: baseTime,
      lower: baseTime * 0.5,
      upper: baseTime * 2,
      confidence: 0.3,
      basedOn: 0
    };
  },

  // Calculate prediction confidence based on sample size and variance
  calculateConfidence(stat) {
    if (!stat || stat.totalExecutions < 5) return 0.2;
    
    // Base confidence on sample size (logarithmic scale)
    let conf = Math.min(0.95, 0.5 + Math.log10(stat.totalExecutions) * 0.15);
    
    // Reduce confidence if coefficient of variation is high
    const cv = stat.stdDev / stat.mean;
    if (cv > 0.5) conf *= 0.7;
    else if (cv > 0.3) conf *= 0.85;
    
    // Reduce confidence if trend is unstable
    if (stat.trend.direction === 'stable') conf *= 1;
    else conf *= 0.9;

    return conf;
  },

  // Predict resource usage
  predictResourceUsage(nodeId) {
    const stat = this.stats[nodeId];
    if (!stat || !stat.resourceStats) {
      return { cpu: { estimated: 10, max: 50 }, memory: { estimated: 50, max: 200 } };
    }

    return {
      cpu: {
        estimated: stat.resourceStats.cpu.mean,
        max: stat.resourceStats.cpu.max,
        trend: stat.resourceStats.cpu.trend
      },
      memory: {
        estimated: stat.resourceStats.memory.mean,
        max: stat.resourceStats.memory.max,
        trend: stat.resourceStats.memory.trend
      }
    };
  },

  // Predict success probability
  predictSuccessRate(nodeId) {
    const stat = this.stats[nodeId];
    if (!stat) return { rate: 0.95, confidence: 0.3 };

    return {
      rate: stat.successRate,
      confidence: Math.min(0.95, 0.5 + Math.log10(stat.totalExecutions + 1) * 0.15)
    };
  },

  // Detect bottlenecks early
  detectBottlenecks(nodes, connections) {
    const bottlenecks = [];
    
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      const stat = this.stats[nodeId];
      
      if (!stat) continue;

      // Check for high execution time
      if (stat.mean > 5000 && stat.totalExecutions >= 5) {
        bottlenecks.push({
          nodeId,
          nodeName: node.name || nodeId,
          type: 'high_duration',
          severity: stat.mean > 10000 ? 'high' : 'medium',
          details: {
            mean: stat.mean,
            p95: stat.p95,
            trend: stat.trend.direction
          },
          suggestion: this.getBottleneckSuggestion(node, stat)
        });
      }

      // Check for high variance (unstable performance)
      const cv = stat.stdDev / stat.mean;
      if (cv > 0.5 && stat.totalExecutions >= 10) {
        bottlenecks.push({
          nodeId,
          nodeName: node.name || nodeId,
          type: 'high_variance',
          severity: 'medium',
          details: {
            cv,
            stdDev: stat.stdDev,
            mean: stat.mean
          },
          suggestion: '考虑添加缓存或重试机制以减少性能波动'
        });
      }

      // Check for low success rate
      if (stat.successRate < 0.9 && stat.totalExecutions >= 5) {
        bottlenecks.push({
          nodeId,
          nodeName: node.name || nodeId,
          type: 'low_success_rate',
          severity: stat.successRate < 0.7 ? 'high' : 'medium',
          details: {
            successRate: stat.successRate,
            totalErrors: stat.totalExecutions * (1 - stat.successRate)
          },
          suggestion: '检查节点配置和输入数据，考虑添加错误处理或数据验证'
        });
      }

      // Check for increasing trend (performance degrading)
      if (stat.trend.direction === 'increasing' && stat.trend.slope > 0.2) {
        bottlenecks.push({
          nodeId,
          nodeName: node.name || nodeId,
          type: 'performance_degradation',
          severity: 'high',
          details: {
            slope: stat.trend.slope,
            recentAvg: stat.trend.recentAvg,
            olderAvg: stat.trend.olderAvg
          },
          suggestion: '检测到性能持续下降，建议检查资源使用情况和外部依赖'
        });
      }

      // Check for resource exhaustion
      if (stat.resourceStats) {
        if (stat.resourceStats.cpu.max > 80) {
          bottlenecks.push({
            nodeId,
            nodeName: node.name || nodeId,
            type: 'cpu_bottleneck',
            severity: stat.resourceStats.cpu.max > 95 ? 'high' : 'medium',
            details: { max: stat.resourceStats.cpu.max },
            suggestion: 'CPU使用率过高，考虑优化算法或增加资源配额'
          });
        }
        if (stat.resourceStats.memory.max > 500) {
          bottlenecks.push({
            nodeId,
            nodeName: node.name || nodeId,
            type: 'memory_bottleneck',
            severity: stat.resourceStats.memory.max > 800 ? 'high' : 'medium',
            details: { max: stat.resourceStats.memory.max },
            suggestion: '内存使用量较高，考虑优化内存管理或增加内存限制'
          });
        }
      }
    }

    // Sort by severity
    bottlenecks.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return bottlenecks;
  },

  // Get suggestion for bottleneck
  getBottleneckSuggestion(node, stat) {
    const suggestions = [];
    
    if (stat.mean > 5000) {
      suggestions.push('考虑使用缓存减少重复计算');
    }
    if (stat.trend.direction === 'increasing') {
      suggestions.push('性能有下降趋势，建议检查是否有资源泄漏');
    }
    if (stat.p95 / stat.mean > 2) {
      suggestions.push('执行时间波动大，建议添加超时和重试机制');
    }
    
    return suggestions.join('；') || '建议进行性能分析和优化';
  },

  // Smart scheduler - find optimal execution path
  optimizeExecutionPath(nodes, connections, startNodeId) {
    const pathAnalysis = this.analyzeExecutionPaths(nodes, connections, startNodeId);
    
    return {
      optimalPath: pathAnalysis.optimalPath,
      parallelOpportunities: pathAnalysis.parallelOpportunities,
      estimatedDuration: pathAnalysis.estimatedDuration,
      recommendations: pathAnalysis.recommendations
    };
  },

  // Analyze possible execution paths
  analyzeExecutionPaths(nodes, connections, startNodeId) {
    const visited = new Set();
    const path = [];
    const parallelNodes = [];
    const recommendations = [];

    // Build adjacency list
    const adj = {};
    for (const conn of connections) {
      if (!adj[conn.from]) adj[conn.from] = [];
      adj[conn.from].push(conn.to);
    }

    // Find independent branches (can run in parallel)
    const independentBranches = this.findIndependentBranches(nodes, adj);
    
    // Estimate total duration
    let estimatedDuration = 0;
    
    // BFS/DFS to find path and calculate duration
    const calculatePathDuration = (nodeId, depth = 0) => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      
      const node = nodes[nodeId];
      if (!node) return 0;

      const pred = this.predictExecutionTime(nodeId);
      let nodeDuration = pred.estimated;

      // Add time for parallel branches
      const children = adj[nodeId] || [];
      let parallelDuration = 0;
      
      for (const childId of children) {
        if (!visited.has(childId)) {
          const childDuration = calculatePathDuration(childId, depth + 1);
          parallelDuration = Math.max(parallelDuration, childDuration);
        }
      }

      return nodeDuration + parallelDuration;
    };

    if (startNodeId) {
      estimatedDuration = calculatePathDuration(startNodeId);
    }

    // Generate recommendations
    if (independentBranches.length > 1) {
      recommendations.push({
        type: 'parallelization',
        impact: 'high',
        description: `发现 ${independentBranches.length} 个独立分支可并行执行`,
        estimatedSavings: '30-50%'
      });
    }

    // Check for sequential loops that could be optimized
    for (const nodeId in nodes) {
      const node = nodes[nodeId];
      if (node.type === 'loop') {
        recommendations.push({
          type: 'loop_optimization',
          impact: 'medium',
          nodeId,
          description: '检测到循环节点，考虑展开或批量优化',
          estimatedSavings: '10-30%'
        });
      }
    }

    return {
      optimalPath: path,
      parallelOpportunities: independentBranches,
      estimatedDuration,
      recommendations
    };
  },

  // Find branches that can run in parallel
  findIndependentBranches(nodes, adj) {
    const branches = [];
    const visited = new Set();

    const dfs = (nodeId, branch) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      branch.push(nodeId);

      const children = adj[nodeId] || [];
      if (children.length > 1) {
        // Branch point - explore each branch
        for (const childId of children) {
          dfs(childId, [...branch]);
        }
      } else if (children.length === 1) {
        dfs(children[0], branch);
      }
    };

    // Find all root nodes (nodes with no incoming connections)
    const hasIncoming = new Set();
    for (const from in adj) {
      for (const to of adj[from]) {
        hasIncoming.add(to);
      }
    }

    for (const nodeId in nodes) {
      if (!hasIncoming.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return branches;
  },

  // Dynamic parallel optimization
  suggestParallelOptimization(nodes, connections) {
    const suggestions = [];
    
    // Find merge points (nodes with multiple inputs)
    const incomingCount = {};
    for (const conn of connections) {
      incomingCount[conn.to] = (incomingCount[conn.to] || 0) + 1;
    }

    // Find parallel branches
    for (const nodeId in nodes) {
      const count = incomingCount[nodeId] || 0;
      if (count > 1) {
        const pred = this.predictExecutionTime(nodeId);
        if (pred.estimated > 1000) {
          suggestions.push({
            type: 'parallel_merge',
            nodeId,
            description: `节点 "${nodeId}" 汇聚了 ${count} 个分支，可优化合并策略`,
            potentialSavings: pred.estimated * 0.2
          });
        }
      }
    }

    return suggestions;
  },

  // Load balancing suggestion
  suggestLoadBalancing() {
    const suggestions = [];
    
    for (const nodeId in this.stats) {
      const stat = this.stats[nodeId];
      if (stat && stat.resourceStats) {
        if (stat.resourceStats.cpu.trend.direction === 'increasing') {
          suggestions.push({
            type: 'load_balance',
            nodeId,
            metric: 'cpu',
            description: `节点 "${nodeId}" CPU使用率持续上升，建议分散负载`,
            currentLoad: stat.resourceStats.cpu.mean,
            maxLoad: stat.resourceStats.cpu.max
          });
        }
      }
    }

    return suggestions;
  },

  // Resource pre-allocation recommendations
  recommendResourcePreAllocation() {
    const recommendations = {};

    for (const nodeId in this.stats) {
      const stat = this.stats[nodeId];
      if (!stat || !stat.resourceStats) continue;

      // Calculate recommended resources with buffer
      recommendations[nodeId] = {
        cpu: Math.ceil(stat.resourceStats.cpu.max * 1.2),
        memory: Math.ceil(stat.resourceStats.memory.max * 1.2),
        timeout: Math.ceil(stat.p95 * 1.5),
        basedOn: stat.totalExecutions
      };
    }

    return recommendations;
  },

  // Adaptive node self-monitoring
  createAdaptiveNodeMonitor(nodeId) {
    return {
      nodeId,
      startTime: null,
      checkpoints: [],
      resourceSnapshots: [],
      
      start() {
        this.startTime = Date.now();
        this.checkpoints = [{ name: 'start', time: 0 }];
        this.resourceSnapshots = [];
      },

      checkpoint(name) {
        if (this.startTime) {
          this.checkpoints.push({ name, time: Date.now() - this.startTime });
        }
      },

      recordResources(cpu, memory) {
        this.resourceSnapshots.push({
          time: Date.now() - this.startTime,
          cpu,
          memory
        });
      },

      finish(success, error = null) {
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        
        // Record execution
        this.recordExecution({
          duration,
          success,
          error,
          resourceUsage: this.getPeakResources()
        });

        this.startTime = null;
        return duration;
      },

      getPeakResources() {
        let peakCpu = 0, peakMem = 0;
        for (const snap of this.resourceSnapshots) {
          peakCpu = Math.max(peakCpu, snap.cpu);
          peakMem = Math.max(peakMem, snap.memory);
        }
        return { cpu: peakCpu, memory: peakMem };
      }
    };
  },

  // Auto parameter tuning based on historical data
  suggestOptimalParams(nodeId) {
    const stat = this.stats[nodeId];
    if (!stat) return null;

    const suggestions = {
      timeout: Math.ceil(stat.p95 * 1.5),
      retries: stat.successRate < 0.95 ? 3 : 1,
      maxParallel: 1,
      cacheTTL: 300
    };

    // Adjust based on variance
    const cv = stat.stdDev / stat.mean;
    if (cv > 0.5) {
      suggestions.retries = Math.min(5, suggestions.retries + 2);
      suggestions.timeout = Math.ceil(suggestions.timeout * 1.5);
    }

    // Adjust based on trend
    if (stat.trend.direction === 'decreasing') {
      suggestions.cacheTTL = Math.min(3600, suggestions.cacheTTL * 2);
    }

    return suggestions;
  },

  // Smart retry logic
  shouldRetry(nodeId, attemptCount, lastError) {
    const stat = this.stats[nodeId];
    
    // Don't retry if we've never succeeded
    if (stat && stat.successRate === 0) {
      return { shouldRetry: false, reason: '历史记录显示该节点从未成功' };
    }

    // Don't retry if we've already tried too many times
    if (attemptCount >= 5) {
      return { shouldRetry: false, reason: '已达到最大重试次数' };
    }

    // Calculate delay with exponential backoff
    const baseDelay = stat ? stat.mean / 2 : 1000;
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount), 30000);

    return {
      shouldRetry: true,
      delay,
      reason: `等待 ${delay}ms 后重试 (第 ${attemptCount + 1} 次)`
    };
  },

  // Failure auto-recovery suggestions
  suggestRecoveryStrategy(nodeId, errorType) {
    const strategies = {
      timeout: {
        action: '增加超时时间',
        params: { timeoutMultiplier: 2 }
      },
      network: {
        action: '添加网络错误处理和重试',
        params: { retries: 3, backoff: 'exponential' }
      },
      resource: {
        action: '释放资源或增加配额',
        params: { resourceMultiplier: 1.5 }
      },
      data: {
        action: '添加数据验证和清洗',
        params: { validation: true }
      },
      unknown: {
        action: '记录错误并跳过该节点继续执行',
        params: { skipOnError: true }
      }
    };

    return strategies[errorType] || strategies.unknown;
  },

  // Simulate execution based on predictions
  simulateExecution(nodes, connections, options = {}) {
    const results = {
      nodes: {},
      totalDuration: 0,
      criticalPath: [],
      bottlenecks: [],
      parallelSavings: 0
    };

    // Calculate predictions for each node
    for (const nodeId in nodes) {
      const pred = this.predictExecutionTime(nodeId);
      const successPred = this.predictSuccessRate(nodeId);
      const resourcePred = this.predictResourceUsage(nodeId);

      results.nodes[nodeId] = {
        estimatedDuration: pred.estimated,
        confidence: pred.confidence,
        successRate: successPred.rate,
        resources: resourcePred
      };
    }

    // Build execution timeline
    const timeline = this.buildExecutionTimeline(nodes, connections, results.nodes);
    results.timeline = timeline;
    results.totalDuration = timeline.reduce((sum, t) => sum + t.duration, 0);

    // Find critical path
    results.criticalPath = this.findCriticalPath(timeline);

    // Calculate parallel savings
    const sequentialDuration = timeline.reduce((sum, t) => sum + t.duration, 0);
    results.parallelSavings = sequentialDuration - results.totalDuration;

    return results;
  },

  // Build execution timeline
  buildExecutionTimeline(nodes, connections, predictions) {
    const timeline = [];
    const adj = {};
    const inDegree = {};

    // Initialize
    for (const nodeId in nodes) {
      inDegree[nodeId] = 0;
    }

    // Build graph
    for (const conn of connections) {
      if (!adj[conn.from]) adj[conn.from] = [];
      adj[conn.from].push(conn.to);
      inDegree[conn.to] = (inDegree[conn.to] || 0) + 1;
    }

    // Find start nodes
    const queue = [];
    for (const nodeId in nodes) {
      if (inDegree[nodeId] === 0) {
        queue.push({ nodeId, startTime: 0 });
      }
    }

    // Process with parallel awareness
    let currentTime = 0;
    const processed = new Set();

    while (queue.length > 0) {
      const { nodeId, startTime } = queue.shift();
      if (processed.has(nodeId)) continue;
      processed.add(nodeId);

      const pred = predictions[nodeId];
      const duration = pred ? pred.estimated : 1000;

      timeline.push({
        nodeId,
        startTime,
        duration,
        endTime: startTime + duration,
        resources: pred ? pred.resources : null
      });

      currentTime = Math.max(currentTime, startTime + duration);

      // Process children
      const children = adj[nodeId] || [];
      for (const childId of children) {
        inDegree[childId]--;
        if (inDegree[childId] === 0 && !processed.has(childId)) {
          queue.push({ nodeId: childId, startTime: currentTime });
        }
      }

      // Sort by start time for next iteration
      queue.sort((a, b) => a.startTime - b.startTime);
    }

    return timeline;
  },

  // Find critical path in timeline
  findCriticalPath(timeline) {
    if (timeline.length === 0) return [];

    // Sort by end time to find longest path
    const sorted = [...timeline].sort((a, b) => b.endTime - a.endTime);
    const maxEndTime = sorted[0].endTime;

    // Find all nodes on critical path
    const criticalPath = timeline
      .filter(t => t.endTime === maxEndTime)
      .map(t => t.nodeId);

    return criticalPath;
  },

  // Get overall accuracy rate of predictions
  getPredictionAccuracy() {
    let totalPredictions = 0;
    let accuratePredictions = 0;

    for (const nodeId in this.history) {
      const records = this.history[nodeId];
      const stat = this.stats[nodeId];
      if (!stat || records.length === 0) continue;

      for (const record of records.slice(-50)) { // Check last 50 executions
        totalPredictions++;
        
        // Check if actual duration is within predicted range
        if (record.duration >= stat.mean - stat.stdDev * 2 &&
            record.duration <= stat.mean + stat.stdDev * 2) {
          accuratePredictions++;
        }
      }
    }

    return {
      accuracy: totalPredictions > 0 ? accuratePredictions / totalPredictions : 0,
      totalPredictions,
      sampleSize: totalPredictions
    };
  },

  // Get dashboard data
  getDashboardData() {
    const bottlenecks = this.detectBottlenecks(state.workflow.nodes, state.workflow.connections);
    const accuracy = this.getPredictionAccuracy();
    const resourceAlloc = this.recommendResourcePreAllocation();

    return {
      totalNodesTracked: Object.keys(this.stats).length,
      totalExecutionsTracked: Object.values(this.history).reduce((sum, h) => sum + h.length, 0),
      bottlenecks: bottlenecks.slice(0, 5),
      accuracy,
      resourceRecommendations: resourceAlloc,
      predictionSummary: this.getPredictionSummary()
    };
  },

  // Get prediction summary
  getPredictionSummary() {
    const summary = {
      avgConfidence: 0,
      avgSuccessRate: 0,
      totalNodes: Object.keys(this.stats).length
    };

    const stats = Object.values(this.stats);
    if (stats.length > 0) {
      summary.avgConfidence = stats.reduce((sum, s) => sum + this.calculateConfidence(s), 0) / stats.length;
      summary.avgSuccessRate = stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length;
    }

    return summary;
  },

  // Export prediction data
  exportPredictionData() {
    return {
      history: this.history,
      stats: this.stats,
      exportTime: Date.now()
    };
  },

  // Import prediction data
  importPredictionData(data) {
    if (data.history) {
      this.history = { ...this.history, ...data.history };
      this.saveHistory();
      this.computeStatistics();
    }
  },

  // Clear all prediction data
  clearData() {
    this.history = {};
    this.stats = {};
    localStorage.removeItem('wf_prediction_history');
  }
};

// Initialize on load
WorkflowPrediction.init();

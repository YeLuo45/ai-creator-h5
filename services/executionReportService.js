/**
 * Execution Report Service v16
 * 执行报告服务 - 生成执行报告、数据可视化、对比分析
 */
class ExecutionReportService {
  constructor() {
    this.templates = {
      simple: {
        id: 'simple',
        name: '简洁报告',
        description: '仅包含基本信息：执行状态、总耗时、节点数量',
        sections: ['header', 'summary', 'timeline', 'nodeList']
      },
      detailed: {
        id: 'detailed',
        name: '详细报告',
        description: '包含完整信息：变量变化、数据吞吐量、性能分析',
        sections: ['header', 'summary', 'timeline', 'nodeList', 'variables', 'throughput', 'performance']
      },
      comparison: {
        id: 'comparison',
        name: '对比报告',
        description: '对比两次执行的差异：性能对比、节点对比、变量对比',
        sections: ['header', 'comparisonSummary', 'sideBySide', 'performanceDiff', 'nodeDiff']
      }
    };
    this.favoriteTemplates = [];
    this.currentReport = null;
  }

  // ============ 报告生成 ============
  
  /**
   * 生成执行报告
   * @param {Object} executionRecord - 执行记录
   * @param {string} templateId - 模板ID
   * @returns {Object} 报告对象
   */
  generateReport(executionRecord, templateId = 'detailed') {
    const template = this.templates[templateId] || this.templates.detailed;
    const trace = executionRecord.trace || [];
    
    const report = {
      id: 'RPT-' + Date.now(),
      templateId: template.id,
      generatedAt: new Date().toISOString(),
      execution: {
        id: executionRecord.id,
        workflowName: executionRecord.workflowName,
        workflowId: executionRecord.workflowId,
        status: executionRecord.status,
        startTime: executionRecord.timestamp,
        endTime: executionRecord.timestamp + (executionRecord.totalDuration || 0),
        totalDuration: executionRecord.totalDuration || 0,
        progress: executionRecord.progress || 0
      },
      sections: {},
      charts: {},
      metadata: {
        version: '1.0',
        generator: 'ExecutionReportService v16'
      }
    };

    // 生成各部分内容
    if (template.sections.includes('summary')) {
      report.sections.summary = this.generateSummary(executionRecord, trace);
    }
    
    if (template.sections.includes('timeline')) {
      report.sections.timeline = this.generateTimeline(executionRecord, trace);
    }
    
    if (template.sections.includes('nodeList')) {
      report.sections.nodeList = this.generateNodeDetails(executionRecord, trace);
    }
    
    if (template.sections.includes('variables')) {
      report.sections.variables = this.generateVariableChanges(trace);
    }
    
    if (template.sections.includes('throughput')) {
      report.sections.throughput = this.generateThroughput(executionRecord, trace);
    }
    
    if (template.sections.includes('performance')) {
      report.sections.performance = this.generatePerformanceMetrics(executionRecord, trace);
    }

    // 生成图表数据
    report.charts = this.generateChartData(executionRecord, trace);

    this.currentReport = report;
    return report;
  }

  /**
   * 生成对比报告
   * @param {Object} record1 - 执行记录1
   * @param {Object} record2 - 执行记录2
   * @returns {Object} 对比报告
   */
  generateComparisonReport(record1, record2) {
    const report = {
      id: 'RPT-CMP-' + Date.now(),
      templateId: 'comparison',
      generatedAt: new Date().toISOString(),
      execution1: {
        id: record1.id,
        workflowName: record1.workflowName,
        status: record1.status,
        startTime: record1.timestamp,
        totalDuration: record1.totalDuration || 0
      },
      execution2: {
        id: record2.id,
        workflowName: record2.workflowName,
        status: record2.status,
        startTime: record2.timestamp,
        totalDuration: record2.totalDuration || 0
      },
      sections: {},
      charts: {}
    };

    // 生成对比摘要
    report.sections.comparisonSummary = {
      durationDiff: record2.totalDuration - record1.totalDuration,
      durationDiffPct: record1.totalDuration > 0 
        ? Math.round((record2.totalDuration - record1.totalDuration) / record1.totalDuration * 100) 
        : 0,
      status1: record1.status,
      status2: record2.status,
      sameResult: record1.status === record2.status
    };

    // 生成节点对比
    report.sections.nodeDiff = this.generateNodeDiff(record1, record2);

    // 生成性能对比
    report.sections.performanceDiff = this.generatePerformanceDiff(record1, record2);

    // 生成图表数据
    report.charts = {
      duration: this.generateComparisonChart(record1, record2, 'duration'),
      status: this.generateStatusComparisonChart(record1, record2)
    };

    return report;
  }

  // ============ 报告各部分生成 ============

  generateSummary(executionRecord, trace) {
    const trace1 = trace[0] || {};
    const traceLast = trace[trace.length - 1] || {};
    
    return {
      workflowName: executionRecord.workflowName || '未命名工作流',
      status: executionRecord.status || 'unknown',
      totalDuration: executionRecord.totalDuration || 0,
      totalDurationFormatted: this.formatDuration(executionRecord.totalDuration || 0),
      nodeCount: executionRecord.workflowData?.nodes?.length || 0,
      connectionCount: executionRecord.workflowData?.connections?.length || 0,
      executedNodes: trace.length,
      startTime: new Date(executionRecord.timestamp).toLocaleString('zh-CN'),
      endTime: new Date((executionRecord.timestamp || 0) + (executionRecord.totalDuration || 0)).toLocaleString('zh-CN'),
      successRate: executionRecord.status === 'completed' ? 100 : 0
    };
  }

  generateTimeline(executionRecord, trace) {
    const startTime = executionRecord.timestamp || Date.now();
    
    return trace.map((step, index) => {
      const relativeTime = step.timestamp - startTime;
      return {
        index: index + 1,
        nodeId: step.nodeId,
        nodeName: step.nodeName || step.nodeId,
        status: step.status,
        duration: index > 0 ? step.timestamp - (trace[index - 1].timestamp || startTime) : 0,
        relativeTime: relativeTime,
        relativeTimeFormatted: this.formatDuration(relativeTime),
        timestamp: new Date(step.timestamp).toLocaleTimeString('zh-CN'),
        output: step.output ? (step.output.success ? '成功' : '失败') : '-'
      };
    });
  }

  generateNodeDetails(executionRecord, trace) {
    const nodes = executionRecord.workflowData?.nodes || [];
    
    return nodes.map(node => {
      const nodeTrace = trace.filter(s => s.nodeId === node.id);
      const totalDuration = nodeTrace.reduce((sum, t) => sum + (t.duration || 0), 0);
      
      return {
        id: node.id,
        name: node.name || node.subtype,
        type: node.type,
        subtype: node.subtype,
        status: nodeTrace.length > 0 ? nodeTrace[nodeTrace.length - 1].status : 'pending',
        executionCount: nodeTrace.length,
        totalDuration: totalDuration,
        avgDuration: nodeTrace.length > 0 ? Math.round(totalDuration / nodeTrace.length) : 0,
        variables: this.extractNodeVariables(nodeTrace)
      };
    });
  }

  generateVariableChanges(trace) {
    const variableMap = {};
    
    trace.forEach((step, index) => {
      if (step.variables) {
        Object.entries(step.variables).forEach(([key, value]) => {
          if (!variableMap[key]) {
            variableMap[key] = [];
          }
          variableMap[key].push({
            stepIndex: index + 1,
            nodeId: step.nodeId,
            value: value,
            timestamp: step.timestamp
          });
        });
      }
    });
    
    return Object.entries(variableMap).map(([name, changes]) => ({
      name,
      type: this.inferVariableType(changes[changes.length - 1]?.value),
      changes: changes
    }));
  }

  generateThroughput(executionRecord, trace) {
    const startTime = executionRecord.timestamp || Date.now();
    const endTime = startTime + (executionRecord.totalDuration || 0);
    const duration = executionRecord.totalDuration || 1;
    
    // 计算吞吐量（节点/秒）
    const nodesPerSecond = (trace.length / duration) * 1000;
    
    // 按时间段统计
    const bucketCount = 10;
    const bucketDuration = duration / bucketCount;
    const buckets = [];
    
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = startTime + i * bucketDuration;
      const bucketEnd = bucketStart + bucketDuration;
      const bucketNodes = trace.filter(s => s.timestamp >= bucketStart && s.timestamp < bucketEnd);
      buckets.push({
        label: `${Math.round((i / bucketCount) * 100)}%`,
        count: bucketNodes.length,
        duration: bucketDuration
      });
    }
    
    return {
      totalNodes: trace.length,
      duration: duration,
      nodesPerSecond: nodesPerSecond.toFixed(3),
      buckets: buckets,
      maxConcurrent: this.calculateMaxConcurrent(trace, startTime, duration)
    };
  }

  generatePerformanceMetrics(executionRecord, trace) {
    if (trace.length === 0) {
      return {
        avgNodeDuration: 0,
        fastestNode: null,
        slowestNode: null,
        nodeDurations: []
      };
    }

    const nodeDurations = {};
    trace.forEach(step => {
      if (!nodeDurations[step.nodeId]) {
        nodeDurations[step.nodeId] = { total: 0, count: 0, name: step.nodeName };
      }
      nodeDurations[step.nodeId].total += step.duration || 0;
      nodeDurations[step.nodeId].count += 1;
    });

    const durationList = Object.entries(nodeDurations).map(([id, data]) => ({
      nodeId: id,
      nodeName: data.name || id,
      avgDuration: Math.round(data.total / data.count),
      totalDuration: data.total,
      count: data.count
    })).sort((a, b) => b.avgDuration - a.avgDuration);

    return {
      avgNodeDuration: Math.round(durationList.reduce((sum, n) => sum + n.avgDuration, 0) / durationList.length),
      fastestNode: durationList[durationList.length - 1],
      slowestNode: durationList[0],
      nodeDurations: durationList
    };
  }

  // ============ 对比报告各部分生成 ============

  generateNodeDiff(record1, record2) {
    const nodes1 = record1.workflowData?.nodes || [];
    const nodes2 = record2.workflowData?.nodes || [];
    const trace1 = record1.trace || [];
    const trace2 = record2.trace || [];

    const diff = {
      added: [],
      removed: [],
      changed: []
    };

    const nodeMap1 = new Map(nodes1.map(n => [n.id, n]));
    const nodeMap2 = new Map(nodes2.map(n => [n.id, n]));

    // 找出新增的节点
    nodes2.forEach(node => {
      if (!nodeMap1.has(node.id)) {
        diff.added.push({ id: node.id, name: node.name, type: node.type });
      }
    });

    // 找出移除的节点
    nodes1.forEach(node => {
      if (!nodeMap2.has(node.id)) {
        diff.removed.push({ id: node.id, name: node.name, type: node.type });
      }
    });

    // 找出改变的节点
    nodes1.forEach(node1 => {
      const node2 = nodeMap2.get(node1.id);
      if (node2) {
        const trace1Nodes = trace1.filter(t => t.nodeId === node1.id);
        const trace2Nodes = trace2.filter(t => t.nodeId === node2.id);
        const duration1 = trace1Nodes.reduce((s, t) => s + (t.duration || 0), 0);
        const duration2 = trace2Nodes.reduce((s, t) => s + (t.duration || 0), 0);
        
        if (duration1 !== duration2 || node1.config?.description !== node2.config?.description) {
          diff.changed.push({
            id: node1.id,
            name: node1.name,
            duration1,
            duration2,
            durationDiff: duration2 - duration1
          });
        }
      }
    });

    return diff;
  }

  generatePerformanceDiff(record1, record2) {
    const trace1 = record1.trace || [];
    const trace2 = record2.trace || [];

    return {
      totalDuration1: record1.totalDuration || 0,
      totalDuration2: record2.totalDuration || 0,
      durationDiff: (record2.totalDuration || 0) - (record1.totalDuration || 0),
      nodesCount1: trace1.length,
      nodesCount2: trace2.length,
      nodesDiff: trace2.length - trace1.length,
      status1: record1.status,
      status2: record2.status
    };
  }

  // ============ 图表数据生成 ============

  generateChartData(executionRecord, trace) {
    return {
      executionTime: this.generateExecutionTimeChart(trace, executionRecord.timestamp),
      successRate: this.generateSuccessRateChart(trace),
      trends: this.generateTrendsChart(executionRecord),
      nodeDuration: this.generateNodeDurationChart(trace),
      throughput: this.generateThroughputChart(executionRecord, trace)
    };
  }

  generateExecutionTimeChart(trace, startTime) {
    const data = trace.map((step, i) => ({
      label: `Step ${i + 1}`,
      value: step.timestamp - (startTime || 0),
      formatted: this.formatDuration(step.timestamp - (startTime || 0))
    }));
    
    return {
      type: 'line',
      title: '执行时间线',
      data,
      maxValue: Math.max(...data.map(d => d.value), 1)
    };
  }

  generateSuccessRateChart(trace) {
    const completed = trace.filter(s => s.status === 'completed').length;
    const failed = trace.filter(s => s.status === 'error').length;
    const total = trace.length || 1;
    
    return {
      type: 'pie',
      title: '执行状态分布',
      data: [
        { label: '成功', value: completed, color: '#10B981' },
        { label: '失败', value: failed, color: '#EF4444' },
        { label: '待执行', value: Math.max(0, total - completed - failed), color: '#6B7280' }
      ],
      total: total
    };
  }

  generateTrendsChart(executionRecord) {
    // 从历史记录中获取趋势数据
    return {
      type: 'bar',
      title: '执行耗时趋势',
      data: [
        { label: '本次', value: executionRecord.totalDuration || 0, formatted: this.formatDuration(executionRecord.totalDuration || 0) }
      ],
      maxValue: Math.max(executionRecord.totalDuration || 1, 1)
    };
  }

  generateNodeDurationChart(trace) {
    const nodeDurations = {};
    trace.forEach(step => {
      if (!nodeDurations[step.nodeName || step.nodeId]) {
        nodeDurations[step.nodeName || step.nodeId] = 0;
      }
      nodeDurations[step.nodeName || step.nodeId] += step.duration || 0;
    });

    const data = Object.entries(nodeDurations)
      .map(([label, value]) => ({ label, value, formatted: this.formatDuration(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      type: 'bar',
      title: '节点耗时分布',
      data,
      maxValue: Math.max(...data.map(d => d.value), 1)
    };
  }

  generateThroughputChart(executionRecord, trace) {
    const duration = executionRecord.totalDuration || 1;
    const bucketCount = 5;
    const bucketSize = duration / bucketCount;
    const startTime = executionRecord.timestamp || Date.now();

    const data = [];
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = startTime + i * bucketSize;
      const bucketEnd = bucketStart + bucketSize;
      const count = trace.filter(s => s.timestamp >= bucketStart && s.timestamp < bucketEnd).length;
      data.push({
        label: `${Math.round((i / bucketCount) * 100)}%`,
        value: count
      });
    }

    return {
      type: 'bar',
      title: '吞吐量分布',
      data,
      maxValue: Math.max(...data.map(d => d.value), 1)
    };
  }

  generateComparisonChart(record1, record2, metric) {
    const value1 = metric === 'duration' ? record1.totalDuration : 0;
    const value2 = metric === 'duration' ? record2.totalDuration : 0;

    return {
      type: 'bar',
      title: '执行耗时对比',
      data: [
        { label: '执行1', value: value1, formatted: this.formatDuration(value1), color: '#6366F1' },
        { label: '执行2', value: value2, formatted: this.formatDuration(value2), color: '#10B981' }
      ],
      maxValue: Math.max(value1, value2, 1)
    };
  }

  generateStatusComparisonChart(record1, record2) {
    return {
      type: 'pie',
      title: '执行状态对比',
      data: [
        { label: `${record1.status || 'unknown'}`, value: 1, color: record1.status === 'completed' ? '#10B981' : '#EF4444' },
        { label: `${record2.status || 'unknown'}`, value: 1, color: record2.status === 'completed' ? '#10B981' : '#EF4444' }
      ]
    };
  }

  // ============ 导出功能 ============

  /**
   * 导出为HTML
   * @param {Object} report - 报告对象
   * @param {Object} options - 导出选项
   * @returns {string} HTML字符串
   */
  exportToHTML(report, options = {}) {
    const template = options.template || 'detailed';
    const includeStyles = options.includeStyles !== false;
    
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>执行报告 - ${report.execution.workflowName}</title>
  ${includeStyles ? this.getReportStyles() : ''}
</head>
<body>
  <div class="report-container">
    <header class="report-header">
      <h1>${report.execution.workflowName}</h1>
      <div class="report-meta">
        <span>报告ID: ${report.id}</span>
        <span>生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}</span>
        <span>模板: ${this.templates[report.templateId]?.name || '详细报告'}</span>
      </div>
    </header>`;

    // 生成各部分HTML
    if (report.sections.summary) {
      html += this.renderSummaryHTML(report.sections.summary);
    }
    
    if (report.sections.timeline) {
      html += this.renderTimelineHTML(report.sections.timeline);
    }
    
    if (report.sections.nodeList) {
      html += this.renderNodeListHTML(report.sections.nodeList);
    }
    
    if (report.sections.variables) {
      html += this.renderVariablesHTML(report.sections.variables);
    }

    // 渲染图表
    if (report.charts) {
      html += this.renderChartsHTML(report.charts);
    }

    html += `</div></body></html>`;
    return html;
  }

  /**
   * 导出为JSON
   * @param {Object} report - 报告对象
   * @returns {string} JSON字符串
   */
  exportToJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  /**
   * 导出为PDF（通过浏览器打印）
   * @param {Object} report - 报告对象
   * @param {Object} options - 导出选项
   */
  exportToPDF(report, options = {}) {
    const html = this.exportToHTML(report, options);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  /**
   * 下载文件
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============ 报告渲染HTML ============

  renderSummaryHTML(summary) {
    const statusColor = summary.status === 'completed' ? '#10B981' : '#EF4444';
    const statusText = summary.status === 'completed' ? '成功' : '失败';
    
    return `
    <section class="report-section summary">
      <h2>执行摘要</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <label>工作流名称</label>
          <value>${summary.workflowName}</value>
        </div>
        <div class="summary-item">
          <label>执行状态</label>
          <value class="status-badge" style="color:${statusColor}">${statusText}</value>
        </div>
        <div class="summary-item">
          <label>总耗时</label>
          <value>${summary.totalDurationFormatted}</value>
        </div>
        <div class="summary-item">
          <label>节点数量</label>
          <value>${summary.nodeCount}</value>
        </div>
        <div class="summary-item">
          <label>已执行节点</label>
          <value>${summary.executedNodes}</value>
        </div>
        <div class="summary-item">
          <label>开始时间</label>
          <value>${summary.startTime}</value>
        </div>
        <div class="summary-item">
          <label>结束时间</label>
          <value>${summary.endTime}</value>
        </div>
        <div class="summary-item">
          <label>成功率</label>
          <value>${summary.successRate}%</value>
        </div>
      </div>
    </section>`;
  }

  renderTimelineHTML(timeline) {
    let rows = timeline.map(step => `
      <tr>
        <td>${step.index}</td>
        <td>${step.nodeName}</td>
        <td><span class="status-${step.status}">${step.status === 'completed' ? '✓ 成功' : step.status === 'error' ? '✗ 失败' : '○ 待执行'}</span></td>
        <td>${step.relativeTimeFormatted}</td>
        <td>${step.timestamp}</td>
        <td>${step.output}</td>
      </tr>
    `).join('');

    return `
    <section class="report-section timeline">
      <h2>执行时间线</h2>
      <table class="timeline-table">
        <thead>
          <tr>
            <th>#</th>
            <th>节点</th>
            <th>状态</th>
            <th>相对时间</th>
            <th>时间戳</th>
            <th>输出</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  renderNodeListHTML(nodeList) {
    let rows = nodeList.map(node => `
      <tr>
        <td>${node.name}</td>
        <td>${node.type}</td>
        <td>${node.subtype}</td>
        <td><span class="status-${node.status}">${node.status}</span></td>
        <td>${node.executionCount}</td>
        <td>${this.formatDuration(node.totalDuration)}</td>
        <td>${this.formatDuration(node.avgDuration)}</td>
      </tr>
    `).join('');

    return `
    <section class="report-section node-list">
      <h2>节点详情</h2>
      <table class="node-table">
        <thead>
          <tr>
            <th>节点名称</th>
            <th>类型</th>
            <th>子类型</th>
            <th>状态</th>
            <th>执行次数</th>
            <th>总耗时</th>
            <th>平均耗时</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  renderVariablesHTML(variables) {
    let rows = variables.map(v => `
      <tr>
        <td>${v.name}</td>
        <td>${v.type}</td>
        <td>${v.changes.length}</td>
        <td>${JSON.stringify(v.changes[v.changes.length - 1]?.value)}</td>
      </tr>
    `).join('');

    return `
    <section class="report-section variables">
      <h2>变量变化</h2>
      <table class="variable-table">
        <thead>
          <tr>
            <th>变量名</th>
            <th>类型</th>
            <th>变化次数</th>
            <th>最终值</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  renderChartsHTML(charts) {
    let html = `<section class="report-section charts"><h2>数据可视化</h2><div class="charts-grid">`;

    if (charts.executionTime) {
      html += `<div class="chart-container">${this.renderLineChart(charts.executionTime)}</div>`;
    }
    if (charts.successRate) {
      html += `<div class="chart-container">${this.renderPieChart(charts.successRate)}</div>`;
    }
    if (charts.nodeDuration) {
      html += `<div class="chart-container">${this.renderBarChart(charts.nodeDuration)}</div>`;
    }
    if (charts.throughput) {
      html += `<div class="chart-container">${this.renderBarChart(charts.throughput)}</div>`;
    }

    html += `</div></section>`;
    return html;
  }

  // ============ 纯CSS/DOM图表渲染 ============

  renderBarChart(chartData) {
    const maxValue = chartData.maxValue || 1;
    let bars = chartData.data.map(d => {
      const heightPct = Math.max((d.value / maxValue) * 100, 2);
      return `<div class="chart-bar-wrapper">
        <div class="chart-bar" style="height:${heightPct}%" title="${d.label}: ${d.formatted || d.value}">
          <span class="chart-bar-value">${d.formatted || d.value}</span>
        </div>
        <div class="chart-bar-label">${d.label}</div>
      </div>`;
    }).join('');

    return `
    <div class="chart" data-type="bar">
      <h3>${chartData.title}</h3>
      <div class="chart-bars">${bars}</div>
    </div>`;
  }

  renderPieChart(chartData) {
    let slices = '';
    let total = chartData.data.reduce((sum, d) => sum + d.value, 0) || 1;
    let currentAngle = 0;

    chartData.data.forEach(d => {
      const percentage = (d.value / total) * 100;
      const angle = (percentage / 100) * 360;
      slices += `<div class="chart-slice" style="--start-angle:${currentAngle}deg;--end-angle:${currentAngle + angle}deg;--color:${d.color}" title="${d.label}: ${d.value} (${percentage.toFixed(1)}%)"></div>`;
      currentAngle += angle;
    });

    return `
    <div class="chart" data-type="pie">
      <h3>${chartData.title}</h3>
      <div class="chart-pie-container">
        <div class="chart-pie">${slices}</div>
        <div class="chart-legend">
          ${chartData.data.map(d => `<div class="legend-item"><span class="legend-color" style="background:${d.color}"></span>${d.label}: ${d.value}</div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  renderLineChart(chartData) {
    const maxValue = chartData.maxValue || 1;
    const points = chartData.data.map((d, i) => {
      const x = (i / Math.max(chartData.data.length - 1, 1)) * 100;
      const y = 100 - (d.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    let dots = chartData.data.map((d, i) => {
      const x = (i / Math.max(chartData.data.length - 1, 1)) * 100;
      const y = 100 - (d.value / maxValue) * 100;
      return `<circle cx="${x}%" cy="${y}%" r="3" title="${d.label}: ${d.formatted || d.value}"></circle>`;
    }).join('');

    return `
    <div class="chart" data-type="line">
      <h3>${chartData.title}</h3>
      <div class="chart-line-container">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="chart-line-svg">
          <polyline points="${points}" class="chart-line-path"></polyline>
          ${dots}
        </svg>
      </div>
      <div class="chart-x-labels">
        ${chartData.data.map(d => `<span>${d.label}</span>`).join('')}
      </div>
    </div>`;
  }

  getReportStyles() {
    return `<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Noto Sans SC', -apple-system, sans-serif; background: #0F0F1A; color: #E0E0FF; line-height: 1.6; }
    .report-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .report-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333355; }
    .report-header h1 { color: #6366F1; font-size: 28px; margin-bottom: 10px; }
    .report-meta { display: flex; justify-content: center; gap: 20px; font-size: 13px; color: #8888AA; flex-wrap: wrap; }
    .report-section { margin-bottom: 40px; background: #1A1A2E; border-radius: 12px; padding: 24px; }
    .report-section h2 { color: #6366F1; font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #333355; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .summary-item { background: #252542; padding: 12px 16px; border-radius: 8px; }
    .summary-item label { display: block; font-size: 11px; color: #8888AA; text-transform: uppercase; margin-bottom: 4px; }
    .summary-item value { font-size: 16px; font-weight: 600; }
    .status-badge { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #333355; }
    th { background: #252542; color: #8888AA; font-size: 11px; text-transform: uppercase; font-weight: 600; }
    tr:hover { background: rgba(99, 102, 241, 0.1); }
    .status-completed { color: #10B981; }
    .status-error { color: #EF4444; }
    .status-pending { color: #6B7280; }
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .chart { background: #252542; border-radius: 8px; padding: 16px; }
    .chart h3 { font-size: 14px; color: #E0E0FF; margin-bottom: 16px; text-align: center; }
    .chart-bars { display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding-top: 20px; }
    .chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 60px; }
    .chart-bar { width: 100%; background: linear-gradient(180deg, #6366F1, #4F46E5); border-radius: 4px 4px 0 0; position: relative; min-height: 4px; transition: height 0.3s; }
    .chart-bar-value { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #8888AA; white-space: nowrap; }
    .chart-bar-label { font-size: 10px; color: #8888AA; margin-top: 8px; text-align: center; }
    .chart-pie-container { display: flex; align-items: center; justify-content: center; gap: 24px; }
    .chart-pie { width: 150px; height: 150px; border-radius: 50%; position: relative; background: conic-gradient(var(--start-angle), var(--end-angle), var(--start-angle)); }
    .chart-slice { position: absolute; inset: 0; border-radius: 50%; }
    .chart-legend { display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .legend-color { width: 12px; height: 12px; border-radius: 2px; }
    .chart-line-container { height: 200px; }
    .chart-line-svg { width: 100%; height: 100%; }
    .chart-line-path { fill: none; stroke: #6366F1; stroke-width: 2; }
    .chart-x-labels { display: flex; justify-content: space-between; padding: 8px 0; font-size: 10px; color: #8888AA; }
    @media print { body { background: white; color: black; } .report-section { background: white; border: 1px solid #ddd; } }
    </style>`;
  }

  // ============ 辅助函数 ============

  formatDuration(ms) {
    if (!ms || ms < 0) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  inferVariableType(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }

  extractNodeVariables(trace) {
    const vars = {};
    trace.forEach(step => {
      if (step.variables) {
        Object.keys(step.variables).forEach(k => {
          if (!vars[k]) vars[k] = step.variables[k];
        });
      }
    });
    return vars;
  }

  calculateMaxConcurrent(trace, startTime, duration) {
    let maxConcurrent = 0;
    for (let t = 0; t < duration; t += 100) {
      const current = trace.filter(s => {
        const stepStart = s.timestamp - startTime;
        const stepEnd = stepStart + (s.duration || 0);
        return stepStart <= t && t <= stepEnd;
      }).length;
      maxConcurrent = Math.max(maxConcurrent, current);
    }
    return maxConcurrent;
  }

  // ============ 模板管理 ============

  getTemplates() {
    return Object.values(this.templates);
  }

  getTemplateById(id) {
    return this.templates[id] || null;
  }

  saveAsFavorite(templateId, name) {
    if (!this.favoriteTemplates.find(f => f.templateId === templateId)) {
      this.favoriteTemplates.push({ templateId, name, createdAt: Date.now() });
    }
  }

  getFavorites() {
    return [...this.favoriteTemplates];
  }

  removeFavorite(templateId) {
    this.favoriteTemplates = this.favoriteTemplates.filter(f => f.templateId !== templateId);
  }
}

// 导出
window.ExecutionReportService = ExecutionReportService;

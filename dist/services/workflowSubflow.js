/**
 * Workflow Subflow Service
 * 子流程调用服务 - 调用其他工作流作为子流程
 */
const WorkflowSubflow = {
  maxDepth: 3, // 最大嵌套深度
  currentDepth: 0,

  // 调用子流程
  async execute(subflowNode, context, executor) {
    const { workflowId, inputMapping = {}, outputMapping = {} } = subflowNode.config;

    if (this.currentDepth >= this.maxDepth) {
      WorkflowLogger.error(`[子流程] 超出最大嵌套深度 ${this.maxDepth}`, subflowNode.id);
      return { success: false, error: 'Max subflow depth exceeded' };
    }

    this.currentDepth++;
    WorkflowLogger.info(`[子流程] 调用工作流 ${workflowId}（深度 ${this.currentDepth}/${this.maxDepth}）`, subflowNode.id);

    try {
      // 加载子流程
      const subWorkflow = await this.loadSubflow(workflowId);
      if (!subWorkflow) {
        throw new Error(`子流程 ${workflowId} 未找到`);
      }

      // 输入映射
      const subContext = this.mapInputs(inputMapping, context);

      // 准备子流程节点
      const nodeMap = {};
      subWorkflow.nodes.forEach(n => nodeMap[n.id] = n);

      // 执行子流程（简化版：只执行到第一个输出节点）
      const result = await this.executeSubWorkflow(subWorkflow, subContext, executor);

      // 输出映射
      const output = this.mapOutputs(outputMapping, result);

      this.currentDepth--;
      WorkflowLogger.success(`[子流程] ${workflowId} 完成`, subflowNode.id);

      return { success: true, output };
    } catch (error) {
      this.currentDepth--;
      WorkflowLogger.error(`[子流程] ${workflowId} 执行失败: ${error.message}`, subflowNode.id);
      return { success: false, error: error.message };
    }
  },

  // 执行子流程
  async executeSubWorkflow(workflow, context, executor) {
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      throw new Error('子流程缺少触发节点');
    }

    const nodeMap = {};
    workflow.nodes.forEach(n => nodeMap[n.id] = n);

    // BFS 执行
    const queue = [{ nodeId: triggerNode.id }];
    const visited = new Set();
    const outputs = {};

    while (queue.length > 0) {
      const { nodeId } = queue.shift();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap[nodeId];
      if (!node) continue;

      // 执行节点
      const execResult = await executor(node, context);
      outputs[nodeId] = execResult;

      // 收集下一节点
      const outConns = workflow.connections.filter(c => c.from === nodeId);
      for (const conn of outConns) {
        queue.push({ nodeId: conn.to });
      }
    }

    return outputs;
  },

  // 加载子流程
  async loadSubflow(workflowId) {
    // 优先从版本管理器加载
    const versions = WorkflowVersionManager.getVersions();
    const version = versions.find(v => v.id === workflowId);
    if (version) return version.workflow;

    // 从存储加载
    return await WorkflowStorage.load(workflowId);
  },

  // 输入映射
  mapInputs(mapping, context) {
    const result = {};
    for (const [key, value] of Object.entries(mapping)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // 引用上下文变量
        const varName = value.slice(1);
        result[key] = context[varName];
      } else {
        result[key] = value;
      }
    }
    return result;
  },

  // 输出映射
  mapOutputs(mapping, outputs) {
    const result = {};
    for (const [key, value] of Object.entries(mapping)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // 引用输出节点的结果
        const nodeId = value.slice(1);
        result[key] = outputs[nodeId]?.output || outputs[nodeId];
      } else {
        result[key] = value;
      }
    }
    return result;
  },

  // 获取可用的子流程列表
  async getAvailableSubflows() {
    const templates = await WorkflowStorage.list();
    const versions = WorkflowVersionManager.getVersions();
    return [
      ...templates.map(t => ({ id: t.id, name: t.name, type: 'template' })),
      ...versions.map(v => ({ id: v.id, name: v.name, type: 'version' }))
    ];
  },

  // 导入工作流 JSON
  importWorkflow(jsonString) {
    try {
      const workflow = JSON.parse(jsonString);
      
      // 验证必需字段
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        throw new Error('无效的工作流格式：缺少 nodes 数组');
      }
      if (!workflow.connections || !Array.isArray(workflow.connections)) {
        workflow.connections = [];
      }

      // 清理 ID（避免冲突）
      const idMap = {};
      workflow.nodes = workflow.nodes.map(node => {
        const newId = 'n' + Date.now() + Math.random().toString(36).slice(2, 6);
        idMap[node.id] = newId;
        return { ...node, id: newId };
      });

      // 更新连接引用
      workflow.connections = workflow.connections.map(conn => ({
        ...conn,
        from: idMap[conn.from] || conn.from,
        to: idMap[conn.to] || conn.to
      }));

      return { success: true, workflow };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 导出工作流 JSON
  exportWorkflow(workflow) {
    return JSON.stringify(workflow, null, 2);
  },

  // 下载工作流文件
  downloadWorkflow(workflow, filename = 'workflow.json') {
    const json = this.exportWorkflow(workflow);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
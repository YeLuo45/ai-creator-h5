/**
 * Workflow Execution Engine
 * 工作流执行引擎 - 支持单步执行、暂停、运行
 */
const WorkflowEngine = {
  isRunning: false,
  isPaused: false,
  currentNodeId: null,
  subscribers: [],
  
  // 节点执行器映射
  executors: {
    manual: async (node, context) => {
      this.log(`[触发] 手动触发`);
      return { success: true };
    },
    character: async (node, context) => {
      this.log(`[创作] 角色生成: ${node.config.description || '随机角色'}`);
      await this.delay(1500);
      return { success: true, output: { characterId: 'char-' + Date.now() } };
    },
    music: async (node, context) => {
      this.log(`[创作] 配乐生成: ${node.config.mood || '欢快'}`);
      await this.delay(2000);
      return { success: true, output: { musicId: 'music-' + Date.now() } };
    },
    tts: async (node, context) => {
      this.log(`[创作] 配音生成: ${node.config.voice || '女声'}`);
      await this.delay(1500);
      return { success: true, output: { ttsId: 'tts-' + Date.now() } };
    },
    poster: async (node, context) => {
      this.log(`[创作] 海报生成`);
      await this.delay(1000);
      return { success: true, output: { posterId: 'poster-' + Date.now() } };
    },
    loop: async (node, context) => {
      const count = node.config.count || 3;
      this.log(`[逻辑] 循环执行 ${count} 次`);
      return { success: true, output: { loopCount: count } };
    },
    condition: async (node, context) => {
      const { field, operator, value } = node.config;
      this.log(`[逻辑] 条件判断: ${field} ${operator} ${value}`);
      return { success: true, output: { branch: value === 'video' ? 'true' : 'false' } };
    },
    save: async (node, context) => {
      this.log(`[输出] 保存到本地`);
      return { success: true };
    },
    share: async (node, context) => {
      this.log(`[输出] 分享`);
      return { success: true };
    }
  },

  // 订阅状态变化
  subscribe(callback) {
    this.subscribers.push(callback);
  },

  // 发布状态变化
  publish(event, data) {
    this.subscribers.forEach(cb => cb(event, data));
  },

  // 日志
  log(message) {
    console.log(`[Workflow] ${message}`);
    this.publish('log', { message, timestamp: Date.now() });
  },

  // 延迟
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 获取节点出边
  getOutConnections(nodeId, connections) {
    return connections.filter(c => c.from === nodeId);
  },

  // 执行工作流
  async run(workflow) {
    if (this.isRunning) {
      this.log('已有工作流在执行中');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.publish('status', { running: true, paused: false });
    this.log(`开始执行工作流: ${workflow.name}`);

    try {
      // 找到触发节点
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('未找到触发节点');
      }

      // 构建节点映射
      const nodeMap = {};
      workflow.nodes.forEach(n => nodeMap[n.id] = n);

      // BFS 执行
      const queue = [{ nodeId: triggerNode.id, depth: 0 }];
      const visited = new Set();
      const outputs = {};

      while (queue.length > 0 && this.isRunning) {
        // 暂停检查
        while (this.isPaused && this.isRunning) {
          await this.delay(100);
        }
        
        if (!this.isRunning) break;

        const { nodeId } = queue.shift();
        
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = nodeMap[nodeId];
        if (!node) continue;

        this.currentNodeId = nodeId;
        this.publish('nodeStart', { nodeId, node });
        this.log(`执行节点: ${node.type} - ${node.subtype}`);

        // 执行节点
        const executor = this.executors[node.subtype];
        if (!executor) {
          this.log(`未知的节点类型: ${node.subtype}`);
          outputs[nodeId] = { success: false };
          continue;
        }

        const result = await executor(node, { outputs });
        outputs[nodeId] = result;

        this.publish('nodeComplete', { nodeId, result });
        this.log(`节点完成: ${node.subtype} -> ${result.success ? '成功' : '失败'}`);

        // 收集下一个节点
        const outConns = this.getOutConnections(nodeId, workflow.connections);
        
        for (const conn of outConns) {
          // 条件分支逻辑
          if (node.type === 'logic' && node.subtype === 'condition') {
            const branch = result.output?.branch || 'false';
            if (conn.fromPort === 'true' && branch !== 'true') continue;
            if (conn.fromPort === 'false' && branch !== 'false') continue;
          }
          
          if (node.type === 'logic' && node.subtype === 'loop') {
            // 循环：只执行一次，后续由输出反馈实现
          }

          queue.push({ nodeId: conn.to, depth: 0 });
        }
      }

      this.log('工作流执行完成');
      this.publish('complete', { outputs });
    } catch (error) {
      this.log(`执行错误: ${error.message}`);
      this.publish('error', { error: error.message });
    } finally {
      this.isRunning = false;
      this.isPaused = false;
      this.currentNodeId = null;
      this.publish('status', { running: false, paused: false });
    }
  },

  // 暂停
  pause() {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.publish('status', { running: true, paused: true });
    this.log('已暂停');
  },

  // 恢复
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.publish('status', { running: true, paused: false });
    this.log('已恢复');
  },

  // 停止
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentNodeId = null;
    this.publish('status', { running: false, paused: false });
    this.log('已停止');
  }
};
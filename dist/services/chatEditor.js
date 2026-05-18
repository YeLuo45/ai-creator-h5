/**
 * Chat Editor Service
 * 对话式编辑服务 - 通过自然语言命令编辑工作流
 */

class ChatEditor {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * Process user command
   * @param {string} message - User message
   * @returns {Object} { success, message, changes }
   */
  processCommand(message) {
    const parsed = this.parseCommand(message);
    
    if (!parsed.action) {
      return {
        success: false,
        message: '无法理解命令，请尝试以下格式：\n• "在XXX前添加YYY节点"\n• "删除第N个节点"\n• "把XXX的名称改成YYY"',
        changes: null
      };
    }

    try {
      const result = this.executeAction(parsed.action, parsed.params);
      this.addHistory(message, result.message);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: '执行出错: ' + error.message,
        changes: null
      };
      this.addHistory(message, errorResult.message);
      return errorResult;
    }
  }

  /**
   * Parse command into action and params
   */
  parseCommand(message) {
    const msg = message.trim();
    
    // "在XXX前添加YYY节点"
    const addBeforeMatch = msg.match(/在(.+?)前添加(.+?)节点/);
    if (addBeforeMatch) {
      return { action: 'addBefore', params: { reference: addBeforeMatch[1], nodeType: addBeforeMatch[2] } };
    }

    // "在XXX后添加YYY节点"
    const addAfterMatch = msg.match(/在(.+?)后添加(.+?)节点/);
    if (addAfterMatch) {
      return { action: 'addAfter', params: { reference: addAfterMatch[1], nodeType: addAfterMatch[2] } };
    }

    // "删除第N个节点"
    const deleteIndexMatch = msg.match(/删除第(\d+)个节点/);
    if (deleteIndexMatch) {
      return { action: 'deleteByIndex', params: { index: parseInt(deleteIndexMatch[1]) - 1 } };
    }

    // "删除XXX节点"
    const deleteMatch = msg.match(/删除(.+?)节点/);
    if (deleteMatch) {
      return { action: 'deleteByName', params: { name: deleteMatch[1] } };
    }

    // "把XXX的名称改成YYY"
    const renameMatch = msg.match(/把(.+?)的名称改成(.+)/);
    if (renameMatch) {
      return { action: 'rename', params: { oldName: renameMatch[1], newName: renameMatch[2] } };
    }

    // "在节点A和B之间插入XXX"
    const insertMatch = msg.match(/在(.+?)和(.+?)之间插入(.+)/);
    if (insertMatch) {
      return { action: 'insertBetween', params: { nodeA: insertMatch[1], nodeB: insertMatch[2], nodeType: insertMatch[3] } };
    }

    // "将整个工作流保存为模板"
    if (msg.includes('保存为模板') || msg.includes('另存为模板')) {
      return { action: 'saveAsTemplate', params: {} };
    }

    // "显示工作流结构"
    if (msg.includes('显示结构') || msg.includes('工作流结构')) {
      return { action: 'showStructure', params: {} };
    }

    // "撤销"
    if (msg === '撤销' || msg === 'undo') {
      return { action: 'undo', params: {} };
    }

    // "重做"
    if (msg === '重做' || msg === 'redo') {
      return { action: 'redo', params: {} };
    }

    return { action: null, params: {} };
  }

  /**
   * Execute action with params
   */
  executeAction(action, params) {
    switch (action) {
      case 'addBefore':
        return this.addNodeBefore(params.reference, params.nodeType);
      
      case 'addAfter':
        return this.addNodeAfter(params.reference, params.nodeType);
      
      case 'deleteByIndex':
        return this.deleteNodeByIndex(params.index);
      
      case 'deleteByName':
        return this.deleteNodeByName(params.name);
      
      case 'rename':
        return this.renameNode(params.oldName, params.newName);
      
      case 'insertBetween':
        return this.insertBetween(params.nodeA, params.nodeB, params.nodeType);
      
      case 'saveAsTemplate':
        return this.saveAsTemplate();
      
      case 'showStructure':
        return this.showStructure();
      
      case 'undo':
        return this.performUndo();
      
      case 'redo':
        return this.performRedo();
      
      default:
        return { success: false, message: '未知命令: ' + action, changes: null };
    }
  }

  /**
   * Add node before reference node
   */
  addNodeBefore(reference, nodeType) {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    const refNode = this.findNodeByName(workflow, reference);
    if (!refNode) {
      return { success: false, message: `未找到节点: ${reference}`, changes: null };
    }

    const nodeTypeMap = {
      '角色': { type: 'creator', subtype: 'character' },
      '配乐': { type: 'creator', subtype: 'music' },
      '配音': { type: 'creator', subtype: 'tts' },
      '海报': { type: 'creator', subtype: 'poster' },
      '循环': { type: 'loop', subtype: 'forLoop' },
      '条件': { type: 'logic', subtype: 'condition' },
      '保存': { type: 'output', subtype: 'save' },
      '分享': { type: 'output', subtype: 'share' }
    };

    const nodeDef = nodeTypeMap[nodeType] || { type: 'creator', subtype: 'character' };
    const newNode = {
      id: 'n' + Date.now(),
      type: nodeDef.type,
      subtype: nodeDef.subtype,
      x: refNode.x - 180,
      y: refNode.y,
      config: {}
    };

    workflow.nodes.push(newNode);
    
    // Reorder connections
    this.insertConnection(workflow, newNode.id, refNode.id, 'before');

    return {
      success: true,
      message: `已在 ${reference} 前添加 ${nodeType} 节点`,
      changes: { addedNode: newNode }
    };
  }

  /**
   * Add node after reference node
   */
  addNodeAfter(reference, nodeType) {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    const refNode = this.findNodeByName(workflow, reference);
    if (!refNode) {
      return { success: false, message: `未找到节点: ${reference}`, changes: null };
    }

    const nodeTypeMap = {
      '角色': { type: 'creator', subtype: 'character' },
      '配乐': { type: 'creator', subtype: 'music' },
      '配音': { type: 'creator', subtype: 'tts' },
      '海报': { type: 'creator', subtype: 'poster' },
      '循环': { type: 'loop', subtype: 'forLoop' },
      '条件': { type: 'logic', subtype: 'condition' },
      '保存': { type: 'output', subtype: 'save' },
      '分享': { type: 'output', subtype: 'share' }
    };

    const nodeDef = nodeTypeMap[nodeType] || { type: 'creator', subtype: 'character' };
    const newNode = {
      id: 'n' + Date.now(),
      type: nodeDef.type,
      subtype: nodeDef.subtype,
      x: refNode.x + 180,
      y: refNode.y,
      config: {}
    };

    workflow.nodes.push(newNode);
    this.insertConnection(workflow, refNode.id, newNode.id, 'after');

    return {
      success: true,
      message: `已在 ${reference} 后添加 ${nodeType} 节点`,
      changes: { addedNode: newNode }
    };
  }

  /**
   * Delete node by index
   */
  deleteNodeByIndex(index) {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    if (index < 0 || index >= workflow.nodes.length) {
      return { success: false, message: `节点索引 ${index + 1} 超出范围`, changes: null };
    }

    const node = workflow.nodes[index];
    workflow.nodes.splice(index, 1);
    workflow.connections = workflow.connections.filter(c => c.from !== node.id && c.to !== node.id);

    return {
      success: true,
      message: `已删除第 ${index + 1} 个节点`,
      changes: { deletedNode: node }
    };
  }

  /**
   * Delete node by name
   */
  deleteNodeByName(name) {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    const node = this.findNodeByName(workflow, name);
    if (!node) {
      return { success: false, message: `未找到节点: ${name}`, changes: null };
    }

    workflow.nodes = workflow.nodes.filter(n => n.id !== node.id);
    workflow.connections = workflow.connections.filter(c => c.from !== node.id && c.to !== node.id);

    return {
      success: true,
      message: `已删除节点: ${name}`,
      changes: { deletedNode: node }
    };
  }

  /**
   * Rename node
   */
  renameNode(oldName, newName) {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    const node = this.findNodeByName(workflow, oldName);
    if (!node) {
      return { success: false, message: `未找到节点: ${oldName}`, changes: null };
    }

    node.config.name = newName;

    return {
      success: true,
      message: `已将 ${oldName} 改名为 ${newName}`,
      changes: { node, oldName, newName }
    };
  }

  /**
   * Insert node between two nodes
   */
  insertBetween(nodeA, nodeB, nodeType) {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    const node1 = this.findNodeByName(workflow, nodeA);
    const node2 = this.findNodeByName(workflow, nodeB);
    if (!node1 || !node2) {
      return { success: false, message: `未找到节点: ${!node1 ? nodeA : nodeB}`, changes: null };
    }

    const nodeTypeMap = {
      '角色': { type: 'creator', subtype: 'character' },
      '配乐': { type: 'creator', subtype: 'music' },
      '配音': { type: 'creator', subtype: 'tts' },
      '海报': { type: 'creator', subtype: 'poster' },
      '循环': { type: 'loop', subtype: 'forLoop' },
      '条件': { type: 'logic', subtype: 'condition' },
      '保存': { type: 'output', subtype: 'save' },
      '分享': { type: 'output', subtype: 'share' }
    };

    const nodeDef = nodeTypeMap[nodeType] || { type: 'creator', subtype: 'character' };
    const newNode = {
      id: 'n' + Date.now(),
      type: nodeDef.type,
      subtype: nodeDef.subtype,
      x: (node1.x + node2.x) / 2,
      y: (node1.y + node2.y) / 2,
      config: {}
    };

    workflow.nodes.push(newNode);

    // Remove old connection between node1 and node2
    workflow.connections = workflow.connections.filter(c => 
      !(c.from === node1.id && c.to === node2.id)
    );

    // Add new connections
    workflow.connections.push({
      from: node1.id,
      fromPort: 'out',
      to: newNode.id,
      toPort: 'in'
    });
    workflow.connections.push({
      from: newNode.id,
      fromPort: 'out',
      to: node2.id,
      toPort: 'in'
    });

    return {
      success: true,
      message: `已在 ${nodeA} 和 ${nodeB} 之间插入 ${nodeType} 节点`,
      changes: { insertedNode: newNode }
    };
  }

  /**
   * Save workflow as template
   */
  saveAsTemplate() {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    const template = {
      name: workflow.name || '自定义模板',
      nodes: workflow.nodes.length,
      connections: workflow.connections.length,
      createdAt: Date.now()
    };

    // Save to localStorage (template service would handle actual saving)
    try {
      const templates = JSON.parse(localStorage.getItem('workflow_custom_templates') || '[]');
      templates.push(template);
      localStorage.setItem('workflow_custom_templates', JSON.stringify(templates));
    } catch (e) {
      console.warn('Failed to save template:', e);
    }

    return {
      success: true,
      message: `已将工作流保存为模板: ${template.name}`,
      changes: { template }
    };
  }

  /**
   * Show workflow structure
   */
  showStructure() {
    const workflow = this.workflowEngine?.workflow || window.state?.workflow;
    if (!workflow) {
      return { success: false, message: '工作流未初始化', changes: null };
    }

    let structure = `📋 工作流: ${workflow.name}\n`;
    structure += `节点数: ${workflow.nodes.length} | 连接数: ${workflow.connections.length}\n\n`;
    
    workflow.nodes.forEach((node, index) => {
      const nodeNames = {
        manual: '触发', character: '角色', music: '配乐', tts: '配音',
        poster: '海报', loop: '循环', condition: '条件', forLoop: 'For循环',
        whileLoop: 'While循环', doWhileLoop: 'DoWhile循环', subflowCall: '子流程',
        save: '保存', share: '分享'
      };
      const name = nodeNames[node.subtype] || node.subtype;
      structure += `${index + 1}. ${name} (${node.id})\n`;
    });

    return {
      success: true,
      message: structure,
      changes: null
    };
  }

  /**
   * Perform undo
   */
  performUndo() {
    if (window.undo) {
      window.undo();
      return { success: true, message: '已撤销', changes: null };
    }
    return { success: false, message: '无法撤销', changes: null };
  }

  /**
   * Perform redo
   */
  performRedo() {
    if (window.redo) {
      window.redo();
      return { success: true, message: '已重做', changes: null };
    }
    return { success: false, message: '无法重做', changes: null };
  }

  // Helper methods
  findNodeByName(workflow, name) {
    const nodeNameMap = {
      '触发': 'manual', '手动触发': 'manual',
      '角色': 'character', '角色生成': 'character',
      '配乐': 'music', '配乐生成': 'music',
      '配音': 'tts', '配音生成': 'tts',
      '海报': 'poster', '海报生成': 'poster',
      '循环': 'loop', '条件': 'condition',
      '保存': 'save', '分享': 'share',
      'For循环': 'forLoop', 'For': 'forLoop',
      'While循环': 'whileLoop', 'DoWhile循环': 'doWhileLoop',
      '子流程': 'subflowCall'
    };

    const subtype = nodeNameMap[name];
    return workflow.nodes.find(n => subtype && n.subtype === subtype);
  }

  insertConnection(workflow, fromId, toId, position) {
    if (position === 'before') {
      // Find incoming connection to toId and reroute to newNode
      const incomingConn = workflow.connections.find(c => c.to === toId);
      if (incomingConn) {
        workflow.connections.push({
          from: incomingConn.from,
          fromPort: incomingConn.fromPort,
          to: fromId,
          toPort: 'in'
        });
        workflow.connections = workflow.connections.filter(c => c !== incomingConn);
      }
      workflow.connections.push({
        from: fromId,
        fromPort: 'out',
        to: toId,
        toPort: 'in'
      });
    } else {
      // After: connect from -> newNode -> (existing target of from)
      const outgoingConn = workflow.connections.find(c => c.from === fromId);
      if (outgoingConn) {
        workflow.connections.push({
          from: fromId,
          fromPort: 'out',
          to: toId,
          toPort: 'in'
        });
        workflow.connections = workflow.connections.filter(c => c !== outgoingConn);
        workflow.connections.push({
          from: toId,
          fromPort: 'out',
          to: outgoingConn.to,
          toPort: 'in'
        });
      } else {
        workflow.connections.push({
          from: fromId,
          fromPort: 'out',
          to: toId,
          toPort: 'in'
        });
      }
    }
  }

  /**
   * Add to conversation history
   */
  addHistory(userMsg, aiMsg) {
    this.history.push({ user: userMsg, ai: aiMsg, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.history = [];
  }
}

// Export singleton
const chatEditor = new ChatEditor(typeof WorkflowEngine !== 'undefined' ? WorkflowEngine : null);
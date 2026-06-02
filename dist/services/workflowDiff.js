/**
 * WorkflowDiff - 版本对比服务
 * 对比两个版本的节点和连接线差异
 */

/**
 * 深度比较两个对象
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * 比较两个节点的配置差异
 */
function diffNodeConfig(oldNode, newNode) {
  const changes = {};
  const oldConfig = oldNode.config || {};
  const newConfig = newNode.config || {};
  
  const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);
  
  for (const key of allKeys) {
    if (!deepEqual(oldConfig[key], newConfig[key])) {
      changes[key] = {
        old: oldConfig[key],
        new: newConfig[key]
      };
    }
  }
  
  return changes;
}

/**
 * 比较两组节点
 * @param {Array} oldNodes - 旧版本节点列表
 * @param {Array} newNodes - 新版本节点列表
 * @returns {Object} 差异对象
 */
function diffWorkflowNodes(oldNodes, newNodes) {
  const result = {
    nodes: {
      added: [],      // 新增节点
      removed: [],    // 删除节点
      modified: [],   // 修改节点（id相同但配置不同）
      unchanged: []   // 未变更节点
    },
    stats: {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    }
  };

  const oldMap = new Map();
  const newMap = new Map();

  // 建立 ID 映射
  oldNodes.forEach(n => oldMap.set(n.id, n));
  newNodes.forEach(n => newMap.set(n.id, n));

  // 找出新增和修改的节点
  newNodes.forEach(newNode => {
    const oldNode = oldMap.get(newNode.id);
    
    if (!oldNode) {
      // 新增节点
      result.nodes.added.push({
        id: newNode.id,
        type: newNode.type,
        subtype: newNode.subtype,
        name: newNode.name || newNode.subtype || newNode.type,
        x: newNode.x,
        y: newNode.y,
        config: newNode.config || {}
      });
    } else {
      // 检查是否修改
      const configChanges = diffNodeConfig(oldNode, newNode);
      const positionChanged = oldNode.x !== newNode.x || oldNode.y !== newNode.y;
      
      if (Object.keys(configChanges).length > 0 || positionChanged) {
        result.nodes.modified.push({
          id: newNode.id,
          type: newNode.type,
          subtype: newNode.subtype,
          name: newNode.name || newNode.subtype || newNode.type,
          oldX: oldNode.x,
          oldY: oldNode.y,
          newX: newNode.x,
          newY: newNode.y,
          configChanges: configChanges,
          positionChanged: positionChanged
        });
      } else {
        result.nodes.unchanged.push(newNode.id);
      }
      
      // 从旧映射中移除，已处理
      oldMap.delete(newNode.id);
    }
  });

  // 剩余的旧节点就是被删除的
  oldMap.forEach(oldNode => {
    result.nodes.removed.push({
      id: oldNode.id,
      type: oldNode.type,
      subtype: oldNode.subtype,
      name: oldNode.name || oldNode.subtype || oldNode.type,
      x: oldNode.x,
      y: oldNode.y,
      config: oldNode.config || {}
    });
  });

  // 更新统计
  result.stats.added = result.nodes.added.length;
  result.stats.removed = result.nodes.removed.length;
  result.stats.modified = result.nodes.modified.length;
  result.stats.unchanged = result.nodes.unchanged.length;

  return result;
}

/**
 * 比较两组连接线
 * @param {Array} oldConns - 旧版本连接列表
 * @param {Array} newConns - 新版本连接列表
 * @returns {Object} 差异对象
 */
function diffWorkflowConnections(oldConns, newConns) {
  const result = {
    connections: {
      added: [],
      removed: []
    },
    stats: {
      added: 0,
      removed: 0
    }
  };

  const oldSet = new Set();
  const newSet = new Set();

  // 创建连接标识
  oldConns.forEach(c => {
    oldSet.add(`${c.from}:${c.fromPort}:${c.to}:${c.toPort}`);
  });
  
  newConns.forEach(c => {
    newSet.add(`${c.from}:${c.fromPort}:${c.to}:${c.toPort}`);
  });

  // 找出新增的连接
  newConns.forEach(newConn => {
    const key = `${newConn.from}:${newConn.fromPort}:${newConn.to}:${newConn.toPort}`;
    if (!oldSet.has(key)) {
      result.connections.added.push({
        from: newConn.from,
        fromPort: newConn.fromPort,
        to: newConn.to,
        toPort: newConn.toPort
      });
    }
  });

  // 找出删除的连接
  oldConns.forEach(oldConn => {
    const key = `${oldConn.from}:${oldConn.fromPort}:${oldConn.to}:${oldConn.toPort}`;
    if (!newSet.has(key)) {
      result.connections.removed.push({
        from: oldConn.from,
        fromPort: oldConn.fromPort,
        to: oldConn.to,
        toPort: oldConn.toPort
      });
    }
  });

  result.stats.added = result.connections.added.length;
  result.stats.removed = result.connections.removed.length;

  return result;
}

/**
 * 比较两个版本完整差异
 * @param {Object} oldVersion - 旧版本数据
 * @param {Object} newVersion - 新版本数据
 * @returns {Object} 完整差异对象
 */
function diffWorkflowVersions(oldVersion, newVersion) {
  const nodeDiff = diffWorkflowNodes(
    oldVersion.nodes || [],
    newVersion.nodes || []
  );
  
  const connDiff = diffWorkflowConnections(
    oldVersion.connections || [],
    newVersion.connections || []
  );

  return {
    nodes: nodeDiff.nodes,
    connections: connDiff.connections,
    stats: {
      nodes: nodeDiff.stats,
      connections: connDiff.stats,
      total: {
        added: nodeDiff.stats.added + connDiff.stats.added,
        removed: nodeDiff.stats.removed + connDiff.stats.removed,
        modified: nodeDiff.stats.modified
      }
    },
    summary: generateDiffSummary(nodeDiff, connDiff)
  };
}

/**
 * 生成差异摘要
 */
function generateDiffSummary(nodeDiff, connDiff) {
  const parts = [];
  
  if (nodeDiff.stats.added > 0) {
    parts.push(`新增 ${nodeDiff.stats.added} 个节点`);
  }
  if (nodeDiff.stats.removed > 0) {
    parts.push(`删除 ${nodeDiff.stats.removed} 个节点`);
  }
  if (nodeDiff.stats.modified > 0) {
    parts.push(`修改 ${nodeDiff.stats.modified} 个节点`);
  }
  if (connDiff.stats.added > 0) {
    parts.push(`新增 ${connDiff.stats.added} 条连接`);
  }
  if (connDiff.stats.removed > 0) {
    parts.push(`删除 ${connDiff.stats.removed} 条连接`);
  }
  
  return parts.length > 0 ? parts.join('，') : '无变更';
}

/**
 * 高亮差异节点
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} diff - 差异对象
 * @param {string} highlightClass - 高亮类名
 */
function highlightDiffNodes(canvas, diff, highlightClass = 'diff-highlight') {
  // 移除之前的高亮
  canvas.querySelectorAll('.diff-highlight').forEach(el => {
    el.classList.remove('diff-highlight');
  });
  
  // 高亮新增节点
  diff.nodes.added.forEach(node => {
    const el = canvas.querySelector(`[data-node-id="${node.id}"]`);
    if (el) el.classList.add(highlightClass);
  });
  
  // 高亮删除节点（红色）
  diff.nodes.removed.forEach(node => {
    const el = canvas.querySelector(`[data-node-id="${node.id}"]`);
    if (el) {
      el.classList.add('diff-removed');
    }
  });
  
  // 高亮修改节点
  diff.nodes.modified.forEach(node => {
    const el = canvas.querySelector(`[data-node-id="${node.id}"]`);
    if (el) el.classList.add('diff-modified');
  });
}

/**
 * 清除差异高亮
 */
function clearDiffHighlight(canvas) {
  canvas.querySelectorAll('.diff-highlight, .diff-added, .diff-removed, .diff-modified').forEach(el => {
    el.classList.remove('diff-highlight', 'diff-added', 'diff-removed', 'diff-modified');
  });
}

// 导出
window.diffWorkflowNodes = diffWorkflowNodes;
window.diffWorkflowConnections = diffWorkflowConnections;
window.diffWorkflowVersions = diffWorkflowVersions;
window.highlightDiffNodes = highlightDiffNodes;
window.clearDiffHighlight = clearDiffHighlight;
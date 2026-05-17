const NodeType = {
  TRIGGER: "trigger",
  ACTION: "action",
  CONDITION: "condition",
  TRANSFORM: "transform",
  OUTPUT: "output"
};
const PRESET_NODES = {
  trigger: [
    { id: "manual", name: "手动触发", icon: "▶️", category: "trigger" },
    { id: "schedule", name: "定时触发", icon: "⏰", category: "trigger" },
    { id: "event", name: "事件触发", icon: "⚡", category: "trigger" }
  ],
  action: [
    { id: "generate_image", name: "生成图片", icon: "🎨", category: "action" },
    { id: "generate_music", name: "生成音乐", icon: "🎵", category: "action" },
    { id: "tts_speak", name: "文字转语音", icon: "🔊", category: "action" },
    { id: "http_request", name: "HTTP请求", icon: "🌐", category: "action" }
  ],
  condition: [
    { id: "if_condition", name: "条件判断", icon: "❓", category: "condition" },
    { id: "switch", name: "分支选择", icon: "🔀", category: "condition" },
    { id: "filter", name: "数据过滤", icon: "🔍", category: "condition" }
  ],
  transform: [
    { id: "join", name: "合并数据", icon: "🔗", category: "transform" },
    { id: "split", name: "拆分数据", icon: "✂️", category: "transform" },
    { id: "map", name: "映射转换", icon: "🗺️", category: "transform" }
  ],
  output: [
    { id: "save", name: "保存结果", icon: "💾", category: "output" },
    { id: "notify", name: "发送通知", icon: "📢", category: "output" }
  ]
};
const WORKFLOW_KEY = "ai-creator-workflows";
const WORKFLOW_RUNS_KEY = "ai-creator-workflow-runs";
function getWorkflows() {
  try {
    return JSON.parse(localStorage.getItem(WORKFLOW_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveWorkflows(workflows) {
  localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflows));
}
function createWorkflow(name, description = "") {
  const id = "wf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  const workflow = {
    id,
    name,
    description,
    nodes: [],
    connections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastRun: null,
    runCount: 0
  };
  const workflows = getWorkflows();
  workflows[id] = workflow;
  saveWorkflows(workflows);
  return workflow;
}
function getWorkflow(id) {
  const workflows = getWorkflows();
  return workflows[id] || null;
}
function updateWorkflow(id, updates) {
  const workflows = getWorkflows();
  if (!workflows[id]) return null;
  workflows[id] = {
    ...workflows[id],
    ...updates,
    updatedAt: Date.now()
  };
  saveWorkflows(workflows);
  return workflows[id];
}
function deleteWorkflow(id) {
  const workflows = getWorkflows();
  if (workflows[id]) {
    delete workflows[id];
    saveWorkflows(workflows);
    return true;
  }
  return false;
}
async function executeWorkflow(id, inputData = {}) {
  const workflow = getWorkflow(id);
  if (!workflow) return { success: false, error: "工作流不存在" };
  const runId = "run_" + Date.now();
  const run = {
    id: runId,
    workflowId: id,
    startedAt: Date.now(),
    status: "running",
    steps: []
  };
  const workflows = getWorkflows();
  workflows[id].lastRun = Date.now();
  workflows[id].runCount++;
  saveWorkflows(workflows);
  try {
    const executionOrder = topologicalSort(workflow);
    let currentData = { ...inputData };
    const results = {};
    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      const step = {
        nodeId,
        name: node.name,
        icon: node.icon,
        status: "running",
        startedAt: Date.now()
      };
      const nodeResult = await executeNode(node, currentData);
      results[nodeId] = nodeResult;
      currentData = nodeResult.output;
      step.status = "success";
      step.finishedAt = Date.now();
      step.output = nodeResult.output;
      run.steps.push(step);
    }
    run.status = "success";
    run.finishedAt = Date.now();
    run.output = currentData;
    saveRun(run);
    return { success: true, runId, output: currentData, steps: run.steps };
  } catch (error) {
    run.status = "failed";
    run.finishedAt = Date.now();
    run.error = error.message;
    saveRun(run);
    return { success: false, error: error.message, runId };
  }
}
function topologicalSort(workflow) {
  const nodes = workflow.nodes;
  const connections = workflow.connections;
  const inDegree = {};
  const adjacency = {};
  for (const node of nodes) {
    inDegree[node.id] = 0;
    adjacency[node.id] = [];
  }
  for (const conn of connections) {
    inDegree[conn.to.nodeId]++;
    adjacency[conn.from.nodeId].push(conn.to.nodeId);
  }
  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const result = [];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    result.push(nodeId);
    for (const neighbor of adjacency[nodeId]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }
  return result;
}
async function executeNode(node, input) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let output = input;
      switch (node.templateId) {
        case "manual":
          break;
        case "schedule":
          output = { ...input, trigger: "scheduled", time: (/* @__PURE__ */ new Date()).toISOString() };
          break;
        case "event":
          output = { ...input, trigger: "event" };
          break;
        case "generate_image":
          output = { ...input, result: "生成图片: " + (input.prompt || "默认图片"), type: "image" };
          break;
        case "generate_music":
          output = { ...input, result: "生成音乐: " + (input.style || "默认风格"), type: "music" };
          break;
        case "tts_speak":
          output = { ...input, result: "语音输出: " + (input.text || "你好"), type: "audio" };
          break;
        case "http_request":
          output = { ...input, result: "HTTP请求完成", status: 200 };
          break;
        case "if_condition":
          output = {
            ...input,
            condition: input.value !== void 0 ? input.value > 0 : true
          };
          break;
        case "switch":
          output = { ...input, branch: input.branch || "default" };
          break;
        case "filter":
          output = { ...input, filtered: input.data || [] };
          break;
        case "join":
          output = { ...input, joined: true };
          break;
        case "split":
          output = { ...input, splitted: true, parts: (input.data || []).slice(0, 3) };
          break;
        case "map":
          output = { ...input, mapped: true };
          break;
        case "save":
          output = { ...input, saved: true };
          break;
        case "notify":
          output = { ...input, notified: true };
          break;
        default:
          output = { ...input };
      }
      resolve({ success: true, output });
    }, 100);
  });
}
function saveRun(run) {
  try {
    const runs = JSON.parse(localStorage.getItem(WORKFLOW_RUNS_KEY) || "{}");
    if (!runs[run.workflowId]) {
      runs[run.workflowId] = [];
    }
    runs[run.workflowId].unshift(run);
    runs[run.workflowId] = runs[run.workflowId].slice(0, 10);
    localStorage.setItem(WORKFLOW_RUNS_KEY, JSON.stringify(runs));
  } catch {
  }
}
function exportWorkflow(id) {
  const workflow = getWorkflow(id);
  if (!workflow) return null;
  return JSON.stringify(workflow, null, 2);
}
function importWorkflow(jsonStr) {
  try {
    const workflow = JSON.parse(jsonStr);
    if (!workflow.id || !workflow.name || !workflow.nodes) {
      throw new Error("无效的工作流格式");
    }
    const newId = "wf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    workflow.id = newId;
    workflow.createdAt = Date.now();
    workflow.updatedAt = Date.now();
    workflow.lastRun = null;
    workflow.runCount = 0;
    const idMap = {};
    workflow.nodes = workflow.nodes.map((node) => {
      const newNodeId = "node_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
      idMap[node.id] = newNodeId;
      return { ...node, id: newNodeId };
    });
    workflow.connections = workflow.connections.map((conn) => ({
      ...conn,
      id: "conn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      from: { ...conn.from, nodeId: idMap[conn.from.nodeId] || conn.from.nodeId },
      to: { ...conn.to, nodeId: idMap[conn.to.nodeId] || conn.to.nodeId }
    }));
    const workflows = getWorkflows();
    workflows[newId] = workflow;
    saveWorkflows(workflows);
    return workflow;
  } catch (error) {
    return null;
  }
}
function createFlowEditorPanel() {
  const panel = document.createElement("div");
  panel.id = "flow-editor-panel";
  let currentWorkflowId = null;
  let editingNodes = [];
  let editingConnections = [];
  let selectedNode = null;
  function renderListView() {
    var _a, _b;
    const workflows = getWorkflows();
    const workflowList = Object.values(workflows).sort((a, b) => b.updatedAt - a.updatedAt);
    let content = '<div class="fe-header"><span class="fe-title">🔀 工作流编辑器</span><button class="fe-close" data-action="close">×</button></div><div class="fe-body"><div class="fe-toolbar"><button class="fe-btn primary" id="fe-new-workflow">➕ 新建工作流</button><button class="fe-btn" id="fe-import-workflow">📥 导入</button></div>';
    if (workflowList.length === 0) {
      content += '<div class="fe-empty">暂无工作流<br/><span>点击"新建工作流"开始</span></div>';
    } else {
      content += '<div class="fe-list">';
      for (const wf of workflowList) {
        const lastRun = wf.lastRun ? formatTime(wf.lastRun) : "从未运行";
        content += '<div class="fe-workflow-card" data-wf-id="' + wf.id + '"><div class="fe-workflow-info"><div class="fe-workflow-name">' + wf.name + '</div><div class="fe-workflow-meta"><span>' + wf.nodes.length + " 节点</span><span>运行 " + wf.runCount + " 次</span><span>" + lastRun + '</span></div></div><div class="fe-workflow-actions"><button class="fe-icon-btn" data-action="edit" title="编辑">✏️</button><button class="fe-icon-btn" data-action="run" title="运行">▶️</button><button class="fe-icon-btn" data-action="export" title="导出">📤</button><button class="fe-icon-btn danger" data-action="delete" title="删除">🗑️</button></div></div>';
      }
      content += "</div>";
    }
    content += "</div>";
    panel.innerHTML = content;
    (_a = panel.querySelector("#fe-new-workflow")) == null ? void 0 : _a.addEventListener("click", () => {
      const name = prompt("请输入工作流名称：", "我的工作流");
      if (name) {
        const wf = createWorkflow(name);
        currentWorkflowId = wf.id;
        loadWorkflowEditor(wf.id);
      }
    });
    (_b = panel.querySelector("#fe-import-workflow")) == null ? void 0 : _b.addEventListener("click", () => {
      const json = prompt("请粘贴工作流JSON：");
      if (json) {
        const wf = importWorkflow(json);
        if (wf) {
          renderListView();
        } else {
          alert("导入失败：无效的工作流格式");
        }
      }
    });
    panel.querySelectorAll(".fe-workflow-card").forEach((card) => {
      var _a2, _b2, _c, _d;
      const wfId = card.dataset.wfId;
      (_a2 = card.querySelector('[data-action="edit"]')) == null ? void 0 : _a2.addEventListener("click", (e) => {
        e.stopPropagation();
        loadWorkflowEditor(wfId);
      });
      (_b2 = card.querySelector('[data-action="run"]')) == null ? void 0 : _b2.addEventListener("click", (e) => {
        e.stopPropagation();
        runWorkflow(wfId);
      });
      (_c = card.querySelector('[data-action="export"]')) == null ? void 0 : _c.addEventListener("click", (e) => {
        var _a3;
        e.stopPropagation();
        const json = exportWorkflow(wfId);
        if (json) {
          (_a3 = navigator.clipboard) == null ? void 0 : _a3.writeText(json);
          alert("工作流JSON已复制到剪贴板");
        }
      });
      (_d = card.querySelector('[data-action="delete"]')) == null ? void 0 : _d.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("确定删除此工作流？")) {
          deleteWorkflow(wfId);
          renderListView();
        }
      });
    });
  }
  function loadWorkflowEditor(wfId) {
    const wf = getWorkflow(wfId);
    if (!wf) return;
    currentWorkflowId = wfId;
    editingNodes = JSON.parse(JSON.stringify(wf.nodes));
    editingConnections = JSON.parse(JSON.stringify(wf.connections));
    renderEditorView(wf);
  }
  function renderEditorView(wf) {
    var _a, _b, _c, _d;
    panel.innerHTML = '<div class="fe-editor"><div class="fe-editor-header"><button class="fe-btn" id="fe-back">← 返回</button><span class="fe-editor-title">' + wf.name + '</span><div class="fe-editor-actions"><button class="fe-btn" id="fe-run-workflow">▶️ 运行</button><button class="fe-btn primary" id="fe-save-workflow">💾 保存</button></div></div><div class="fe-editor-body"><div class="fe-node-palette" id="fe-palette"><div class="fe-palette-title">节点库</div></div><div class="fe-canvas" id="fe-canvas"></div></div><div class="fe-status-bar"><span id="fe-node-count">0 节点</span><span id="fe-conn-count">0 连接</span></div></div>';
    const palette = panel.querySelector("#fe-palette");
    for (const [category, nodes] of Object.entries(PRESET_NODES)) {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "fe-palette-category";
      categoryDiv.innerHTML = '<div class="fe-category-title">' + getCategoryName(category) + "</div>";
      for (const node of nodes) {
        const nodeEl = document.createElement("div");
        nodeEl.className = "fe-palette-node";
        nodeEl.dataset.type = category;
        nodeEl.dataset.template = JSON.stringify(node);
        nodeEl.innerHTML = '<span class="fe-node-icon">' + node.icon + '</span><span class="fe-node-name">' + node.name + "</span>";
        categoryDiv.appendChild(nodeEl);
      }
      palette.appendChild(categoryDiv);
    }
    renderCanvas();
    (_a = panel.querySelector("#fe-back")) == null ? void 0 : _a.addEventListener("click", () => {
      currentWorkflowId = null;
      renderListView();
    });
    (_b = panel.querySelector("#fe-run-workflow")) == null ? void 0 : _b.addEventListener("click", () => {
      if (currentWorkflowId) runWorkflow(currentWorkflowId);
    });
    (_c = panel.querySelector("#fe-save-workflow")) == null ? void 0 : _c.addEventListener("click", () => {
      if (currentWorkflowId) {
        updateWorkflow(currentWorkflowId, {
          nodes: editingNodes,
          connections: editingConnections
        });
        alert("保存成功！");
      }
    });
    palette.querySelectorAll(".fe-palette-node").forEach((node) => {
      node.addEventListener("mousedown", (e) => {
        const template = JSON.parse(node.dataset.template);
        const type = node.dataset.type;
        const canvas = panel.querySelector("#fe-canvas");
        const canvasRect = canvas.getBoundingClientRect();
        const newNode = {
          id: "temp_" + Date.now(),
          type,
          templateId: template.id,
          name: template.name,
          icon: template.icon,
          position: {
            x: e.clientX - canvasRect.left - 60,
            y: e.clientY - canvasRect.top - 25
          },
          inputs: [],
          outputs: []
        };
        setupNodePorts(newNode);
        editingNodes.push(newNode);
        selectedNode = newNode.id;
        renderCanvas();
      });
    });
    (_d = panel.querySelector("#fe-canvas")) == null ? void 0 : _d.addEventListener("click", (e) => {
      if (e.target.id === "fe-canvas" || e.target.classList.contains("fe-canvas-bg")) {
        selectedNode = null;
        renderCanvas();
      }
    });
    updateStatusBar();
  }
  function getCategoryName(category) {
    const names = {
      trigger: "▶️ 触发器",
      action: "⚡ 操作",
      condition: "❓ 条件",
      transform: "🔄 转换",
      output: "📤 输出"
    };
    return names[category] || category;
  }
  function setupNodePorts(node) {
    switch (node.type) {
      case NodeType.TRIGGER:
        node.outputs = [{ id: "out", name: "输出" }];
        break;
      case NodeType.ACTION:
        node.inputs = [{ id: "in", name: "输入" }];
        node.outputs = [{ id: "out", name: "输出" }];
        break;
      case NodeType.CONDITION:
        node.inputs = [{ id: "in", name: "输入" }];
        node.outputs = [{ id: "true", name: "真" }, { id: "false", name: "假" }];
        break;
      case NodeType.TRANSFORM:
        node.inputs = [{ id: "in", name: "输入" }];
        node.outputs = [{ id: "out", name: "输出" }];
        break;
      case NodeType.OUTPUT:
        node.inputs = [{ id: "in", name: "输入" }];
        break;
    }
  }
  function renderCanvas() {
    var _a, _b, _c, _d, _e;
    const canvas = panel.querySelector("#fe-canvas");
    if (!canvas) return;
    canvas.innerHTML = '<div class="fe-canvas-bg"></div>';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("fe-connections");
    for (const conn of editingConnections) {
      const fromNode = editingNodes.find((n) => n.id === conn.from.nodeId);
      const toNode = editingNodes.find((n) => n.id === conn.to.nodeId);
      if (!fromNode || !toNode) continue;
      const fromPort = (_a = fromNode.outputs) == null ? void 0 : _a.find((p) => p.id === conn.from.port);
      const toPort = (_b = toNode.inputs) == null ? void 0 : _b.find((p) => p.id === conn.to.port);
      if (!fromPort || !toPort) continue;
      const x1 = fromNode.position.x + 120;
      const y1 = fromNode.position.y + 25 + fromNode.outputs.indexOf(fromPort) * 20;
      const x2 = toNode.position.x;
      const y2 = toNode.position.y + 25 + toNode.inputs.indexOf(toPort) * 20;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`);
      path.classList.add("fe-connection-line");
      path.dataset.connId = conn.id;
      path.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("删除此连接？")) {
          const idx = editingConnections.findIndex((c) => c.id === conn.id);
          if (idx >= 0) editingConnections.splice(idx, 1);
          renderCanvas();
          updateStatusBar();
        }
      });
      svg.appendChild(path);
    }
    canvas.appendChild(svg);
    for (const node of editingNodes) {
      const nodeEl = document.createElement("div");
      nodeEl.className = "fe-node " + node.type + (selectedNode === node.id ? " selected" : "");
      nodeEl.id = "fe-node-" + node.id;
      nodeEl.style.left = node.position.x + "px";
      nodeEl.style.top = node.position.y + "px";
      let html = '<div class="fe-node-header"><span class="fe-node-icon">' + node.icon + '</span><span class="fe-node-name">' + node.name + '</span><button class="fe-node-delete" data-node-id="' + node.id + '">×</button></div><div class="fe-node-body">';
      if (((_c = node.inputs) == null ? void 0 : _c.length) > 0) {
        html += '<div class="fe-node-ports fe-inputs">';
        for (const port of node.inputs) {
          html += '<div class="fe-port fe-input-port" data-node="' + node.id + '" data-port="' + port.id + '" data-dir="input"></div>';
        }
        html += "</div>";
      }
      if (((_d = node.outputs) == null ? void 0 : _d.length) > 0) {
        html += '<div class="fe-node-ports fe-outputs">';
        for (const port of node.outputs) {
          html += '<div class="fe-port fe-output-port" data-node="' + node.id + '" data-port="' + port.id + '" data-dir="output"></div>';
        }
        html += "</div>";
      }
      html += "</div>";
      nodeEl.innerHTML = html;
      const header = nodeEl.querySelector(".fe-node-header");
      header.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("fe-node-delete")) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = node.position.x;
        const origY = node.position.y;
        function onMouseMove(e2) {
          node.position.x = origX + (e2.clientX - startX);
          node.position.y = origY + (e2.clientY - startY);
          nodeEl.style.left = node.position.x + "px";
          nodeEl.style.top = node.position.y + "px";
          renderCanvas();
        }
        function onMouseUp() {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        }
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
      nodeEl.addEventListener("click", (e) => {
        if (!e.target.classList.contains("fe-port")) {
          selectedNode = node.id;
          renderCanvas();
        }
      });
      (_e = nodeEl.querySelector(".fe-node-delete")) == null ? void 0 : _e.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = editingNodes.findIndex((n) => n.id === node.id);
        if (idx >= 0) {
          editingNodes.splice(idx, 1);
          editingConnections = editingConnections.filter(
            (c) => c.from.nodeId !== node.id && c.to.nodeId !== node.id
          );
          renderCanvas();
          updateStatusBar();
        }
      });
      nodeEl.querySelectorAll(".fe-port").forEach((port) => {
        port.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          const portNode = port.dataset.node;
          const portId = port.dataset.port;
          const dir = port.dataset.dir;
          const canvasRect = canvas.getBoundingClientRect();
          const tempLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
          tempLine.classList.add("fe-connection-line", "temp");
          svg.appendChild(tempLine);
          function onMouseMove(e2) {
            const x1 = dir === "output" ? node.position.x + 120 : node.position.x;
            const y1 = node.position.y + 25;
            const x2 = e2.clientX - canvasRect.left;
            const y2 = e2.clientY - canvasRect.top;
            tempLine.setAttribute("d", `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`);
          }
          function onMouseUp(e2) {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            tempLine.remove();
            const target = document.elementFromPoint(e2.clientX, e2.clientY);
            const targetPort = target == null ? void 0 : target.closest(".fe-port");
            if (targetPort && targetPort !== port) {
              const targetNode = targetPort.dataset.node;
              const targetPortId = targetPort.dataset.port;
              const targetDir = targetPort.dataset.dir;
              if (dir !== targetDir) {
                if (dir === "output") {
                  editingConnections.push({
                    id: "conn_" + Date.now(),
                    from: { nodeId: portNode, port: portId },
                    to: { nodeId: targetNode, port: targetPortId }
                  });
                } else {
                  editingConnections.push({
                    id: "conn_" + Date.now(),
                    from: { nodeId: targetNode, port: targetPortId },
                    to: { nodeId: portNode, port: portId }
                  });
                }
                renderCanvas();
                updateStatusBar();
              }
            }
          }
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      });
      canvas.appendChild(nodeEl);
    }
  }
  function updateStatusBar() {
    const nodeCount = panel.querySelector("#fe-node-count");
    const connCount = panel.querySelector("#fe-conn-count");
    if (nodeCount) nodeCount.textContent = editingNodes.length + " 节点";
    if (connCount) connCount.textContent = editingConnections.length + " 连接";
  }
  async function runWorkflow(wfId) {
    const result = await executeWorkflow(wfId);
    if (result.success) {
      alert("工作流执行成功！\n输出：" + JSON.stringify(result.output, null, 2));
    } else {
      alert("工作流执行失败：" + result.error);
    }
  }
  function formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 6e4);
    const hours = Math.floor(diff / 36e5);
    const days = Math.floor(diff / 864e5);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return minutes + "分钟前";
    if (hours < 24) return hours + "小时前";
    if (days < 30) return days + "天前";
    return new Date(timestamp).toLocaleDateString();
  }
  const style = document.createElement("style");
  style.id = "flow-editor-style";
  style.textContent = [
    "#flow-editor-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 600px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1012; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".fe-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".fe-title { font-size: 15px; font-weight: 600; color: #f97316; }",
    ".fe-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".fe-close:hover { color: #fff; }",
    ".fe-body { flex: 1; overflow-y: auto; padding: 16px; }",
    ".fe-toolbar { display: flex; gap: 8px; margin-bottom: 16px; }",
    ".fe-btn {",
    "padding: 8px 14px; border: 1px solid #333; border-radius: 6px;",
    "background: #1a1a2e; color: #fff; font-size: 13px; cursor: pointer;",
    "}",
    ".fe-btn.primary { background: #f9731622; color: #f97316; border-color: #f9731644; }",
    ".fe-btn:hover { background: #252540; }",
    ".fe-empty {",
    "text-align: center; padding: 40px; color: #666; font-size: 14px;",
    "}",
    ".fe-empty span { display: block; margin-top: 8px; font-size: 12px; }",
    ".fe-list { display: flex; flex-direction: column; gap: 8px; }",
    ".fe-workflow-card {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 12px; background: #12122a; border-radius: 8px;",
    "}",
    ".fe-workflow-name { font-size: 14px; font-weight: 500; color: #fff; margin-bottom: 4px; }",
    ".fe-workflow-meta { display: flex; gap: 12px; font-size: 11px; color: #888; }",
    ".fe-workflow-actions { display: flex; gap: 4px; }",
    ".fe-icon-btn {",
    "padding: 6px 8px; border: none; border-radius: 4px;",
    "background: transparent; cursor: pointer; font-size: 14px;",
    "}",
    ".fe-icon-btn:hover { background: #252540; }",
    ".fe-icon-btn.danger:hover { background: #dc262644; }",
    ".fe-editor { height: 100%; display: flex; flex-direction: column; }",
    ".fe-editor-header {",
    "display: flex; align-items: center; gap: 12px; padding: 10px 14px;",
    "border-bottom: 1px solid #333; background: #16162a;",
    "}",
    ".fe-editor-title { flex: 1; font-size: 14px; font-weight: 600; color: #f97316; }",
    ".fe-editor-actions { display: flex; gap: 8px; }",
    ".fe-editor-body { flex: 1; display: flex; overflow: hidden; }",
    ".fe-node-palette {",
    "width: 140px; background: #12122a; border-right: 1px solid #222;",
    "padding: 10px; overflow-y: auto;",
    "}",
    ".fe-palette-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #222;",
    "}",
    ".fe-category-title { font-size: 11px; color: #666; margin: 8px 0 4px; }",
    ".fe-palette-node {",
    "display: flex; align-items: center; gap: 6px; padding: 6px 8px;",
    "background: #1a1a2e; border-radius: 4px; margin-bottom: 4px; cursor: grab; font-size: 12px; color: #fff;",
    "}",
    ".fe-palette-node:hover { background: #252540; }",
    ".fe-palette-node .fe-node-icon { font-size: 14px; }",
    ".fe-canvas {",
    "flex: 1; position: relative; overflow: auto; background: #0a0a1a;",
    "background-image: radial-gradient(circle, #222 1px, transparent 1px);",
    "background-size: 20px 20px;",
    "}",
    ".fe-canvas-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }",
    ".fe-connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }",
    ".fe-connection-line { fill: none; stroke: #60a5fa; stroke-width: 2; pointer-events: stroke; cursor: pointer; }",
    ".fe-connection-line:hover { stroke: #f97316; }",
    ".fe-node {",
    "position: absolute; width: 120px; background: #1a1a2e; border: 2px solid #333;",
    "border-radius: 8px; cursor: move; user-select: none;",
    "}",
    ".fe-node.selected { border-color: #f97316; }",
    ".fe-node.trigger { border-color: #34d399; }",
    ".fe-node.action { border-color: #60a5fa; }",
    ".fe-node.condition { border-color: #f97316; }",
    ".fe-node.transform { border-color: #a78bfa; }",
    ".fe-node.output { border-color: #fbbf24; }",
    ".fe-node-header {",
    "display: flex; align-items: center; gap: 4px; padding: 6px 8px;",
    "background: #12122a; border-radius: 6px 6px 0 0; font-size: 11px;",
    "}",
    ".fe-node-icon { font-size: 14px; }",
    ".fe-node-name { flex: 1; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".fe-node-delete {",
    "background: none; border: none; color: #888; font-size: 14px; cursor: pointer; padding: 0; line-height: 1;",
    "}",
    ".fe-node-delete:hover { color: #dc2626; }",
    ".fe-node-body { padding: 8px; position: relative; min-height: 30px; }",
    ".fe-node-ports { display: flex; }",
    ".fe-inputs { flex-direction: column; }",
    ".fe-outputs { flex-direction: column; align-items: flex-end; }",
    ".fe-port {",
    "width: 10px; height: 10px; border-radius: 50%; background: #60a5fa;",
    "cursor: crosshair; margin: 2px 0;",
    "}",
    ".fe-port:hover { transform: scale(1.3); }",
    ".fe-status-bar {",
    "display: flex; gap: 16px; padding: 8px 14px; font-size: 11px; color: #888;",
    "background: #12122a; border-top: 1px solid #222;",
    "}"
  ].join("");
  if (!document.getElementById("flow-editor-style")) {
    document.head.appendChild(style);
  }
  renderListView();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createFlowEditorPanel
};
//# sourceMappingURL=FlowEditorPanel-DHXMuThZ.js.map

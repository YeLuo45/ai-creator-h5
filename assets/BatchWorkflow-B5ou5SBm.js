import "./TaskQueue-DOQ0hbkZ.js";
import { g as getInstalledTemplates, a as getMarketTemplates } from "./TemplateMarket-BFmIOwYb.js";
const BATCH_KEY = "ai-creator-batch-workflows";
const BatchStatus = {
  PENDING: "pending",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};
function createBatchWorkflow(config) {
  var _a;
  const workflow = {
    id: `batch-${Date.now()}`,
    name: config.name || "批量生成任务",
    templateId: config.templateId,
    type: config.type || "text",
    items: config.items || [],
    // 批量项列表
    currentIndex: 0,
    status: BatchStatus.PENDING,
    results: [],
    stats: {
      total: ((_a = config.items) == null ? void 0 : _a.length) || 0,
      completed: 0,
      failed: 0
    },
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null
  };
  saveBatchWorkflow(workflow);
  return workflow;
}
function saveBatchWorkflow(workflow) {
  const workflows = getBatchWorkflows();
  const existing = workflows.findIndex((w) => w.id === workflow.id);
  if (existing >= 0) {
    workflows[existing] = workflow;
  } else {
    workflows.push(workflow);
  }
  localStorage.setItem(BATCH_KEY, JSON.stringify(workflows));
}
function getBatchWorkflows() {
  try {
    const data = localStorage.getItem(BATCH_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function getBatchWorkflow(id) {
  const workflows = getBatchWorkflows();
  return workflows.find((w) => w.id === id);
}
function deleteBatchWorkflow(id) {
  const workflows = getBatchWorkflows();
  const filtered = workflows.filter((w) => w.id !== id);
  localStorage.setItem(BATCH_KEY, JSON.stringify(filtered));
  return true;
}
function updateBatchWorkflow(id, updates) {
  const workflows = getBatchWorkflows();
  const index = workflows.findIndex((w) => w.id === id);
  if (index < 0) return null;
  workflows[index] = { ...workflows[index], ...updates };
  localStorage.setItem(BATCH_KEY, JSON.stringify(workflows));
  return workflows[index];
}
async function executeBatchWorkflow(workflowId, executorFn) {
  const workflow = getBatchWorkflow(workflowId);
  if (!workflow) return { success: false, error: "工作流不存在" };
  if (workflow.status === BatchStatus.RUNNING) {
    return { success: false, error: "工作流已在运行中" };
  }
  updateBatchWorkflow(workflowId, {
    status: BatchStatus.RUNNING,
    startedAt: Date.now(),
    currentIndex: 0,
    results: [],
    stats: { ...workflow.stats, completed: 0, failed: 0 }
  });
  window.dispatchEvent(new CustomEvent("batch-workflow-start", { detail: { workflowId } }));
  for (let i = 0; i < workflow.items.length; i++) {
    const currentWorkflow = getBatchWorkflow(workflowId);
    if (currentWorkflow.status === BatchStatus.PAUSED) {
      await waitForResume(workflowId);
    }
    if (currentWorkflow.status === BatchStatus.CANCELLED) {
      break;
    }
    updateBatchWorkflow(workflowId, { currentIndex: i });
    const item = workflow.items[i];
    try {
      const result = await executorFn(item, i, workflow);
      const updatedWorkflow = getBatchWorkflow(workflowId);
      updatedWorkflow.results.push({
        index: i,
        item,
        result,
        success: true,
        timestamp: Date.now()
      });
      updatedWorkflow.stats.completed++;
      updatedWorkflow.stats.total = workflow.items.length;
      updateBatchWorkflow(workflowId, updatedWorkflow);
      window.dispatchEvent(new CustomEvent("batch-workflow-progress", {
        detail: {
          workflowId,
          currentIndex: i,
          total: workflow.items.length,
          completed: updatedWorkflow.stats.completed
        }
      }));
    } catch (error) {
      const updatedWorkflow = getBatchWorkflow(workflowId);
      updatedWorkflow.results.push({
        index: i,
        item,
        error: error.message,
        success: false,
        timestamp: Date.now()
      });
      updatedWorkflow.stats.failed++;
      updateBatchWorkflow(workflowId, updatedWorkflow);
    }
  }
  const finalWorkflow = getBatchWorkflow(workflowId);
  finalWorkflow.status = BatchStatus.COMPLETED;
  finalWorkflow.completedAt = Date.now();
  updateBatchWorkflow(workflowId, finalWorkflow);
  window.dispatchEvent(new CustomEvent("batch-workflow-complete", {
    detail: { workflowId, results: finalWorkflow.results }
  }));
  return { success: true, workflow: finalWorkflow };
}
function waitForResume(workflowId) {
  return new Promise((resolve) => {
    const check = () => {
      const workflow = getBatchWorkflow(workflowId);
      if (workflow.status !== BatchStatus.PAUSED) {
        resolve();
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}
function pauseBatchWorkflow(workflowId) {
  return updateBatchWorkflow(workflowId, { status: BatchStatus.PAUSED });
}
function resumeBatchWorkflow(workflowId) {
  return updateBatchWorkflow(workflowId, { status: BatchStatus.RUNNING });
}
function cancelBatchWorkflow(workflowId) {
  return updateBatchWorkflow(workflowId, { status: BatchStatus.CANCELLED });
}
function createQuickBatch(templateId, params) {
  const templates = getInstalledTemplates().concat(getMarketTemplates());
  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    return { success: false, error: "模板不存在" };
  }
  const items = generateBatchItems(template, params);
  if (items.length === 0) {
    return { success: false, error: "没有生成批量项" };
  }
  const workflow = createBatchWorkflow({
    name: `批量: ${template.name}`,
    templateId,
    type: template.type,
    items
  });
  return { success: true, workflow };
}
function generateBatchItems(template, params) {
  const items = [];
  if (params.textList && Array.isArray(params.textList)) {
    for (const text of params.textList) {
      if (text.trim()) {
        items.push({
          prompt: template.prompt.replace(/\{[^}]+\}/g, text),
          originalText: text,
          params: { text }
        });
      }
    }
  } else if (params.range) {
    const [start, end] = params.range.split("-").map((n) => parseInt(n.trim()));
    for (let i = start; i <= end; i++) {
      const prompt = template.prompt.replace(/\{[^}]+\}/g, i.toString());
      items.push({
        prompt,
        originalText: i.toString(),
        params: { index: i }
      });
    }
  } else if (params.count && template.params) {
    for (let i = 0; i < params.count; i++) {
      const paramValues = {};
      let prompt = template.prompt;
      for (const [key, config] of Object.entries(template.params)) {
        if (config.type === "select" && config.options) {
          const value = config.options[Math.floor(Math.random() * config.options.length)];
          paramValues[key] = value;
          prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value);
        }
      }
      items.push({
        prompt,
        paramValues,
        params: { random: true }
      });
    }
  }
  return items;
}
function exportBatchResults(workflowId) {
  const workflow = getBatchWorkflow(workflowId);
  if (!workflow) return { success: false, error: "工作流不存在" };
  const data = {
    workflow: {
      name: workflow.name,
      type: workflow.type,
      stats: workflow.stats,
      completedAt: workflow.completedAt
    },
    results: workflow.results.map((r) => ({
      input: r.originalText || r.item,
      output: r.success ? r.result : null,
      error: r.success ? null : r.error,
      success: r.success
    }))
  };
  return {
    success: true,
    data,
    encoded: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  };
}
export {
  BatchStatus as B,
  createQuickBatch as a,
  exportBatchResults as b,
  cancelBatchWorkflow as c,
  deleteBatchWorkflow as d,
  executeBatchWorkflow as e,
  getBatchWorkflows as g,
  pauseBatchWorkflow as p,
  resumeBatchWorkflow as r
};
//# sourceMappingURL=BatchWorkflow-B5ou5SBm.js.map

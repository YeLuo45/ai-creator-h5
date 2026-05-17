import { g as getBatchWorkflows, a as createQuickBatch, B as BatchStatus, d as deleteBatchWorkflow, b as exportBatchResults, c as cancelBatchWorkflow, r as resumeBatchWorkflow, p as pauseBatchWorkflow, e as executeBatchWorkflow } from "./BatchWorkflow-B5ou5SBm.js";
import { g as getInstalledTemplates } from "./TemplateMarket-BFmIOwYb.js";
import { c as copyToClipboard } from "./PluginShare-CphKts8Q.js";
import "./TaskQueue-DOQ0hbkZ.js";
import "./index-zZBXRajj.js";
function createBatchWorkflowPanel() {
  const panel = document.createElement("div");
  panel.id = "batch-workflow-panel";
  const workflows = getBatchWorkflows();
  const templates = getInstalledTemplates();
  panel.innerHTML = `
    <div class="bwp-header">
      <span class="bwp-title">⚡ 批量工作流</span>
      <button class="bwp-close" data-action="close">×</button>
    </div>
    <div class="bwp-tabs">
      <button class="bwp-tab active" data-tab="list">📋 任务列表</button>
      <button class="bwp-tab" data-tab="create">➕ 快速创建</button>
    </div>
    <div class="bwp-content">
      <!-- 任务列表 -->
      <div class="bwp-tab-content active" id="bwp-tab-list">
        <div class="bwp-list" id="bwp-workflow-list">
          ${workflows.length === 0 ? '<p class="bwp-empty">暂无批量任务</p>' : ""}
        </div>
      </div>
      
      <!-- 快速创建 -->
      <div class="bwp-tab-content" id="bwp-tab-create" style="display:none;">
        <div class="bwp-create-form">
          <div class="bwp-field">
            <label>选择模板:</label>
            <select id="bwp-template-select">
              <option value="">-- 选择模板 --</option>
              ${templates.map((t) => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join("")}
            </select>
          </div>
          <div class="bwp-field">
            <label>生成模式:</label>
            <select id="bwp-mode-select">
              <option value="text-list">文本列表</option>
              <option value="range">数字范围</option>
              <option value="random">随机生成</option>
            </select>
          </div>
          <div class="bwp-mode-config" id="bwp-config-text-list" style="display:none;">
            <div class="bwp-field">
              <label>文本列表 (每行一个):</label>
              <textarea id="bwp-text-list" placeholder="输入1
输入2
输入3..."></textarea>
            </div>
          </div>
          <div class="bwp-mode-config" id="bwp-config-range" style="display:none;">
            <div class="bwp-field">
              <label>范围 (如 1-10):</label>
              <input type="text" id="bwp-range" placeholder="1-10" />
            </div>
          </div>
          <div class="bwp-mode-config" id="bwp-config-random" style="display:none;">
            <div class="bwp-field">
              <label>生成数量:</label>
              <input type="number" id="bwp-random-count" value="10" min="1" max="100" />
            </div>
          </div>
          <button class="bwp-btn" id="bwp-btn-create">创建任务</button>
        </div>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #batch-workflow-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 480px; max-height: 80vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1007; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .bwp-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .bwp-title { font-size: 15px; font-weight: 600; color: #fbbf24; }
    .bwp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .bwp-close:hover { color: #fff; }
    .bwp-tabs { display: flex; border-bottom: 1px solid #222; }
    .bwp-tab {
      flex: 1; padding: 10px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .bwp-tab:hover { color: #fff; }
    .bwp-tab.active { color: #fbbf24; border-bottom: 2px solid #fbbf24; }
    .bwp-content { flex: 1; overflow-y: auto; padding: 14px; }
    .bwp-tab-content { display: none; }
    .bwp-tab-content.active { display: block; }
    .bwp-list { display: flex; flex-direction: column; gap: 10px; }
    .bwp-item {
      padding: 12px; background: #12122a; border-radius: 8px;
      border: 1px solid #222;
    }
    .bwp-item-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .bwp-item-name { font-size: 14px; font-weight: 500; color: #fff; }
    .bwp-item-status {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
    }
    .bwp-item-status.pending { background: #666622; color: #fbbf24; }
    .bwp-item-status.running { background: #22c55e22; color: #22c55e; }
    .bwp-item-status.paused { background: #f59e0b22; color: #f59e0b; }
    .bwp-item-status.completed { background: #3b82f622; color: #3b82f6; }
    .bwp-item-status.cancelled { background: #dc262622; color: #dc2626; }
    .bwp-progress { margin-top: 8px; }
    .bwp-progress-bar {
      height: 6px; background: #333; border-radius: 3px; overflow: hidden;
    }
    .bwp-progress-fill {
      height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b);
      transition: width 0.3s;
    }
    .bwp-progress-text { font-size: 11px; color: #888; margin-top: 4px; }
    .bwp-item-actions { display: flex; gap: 6px; margin-top: 10px; }
    .bwp-btn {
      padding: 8px 14px; border: none; border-radius: 6px;
      font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .bwp-btn:not(.secondary) { background: #fbbf24; color: #000; }
    .bwp-btn.secondary { background: #333; color: #fff; }
    .bwp-btn:hover { opacity: 0.85; }
    .bwp-btn.danger { background: #dc2626; color: #fff; }
    .bwp-create-form { padding: 4px; }
    .bwp-field { margin-bottom: 14px; }
    .bwp-field label { display: block; font-size: 13px; color: #888; margin-bottom: 6px; }
    .bwp-field input, .bwp-field select, .bwp-field textarea {
      width: 100%; padding: 10px; background: #12122a; border: 1px solid #333;
      border-radius: 6px; color: #fff; font-size: 13px; font-family: inherit;
    }
    .bwp-field textarea { min-height: 80px; resize: vertical; }
    .bwp-field input:focus, .bwp-field select:focus, .bwp-field textarea:focus {
      outline: none; border-color: #fbbf24;
    }
    .bwp-empty { text-align: center; color: #666; padding: 30px; }
  `;
  document.head.appendChild(style);
  panel.querySelectorAll(".bwp-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      panel.querySelectorAll(".bwp-tab").forEach((t) => t.classList.remove("active"));
      panel.querySelectorAll(".bwp-tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      panel.querySelector(`#bwp-tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
  const workflowList = panel.querySelector("#bwp-workflow-list");
  function renderWorkflowList() {
    const workflows2 = getBatchWorkflows();
    if (workflows2.length === 0) {
      workflowList.innerHTML = '<p class="bwp-empty">暂无批量任务</p>';
      return;
    }
    workflowList.innerHTML = workflows2.map((w) => {
      const progress = w.stats.total > 0 ? w.stats.completed / w.stats.total * 100 : 0;
      const statusText = {
        [BatchStatus.PENDING]: "待开始",
        [BatchStatus.RUNNING]: "运行中",
        [BatchStatus.PAUSED]: "已暂停",
        [BatchStatus.COMPLETED]: "已完成",
        [BatchStatus.CANCELLED]: "已取消"
      };
      return `
        <div class="bwp-item" data-id="${w.id}">
          <div class="bwp-item-header">
            <span class="bwp-item-name">${w.name}</span>
            <span class="bwp-item-status ${w.status}">${statusText[w.status]}</span>
          </div>
          ${w.status === BatchStatus.RUNNING || w.status === BatchStatus.PAUSED || w.status === BatchStatus.COMPLETED ? `
            <div class="bwp-progress">
              <div class="bwp-progress-bar">
                <div class="bwp-progress-fill" style="width:${progress}%"></div>
              </div>
              <div class="bwp-progress-text">${w.stats.completed}/${w.stats.total} 完成 | 失败: ${w.stats.failed}</div>
            </div>
          ` : ""}
          <div class="bwp-item-actions">
            ${w.status === BatchStatus.PENDING ? `
              <button class="bwp-btn" data-action="run">▶️ 开始</button>
            ` : ""}
            ${w.status === BatchStatus.RUNNING ? `
              <button class="bwp-btn secondary" data-action="pause">⏸️ 暂停</button>
              <button class="bwp-btn danger" data-action="cancel">⏹️ 取消</button>
            ` : ""}
            ${w.status === BatchStatus.PAUSED ? `
              <button class="bwp-btn" data-action="resume">▶️ 恢复</button>
              <button class="bwp-btn danger" data-action="cancel">⏹️ 取消</button>
            ` : ""}
            ${w.status === BatchStatus.COMPLETED ? `
              <button class="bwp-btn secondary" data-action="export">📤 导出结果</button>
            ` : ""}
            <button class="bwp-btn secondary" data-action="delete">🗑️ 删除</button>
          </div>
        </div>
      `;
    }).join("");
    workflowList.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const item = btn.closest(".bwp-item");
        const workflowId = item.dataset.id;
        handleWorkflowAction(action, workflowId);
      });
    });
  }
  function handleWorkflowAction(action, workflowId) {
    switch (action) {
      case "run":
        executeBatchWorkflow(workflowId, async (item, index, workflow) => {
          var _a;
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { success: true, result: `Generated: ${(_a = item.prompt) == null ? void 0 : _a.slice(0, 30)}...` };
        });
        renderWorkflowList();
        break;
      case "pause":
        pauseBatchWorkflow(workflowId);
        renderWorkflowList();
        break;
      case "resume":
        resumeBatchWorkflow(workflowId);
        renderWorkflowList();
        break;
      case "cancel":
        cancelBatchWorkflow(workflowId);
        renderWorkflowList();
        break;
      case "export":
        const exportResult = exportBatchResults(workflowId);
        if (exportResult.success) {
          copyToClipboard(exportResult.encoded);
          alert("结果已复制到剪贴板");
        }
        break;
      case "delete":
        if (confirm("确定删除此任务？")) {
          deleteBatchWorkflow(workflowId);
          renderWorkflowList();
        }
        break;
    }
  }
  const modeSelect = panel.querySelector("#bwp-mode-select");
  const modeConfigs = panel.querySelectorAll(".bwp-mode-config");
  modeSelect.addEventListener("change", () => {
    const mode = modeSelect.value;
    modeConfigs.forEach((config) => {
      config.style.display = config.id === `bwp-config-${mode}` ? "block" : "none";
    });
  });
  const btnCreate = panel.querySelector("#bwp-btn-create");
  btnCreate.addEventListener("click", () => {
    const templateId = panel.querySelector("#bwp-template-select").value;
    const mode = panel.querySelector("#bwp-mode-select").value;
    if (!templateId) {
      alert("请选择模板");
      return;
    }
    let params = {};
    if (mode === "text-list") {
      const textList = panel.querySelector("#bwp-text-list").value.split("\n").filter((t) => t.trim());
      if (textList.length === 0) {
        alert("请输入文本列表");
        return;
      }
      params.textList = textList;
    } else if (mode === "range") {
      const range = panel.querySelector("#bwp-range").value;
      if (!/^\d+-\d+$/.test(range)) {
        alert("请输入正确格式的范围，如 1-10");
        return;
      }
      params.range = range;
    } else if (mode === "random") {
      params.count = parseInt(panel.querySelector("#bwp-random-count").value) || 10;
    }
    const result = createQuickBatch(templateId, params);
    if (result.success) {
      panel.querySelectorAll(".bwp-tab").forEach((t) => t.classList.remove("active"));
      panel.querySelectorAll(".bwp-tab-content").forEach((c) => c.classList.remove("active"));
      panel.querySelector('[data-tab="list"]').classList.add("active");
      panel.querySelector("#bwp-tab-list").classList.add("active");
      renderWorkflowList();
    } else {
      alert(result.error);
    }
  });
  const progressHandler = () => renderWorkflowList();
  window.addEventListener("batch-workflow-progress", progressHandler);
  window.addEventListener("batch-workflow-complete", progressHandler);
  panel._progressHandler = progressHandler;
  renderWorkflowList();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => {
    window.removeEventListener("batch-workflow-progress", panel._progressHandler);
    window.removeEventListener("batch-workflow-complete", panel._progressHandler);
    panel.remove();
  });
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createBatchWorkflowPanel
};
//# sourceMappingURL=BatchWorkflowPanel-BmLGxQTA.js.map

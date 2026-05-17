import { t as taskQueue, T as TaskStatus } from "./TaskQueue-DOQ0hbkZ.js";
function createTaskQueuePanel() {
  const panel = document.createElement("div");
  panel.id = "task-queue-panel";
  const status = taskQueue.getStatus();
  panel.innerHTML = `
    <div class="tq-header">
      <span class="tq-title">⚡ 任务队列</span>
      <button class="tq-close" data-action="close">×</button>
    </div>
    <div class="tq-stats">
      <span class="tq-stat">
        <span class="tq-stat-value" id="tq-pending">${status.pending}</span>
        <span class="tq-stat-label">等待</span>
      </span>
      <span class="tq-stat">
        <span class="tq-stat-value running" id="tq-running">${status.running}</span>
        <span class="tq-stat-label">运行中</span>
      </span>
      <span class="tq-stat">
        <span class="tq-stat-value success" id="tq-completed">${status.completed}</span>
        <span class="tq-stat-label">完成</span>
      </span>
      <span class="tq-stat">
        <span class="tq-stat-value error" id="tq-failed">${status.failed}</span>
        <span class="tq-stat-label">失败</span>
      </span>
    </div>
    <div class="tq-actions">
      <button class="tq-btn" id="tq-cancel-all">取消全部</button>
      <button class="tq-btn" id="tq-cleanup">清空已完成</button>
    </div>
    <div class="tq-list" id="tq-list"></div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #task-queue-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 440px; max-height: 70vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .tq-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .tq-title { font-size: 15px; font-weight: 600; color: #fbbf24; }
    .tq-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .tq-close:hover { color: #fff; }
    .tq-stats {
      display: flex; justify-content: space-around; padding: 12px;
      border-bottom: 1px solid #222;
    }
    .tq-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .tq-stat-value { font-size: 20px; font-weight: 700; }
    .tq-stat-value.running { color: #60a5fa; }
    .tq-stat-value.success { color: #4ade80; }
    .tq-stat-value.error { color: #dc2626; }
    .tq-stat-label { font-size: 11px; color: #888; }
    .tq-actions {
      display: flex; gap: 8px; padding: 10px 12px;
      border-bottom: 1px solid #222;
    }
    .tq-btn {
      flex: 1; padding: 6px 10px; border: 1px solid #333; border-radius: 4px;
      background: transparent; color: #fff; font-size: 12px; cursor: pointer;
    }
    .tq-btn:hover { background: #252540; }
    .tq-btn#tq-cancel-all { border-color: #dc262666; color: #dc2626; }
    .tq-btn#tq-cleanup { border-color: #4ade8066; color: #4ade80; }
    .tq-list { flex: 1; overflow-y: auto; padding: 10px 12px; }
    .tq-empty { text-align: center; color: #666; font-size: 13px; padding: 30px; }
    .tq-item {
      padding: 10px 12px; background: #12122a; border-radius: 6px; margin-bottom: 6px;
      border: 1px solid #222;
    }
    .tq-item.running { border-color: #60a5fa44; }
    .tq-item.completed { border-color: #4ade8044; }
    .tq-item.failed { border-color: #dc262644; }
    .tq-item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .tq-item-name { font-size: 13px; font-weight: 500; color: #fff; }
    .tq-item-status {
      font-size: 11px; padding: 2px 6px; border-radius: 3px;
    }
    .tq-item-status.pending { background: #88882222; color: #fbbf24; }
    .tq-item-status.running { background: #60a5fa22; color: #60a5fa; }
    .tq-item-status.completed { background: #4ade8022; color: #4ade80; }
    .tq-item-status.failed { background: #dc262622; color: #dc2626; }
    .tq-item-status.cancelled { background: #66662222; color: #888; }
    .tq-item-progress {
      height: 4px; background: #333; border-radius: 2px; margin: 6px 0;
      overflow: hidden;
    }
    .tq-item-progress-bar {
      height: 100%; background: #60a5fa; transition: width 0.2s;
    }
    .tq-item-meta { display: flex; justify-content: space-between; font-size: 11px; color: #666; }
    .tq-item-actions { display: flex; gap: 4px; margin-top: 6px; }
    .tq-item-btn {
      padding: 4px 8px; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;
      background: #333; color: #fff;
    }
    .tq-item-btn.cancel { background: #dc262622; color: #dc2626; }
  `;
  document.head.appendChild(style);
  const tqList = panel.querySelector("#tq-list");
  const statusMap = {
    [TaskStatus.PENDING]: "pending",
    [TaskStatus.RUNNING]: "running",
    [TaskStatus.COMPLETED]: "completed",
    [TaskStatus.FAILED]: "failed",
    [TaskStatus.CANCELLED]: "cancelled"
  };
  const statusLabelMap = {
    [TaskStatus.PENDING]: "等待",
    [TaskStatus.RUNNING]: "运行中",
    [TaskStatus.COMPLETED]: "完成",
    [TaskStatus.FAILED]: "失败",
    [TaskStatus.CANCELLED]: "已取消"
  };
  const render = () => {
    const tasks = taskQueue.getAllTasks().slice().reverse();
    const s = taskQueue.getStatus();
    panel.querySelector("#tq-pending").textContent = s.pending;
    panel.querySelector("#tq-running").textContent = s.running;
    panel.querySelector("#tq-completed").textContent = s.completed;
    panel.querySelector("#tq-failed").textContent = s.failed;
    if (tasks.length === 0) {
      tqList.innerHTML = '<p class="tq-empty">暂无任务</p>';
      return;
    }
    tqList.innerHTML = tasks.map((task) => `
      <div class="tq-item ${statusMap[task.status]}">
        <div class="tq-item-header">
          <span class="tq-item-name">${task.name}</span>
          <span class="tq-item-status ${statusMap[task.status]}">${statusLabelMap[task.status]}</span>
        </div>
        ${task.status === TaskStatus.RUNNING ? `
          <div class="tq-item-progress">
            <div class="tq-item-progress-bar" style="width:${task.progress}%"></div>
          </div>
        ` : ""}
        <div class="tq-item-meta">
          <span>${new Date(task.createdAt).toLocaleTimeString()}</span>
          ${task.error ? `<span style="color:#dc2626">${task.error.message}</span>` : ""}
        </div>
        ${task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED ? `
          <div class="tq-item-actions">
            <button class="tq-item-btn cancel" data-action="cancel" data-id="${task.id}">取消</button>
          </div>
        ` : ""}
      </div>
    `).join("");
    tqList.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        taskQueue.cancel(btn.dataset.id);
        render();
      });
    });
  };
  const unsubscribers = [];
  taskQueue.getAllTasks().forEach((task) => {
    const unsub = taskQueue.subscribe(task.id, () => render());
    unsubscribers.push(unsub);
  });
  const intervalId = setInterval(render, 1e3);
  panel.querySelector("#tq-cancel-all").addEventListener("click", () => {
    if (confirm("确定要取消所有任务吗？")) {
      taskQueue.cancelAll();
      render();
    }
  });
  panel.querySelector("#tq-cleanup").addEventListener("click", () => {
    taskQueue.cleanup(true);
    render();
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => {
    clearInterval(intervalId);
    unsubscribers.forEach((unsub) => unsub());
    panel.remove();
  });
  panel.addEventListener("click", (e) => e.stopPropagation());
  render();
  return panel;
}
export {
  createTaskQueuePanel
};
//# sourceMappingURL=TaskQueuePanel-jcJPAfbG.js.map

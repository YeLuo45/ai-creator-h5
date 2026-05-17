import { getStorageStats, exportAllData, importData, cleanupOldData } from "./OfflineStorage--KIH4Fbv.js";
function createStorageStatsPanel() {
  const stats = getStorageStats();
  const panel = document.createElement("div");
  panel.id = "storage-stats-panel";
  panel.innerHTML = `
    <div class="ss-header">
      <span class="ss-title">💾 本地存储管理</span>
      <button class="ss-close" data-action="close">×</button>
    </div>
    <div class="ss-content">
      <div class="ss-overview">
        <div class="ss-total">
          <span class="ss-total-label">总占用</span>
          <span class="ss-total-value">${stats.totalSizeFormatted}</span>
        </div>
        <div class="ss-bar">
          <div class="ss-bar-history" style="width:${stats.totalSize > 0 ? (stats.historySize / stats.totalSize * 100).toFixed(1) : 0}%"></div>
          <div class="ss-bar-versions" style="width:${stats.totalSize > 0 ? (stats.versionsSize / stats.totalSize * 100).toFixed(1) : 0}%"></div>
        </div>
      </div>
      <div class="ss-details">
        <div class="ss-item">
          <span class="ss-item-label">历史记录</span>
          <span class="ss-item-value">${stats.historyCount} 条 (${stats.historySize})</span>
        </div>
        <div class="ss-item">
          <span class="ss-item-label">版本快照</span>
          <span class="ss-item-value">${stats.versionsCount} 个 (${stats.versionsSize})</span>
        </div>
      </div>
      <div class="ss-actions">
        <button class="ss-btn" id="ss-export">📤 导出数据</button>
        <button class="ss-btn" id="ss-import">📥 导入数据</button>
        <button class="ss-btn" id="ss-cleanup">🗑️ 清理30天前</button>
      </div>
      <div class="ss-auto-save">
        <label>
          <input type="checkbox" id="ss-auto-save" checked />
          自动保存 (每30秒)
        </label>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #storage-stats-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 400px; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif;
    }
    .ss-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .ss-title { font-size: 15px; font-weight: 600; color: #38bdf8; }
    .ss-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .ss-close:hover { color: #fff; }
    .ss-content { padding: 16px; }
    .ss-overview { margin-bottom: 16px; }
    .ss-total { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .ss-total-label { color: #888; font-size: 13px; }
    .ss-total-value { color: #38bdf8; font-size: 18px; font-weight: 600; }
    .ss-bar {
      height: 8px; background: #333; border-radius: 4px; overflow: hidden;
      display: flex;
    }
    .ss-bar-history { background: #4ade80; height: 100%; }
    .ss-bar-versions { background: #60a5fa; height: 100%; }
    .ss-details { margin-bottom: 16px; }
    .ss-item {
      display: flex; justify-content: space-between; padding: 8px 0;
      border-bottom: 1px solid #222;
    }
    .ss-item:last-child { border-bottom: none; }
    .ss-item-label { color: #888; font-size: 13px; }
    .ss-item-value { color: #fff; font-size: 13px; }
    .ss-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .ss-btn {
      flex: 1; padding: 8px; border: 1px solid #333; border-radius: 6px;
      background: transparent; color: #fff; font-size: 12px; cursor: pointer;
      transition: background 0.15s;
    }
    .ss-btn:hover { background: #252540; }
    .ss-auto-save { font-size: 13px; color: #888; }
    .ss-auto-save input { margin-right: 6px; }
  `;
  document.head.appendChild(style);
  panel.querySelector("#ss-export").addEventListener("click", () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-creator-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  panel.querySelector("#ss-import").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          importData(data);
          alert("数据导入成功！");
          panel.remove();
        } catch (err) {
          alert("导入失败: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
  panel.querySelector("#ss-cleanup").addEventListener("click", () => {
    if (confirm("确定要清理30天前的数据吗？")) {
      cleanupOldData(30);
      alert("清理完成");
      panel.remove();
    }
  });
  panel.querySelector("#ss-auto-save").addEventListener("change", (e) => {
    const settings = { autoSave: e.target.checked };
    localStorage.setItem("ai-creator-settings", JSON.stringify(settings));
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createStorageStatsPanel
};
//# sourceMappingURL=StorageStatsPanel-BDx6Pm1D.js.map

import { g as getAllRatings, a as getFavorites } from "./index-zZBXRajj.js";
import { g as getInstalledTemplates } from "./TemplateMarket-BFmIOwYb.js";
import { g as getBatchWorkflows } from "./BatchWorkflow-B5ou5SBm.js";
import { getHistory } from "./OfflineStorage--KIH4Fbv.js";
import { c as copyToClipboard } from "./PluginShare-CphKts8Q.js";
import "./TaskQueue-DOQ0hbkZ.js";
const SYNC_KEY = "ai-creator-sync-state";
const LAST_SYNC_KEY = "ai-creator-last-sync";
const SyncDataType = {
  FAVORITES: "favorites",
  RATINGS: "ratings",
  TEMPLATES: "templates",
  WORKFLOWS: "workflows",
  HISTORY: "history",
  SETTINGS: "settings"
};
const SyncStatus = {
  SYNCING: "syncing",
  SUCCESS: "success",
  ERROR: "error"
};
function createSyncSnapshot() {
  return {
    version: "1.0",
    timestamp: Date.now(),
    deviceId: getDeviceId(),
    data: {
      [SyncDataType.FAVORITES]: getFavorites(),
      [SyncDataType.RATINGS]: getAllRatings(),
      [SyncDataType.TEMPLATES]: getInstalledTemplates(),
      [SyncDataType.WORKFLOWS]: getBatchWorkflows(),
      [SyncDataType.HISTORY]: getHistory(),
      [SyncDataType.SETTINGS]: getSettings()
    }
  };
}
function getDeviceId() {
  let deviceId = localStorage.getItem("ai-creator-device-id");
  if (!deviceId) {
    deviceId = "device-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("ai-creator-device-id", deviceId);
  }
  return deviceId;
}
function getSettings() {
  try {
    const data = localStorage.getItem("ai-creator-settings");
    return data ? JSON.parse(data) : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}
function getDefaultSettings() {
  return {
    theme: "dark",
    autoSave: true,
    maxHistory: 100,
    defaultType: "image"
  };
}
function saveSettings(settings) {
  localStorage.setItem("ai-creator-settings", JSON.stringify(settings));
  updateLastSyncTime();
}
function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_KEY) || null;
}
function updateLastSyncTime() {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}
function exportSyncData() {
  const snapshot = createSyncSnapshot();
  return {
    success: true,
    data: snapshot,
    encoded: btoa(unescape(encodeURIComponent(JSON.stringify(snapshot, null, 2))))
  };
}
function importSyncData(encodedOrData) {
  try {
    let data;
    if (typeof encodedOrData === "string") {
      try {
        data = JSON.parse(decodeURIComponent(escape(atob(encodedOrData))));
      } catch {
        data = JSON.parse(encodedOrData);
      }
    } else {
      data = encodedOrData;
    }
    if (!data.version || !data.data) {
      return { success: false, error: "无效的同步数据" };
    }
    const results = applySyncData(data.data);
    updateLastSyncTime();
    return {
      success: true,
      imported: results,
      timestamp: data.timestamp
    };
  } catch (e) {
    return { success: false, error: "解析失败: " + e.message };
  }
}
function applySyncData(syncData) {
  const results = {};
  if (syncData[SyncDataType.FAVORITES]) {
    const currentFavs = JSON.parse(localStorage.getItem("tool-favorites") || "[]");
    const incomingFavs = syncData[SyncDataType.FAVORITES];
    const mergedFavs = [.../* @__PURE__ */ new Set([...currentFavs, ...incomingFavs])];
    localStorage.setItem("tool-favorites", JSON.stringify(mergedFavs));
    results[SyncDataType.FAVORITES] = mergedFavs.length;
  }
  if (syncData[SyncDataType.RATINGS]) {
    const currentRatings = JSON.parse(localStorage.getItem("tool-ratings") || "{}");
    const incomingRatings = syncData[SyncDataType.RATINGS];
    const mergedRatings = { ...currentRatings, ...incomingRatings };
    localStorage.setItem("tool-ratings", JSON.stringify(mergedRatings));
    results[SyncDataType.RATINGS] = Object.keys(mergedRatings).length;
  }
  if (syncData[SyncDataType.TEMPLATES]) {
    localStorage.setItem("ai-creator-templates-installed", JSON.stringify(syncData[SyncDataType.TEMPLATES]));
    results[SyncDataType.TEMPLATES] = syncData[SyncDataType.TEMPLATES].length;
  }
  if (syncData[SyncDataType.WORKFLOWS]) {
    localStorage.setItem("ai-creator-batch-workflows", JSON.stringify(syncData[SyncDataType.WORKFLOWS]));
    results[SyncDataType.WORKFLOWS] = syncData[SyncDataType.WORKFLOWS].length;
  }
  if (syncData[SyncDataType.HISTORY] && Array.isArray(syncData[SyncDataType.HISTORY])) {
    const currentHistory = getHistory();
    const incomingHistory = syncData[SyncDataType.HISTORY];
    const existingIds = new Set(currentHistory.map((h) => h.id));
    const newItems = incomingHistory.filter((h) => !existingIds.has(h.id));
    const mergedHistory = [...currentHistory, ...newItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);
    localStorage.setItem("offline-history", JSON.stringify(mergedHistory));
    results[SyncDataType.HISTORY] = newItems.length;
  }
  if (syncData[SyncDataType.SETTINGS]) {
    saveSettings(syncData[SyncDataType.SETTINGS]);
    results[SyncDataType.SETTINGS] = 1;
  }
  return results;
}
let statusListeners = [];
function setSyncStatus(status) {
  statusListeners.forEach((fn) => fn(status));
}
function onSyncStatusChange(fn) {
  statusListeners.push(fn);
  return () => {
    statusListeners = statusListeners.filter((f) => f !== fn);
  };
}
function getSyncStats() {
  const lastSync = getLastSyncTime();
  const snapshot = createSyncSnapshot();
  return {
    lastSyncTime: lastSync ? parseInt(lastSync) : null,
    dataCounts: {
      favorites: snapshot.data[SyncDataType.FAVORITES].length,
      ratings: Object.keys(snapshot.data[SyncDataType.RATINGS] || {}).length,
      templates: snapshot.data[SyncDataType.TEMPLATES].length,
      workflows: snapshot.data[SyncDataType.WORKFLOWS].length,
      history: snapshot.data[SyncDataType.HISTORY].length
    },
    deviceId: snapshot.deviceId
  };
}
function clearSyncState() {
  localStorage.removeItem(SYNC_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}
function createCloudSyncPanel() {
  const panel = document.createElement("div");
  panel.id = "cloud-sync-panel";
  const stats = getSyncStats();
  panel.innerHTML = `
    <div class="csp-header">
      <span class="csp-title">☁️ 云端同步</span>
      <button class="csp-close" data-action="close">×</button>
    </div>
    <div class="csp-content">
      <!-- 同步状态卡片 -->
      <div class="csp-status-card">
        <div class="csp-status-icon">${getStatusIcon(stats.lastSyncTime)}</div>
        <div class="csp-status-info">
          <div class="csp-status-label">${getStatusLabel(stats.lastSyncTime)}</div>
          <div class="csp-status-time">${getLastSyncText(stats.lastSyncTime)}</div>
        </div>
        <div class="csp-device-id">设备: ${stats.deviceId.slice(0, 12)}...</div>
      </div>
      
      <!-- 数据统计 -->
      <div class="csp-stats">
        <div class="csp-stat-item">
          <span class="csp-stat-value">${stats.dataCounts.favorites}</span>
          <span class="csp-stat-label">收藏</span>
        </div>
        <div class="csp-stat-item">
          <span class="csp-stat-value">${stats.dataCounts.ratings}</span>
          <span class="csp-stat-label">评分</span>
        </div>
        <div class="csp-stat-item">
          <span class="csp-stat-value">${stats.dataCounts.templates}</span>
          <span class="csp-stat-label">模板</span>
        </div>
        <div class="csp-stat-item">
          <span class="csp-stat-value">${stats.dataCounts.workflows}</span>
          <span class="csp-stat-label">工作流</span>
        </div>
        <div class="csp-stat-item">
          <span class="csp-stat-value">${stats.dataCounts.history}</span>
          <span class="csp-stat-label">历史</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="csp-actions">
        <button class="csp-btn" id="csp-btn-export">
          <span class="csp-btn-icon">📤</span>
          <span class="csp-btn-text">导出到云端</span>
        </button>
        <button class="csp-btn" id="csp-btn-import">
          <span class="csp-btn-icon">📥</span>
          <span class="csp-btn-text">从云端导入</span>
        </button>
        <button class="csp-btn" id="csp-btn-merge">
          <span class="csp-btn-icon">🔀</span>
          <span class="csp-btn-text">智能合并</span>
        </button>
      </div>
      
      <!-- 同步日志 -->
      <div class="csp-log">
        <div class="csp-log-header">同步记录</div>
        <div class="csp-log-content" id="csp-log-content">
          <p class="csp-log-empty">暂无同步记录</p>
        </div>
      </div>
      
      <!-- 高级功能 -->
      <div class="csp-advanced">
        <button class="csp-advanced-toggle" id="csp-advanced-toggle">
          ⚙️ 高级选项 ▼
        </button>
        <div class="csp-advanced-content" id="csp-advanced-content" style="display:none;">
          <div class="csp-field">
            <label>导入同步数据:</label>
            <textarea id="csp-import-textarea" placeholder="粘贴云端导出的同步数据..."></textarea>
          </div>
          <button class="csp-btn secondary" id="csp-btn-import-raw">确认导入</button>
          <div class="csp-danger-zone">
            <button class="csp-btn danger" id="csp-btn-clear">🗑️ 清除同步状态</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #cloud-sync-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 420px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1008; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .csp-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .csp-title { font-size: 15px; font-weight: 600; color: #60a5fa; }
    .csp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .csp-close:hover { color: #fff; }
    .csp-content { flex: 1; overflow-y: auto; padding: 16px; }
    .csp-status-card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; background: #12122a; border-radius: 10px;
      margin-bottom: 16px; border: 1px solid #222;
    }
    .csp-status-icon { font-size: 28px; }
    .csp-status-info { flex: 1; }
    .csp-status-label { font-size: 14px; font-weight: 500; color: #fff; }
    .csp-status-time { font-size: 12px; color: #888; margin-top: 2px; }
    .csp-device-id { font-size: 10px; color: #666; }
    .csp-stats {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
      margin-bottom: 16px;
    }
    .csp-stat-item {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 4px; background: #12122a; border-radius: 8px;
    }
    .csp-stat-value { font-size: 18px; font-weight: 600; color: #60a5fa; }
    .csp-stat-label { font-size: 10px; color: #888; margin-top: 2px; }
    .csp-actions {
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 16px;
    }
    .csp-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 12px 14px; border: none; border-radius: 8px;
      font-size: 13px; cursor: pointer; transition: all 0.15s;
      background: #60a5fa22; color: #60a5fa; border: 1px solid #60a5fa44;
    }
    .csp-btn:hover { background: #60a5fa33; }
    .csp-btn.secondary { background: #333; color: #fff; border-color: #333; }
    .csp-btn.secondary:hover { background: #444; }
    .csp-btn.danger { background: #dc262622; color: #dc2626; border-color: #dc262644; }
    .csp-btn.danger:hover { background: #dc262633; }
    .csp-btn-icon { font-size: 18px; }
    .csp-log {
      margin-bottom: 16px;
    }
    .csp-log-header { font-size: 12px; color: #888; margin-bottom: 8px; }
    .csp-log-content {
      max-height: 100px; overflow-y: auto;
      padding: 10px; background: #0a0a1a; border-radius: 6px;
      font-size: 11px; color: #888;
    }
    .csp-log-empty { color: #666; text-align: center; }
    .csp-log-entry { padding: 4px 0; border-bottom: 1px solid #1a1a2a; }
    .csp-log-entry:last-child { border-bottom: none; }
    .csp-log-time { color: #666; margin-right: 6px; }
    .csp-log-success { color: #34d399; }
    .csp-log-error { color: #dc2626; }
    .csp-advanced { border-top: 1px solid #222; padding-top: 14px; }
    .csp-advanced-toggle {
      width: 100%; padding: 8px; border: none; background: transparent;
      color: #888; font-size: 12px; cursor: pointer; text-align: left;
    }
    .csp-advanced-toggle:hover { color: #fff; }
    .csp-advanced-content { padding-top: 12px; }
    .csp-field { margin-bottom: 12px; }
    .csp-field label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; }
    .csp-field textarea {
      width: 100%; min-height: 60px; padding: 8px;
      background: #0a0a1a; border: 1px solid #333; border-radius: 6px;
      color: #fff; font-size: 12px; font-family: inherit; resize: vertical;
    }
    .csp-field textarea:focus { outline: none; border-color: #60a5fa; }
    .csp-danger-zone { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #333; }
    .csp-result {
      padding: 10px; border-radius: 6px; margin-top: 12px; font-size: 12px;
    }
    .csp-result.success { background: #34d39922; color: #34d399; }
    .csp-result.error { background: #dc262622; color: #dc2626; }
    .csp-result.info { background: #60a5fa22; color: #60a5fa; }
  `;
  document.head.appendChild(style);
  const logContent = panel.querySelector("#csp-log-content");
  const resultArea = document.createElement("div");
  panel.querySelector(".csp-content").appendChild(resultArea);
  function addLog(message, type = "info") {
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = "csp-log-entry";
    entry.innerHTML = `<span class="csp-log-time">${time}</span><span class="csp-log-${type}">${message}</span>`;
    if (logContent.querySelector(".csp-log-empty")) {
      logContent.innerHTML = "";
    }
    logContent.insertBefore(entry, logContent.firstChild);
  }
  function showResult(message, type = "success") {
    resultArea.innerHTML = `<div class="csp-result ${type}">${message}</div>`;
    setTimeout(() => {
      if (resultArea) resultArea.innerHTML = "";
    }, 3e3);
  }
  panel.querySelector("#csp-btn-export").addEventListener("click", async () => {
    setSyncStatus(SyncStatus.SYNCING);
    addLog("正在导出同步数据...", "info");
    await new Promise((r) => setTimeout(r, 500));
    const result = exportSyncData();
    {
      await copyToClipboard(result.encoded);
      setSyncStatus(SyncStatus.SUCCESS);
      addLog("同步数据已导出并复制到剪贴板", "success");
      showResult("✅ 同步数据已复制到剪贴板，可保存到云端");
    }
  });
  panel.querySelector("#csp-btn-import").addEventListener("click", () => {
    const textarea = panel.querySelector("#csp-import-textarea");
    textarea.style.display = textarea.style.display === "none" ? "block" : "none";
  });
  panel.querySelector("#csp-btn-merge").addEventListener("click", async () => {
    const textarea = panel.querySelector("#csp-import-textarea");
    const input = textarea.value.trim();
    if (!input) {
      showResult("请先粘贴要合并的同步数据", "error");
      return;
    }
    setSyncStatus(SyncStatus.SYNCING);
    addLog("正在进行智能合并...", "info");
    await new Promise((r) => setTimeout(r, 500));
    const result = importSyncData(input);
    if (result.success) {
      setSyncStatus(SyncStatus.SUCCESS);
      const imported = result.imported;
      const details = Object.entries(imported).map(([k, v]) => `${k}: ${v}`).join(", ");
      addLog(`合并成功: ${details}`, "success");
      showResult(`✅ 合并成功！已导入 ${Object.keys(imported).length} 种数据类型`);
      const newStats = getSyncStats();
      panel.querySelectorAll(".csp-stat-value").forEach((el, i) => {
        const values = Object.values(newStats.dataCounts);
        if (values[i] !== void 0) el.textContent = values[i];
      });
    } else {
      setSyncStatus(SyncStatus.ERROR);
      addLog("合并失败: " + result.error, "error");
      showResult("❌ " + result.error, "error");
    }
    textarea.value = "";
  });
  panel.querySelector("#csp-btn-import-raw").addEventListener("click", async () => {
    const input = panel.querySelector("#csp-import-textarea").value.trim();
    if (!input) {
      showResult("请输入要导入的数据", "error");
      return;
    }
    setSyncStatus(SyncStatus.SYNCING);
    const result = importSyncData(input);
    if (result.success) {
      setSyncStatus(SyncStatus.SUCCESS);
      addLog("导入成功", "success");
      showResult("✅ 导入成功！");
    } else {
      setSyncStatus(SyncStatus.ERROR);
      addLog("导入失败: " + result.error, "error");
      showResult("❌ " + result.error, "error");
    }
  });
  panel.querySelector("#csp-advanced-toggle").addEventListener("click", () => {
    const content = panel.querySelector("#csp-advanced-content");
    const toggle = panel.querySelector("#csp-advanced-toggle");
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    toggle.innerHTML = isHidden ? "⚙️ 高级选项 ▲" : "⚙️ 高级选项 ▼";
  });
  panel.querySelector("#csp-btn-clear").addEventListener("click", () => {
    if (confirm("确定要清除同步状态吗？您的数据不会被删除。")) {
      clearSyncState();
      addLog("同步状态已清除", "info");
      showResult("同步状态已清除", "info");
    }
  });
  const statusUnsub = onSyncStatusChange((status) => {
    const icon = panel.querySelector(".csp-status-icon");
    if (status === SyncStatus.SYNCING) {
      icon.textContent = "🔄";
    } else if (status === SyncStatus.SUCCESS) {
      icon.textContent = "✅";
    } else if (status === SyncStatus.ERROR) {
      icon.textContent = "❌";
    }
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => {
    statusUnsub();
    panel.remove();
  });
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
function getStatusIcon(lastSyncTime) {
  if (!lastSyncTime) return "☁️";
  const diff = Date.now() - parseInt(lastSyncTime);
  if (diff < 6e4) return "✅";
  if (diff < 36e5) return "☁️";
  return "📅";
}
function getStatusLabel(lastSyncTime) {
  if (!lastSyncTime) return "未同步";
  const diff = Date.now() - parseInt(lastSyncTime);
  if (diff < 6e4) return "已同步";
  if (diff < 36e5) return "已同步";
  return "需同步";
}
function getLastSyncText(lastSyncTime) {
  if (!lastSyncTime) return "从未同步";
  const date = new Date(parseInt(lastSyncTime));
  return "上次同步: " + date.toLocaleString();
}
export {
  createCloudSyncPanel
};
//# sourceMappingURL=CloudSyncPanel-C5bNJ9PT.js.map

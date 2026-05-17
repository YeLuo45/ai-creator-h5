const STORAGE_PREFIX = "ai-creator-";
const HISTORY_KEY = STORAGE_PREFIX + "history";
const VERSIONS_KEY = STORAGE_PREFIX + "versions";
const SETTINGS_KEY = STORAGE_PREFIX + "settings";
function saveHistoryItem(item) {
  const history = getHistory() || [];
  const newItem = {
    id: item.id || Date.now().toString(36),
    ...item,
    savedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  history.unshift(newItem);
  if (history.length > 1e3) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return newItem;
}
function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : null;
}
function getHistoryItem(id) {
  const history = getHistory() || [];
  return history.find((h) => h.id === id);
}
function updateHistoryItem(id, updates) {
  const history = getHistory() || [];
  const idx = history.findIndex((h) => h.id === id);
  if (idx !== -1) {
    history[idx] = { ...history[idx], ...updates, savedAt: (/* @__PURE__ */ new Date()).toISOString() };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}
function deleteHistoryItem(id) {
  const history = getHistory() || [];
  const filtered = history.filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
function saveVersion(itemId, content, type = "draft") {
  const versions = getVersions(itemId) || [];
  const newVersion = {
    id: Date.now().toString(36),
    itemId,
    content,
    type,
    // 'draft' | 'published' | 'backup'
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  versions.unshift(newVersion);
  const itemVersions = versions.filter((v) => v.itemId === itemId);
  if (itemVersions.length > 50) {
    const toRemove = itemVersions.slice(50);
    toRemove.forEach((v) => {
      const idx = versions.findIndex((x) => x.id === v.id);
      if (idx !== -1) versions.splice(idx, 1);
    });
  }
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  return newVersion;
}
function getVersions(itemId) {
  const all = localStorage.getItem(VERSIONS_KEY);
  if (!all) return [];
  const versions = JSON.parse(all);
  return versions.filter((v) => v.itemId === itemId);
}
function getVersion(itemId, versionId) {
  const versions = getVersions(itemId) || [];
  return versions.find((v) => v.id === versionId);
}
function restoreVersion(itemId, versionId) {
  const version = getVersion(itemId, versionId);
  if (!version) return null;
  updateHistoryItem(itemId, { content: version.content });
  return version;
}
function deleteVersion(itemId, versionId) {
  const all = localStorage.getItem(VERSIONS_KEY);
  if (!all) return;
  const versions = JSON.parse(all);
  const filtered = versions.filter((v) => !(v.itemId === itemId && v.id === versionId));
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(filtered));
}
function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function getSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    autoSave: true,
    autoSaveInterval: 3e4,
    // 30秒
    maxHistory: 1e3,
    maxVersionsPerItem: 50
  };
}
function getStorageStats() {
  const historySize = (localStorage.getItem(HISTORY_KEY) || "").length;
  const versionsSize = (localStorage.getItem(VERSIONS_KEY) || "").length;
  const settingsSize = (localStorage.getItem(SETTINGS_KEY) || "").length;
  const totalSize = historySize + versionsSize + settingsSize;
  const historyCount = (getHistory() || []).length;
  const versionsCount = JSON.parse(localStorage.getItem(VERSIONS_KEY) || "[]").length;
  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    historySize: formatBytes(historySize),
    versionsSize: formatBytes(versionsSize),
    historyCount,
    versionsCount
  };
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function exportAllData() {
  return {
    history: getHistory(),
    versions: JSON.parse(localStorage.getItem(VERSIONS_KEY) || "[]"),
    settings: getSettings(),
    exportedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function importData(data) {
  if (data.history) localStorage.setItem(HISTORY_KEY, JSON.stringify(data.history));
  if (data.versions) localStorage.setItem(VERSIONS_KEY, JSON.stringify(data.versions));
  if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
}
function cleanupOldData(daysOld = 30) {
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const history = getHistory() || [];
  const filteredHistory = history.filter((h) => new Date(h.savedAt) > cutoff);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  const all = localStorage.getItem(VERSIONS_KEY);
  if (all) {
    const versions = JSON.parse(all);
    const filteredVersions = versions.filter((v) => new Date(v.createdAt) > cutoff);
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(filteredVersions));
  }
}
export {
  cleanupOldData,
  clearHistory,
  deleteHistoryItem,
  deleteVersion,
  exportAllData,
  getHistory,
  getHistoryItem,
  getSettings,
  getStorageStats,
  getVersion,
  getVersions,
  importData,
  restoreVersion,
  saveHistoryItem,
  saveSettings,
  saveVersion,
  updateHistoryItem
};
//# sourceMappingURL=OfflineStorage--KIH4Fbv.js.map

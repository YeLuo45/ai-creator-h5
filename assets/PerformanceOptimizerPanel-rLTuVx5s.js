import { i as initPerformanceOptimizer, g as getCacheStats, d as getUsageStats, a as getHotTools, c as clearCache, b as getMemoryUsage } from "./PerformanceOptimizer-CAwo3Qe8.js";
import "./index-zZBXRajj.js";
function createPerformanceOptimizerPanel() {
  const panel = document.createElement("div");
  panel.id = "perf-panel";
  initPerformanceOptimizer();
  let currentTab = "overview";
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  function formatTime(timestamp) {
    if (!timestamp) return "-";
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
  function render() {
    var _a;
    let content = '<div class="pp-header"><span class="pp-title">⚡ 性能优化</span><button class="pp-close" data-action="close">×</button></div><div class="pp-tabs"><button class="pp-tab ' + (currentTab === "overview" ? "active" : "") + '" data-tab="overview">📊 概览</button><button class="pp-tab ' + (currentTab === "cache" ? "active" : "") + '" data-tab="cache">💾 缓存</button><button class="pp-tab ' + (currentTab === "hot" ? "active" : "") + '" data-tab="hot">🔥 热门</button><button class="pp-tab ' + (currentTab === "memory" ? "active" : "") + '" data-tab="memory">🧠 内存</button></div><div class="pp-body">';
    if (currentTab === "overview") {
      const stats = getCacheStats();
      const usage = getUsageStats();
      const hotTools = getHotTools(5);
      content += '<div class="pp-section"><div class="pp-section-title">📊 缓存状态</div><div class="pp-stats-grid"><div class="pp-stat-card"><div class="pp-stat-value">' + stats.entries + '</div><div class="pp-stat-label">缓存条目</div></div><div class="pp-stat-card"><div class="pp-stat-value">' + formatBytes(stats.size) + '</div><div class="pp-stat-label">已用空间</div></div><div class="pp-stat-card"><div class="pp-stat-value">' + stats.usagePercent + '%</div><div class="pp-stat-label">使用率</div></div><div class="pp-stat-card"><div class="pp-stat-value">' + Object.keys(usage).length + '</div><div class="pp-stat-label">已统计工具</div></div></div></div>';
      content += '<div class="pp-section"><div class="pp-section-title">🔥 Top 5 热门工具</div>';
      if (hotTools.length > 0) {
        content += '<div class="pp-hot-list">';
        for (let i = 0; i < hotTools.length; i++) {
          const t = hotTools[i];
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
          content += '<div class="pp-hot-item"><div class="pp-hot-rank">' + medal + '</div><div class="pp-hot-info"><div class="pp-hot-name">' + t.toolId + '</div><div class="pp-hot-meta">使用 ' + t.count + " 次 · " + formatTime(t.lastUsed) + "</div></div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="pp-empty">暂无数据</div>';
      }
      content += "</div>";
    } else if (currentTab === "cache") {
      const stats = getCacheStats();
      content += '<div class="pp-section"><div class="pp-section-title">💾 缓存详情</div><div class="pp-cache-info"><div class="pp-cache-row"><span class="pp-cache-label">条目数量</span><span class="pp-cache-value">' + stats.entries + '</span></div><div class="pp-cache-row"><span class="pp-cache-label">已用空间</span><span class="pp-cache-value">' + formatBytes(stats.size) + '</span></div><div class="pp-cache-row"><span class="pp-cache-label">最大空间</span><span class="pp-cache-value">' + formatBytes(stats.maxSize) + '</span></div><div class="pp-cache-row"><span class="pp-cache-label">使用率</span><span class="pp-cache-value">' + stats.usagePercent + '%</span></div></div><div class="pp-cache-bar"><div class="pp-cache-fill" style="width: ' + stats.usagePercent + '%"></div></div></div><div class="pp-section"><button class="pp-btn danger" id="pp-clear-cache">🗑️ 清除所有缓存</button></div>';
    } else if (currentTab === "hot") {
      const hotTools = getHotTools(20);
      content += '<div class="pp-section"><div class="pp-section-title">🔥 热门工具排行 (Top 20)</div>';
      if (hotTools.length > 0) {
        content += '<div class="pp-hot-full-list">';
        for (let i = 0; i < hotTools.length; i++) {
          const t = hotTools[i];
          const barWidth = Math.round(t.count / hotTools[0].count * 100);
          content += '<div class="pp-hot-full-item"><div class="pp-hot-full-rank">' + (i + 1) + '</div><div class="pp-hot-full-info"><div class="pp-hot-full-name">' + t.toolId + '</div><div class="pp-hot-full-bar-container"><div class="pp-hot-full-bar" style="width: ' + barWidth + '%"></div></div></div><div class="pp-hot-full-count">' + t.count + " 次</div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="pp-empty">暂无使用数据</div>';
      }
      content += "</div>";
    } else if (currentTab === "memory") {
      const mem = getMemoryUsage();
      content += '<div class="pp-section"><div class="pp-section-title">🧠 内存使用</div>';
      if (mem) {
        content += '<div class="pp-memory-grid"><div class="pp-memory-card"><div class="pp-memory-value">' + formatBytes(mem.usedJSHeapSize) + '</div><div class="pp-memory-label">已使用堆</div></div><div class="pp-memory-card"><div class="pp-memory-value">' + formatBytes(mem.totalJSHeapSize) + '</div><div class="pp-memory-label">总堆大小</div></div><div class="pp-memory-card"><div class="pp-memory-value">' + formatBytes(mem.jsHeapSizeLimit) + '</div><div class="pp-memory-label">堆限制</div></div><div class="pp-memory-card"><div class="pp-memory-value">' + (mem.usedJSHeapSize / mem.jsHeapSizeLimit * 100).toFixed(1) + '%</div><div class="pp-memory-label">使用率</div></div></div>';
      } else {
        content += '<div class="pp-empty">浏览器不支持内存API (Chrome only)</div>';
      }
      content += "</div>";
    }
    content += "</div>";
    panel.innerHTML = content;
    panel.querySelectorAll(".pp-tab").forEach((tab) => {
      tab.addEventListener("click", function() {
        currentTab = this.dataset.tab;
        render();
      });
    });
    (_a = panel.querySelector("#pp-clear-cache")) == null ? void 0 : _a.addEventListener("click", function() {
      if (confirm("确定清除所有缓存？")) {
        clearCache();
        render();
        alert("缓存已清除");
      }
    });
  }
  const style = document.createElement("style");
  style.id = "perf-panel-style";
  style.textContent = [
    "#perf-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 440px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1013; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".pp-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".pp-title { font-size: 15px; font-weight: 600; color: #10b981; }",
    ".pp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".pp-close:hover { color: #fff; }",
    ".pp-tabs {",
    "display: flex; padding: 8px 10px; gap: 4px; border-bottom: 1px solid #222;",
    "background: #12122a;",
    "}",
    ".pp-tab {",
    "flex: 1; padding: 8px 4px; border: none; border-radius: 6px;",
    "background: transparent; color: #888; font-size: 12px; cursor: pointer;",
    "}",
    ".pp-tab:hover { background: #1a1a3a; }",
    ".pp-tab.active { background: #10b98122; color: #10b981; }",
    ".pp-body { flex: 1; overflow-y: auto; padding: 12px; }",
    ".pp-section { margin-bottom: 16px; }",
    ".pp-section-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".pp-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    ".pp-stat-card {",
    "padding: 12px; background: #12122a; border-radius: 8px; text-align: center;",
    "}",
    ".pp-stat-value { font-size: 18px; font-weight: 600; color: #10b981; }",
    ".pp-stat-label { font-size: 11px; color: #888; margin-top: 2px; }",
    ".pp-hot-list { display: flex; flex-direction: column; gap: 6px; }",
    ".pp-hot-item {",
    "display: flex; align-items: center; gap: 10px; padding: 8px 10px;",
    "background: #12122a; border-radius: 6px;",
    "}",
    ".pp-hot-rank { font-size: 14px; width: 24px; text-align: center; }",
    ".pp-hot-name { font-size: 13px; color: #fff; }",
    ".pp-hot-meta { font-size: 11px; color: #888; margin-top: 2px; }",
    ".pp-cache-info { background: #12122a; border-radius: 8px; padding: 12px; margin-bottom: 10px; }",
    ".pp-cache-row {",
    "display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #222;",
    "}",
    ".pp-cache-row:last-child { border-bottom: none; }",
    ".pp-cache-label { font-size: 12px; color: #888; }",
    ".pp-cache-value { font-size: 12px; color: #10b981; font-weight: 500; }",
    ".pp-cache-bar {",
    "height: 8px; background: #222; border-radius: 4px; overflow: hidden;",
    "}",
    ".pp-cache-fill {",
    "height: 100%; background: linear-gradient(90deg, #10b981, #34d399);",
    "border-radius: 4px; transition: width 0.3s;",
    "}",
    ".pp-btn {",
    "width: 100%; padding: 10px; border: 1px solid #333; border-radius: 8px;",
    "background: #1a1a2e; color: #fff; font-size: 13px; cursor: pointer;",
    "}",
    ".pp-btn:hover { background: #252540; }",
    ".pp-btn.danger { border-color: #dc262666; color: #dc2626; }",
    ".pp-btn.danger:hover { background: #dc262622; }",
    ".pp-empty { text-align: center; padding: 30px; color: #666; font-size: 13px; }",
    ".pp-hot-full-list { display: flex; flex-direction: column; gap: 4px; }",
    ".pp-hot-full-item {",
    "display: flex; align-items: center; gap: 8px; padding: 6px 8px;",
    "background: #12122a; border-radius: 4px;",
    "}",
    ".pp-hot-full-rank { font-size: 12px; width: 20px; color: #888; text-align: center; }",
    ".pp-hot-full-info { flex: 1; min-width: 0; }",
    ".pp-hot-full-name { font-size: 12px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".pp-hot-full-bar-container {",
    "height: 4px; background: #222; border-radius: 2px; margin-top: 4px;",
    "}",
    ".pp-hot-full-bar {",
    "height: 100%; background: linear-gradient(90deg, #f97316, #fbbf24); border-radius: 2px;",
    "}",
    ".pp-hot-full-count { font-size: 11px; color: #888; }",
    ".pp-memory-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    ".pp-memory-card {",
    "padding: 12px; background: #12122a; border-radius: 8px; text-align: center;",
    "}",
    ".pp-memory-value { font-size: 14px; font-weight: 600; color: #a78bfa; }",
    ".pp-memory-label { font-size: 11px; color: #888; margin-top: 2px; }"
  ].join("");
  if (!document.getElementById("perf-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createPerformanceOptimizerPanel
};
//# sourceMappingURL=PerformanceOptimizerPanel-rLTuVx5s.js.map

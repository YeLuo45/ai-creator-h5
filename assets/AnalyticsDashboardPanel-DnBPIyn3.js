import { d as getUsageStats, a as getHotTools } from "./PerformanceOptimizer-CAwo3Qe8.js";
import "./index-zZBXRajj.js";
const EVENTS_KEY = "ai-creator-events";
const EventType = {
  TOOL_USE: "tool_use"
};
function initAnalytics() {
  restoreEvents();
  setInterval(cleanOldEvents, 24 * 60 * 60 * 1e3);
  console.log("[Analytics] Initialized");
}
function getEventStats(range = "day") {
  const events = getAllEvents();
  const now = Date.now();
  let startTime;
  switch (range) {
    case "hour":
      startTime = now - 60 * 60 * 1e3;
      break;
    case "day":
      startTime = now - 24 * 60 * 60 * 1e3;
      break;
    case "week":
      startTime = now - 7 * 24 * 60 * 60 * 1e3;
      break;
    case "month":
      startTime = now - 30 * 24 * 60 * 60 * 1e3;
      break;
    default:
      startTime = now - 24 * 60 * 60 * 1e3;
  }
  const filtered = events.filter((e) => e.timestamp >= startTime);
  const byType = {};
  for (const event of filtered) {
    byType[event.type] = (byType[event.type] || 0) + 1;
  }
  const byTime = {};
  for (const event of filtered) {
    let key;
    if (range === "hour") {
      key = new Date(event.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit" });
    } else {
      key = new Date(event.timestamp).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    }
    byTime[key] = (byTime[key] || 0) + 1;
  }
  return {
    total: filtered.length,
    byType,
    byTime,
    startTime,
    endTime: now
  };
}
function getToolUsageTrend(days = 7) {
  var _a;
  getUsageStats();
  const allEvents = getAllEvents();
  const now = Date.now();
  const trends = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - i * 24 * 60 * 60 * 1e3;
    const dayEnd = dayStart + 24 * 60 * 60 * 1e3;
    const dayEvents = allEvents.filter(
      (e) => e.timestamp >= dayStart && e.timestamp < dayEnd && e.type === EventType.TOOL_USE
    );
    const toolCounts = {};
    for (const event of dayEvents) {
      const toolId = event.data.toolId;
      toolCounts[toolId] = (toolCounts[toolId] || 0) + 1;
    }
    trends.push({
      date: new Date(dayStart).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      total: dayEvents.length,
      tools: toolCounts,
      topTool: ((_a = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]) == null ? void 0 : _a[0]) || null
    });
  }
  return trends;
}
function getHeatmapData() {
  const allEvents = getAllEvents();
  const heatmap = {};
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      const key = `${hour}:${day}`;
      heatmap[key] = 0;
    }
  }
  for (const event of allEvents) {
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    const key = `${hour}:${day}`;
    heatmap[key]++;
  }
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      const key = `${hour}:${day}`;
      data.push({
        hour,
        day,
        dayName: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][day],
        hourLabel: hour.toString().padStart(2, "0") + ":00",
        count: heatmap[key],
        intensity: 0
        // 0-1 normalized
      });
    }
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  for (const d of data) {
    d.intensity = d.count / max;
  }
  return data;
}
function getUserPaths(steps = 5) {
  const allEvents = getAllEvents();
  const sessions = {};
  for (const event of allEvents) {
    if (!sessions[event.sessionId]) {
      sessions[event.sessionId] = [];
    }
    sessions[event.sessionId].push(event);
  }
  const paths = [];
  for (const sessionEvents of Object.values(sessions)) {
    sessionEvents.sort((a, b) => a.timestamp - b.timestamp);
    const path = sessionEvents.slice(0, steps).map((e) => e.type);
    if (path.length >= 2) {
      paths.push(path.join(" → "));
    }
  }
  const pathCounts = {};
  for (const path of paths) {
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  }
  return Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));
}
function getRealtimeStats() {
  const allEvents = getAllEvents();
  const now = Date.now();
  const recent = allEvents.filter((e) => now - e.timestamp < 5 * 60 * 1e3);
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = allEvents.filter((e) => e.timestamp >= todayStart.getTime());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart);
  const yesterday = allEvents.filter(
    (e) => e.timestamp >= yesterdayStart.getTime() && e.timestamp < yesterdayEnd.getTime()
  );
  return {
    online: recent.length,
    // 最近5分钟活动数作为"在线"指标
    todayTotal: today.length,
    yesterdayTotal: yesterday.length,
    change: yesterday.length > 0 ? ((today.length - yesterday.length) / yesterday.length * 100).toFixed(1) : "0"
  };
}
function getAllEvents() {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveEvents(events) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    const trimmed = events.slice(-5e3);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  }
}
function restoreEvents() {
  try {
    const events = localStorage.getItem(EVENTS_KEY);
    if (events) {
      JSON.parse(events);
    }
  } catch {
    localStorage.removeItem(EVENTS_KEY);
  }
}
function cleanOldEvents() {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1e3;
  const events = getAllEvents();
  const filtered = events.filter((e) => now - e.timestamp < thirtyDays);
  if (filtered.length < events.length) {
    saveEvents(filtered);
    console.log(`[Analytics] Cleaned ${events.length - filtered.length} old events`);
  }
}
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
  });
}
function createAnalyticsDashboardPanel() {
  const panel = document.createElement("div");
  panel.id = "analytics-panel";
  initAnalytics();
  let currentTab = "overview";
  function formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
  }
  function render() {
    let content = '<div class="ad-header"><span class="ad-title">📊 数据分析</span><button class="ad-close" data-action="close">×</button></div><div class="ad-tabs"><button class="ad-tab ' + (currentTab === "overview" ? "active" : "") + '" data-tab="overview">📈 概览</button><button class="ad-tab ' + (currentTab === "trend" ? "active" : "") + '" data-tab="trend">📉 趋势</button><button class="ad-tab ' + (currentTab === "heatmap" ? "active" : "") + '" data-tab="heatmap">🔥 热力图</button><button class="ad-tab ' + (currentTab === "paths" ? "active" : "") + '" data-tab="paths">🔀 路径</button></div><div class="ad-body">';
    if (currentTab === "overview") {
      const realtime = getRealtimeStats();
      const hotTools = getHotTools(5);
      const eventStats = getEventStats("day");
      content += '<div class="ad-section"><div class="ad-section-title">📊 实时概览</div><div class="ad-stats-row"><div class="ad-stat-card"><div class="ad-stat-value">' + realtime.online + '</div><div class="ad-stat-label">在线活动</div><div class="ad-stat-sub">最近5分钟</div></div><div class="ad-stat-card"><div class="ad-stat-value">' + formatNumber(realtime.todayTotal) + '</div><div class="ad-stat-label">今日事件</div><div class="ad-stat-sub ' + (parseFloat(realtime.change) >= 0 ? "positive" : "negative") + '">' + (parseFloat(realtime.change) >= 0 ? "↑" : "↓") + Math.abs(realtime.change) + "% 昨日</div></div></div></div>";
      content += '<div class="ad-section"><div class="ad-section-title">🔥 热门工具</div>';
      if (hotTools.length > 0) {
        const maxCount = hotTools[0].count;
        content += '<div class="ad-hot-list">';
        for (let i = 0; i < hotTools.length; i++) {
          const t = hotTools[i];
          const barWidth = Math.round(t.count / maxCount * 100);
          content += '<div class="ad-hot-item"><div class="ad-hot-rank">' + (i + 1) + '</div><div class="ad-hot-bar-container"><div class="ad-hot-bar" style="width: ' + barWidth + '%"></div></div><div class="ad-hot-info"><div class="ad-hot-name">' + t.toolId + '</div><div class="ad-hot-count">' + t.count + " 次</div></div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="ad-empty">暂无数据</div>';
      }
      content += "</div>";
      content += '<div class="ad-section"><div class="ad-section-title">📊 事件分布</div><div class="ad-event-grid">';
      const eventTypes = [
        { type: "page_view", label: "页面浏览", icon: "👁️" },
        { type: "tool_use", label: "工具使用", icon: "🔧" },
        { type: "tool_create", label: "创建工具", icon: "➕" },
        { type: "workflow_run", label: "工作流运行", icon: "▶️" },
        { type: "search", label: "搜索", icon: "🔍" },
        { type: "error", label: "错误", icon: "❌" }
      ];
      for (const et of eventTypes) {
        const count = eventStats.byType[et.type] || 0;
        content += '<div class="ad-event-card"><div class="ad-event-icon">' + et.icon + '</div><div class="ad-event-info"><div class="ad-event-label">' + et.label + '</div><div class="ad-event-count">' + formatNumber(count) + "</div></div></div>";
      }
      content += "</div></div>";
    } else if (currentTab === "trend") {
      const trends = getToolUsageTrend(7);
      content += '<div class="ad-section"><div class="ad-section-title">📈 7天使用趋势</div><div class="ad-trend-chart">';
      if (trends.length > 0) {
        const maxTotal = Math.max(...trends.map((t) => t.total), 1);
        content += '<div class="ad-trend-bars">';
        for (const t of trends) {
          const barHeight = Math.round(t.total / maxTotal * 100);
          content += '<div class="ad-trend-bar-container"><div class="ad-trend-bar" style="height: ' + barHeight + '%"></div><div class="ad-trend-date">' + t.date + '</div><div class="ad-trend-value">' + t.total + "</div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="ad-empty">暂无趋势数据</div>';
      }
      content += "</div></div>";
      content += '<div class="ad-section"><div class="ad-section-title">🔝 Top工具每日使用</div><div class="ad-trend-list">';
      for (const t of trends) {
        if (t.topTool) {
          content += '<div class="ad-trend-item"><div class="ad-trend-date">' + t.date + '</div><div class="ad-trend-top">' + t.topTool + '</div><div class="ad-trend-count">' + t.total + " 次</div></div>";
        }
      }
      content += "</div></div>";
    } else if (currentTab === "heatmap") {
      const heatmap = getHeatmapData();
      content += '<div class="ad-section"><div class="ad-section-title">🔥 周活跃热力图</div><div class="ad-heatmap-container">';
      content += '<div class="ad-heatmap-row ad-heatmap-header"><div class="ad-heatmap-cell ad-heatmap-label"></div>';
      for (let day = 0; day < 7; day++) {
        content += '<div class="ad-heatmap-cell ad-heatmap-day">' + ["日", "一", "二", "三", "四", "五", "六"][day] + "</div>";
      }
      content += "</div>";
      for (let hour = 0; hour < 24; hour += 3) {
        content += '<div class="ad-heatmap-row"><div class="ad-heatmap-cell ad-heatmap-label">' + hour.toString().padStart(2, "0") + "</div>";
        for (let day = 0; day < 7; day++) {
          let total = 0;
          for (let h = hour; h < hour + 3 && h < 24; h++) {
            const cell = heatmap.find((c) => c.hour === h && c.day === day);
            if (cell) total += cell.count;
          }
          const max = Math.max(...heatmap.map((c) => c.count), 1);
          const intensity = total / max;
          const color = intensity > 0.7 ? "#ef4444" : intensity > 0.4 ? "#f97316" : intensity > 0.2 ? "#fbbf24" : intensity > 0 ? "#34d399" : "#1a1a2e";
          content += '<div class="ad-heatmap-cell ad-heatmap-value" style="background: ' + color + '" title="' + hour + "-" + (hour + 3) + "点: " + total + ' 事件">' + (total > 0 ? total : "") + "</div>";
        }
        content += "</div>";
      }
      content += "</div>";
      content += '<div class="ad-heatmap-legend"><span>低</span><div class="ad-legend-gradient"></div><span>高</span></div>';
      content += "</div>";
    } else if (currentTab === "paths") {
      const paths = getUserPaths();
      content += '<div class="ad-section"><div class="ad-section-title">🔀 用户行为路径 (Top 10)</div>';
      if (paths.length > 0) {
        const maxCount = paths[0].count;
        content += '<div class="ad-paths-list">';
        for (let i = 0; i < paths.length; i++) {
          const p = paths[i];
          const barWidth = Math.round(p.count / maxCount * 100);
          content += '<div class="ad-path-item"><div class="ad-path-rank">' + (i + 1) + '</div><div class="ad-path-info"><div class="ad-path-flow">' + p.path + '</div><div class="ad-path-bar-container"><div class="ad-path-bar" style="width: ' + barWidth + '%"></div></div></div><div class="ad-path-count">' + p.count + "</div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="ad-empty">暂无路径数据</div>';
      }
      content += "</div>";
      content += '<div class="ad-section"><div class="ad-section-title">💡 说明</div><div class="ad-info-box"><p>用户行为路径展示了用户在应用中的典型操作顺序。</p><p>分析这些路径可以帮助你：</p><ul><li>了解用户最常使用的功能组合</li><li>发现潜在的体验痛点</li><li>优化功能入口和流程</li></ul></div></div>';
    }
    content += "</div>";
    panel.innerHTML = content;
    panel.querySelectorAll(".ad-tab").forEach((tab) => {
      tab.addEventListener("click", function() {
        currentTab = this.dataset.tab;
        render();
      });
    });
  }
  const style = document.createElement("style");
  style.id = "analytics-panel-style";
  style.textContent = [
    "#analytics-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 480px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1014; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".ad-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".ad-title { font-size: 15px; font-weight: 600; color: #8b5cf6; }",
    ".ad-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".ad-close:hover { color: #fff; }",
    ".ad-tabs {",
    "display: flex; padding: 8px 10px; gap: 4px; border-bottom: 1px solid #222;",
    "background: #12122a;",
    "}",
    ".ad-tab {",
    "flex: 1; padding: 8px 4px; border: none; border-radius: 6px;",
    "background: transparent; color: #888; font-size: 12px; cursor: pointer;",
    "}",
    ".ad-tab:hover { background: #1a1a3a; }",
    ".ad-tab.active { background: #8b5cf622; color: #8b5cf6; }",
    ".ad-body { flex: 1; overflow-y: auto; padding: 12px; }",
    ".ad-section { margin-bottom: 16px; }",
    ".ad-section-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".ad-stats-row { display: flex; gap: 8px; }",
    ".ad-stat-card {",
    "flex: 1; padding: 14px; background: #12122a; border-radius: 8px; text-align: center;",
    "}",
    ".ad-stat-value { font-size: 24px; font-weight: 600; color: #8b5cf6; }",
    ".ad-stat-label { font-size: 12px; color: #888; margin-top: 2px; }",
    ".ad-stat-sub { font-size: 11px; color: #666; margin-top: 2px; }",
    ".ad-stat-sub.positive { color: #10b981; }",
    ".ad-stat-sub.negative { color: #ef4444; }",
    ".ad-hot-list { display: flex; flex-direction: column; gap: 6px; }",
    ".ad-hot-item {",
    "display: flex; align-items: center; gap: 8px; padding: 6px 8px;",
    "background: #12122a; border-radius: 6px;",
    "}",
    ".ad-hot-rank { font-size: 12px; width: 18px; color: #888; text-align: center; }",
    ".ad-hot-bar-container {",
    "flex: 1; height: 8px; background: #222; border-radius: 4px; overflow: hidden;",
    "}",
    ".ad-hot-bar {",
    "height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 4px;",
    "}",
    ".ad-hot-info { display: flex; justify-content: space-between; align-items: center; width: 120px; }",
    ".ad-hot-name { font-size: 11px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".ad-hot-count { font-size: 10px; color: #888; }",
    ".ad-event-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }",
    ".ad-event-card {",
    "display: flex; align-items: center; gap: 8px; padding: 10px;",
    "background: #12122a; border-radius: 6px;",
    "}",
    ".ad-event-icon { font-size: 16px; }",
    ".ad-event-label { font-size: 11px; color: #888; }",
    ".ad-event-count { font-size: 14px; font-weight: 600; color: #8b5cf6; }",
    ".ad-trend-chart { background: #12122a; border-radius: 8px; padding: 12px; }",
    ".ad-trend-bars { display: flex; align-items: flex-end; gap: 6px; height: 100px; }",
    ".ad-trend-bar-container {",
    "flex: 1; display: flex; flex-direction: column; align-items: center;",
    "height: 100%; justify-content: flex-end;",
    "}",
    ".ad-trend-bar {",
    "width: 100%; background: linear-gradient(180deg, #8b5cf6, #a78bfa);",
    "border-radius: 4px 4px 0 0; min-height: 4px;",
    "}",
    ".ad-trend-date { font-size: 9px; color: #888; margin-top: 4px; }",
    ".ad-trend-value { font-size: 9px; color: #666; }",
    ".ad-trend-list { display: flex; flex-direction: column; gap: 4px; }",
    ".ad-trend-item {",
    "display: flex; align-items: center; gap: 8px; padding: 6px 8px;",
    "background: #12122a; border-radius: 4px;",
    "}",
    ".ad-trend-date { font-size: 11px; color: #888; width: 50px; }",
    ".ad-trend-top { flex: 1; font-size: 11px; color: #fff; }",
    ".ad-trend-count { font-size: 10px; color: #666; }",
    ".ad-heatmap-container { background: #12122a; border-radius: 8px; padding: 10px; }",
    ".ad-heatmap-row { display: flex; gap: 2px; }",
    ".ad-heatmap-header { margin-bottom: 4px; }",
    ".ad-heatmap-cell {",
    "flex: 1; height: 16px; display: flex; align-items: center; justify-content: center;",
    "font-size: 9px; color: #888; border-radius: 2px;",
    "}",
    ".ad-heatmap-label { width: 24px; font-size: 9px; color: #666; }",
    ".ad-heatmap-day { font-size: 10px; color: #888; }",
    ".ad-heatmap-value { cursor: default; transition: transform 0.1s; }",
    ".ad-heatmap-value:hover { transform: scale(1.2); z-index: 1; }",
    ".ad-heatmap-legend {",
    "display: flex; align-items: center; justify-content: center; gap: 8px;",
    "margin-top: 8px; font-size: 10px; color: #888;",
    "}",
    ".ad-legend-gradient {",
    "width: 80px; height: 8px; background: linear-gradient(90deg, #1a1a2e, #34d399, #fbbf24, #ef4444);",
    "border-radius: 4px;",
    "}",
    ".ad-paths-list { display: flex; flex-direction: column; gap: 6px; }",
    ".ad-path-item {",
    "display: flex; align-items: center; gap: 8px; padding: 8px;",
    "background: #12122a; border-radius: 6px;",
    "}",
    ".ad-path-rank { font-size: 12px; width: 18px; color: #888; text-align: center; }",
    ".ad-path-info { flex: 1; min-width: 0; }",
    ".ad-path-flow { font-size: 11px; color: #fff; font-family: monospace; }",
    ".ad-path-bar-container {",
    "height: 4px; background: #222; border-radius: 2px; margin-top: 4px; overflow: hidden;",
    "}",
    ".ad-path-bar {",
    "height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 2px;",
    "}",
    ".ad-path-count { font-size: 11px; color: #888; }",
    ".ad-empty { text-align: center; padding: 30px; color: #666; font-size: 13px; }",
    ".ad-info-box {",
    "background: #12122a; border-radius: 8px; padding: 12px;",
    "font-size: 12px; color: #888; line-height: 1.6;",
    "}",
    ".ad-info-box p { margin: 0 0 8px; }",
    ".ad-info-box ul { margin: 0; padding-left: 16px; }",
    ".ad-info-box li { margin-bottom: 4px; }"
  ].join("");
  if (!document.getElementById("analytics-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createAnalyticsDashboardPanel
};
//# sourceMappingURL=AnalyticsDashboardPanel-DnBPIyn3.js.map

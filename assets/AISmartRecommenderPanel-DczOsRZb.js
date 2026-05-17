import { e as toolRegistry, b as getToolRating, i as isFavorite } from "./index-zZBXRajj.js";
const USAGE_STATS_KEY = "ai-creator-usage-stats";
function getUserToolUsageStats(toolId) {
  try {
    const stats = JSON.parse(localStorage.getItem(USAGE_STATS_KEY) || "{}");
    return stats[toolId] || { usageCount: 0, lastUsed: null };
  } catch {
    return { usageCount: 0, lastUsed: null };
  }
}
const USER_BEHAVIOR_KEY = "ai-creator-user-behavior";
function getUserBehavior() {
  try {
    const data = localStorage.getItem(USER_BEHAVIOR_KEY);
    return data ? JSON.parse(data) : { views: [], searches: [], ratings: [], favorites: [] };
  } catch {
    return { views: [], searches: [], ratings: [], favorites: [] };
  }
}
function recordUserBehavior(action, toolId, timestamp = Date.now()) {
  const behavior = getUserBehavior();
  switch (action) {
    case "view":
      behavior.views = behavior.views.filter((v) => v.toolId !== toolId);
      behavior.views.push({ toolId, timestamp });
      break;
    case "search":
      behavior.searches.push({ keyword: toolId, timestamp });
      if (behavior.searches.length > 20) {
        behavior.searches = behavior.searches.slice(-20);
      }
      break;
    case "rate":
      const existing = behavior.ratings.findIndex((r) => r.toolId === toolId);
      if (existing >= 0) {
        behavior.ratings[existing] = { toolId, timestamp };
      } else {
        behavior.ratings.push({ toolId, timestamp });
      }
      break;
    case "favorite":
      if (!behavior.favorites.find((f) => f.toolId === toolId)) {
        behavior.favorites.push({ toolId, timestamp });
      }
      break;
    case "unfavorite":
      behavior.favorites = behavior.favorites.filter((f) => f.toolId !== toolId);
      break;
  }
  localStorage.setItem(USER_BEHAVIOR_KEY, JSON.stringify(behavior));
}
function getCollaborativeFilteringRecommendations(limit = 5) {
  const behavior = getUserBehavior();
  const favorites = behavior.favorites.map((f) => f.toolId);
  if (favorites.length === 0) {
    return getPopularTools(limit);
  }
  const allTools = toolRegistry.getAllTools();
  const scores = [];
  for (const tool of allTools) {
    if (favorites.includes(tool.id)) continue;
    let score = 0;
    for (const favId of favorites) {
      const favTool = toolRegistry.getTool(favId);
      if (!favTool) continue;
      if (tool.category === favTool.category) {
        score += 2;
      }
      if (favTool.tags && tool.tags) {
        const overlap = favTool.tags.filter((t) => tool.tags.includes(t)).length;
        score += overlap;
      }
    }
    const rating = getToolRating(tool.id);
    if (rating.count >= 3) {
      score += rating.average * 1.5;
    }
    const stats = getUserToolUsageStats(tool.id);
    score += Math.min(stats.usageCount * 0.2, 3);
    const viewed = behavior.views.find((v) => v.toolId === tool.id);
    if (viewed) {
      score += 1;
    }
    if (score > 0) {
      scores.push({ toolId: tool.id, score });
    }
  }
  return scores.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.toolId);
}
function getPopularTools(limit = 5) {
  const allTools = toolRegistry.getAllTools();
  const scores = [];
  for (const tool of allTools) {
    const rating = getToolRating(tool.id);
    const stats = getUserToolUsageStats(tool.id);
    const isFav = isFavorite(tool.id);
    const score = rating.average * rating.count * 0.5 + stats.usageCount * 0.3;
    scores.push({ toolId: tool.id, score, rating, stats, isFavorite: isFav });
  }
  return scores.filter((s) => !s.isFavorite).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.toolId);
}
function getSmartSortedTools(sortBy = "recommended", limit = 20) {
  const allTools = toolRegistry.getAllTools();
  const behavior = getUserBehavior();
  const favorites = behavior.favorites.map((f) => f.toolId);
  const scoredTools = allTools.map((tool) => {
    let score = 0;
    const rating = getToolRating(tool.id);
    const stats = getUserToolUsageStats(tool.id);
    const isFav = favorites.includes(tool.id);
    switch (sortBy) {
      case "recommended":
        if (isFav) {
          score = -999;
        } else {
          const cfScore = getCollaborativeFilteringRecommendations(20).indexOf(tool.id);
          if (cfScore >= 0) {
            score = 100 - cfScore;
          }
          for (const favId of favorites) {
            const favTool = toolRegistry.getTool(favId);
            if (favTool && tool.category === favTool.category) {
              score += 5;
            }
          }
          score += rating.average * 2 + Math.min(stats.usageCount * 0.5, 5);
        }
        break;
      case "popular":
        score = rating.average * rating.count + stats.usageCount;
        break;
      case "rating":
        score = rating.average * 100 + rating.count;
        break;
      case "recent":
        const viewEntry = behavior.views.find((v) => v.toolId === tool.id);
        const lastUsed = stats.lastUsed;
        const recentTime = Math.max((viewEntry == null ? void 0 : viewEntry.timestamp) || 0, lastUsed || 0);
        score = recentTime;
        break;
      case "name":
        score = 0;
        break;
      default:
        score = rating.average * rating.count;
    }
    return { ...tool, score, rating, stats, isFavorite: isFav };
  });
  if (sortBy === "name") {
    scoredTools.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy !== "recommended") {
    scoredTools.sort((a, b) => b.score - a.score);
  }
  return scoredTools.slice(0, limit);
}
function getPersonalizedRecommendations(limit = 5) {
  const cfRecs = getCollaborativeFilteringRecommendations(limit);
  if (cfRecs.length >= limit) {
    return cfRecs;
  }
  const popular = getPopularTools(limit - cfRecs.length);
  return [...cfRecs, ...popular.filter((id) => !cfRecs.includes(id))];
}
function getRecommendationReason(toolId) {
  const behavior = getUserBehavior();
  const favorites = behavior.favorites.map((f) => f.toolId);
  const targetTool = toolRegistry.getTool(toolId);
  if (!targetTool) return null;
  for (const favId of favorites) {
    const favTool = toolRegistry.getTool(favId);
    if (favTool) {
      if (targetTool.category === favTool.category) {
        return `与你收藏的「${favTool.name}」类别相同`;
      }
      if (favTool.tags && targetTool.tags) {
        const overlap = favTool.tags.filter((t) => targetTool.tags.includes(t));
        if (overlap.length > 0) {
          return `与「${favTool.name}」有共同标签: ${overlap.join(", ")}`;
        }
      }
    }
  }
  const viewEntry = behavior.views.find((v) => v.toolId === toolId);
  if (viewEntry) {
    return "你之前浏览过的工具";
  }
  const rating = getToolRating(toolId);
  if (rating.count >= 5 && rating.average >= 4) {
    return `高评分工具 (${rating.average.toFixed(1)}★)`;
  }
  const stats = getUserToolUsageStats(toolId);
  if (stats.usageCount >= 5) {
    return `热门使用工具`;
  }
  return null;
}
function clearUserBehavior() {
  localStorage.removeItem(USER_BEHAVIOR_KEY);
}
function createAISmartRecommenderPanel() {
  const panel = document.createElement("div");
  panel.id = "ai-smart-panel";
  let currentSort = "recommended";
  function renderToolCard(toolId) {
    var _a;
    const tool = (_a = window.toolRegistry) == null ? void 0 : _a.getTool(toolId);
    if (!tool) return "";
    const rating = getToolRating(toolId);
    const reason = getRecommendationReason(toolId);
    return '<div class="recs-item" data-tool-id="' + toolId + '"><div class="recs-item-icon">' + (tool.icon || "🔧") + '</div><div class="recs-item-info"><div class="recs-item-name">' + tool.name + '</div><div class="recs-item-meta"><span class="recs-item-category">' + (tool.category || "general") + "</span>" + (rating.count > 0 ? '<span class="recs-item-rating">★ ' + rating.average.toFixed(1) + " (" + rating.count + ")</span>" : "") + "</div>" + (reason ? '<div class="recs-item-reason">' + reason + "</div>" : "") + "</div></div>";
  }
  function render() {
    const tools = getSmartSortedTools(currentSort, 15);
    const recs = getPersonalizedRecommendations(5);
    const behavior = getUserBehavior();
    let content = "";
    content += '<div class="recs-section">';
    content += '<div class="recs-section-title">🤖 个性化推荐</div>';
    if (recs.length > 0) {
      content += '<div class="recs-list">' + recs.map(renderToolCard).join("") + "</div>";
    } else {
      content += '<div class="recs-empty">暂无推荐，先收藏一些工具吧</div>';
    }
    content += "</div>";
    content += '<div class="recs-section">';
    content += '<div class="recs-section-title">📊 智能排序</div>';
    content += '<div class="recs-sort-buttons">';
    const sortOptions = [
      { key: "recommended", label: "推荐" },
      { key: "popular", label: "热门" },
      { key: "rating", label: "评分" },
      { key: "recent", label: "最近" },
      { key: "name", label: "名称" }
    ];
    for (const opt of sortOptions) {
      content += '<button class="recs-sort-btn ' + (currentSort === opt.key ? "active" : "") + '" data-sort="' + opt.key + '">' + opt.label + "</button>";
    }
    content += "</div>";
    content += "</div>";
    content += '<div class="recs-section">';
    content += '<div class="recs-section-title">🔧 工具列表 <span class="recs-count">(' + tools.length + ")</span></div>";
    content += '<div class="recs-all-list">' + tools.map(renderToolCard).join("") + "</div>";
    content += "</div>";
    content += '<div class="recs-section">';
    content += '<div class="recs-section-title">📈 我的行为</div>';
    content += '<div class="recs-stats">';
    content += '<div class="recs-stat-item"><span class="recs-stat-label">查看</span><span class="recs-stat-value">' + behavior.views.length + "</span></div>";
    content += '<div class="recs-stat-item"><span class="recs-stat-label">搜索</span><span class="recs-stat-value">' + behavior.searches.length + "</span></div>";
    content += '<div class="recs-stat-item"><span class="recs-stat-label">评分</span><span class="recs-stat-value">' + behavior.ratings.length + "</span></div>";
    content += '<div class="recs-stat-item"><span class="recs-stat-label">收藏</span><span class="recs-stat-value">' + behavior.favorites.length + "</span></div>";
    content += "</div>";
    content += '<button class="recs-clear-btn" id="recs-clear">🗑️ 清除行为数据</button>';
    content += "</div>";
    panel.querySelector(".recs-content").innerHTML = content;
    panel.querySelectorAll(".recs-sort-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        currentSort = this.dataset.sort;
        render();
      });
    });
    panel.querySelectorAll(".recs-item").forEach(function(item) {
      item.addEventListener("click", function() {
        const toolId = this.dataset.toolId;
        recordUserBehavior("view", toolId);
        if (window.openToolDetail) {
          window.openToolDetail(toolId);
        }
      });
    });
    panel.querySelector("#recs-clear").addEventListener("click", function() {
      if (confirm("确定清除所有行为数据？")) {
        clearUserBehavior();
        render();
      }
    });
  }
  panel.innerHTML = '<div class="recs-header"><span class="recs-title">🧠 AI 智能推荐</span><button class="recs-close" data-action="close">×</button></div><div class="recs-content"></div>';
  const style = document.createElement("style");
  style.id = "recs-panel-style";
  style.textContent = [
    "#ai-smart-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 420px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1010; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".recs-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".recs-title { font-size: 15px; font-weight: 600; color: #a78bfa; }",
    ".recs-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".recs-close:hover { color: #fff; }",
    ".recs-content { flex: 1; overflow-y: auto; padding: 16px; }",
    ".recs-section { margin-bottom: 20px; }",
    ".recs-section:last-child { margin-bottom: 0; }",
    ".recs-section-title {",
    "font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".recs-count { font-weight: 400; color: #666; }",
    ".recs-list, .recs-all-list { display: flex; flex-direction: column; gap: 6px; }",
    ".recs-item {",
    "display: flex; align-items: center; gap: 10px; padding: 10px;",
    "background: #12122a; border-radius: 8px; cursor: pointer;",
    "transition: background 0.15s;",
    "}",
    ".recs-item:hover { background: #1a1a3a; }",
    ".recs-item-icon { font-size: 20px; flex-shrink: 0; }",
    ".recs-item-info { flex: 1; min-width: 0; }",
    ".recs-item-name { font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".recs-item-meta { display: flex; gap: 8px; margin-top: 3px; }",
    ".recs-item-category { font-size: 11px; color: #666; background: #333; padding: 1px 6px; border-radius: 4px; }",
    ".recs-item-rating { font-size: 11px; color: #fbbf24; }",
    ".recs-item-reason { font-size: 11px; color: #a78bfa; margin-top: 4px; font-style: italic; }",
    ".recs-empty { text-align: center; padding: 20px; color: #666; font-size: 13px; }",
    ".recs-sort-buttons { display: flex; gap: 6px; flex-wrap: wrap; }",
    ".recs-sort-btn {",
    "padding: 6px 12px; border: 1px solid #333; border-radius: 6px;",
    "background: #12122a; color: #888; font-size: 12px; cursor: pointer;",
    "transition: all 0.15s;",
    "}",
    ".recs-sort-btn:hover { background: #1a1a3a; color: #fff; }",
    ".recs-sort-btn.active { background: #a78bfa22; color: #a78bfa; border-color: #a78bfa44; }",
    ".recs-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }",
    ".recs-stat-item {",
    "display: flex; justify-content: space-between; padding: 8px 10px;",
    "background: #12122a; border-radius: 6px;",
    "}",
    ".recs-stat-label { font-size: 12px; color: #888; }",
    ".recs-stat-value { font-size: 12px; color: #fff; font-weight: 600; }",
    ".recs-clear-btn {",
    "width: 100%; padding: 8px; border: 1px solid #dc262644; border-radius: 6px;",
    "background: #dc262622; color: #dc2626; font-size: 12px; cursor: pointer;",
    "}",
    ".recs-clear-btn:hover { background: #dc262633; }"
  ].join("");
  if (!document.getElementById("recs-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", function() {
    panel.remove();
  });
  panel.addEventListener("click", function(e) {
    e.stopPropagation();
  });
  return panel;
}
export {
  createAISmartRecommenderPanel
};
//# sourceMappingURL=AISmartRecommenderPanel-DczOsRZb.js.map

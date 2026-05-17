import { e as toolRegistry, a as getFavorites, b as getToolRating } from "./index-zZBXRajj.js";
function createToolLeaderboard() {
  const panel = document.createElement("div");
  panel.id = "tool-leaderboard";
  panel.innerHTML = `
    <div class="lb-header">
      <span class="lb-title">🏆 热门工具排行</span>
      <button class="lb-close" data-action="close">×</button>
    </div>
    <div class="lb-tabs">
      <button class="lb-tab active" data-sort="rating">评分排序</button>
      <button class="lb-tab" data-sort="favorites">收藏最多</button>
    </div>
    <div class="lb-list" id="lb-list"></div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #tool-leaderboard {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 380px; max-height: 70vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1004; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .lb-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .lb-title { font-size: 16px; font-weight: 600; color: #fbbf24; }
    .lb-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .lb-close:hover { color: #fff; }
    .lb-tabs { display: flex; border-bottom: 1px solid #333; }
    .lb-tab {
      flex: 1; padding: 10px; background: none; border: none;
      color: #888; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent;
    }
    .lb-tab.active { color: #fbbf24; border-bottom-color: #fbbf24; }
    .lb-list { flex: 1; overflow-y: auto; padding: 8px; }
    .lb-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px; cursor: pointer;
      transition: background 0.15s;
    }
    .lb-item:hover { background: #252540; }
    .lb-rank { font-size: 16px; font-weight: 700; width: 28px; text-align: center; }
    .lb-rank.gold { color: #fbbf24; }
    .lb-rank.silver { color: #c0c0c0; }
    .lb-rank.bronze { color: #cd7f32; }
    .lb-icon { font-size: 20px; }
    .lb-info { flex: 1; }
    .lb-name { color: #e0e0e0; font-size: 14px; }
    .lb-meta { display: flex; gap: 8px; font-size: 11px; color: #888; margin-top: 2px; }
    .lb-stars { color: #fbbf24; }
    .lb-favs { color: #dc2626; }
  `;
  document.head.appendChild(style);
  const lbList = panel.querySelector("#lb-list");
  let currentSort = "rating";
  const renderList = () => {
    const tools = toolRegistry.list();
    const favorites = getFavorites();
    const toolsWithScore = tools.map((t) => {
      const rating = getToolRating(t.id);
      return {
        ...t,
        average: parseFloat(rating.average) || 0,
        count: rating.count,
        favCount: favorites.filter((f) => f === t.id).length
      };
    });
    if (currentSort === "rating") {
      toolsWithScore.sort((a, b) => b.average - a.average || b.count - a.count);
    } else {
      toolsWithScore.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        return bFav - aFav || b.average - a.average;
      });
    }
    lbList.innerHTML = toolsWithScore.slice(0, 10).map((t, i) => {
      const rankClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      return `
        <div class="lb-item">
          <span class="lb-rank ${rankClass}">${i + 1}</span>
          <span class="lb-icon">${t.icon}</span>
          <div class="lb-info">
            <div class="lb-name">${t.name}</div>
            <div class="lb-meta">
              <span class="lb-stars">★ ${t.average > 0 ? t.average : "-"}</span>
              <span class="lb-favs">${favorites.includes(t.id) ? "❤️" : ""}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };
  panel.querySelectorAll(".lb-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      panel.querySelectorAll(".lb-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentSort = tab.dataset.sort;
      renderList();
    });
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  renderList();
  return panel;
}
export {
  createToolLeaderboard
};
//# sourceMappingURL=ToolLeaderboard-Zr1tkOr2.js.map

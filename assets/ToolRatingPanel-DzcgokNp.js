import { e as toolRegistry, b as getToolRating, i as isFavorite, t as toggleFavorite, d as submitRating } from "./index-zZBXRajj.js";
function createToolRatingPanel(toolId) {
  const tool = toolRegistry.get(toolId);
  if (!tool) return null;
  const rating = getToolRating(toolId);
  const faved = isFavorite(toolId);
  const panel = document.createElement("div");
  panel.id = "tool-rating-panel";
  panel.innerHTML = `
    <div class="rating-header">
      <span class="rating-tool-icon">${tool.icon}</span>
      <span class="rating-tool-name">${tool.name}</span>
      <button class="rating-close" data-action="close">×</button>
    </div>
    <div class="rating-content">
      <div class="rating-stats">
        <div class="rating-score">${rating.average}</div>
        <div class="rating-stars">${"★".repeat(Math.round(parseFloat(rating.average)))}<span class="gray">${"★".repeat(5 - Math.round(parseFloat(rating.average)))}</span></div>
        <div class="rating-count">${rating.count} 人评分</div>
      </div>
      <button class="btn-favorite ${faved ? "favorited" : ""}" id="btn-favorite">
        ${faved ? "❤️ 已收藏" : "🤍 收藏"}
      </button>
      <div class="rating-form">
        <h4>评分</h4>
        <div class="star-input" id="star-input">
          ${[1, 2, 3, 4, 5].map((n) => `<span class="star" data-score="${n}">☆</span>`).join("")}
        </div>
        <textarea id="rating-comment" placeholder="写下你的评论..." rows="3"></textarea>
        <button class="btn-submit-rating" id="btn-submit-rating">提交评分</button>
      </div>
      <div class="rating-comments">
        <h4>最新评论</h4>
        <div id="comments-list">
          ${rating.comments.length === 0 ? '<p class="no-comments">暂无评论</p>' : rating.comments.map((c) => `
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-stars">${"★".repeat(c.score)}</span>
                  <span class="comment-date">${new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p class="comment-text">${c.comment || ""}</p>
              </div>
            `).join("")}
        </div>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #tool-rating-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 400px; max-height: 80vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1003; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .rating-header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .rating-tool-icon { font-size: 24px; }
    .rating-tool-name { flex: 1; font-size: 16px; font-weight: 600; color: #fff; }
    .rating-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .rating-close:hover { color: #fff; }
    .rating-content { padding: 16px; overflow-y: auto; flex: 1; }
    .rating-stats { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .rating-score { font-size: 36px; font-weight: 700; color: #fbbf24; }
    .rating-stars { font-size: 18px; color: #fbbf24; }
    .rating-stars .gray { color: #444; }
    .rating-count { color: #888; font-size: 13px; }
    .btn-favorite {
      width: 100%; padding: 10px; border: 1px solid #dc2626;
      background: transparent; border-radius: 8px; color: #dc2626;
      font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 16px;
    }
    .btn-favorite.favorited { background: #dc262622; }
    .rating-form h4, .rating-comments h4 { margin: 0 0 10px 0; color: #e0e0e0; font-size: 14px; }
    .star-input { display: flex; gap: 6px; margin-bottom: 10px; cursor: pointer; }
    .star { font-size: 28px; color: #444; transition: color 0.15s; }
    .star:hover, .star.active { color: #fbbf24; }
    .rating-form textarea {
      width: 100%; padding: 8px; border: 1px solid #333; border-radius: 6px;
      background: #0d0d1a; color: #fff; font-size: 13px; resize: vertical;
      box-sizing: border-box; font-family: system-ui;
    }
    .rating-form textarea:focus { outline: none; border-color: #fbbf24; }
    .btn-submit-rating {
      width: 100%; padding: 10px; margin-top: 10px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border: none; border-radius: 8px; color: #000; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .rating-comments { margin-top: 20px; }
    .comment-item { background: #12122a; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .comment-stars { color: #fbbf24; font-size: 12px; }
    .comment-date { color: #666; font-size: 11px; }
    .comment-text { margin: 0; color: #ccc; font-size: 13px; white-space: pre-wrap; }
    .no-comments { color: #666; font-size: 13px; text-align: center; padding: 20px; }
  `;
  document.head.appendChild(style);
  let selectedScore = 0;
  panel.querySelector("#btn-favorite").addEventListener("click", () => {
    const nowFaved = toggleFavorite(toolId);
    panel.querySelector("#btn-favorite").textContent = nowFaved ? "❤️ 已收藏" : "🤍 收藏";
    panel.querySelector("#btn-favorite").classList.toggle("favorited", nowFaved);
  });
  panel.querySelectorAll(".star").forEach((star) => {
    star.addEventListener("click", () => {
      selectedScore = parseInt(star.dataset.score);
      panel.querySelectorAll(".star").forEach((s, i) => {
        s.textContent = i < selectedScore ? "★" : "☆";
        s.classList.toggle("active", i < selectedScore);
      });
    });
    star.addEventListener("mouseenter", () => {
      const score = parseInt(star.dataset.score);
      panel.querySelectorAll(".star").forEach((s, i) => {
        s.textContent = i < score ? "★" : "☆";
      });
    });
    star.addEventListener("mouseleave", () => {
      panel.querySelectorAll(".star").forEach((s, i) => {
        s.textContent = i < selectedScore ? "★" : "☆";
      });
    });
  });
  panel.querySelector("#btn-submit-rating").addEventListener("click", () => {
    if (selectedScore === 0) {
      alert("请选择评分");
      return;
    }
    const comment = panel.querySelector("#rating-comment").value.trim();
    const newRating = submitRating(toolId, selectedScore, comment);
    panel.querySelector(".rating-score").textContent = newRating.average;
    panel.querySelector(".rating-stars").innerHTML = "★".repeat(Math.round(parseFloat(newRating.average))) + '<span class="gray">' + "★".repeat(5 - Math.round(parseFloat(newRating.average))) + "</span>";
    panel.querySelector(".rating-count").textContent = `${newRating.count} 人评分`;
    panel.querySelector("#rating-comment").value = "";
    selectedScore = 0;
    panel.querySelectorAll(".star").forEach((s) => {
      s.textContent = "☆";
      s.classList.remove("active");
    });
    const listEl = panel.querySelector("#comments-list");
    if (newRating.comments.length === 0) {
      listEl.innerHTML = '<p class="no-comments">暂无评论</p>';
    } else {
      listEl.innerHTML = newRating.comments.map((c) => `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-stars">${"★".repeat(c.score)}</span>
            <span class="comment-date">${new Date(c.date).toLocaleDateString()}</span>
          </div>
          <p class="comment-text">${c.comment || ""}</p>
        </div>
      `).join("");
    }
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createToolRatingPanel
};
//# sourceMappingURL=ToolRatingPanel-DzcgokNp.js.map

import { e as toolRegistry } from "./index-zZBXRajj.js";
const COMMUNITY_KEY = "ai-creator-community";
const AVATARS = ["🐱", "🐶", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐰", "🐻", "🐨", "🦊", "🦝", "🐻‍❄️", "🦄", "🐲", "🦋", "🐝"];
const NICKNAMES = [
  "创作者A",
  "开发者B",
  "设计师C",
  "音乐人D",
  "画家E",
  "写作者F",
  "导演G",
  "摄影师H",
  "动画师I",
  "制作人J",
  "极客侠",
  "创意王",
  "灵感家",
  "梦想家",
  "执行者"
];
function getCommunityData() {
  try {
    return JSON.parse(localStorage.getItem(COMMUNITY_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCommunityData(data) {
  localStorage.setItem(COMMUNITY_KEY, JSON.stringify(data));
}
function getToolCommunity(toolId) {
  const data = getCommunityData();
  const toolData = data[toolId] || {
    reviews: [],
    tips: [],
    likes: 0,
    views: 0,
    lastActivity: null
  };
  return {
    ...toolData,
    reviewCount: toolData.reviews.length,
    tipCount: toolData.tips.length
  };
}
function submitReview(toolId, comment, rating) {
  const data = getCommunityData();
  if (!data[toolId]) {
    data[toolId] = { reviews: [], tips: [], likes: 0, views: 0, lastActivity: null };
  }
  const review = {
    id: "review_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
    comment,
    rating: rating || 5,
    author: {
      nickname: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    },
    createdAt: Date.now(),
    likes: 0
  };
  data[toolId].reviews.unshift(review);
  data[toolId].lastActivity = Date.now();
  saveCommunityData(data);
  return review;
}
function likeReview(toolId, reviewId) {
  const data = getCommunityData();
  if (!data[toolId]) return false;
  const review = data[toolId].reviews.find((r) => r.id === reviewId);
  if (review) {
    review.likes++;
    saveCommunityData(data);
    return true;
  }
  return false;
}
function submitTip(toolId, title, content) {
  const data = getCommunityData();
  if (!data[toolId]) {
    data[toolId] = { reviews: [], tips: [], likes: 0, views: 0, lastActivity: null };
  }
  const tip = {
    id: "tip_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
    title,
    content,
    author: {
      nickname: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    },
    createdAt: Date.now(),
    likes: 0
  };
  data[toolId].tips.unshift(tip);
  data[toolId].lastActivity = Date.now();
  saveCommunityData(data);
  return tip;
}
function tipTool(toolId, amount) {
  const data = getCommunityData();
  if (!data[toolId]) {
    data[toolId] = { reviews: [], tips: [], likes: 0, views: 0, lastActivity: null };
  }
  if (!data[toolId].donations) {
    data[toolId].donations = [];
  }
  const donation = {
    id: "donation_" + Date.now(),
    amount: amount || 10,
    author: {
      nickname: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    },
    createdAt: Date.now()
  };
  data[toolId].donations.push(donation);
  data[toolId].lastActivity = Date.now();
  saveCommunityData(data);
  return donation;
}
function getTopDonations(limit = 10) {
  const data = getCommunityData();
  const toolIds = Object.keys(data);
  const donations = [];
  for (const toolId of toolIds) {
    const toolData = data[toolId];
    if (toolData.donations && toolData.donations.length > 0) {
      const totalAmount = toolData.donations.reduce((sum, d) => sum + d.amount, 0);
      const tool = toolRegistry.getTool(toolId);
      donations.push({
        toolId,
        toolName: tool ? tool.name : toolId,
        totalAmount,
        donationCount: toolData.donations.length
      });
    }
  }
  return donations.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, limit);
}
function getActiveCommunityTools(limit = 10) {
  const data = getCommunityData();
  const toolIds = Object.keys(data);
  const activeTools = toolIds.filter((id) => {
    const toolData = data[id];
    return toolData.reviews.length > 0 || toolData.tips.length > 0;
  }).map((id) => {
    const toolData = data[id];
    const tool = toolRegistry.getTool(id);
    return {
      toolId: id,
      toolName: tool ? tool.name : id,
      toolIcon: tool ? tool.icon : "🔧",
      reviewCount: toolData.reviews.length,
      tipCount: toolData.tips.length,
      totalLikes: toolData.reviews.reduce((sum, r) => sum + r.likes, 0) + toolData.tips.reduce((sum, t) => sum + t.likes, 0),
      lastActivity: toolData.lastActivity || 0
    };
  }).sort((a, b) => b.lastActivity - a.lastActivity).slice(0, limit);
  return activeTools;
}
function recordToolView(toolId) {
  const data = getCommunityData();
  if (!data[toolId]) {
    data[toolId] = { reviews: [], tips: [], likes: 0, views: 0, lastActivity: null };
  }
  data[toolId].views++;
  saveCommunityData(data);
}
function getHotCommunityTools(limit = 10) {
  const data = getCommunityData();
  const toolIds = Object.keys(data);
  const hotTools = toolIds.filter((id) => {
    const toolData = data[id];
    return toolData.views > 0 || toolData.reviews.length > 0;
  }).map((id) => {
    const toolData = data[id];
    const tool = toolRegistry.getTool(id);
    const hotScore = toolData.views * 1 + toolData.reviews.length * 5 + toolData.tips.length * 8 + toolData.reviews.reduce((sum, r) => sum + r.likes, 0) * 3 + toolData.tips.reduce((sum, t) => sum + t.likes, 0) * 3 + (toolData.donations ? toolData.donations.reduce((sum, d) => sum + d.amount, 0) * 10 : 0);
    return {
      toolId: id,
      toolName: tool ? tool.name : id,
      toolIcon: tool ? tool.icon : "🔧",
      views: toolData.views,
      reviewCount: toolData.reviews.length,
      tipCount: toolData.tips.length,
      hotScore
    };
  }).sort((a, b) => b.hotScore - a.hotScore).slice(0, limit);
  return hotTools;
}
function createCommunitySystemPanel() {
  const panel = document.createElement("div");
  panel.id = "community-panel";
  let currentTab = "hot";
  function formatTime(timestamp) {
    if (!timestamp) return "";
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
    let content = "";
    content += '<div class="cp-tabs"><button class="cp-tab ' + (currentTab === "hot" ? "active" : "") + '" data-tab="hot">🔥 热门</button><button class="cp-tab ' + (currentTab === "active" ? "active" : "") + '" data-tab="active">📈 活跃</button><button class="cp-tab ' + (currentTab === "donations" ? "active" : "") + '" data-tab="donations">💰 打赏榜</button><button class="cp-tab ' + (currentTab === "tips" ? "active" : "") + '" data-tab="tips">💡 技巧</button></div>';
    content += '<div class="cp-content">';
    if (currentTab === "hot") {
      const hotTools = getHotCommunityTools(10);
      if (hotTools.length > 0) {
        content += '<div class="cp-section-title">🔥 热门工具排行</div>';
        content += '<div class="cp-tool-list">';
        for (const tool of hotTools) {
          content += '<div class="cp-tool-card" data-tool-id="' + tool.toolId + '"><div class="cp-tool-icon">' + (tool.toolIcon || "🔧") + '</div><div class="cp-tool-info"><div class="cp-tool-name">' + tool.toolName + '</div><div class="cp-tool-stats"><span class="cp-hot-score">🔥 ' + tool.hotScore + '</span></div><div class="cp-tool-meta"><span>👁 ' + tool.views + "</span><span>💬 " + tool.reviewCount + "</span><span>💡 " + tool.tipCount + "</span></div></div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="cp-empty">暂无热门数据</div>';
      }
    } else if (currentTab === "active") {
      const activeTools = getActiveCommunityTools(10);
      if (activeTools.length > 0) {
        content += '<div class="cp-section-title">📈 活跃工具</div>';
        content += '<div class="cp-tool-list">';
        for (const tool of activeTools) {
          content += '<div class="cp-tool-card" data-tool-id="' + tool.toolId + '"><div class="cp-tool-icon">' + (tool.toolIcon || "🔧") + '</div><div class="cp-tool-info"><div class="cp-tool-name">' + tool.toolName + '</div><div class="cp-tool-meta"><span>💬 ' + tool.reviewCount + "</span><span>💡 " + tool.tipCount + "</span><span>❤️ " + tool.totalLikes + "</span></div></div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="cp-empty">暂无活跃数据</div>';
      }
    } else if (currentTab === "donations") {
      const donations = getTopDonations(10);
      if (donations.length > 0) {
        content += '<div class="cp-section-title">💰 打赏排行榜</div>';
        content += '<div class="cp-donation-list">';
        for (let i = 0; i < donations.length; i++) {
          const d = donations[i];
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1 + ".";
          content += '<div class="cp-donation-item"><div class="cp-donation-rank">' + medal + '</div><div class="cp-donation-info"><div class="cp-donation-name">' + d.toolName + '</div><div class="cp-donation-count">' + d.donationCount + ' 次打赏</div></div><div class="cp-donation-amount">💰 ' + d.totalAmount + "</div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="cp-empty">暂无打赏数据</div>';
      }
    } else if (currentTab === "tips") {
      content += '<div class="cp-section-title">💡 技巧分享</div>';
      content += '<div class="cp-tip-form"><div class="cp-form-group"><select id="cp-tip-tool" class="cp-select"><option value="">选择工具...</option></select></div><div class="cp-form-group"><input type="text" id="cp-tip-title" class="cp-input" placeholder="技巧标题..." /></div><div class="cp-form-group"><textarea id="cp-tip-content" class="cp-textarea" placeholder="分享你的使用技巧..."></textarea></div><button class="cp-btn" id="cp-submit-tip">发布技巧</button></div>';
      content += '<div class="cp-tips-list" id="cp-tips-list"></div>';
    }
    content += "</div>";
    panel.querySelector(".cp-body").innerHTML = content;
    panel.querySelectorAll(".cp-tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        currentTab = this.dataset.tab;
        render();
      });
    });
    panel.querySelectorAll(".cp-tool-card").forEach(function(card) {
      card.addEventListener("click", function() {
        const toolId = this.dataset.toolId;
        if (toolId) {
          recordToolView(toolId);
          showToolReviews(toolId);
        }
      });
    });
    if (currentTab === "tips") {
      const select = panel.querySelector("#cp-tip-tool");
      if (select && window.toolRegistry) {
        for (const tool of window.toolRegistry.list()) {
          var option = document.createElement("option");
          option.value = tool.id;
          option.textContent = (tool.icon || "🔧") + " " + tool.name;
          select.appendChild(option);
        }
      }
      panel.querySelector("#cp-submit-tip").addEventListener("click", function() {
        var toolId = panel.querySelector("#cp-tip-tool").value;
        var title = panel.querySelector("#cp-tip-title").value;
        var content2 = panel.querySelector("#cp-tip-content").value;
        if (!toolId || !title || !content2) {
          alert("请填写完整信息");
          return;
        }
        submitTip(toolId, title, content2);
        panel.querySelector("#cp-tip-title").value = "";
        panel.querySelector("#cp-tip-content").value = "";
        alert("技巧发布成功！");
        render();
      });
    }
  }
  function showToolReviews(toolId) {
    var _a;
    const community = getToolCommunity(toolId);
    const tool = (_a = window.toolRegistry) == null ? void 0 : _a.getTool(toolId);
    const modal = document.createElement("div");
    modal.className = "cp-modal";
    modal.innerHTML = '<div class="cp-modal-content"><div class="cp-modal-header"><span class="cp-modal-title">' + ((tool == null ? void 0 : tool.icon) || "🔧") + " " + ((tool == null ? void 0 : tool.name) || toolId) + ' - 社区</span><button class="cp-modal-close" data-action="close">×</button></div><div class="cp-modal-body"><div class="cp-modal-stats"><div class="cp-stat-item"><span class="cp-stat-value">' + community.reviewCount + '</span><span class="cp-stat-label">评论</span></div><div class="cp-stat-item"><span class="cp-stat-value">' + community.tipCount + '</span><span class="cp-stat-label">技巧</span></div><div class="cp-stat-item"><span class="cp-stat-value">' + community.views + '</span><span class="cp-stat-label">浏览</span></div></div><div class="cp-review-form"><div class="cp-form-group"><select id="cp-review-rating" class="cp-select"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select></div><div class="cp-form-group"><textarea id="cp-review-comment" class="cp-textarea" placeholder="发表你的评论..."></textarea></div><button class="cp-btn" id="cp-submit-review">发表评论</button></div><div class="cp-reviews-list">' + community.reviews.map(function(review) {
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
      return '<div class="cp-review-item"><div class="cp-review-header"><div class="cp-author-info"><span class="cp-author-avatar">' + review.author.avatar + '</span><span class="cp-author-name">' + review.author.nickname + '</span></div><div class="cp-review-time">' + formatTime(review.createdAt) + '</div></div><div class="cp-review-rating">' + stars + '</div><div class="cp-review-content">' + review.comment + '</div><div class="cp-review-footer"><button class="cp-like-btn" data-review-id="' + review.id + '">👍 ' + review.likes + '</button><button class="cp-tip-btn" id="cp-tip-' + review.id + '">💰 打赏</button></div></div>';
    }).join("") + "</div></div></div>";
    document.body.appendChild(modal);
    modal.querySelector('[data-action="close"]').addEventListener("click", function() {
      modal.remove();
    });
    modal.addEventListener("click", function(e) {
      if (e.target === modal) modal.remove();
    });
    modal.querySelector("#cp-submit-review").addEventListener("click", function() {
      var _a2, _b;
      const rating = parseInt(((_a2 = panel.querySelector("#cp-review-rating")) == null ? void 0 : _a2.value) || "5");
      const comment = ((_b = panel.querySelector("#cp-review-comment")) == null ? void 0 : _b.value) || "";
      if (!comment.trim()) {
        alert("请输入评论内容");
        return;
      }
      submitReview(toolId, comment, rating);
      modal.remove();
      showToolReviews(toolId);
    });
    modal.querySelectorAll(".cp-like-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const reviewId = this.dataset.reviewId;
        likeReview(toolId, reviewId);
        modal.remove();
        showToolReviews(toolId);
      });
    });
    modal.querySelectorAll(".cp-tip-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const tipAmount = prompt("请输入打赏金额 (1-100)：", "10");
        if (tipAmount) {
          tipTool(toolId, parseInt(tipAmount) || 10);
          alert("打赏成功！感谢支持！");
        }
      });
    });
  }
  panel.innerHTML = '<div class="cp-header"><span class="cp-title">👥 社区中心</span><button class="cp-close" data-action="close">×</button></div><div class="cp-body"></div>';
  const style = document.createElement("style");
  style.id = "community-panel-style";
  style.textContent = [
    "#community-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 440px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1011; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".cp-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".cp-title { font-size: 15px; font-weight: 600; color: #60a5fa; }",
    ".cp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".cp-close:hover { color: #fff; }",
    ".cp-body { flex: 1; overflow-y: auto; padding: 0; }",
    ".cp-tabs {",
    "display: flex; padding: 10px; gap: 4px; border-bottom: 1px solid #222;",
    "background: #12122a;",
    "}",
    ".cp-tab {",
    "flex: 1; padding: 8px 4px; border: none; border-radius: 6px;",
    "background: transparent; color: #888; font-size: 12px; cursor: pointer;",
    "}",
    ".cp-tab:hover { background: #1a1a3a; }",
    ".cp-tab.active { background: #60a5fa22; color: #60a5fa; }",
    ".cp-content { padding: 12px; }",
    ".cp-section-title {",
    "font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".cp-tool-list { display: flex; flex-direction: column; gap: 6px; }",
    ".cp-tool-card {",
    "display: flex; align-items: center; gap: 10px; padding: 10px;",
    "background: #12122a; border-radius: 8px; cursor: pointer;",
    "transition: background 0.15s;",
    "}",
    ".cp-tool-card:hover { background: #1a1a3a; }",
    ".cp-tool-icon { font-size: 22px; }",
    ".cp-tool-info { flex: 1; min-width: 0; }",
    ".cp-tool-name { font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".cp-tool-stats { display: flex; gap: 6px; margin-top: 3px; }",
    ".cp-tool-meta { display: flex; gap: 8px; margin-top: 3px; }",
    ".cp-tool-meta span { font-size: 11px; color: #888; }",
    ".cp-hot-score { color: #f97316 !important; font-weight: 600; }",
    ".cp-empty { text-align: center; padding: 30px; color: #666; font-size: 13px; }",
    ".cp-donation-list { display: flex; flex-direction: column; gap: 6px; }",
    ".cp-donation-item {",
    "display: flex; align-items: center; gap: 10px; padding: 10px;",
    "background: #12122a; border-radius: 8px;",
    "}",
    ".cp-donation-rank { font-size: 16px; width: 30px; text-align: center; }",
    ".cp-donation-info { flex: 1; }",
    ".cp-donation-name { font-size: 13px; font-weight: 500; color: #fff; }",
    ".cp-donation-count { font-size: 11px; color: #888; }",
    ".cp-donation-amount { font-size: 14px; color: #fbbf24; font-weight: 600; }",
    ".cp-review-form {",
    "padding: 12px; background: #12122a; border-radius: 8px; margin-bottom: 12px;",
    "}",
    ".cp-form-group { margin-bottom: 8px; }",
    ".cp-form-group:last-child { margin-bottom: 0; }",
    ".cp-select, .cp-input, .cp-textarea {",
    "width: 100%; padding: 8px 10px; background: #0a0a1a; border: 1px solid #333;",
    "border-radius: 6px; color: #fff; font-size: 13px; font-family: inherit;",
    "box-sizing: border-box;",
    "}",
    ".cp-select { cursor: pointer; }",
    ".cp-textarea { min-height: 60px; resize: vertical; }",
    ".cp-select:focus, .cp-input:focus, .cp-textarea:focus { outline: none; border-color: #60a5fa; }",
    ".cp-btn {",
    "width: 100%; padding: 10px; border: none; border-radius: 8px;",
    "background: #60a5fa22; color: #60a5fa; border: 1px solid #60a5fa44;",
    "font-size: 13px; cursor: pointer;",
    "}",
    ".cp-btn:hover { background: #60a5fa33; }",
    ".cp-reviews-list { display: flex; flex-direction: column; gap: 10px; }",
    ".cp-review-item {",
    "padding: 12px; background: #12122a; border-radius: 8px;",
    "}",
    ".cp-review-header {",
    "display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;",
    "}",
    ".cp-author-info { display: flex; align-items: center; gap: 6px; }",
    ".cp-author-avatar { font-size: 18px; }",
    ".cp-author-name { font-size: 13px; color: #fff; font-weight: 500; }",
    ".cp-review-time { font-size: 11px; color: #666; }",
    ".cp-review-rating { font-size: 12px; color: #fbbf24; margin-bottom: 6px; }",
    ".cp-review-content { font-size: 13px; color: #ddd; line-height: 1.5; }",
    ".cp-review-footer {",
    "display: flex; gap: 8px; margin-top: 8px; padding-top: 8px;",
    "border-top: 1px solid #222;",
    "}",
    ".cp-like-btn, .cp-tip-btn {",
    "padding: 4px 10px; border: 1px solid #333; border-radius: 4px;",
    "background: #1a1a2e; color: #888; font-size: 11px; cursor: pointer;",
    "}",
    ".cp-like-btn:hover, .cp-tip-btn:hover { background: #252540; color: #fff; }",
    ".cp-modal {",
    "position: fixed; top: 0; left: 0; right: 0; bottom: 0;",
    "background: rgba(0,0,0,0.8); z-index: 1012; display: flex;",
    "align-items: center; justify-content: center;",
    "}",
    ".cp-modal-content {",
    "width: 500px; max-height: 85vh; background: #1a1a2e;",
    "border: 1px solid #333; border-radius: 12px; display: flex; flex-direction: column;",
    "}",
    ".cp-modal-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333; background: #16162a;",
    "}",
    ".cp-modal-title { font-size: 15px; font-weight: 600; color: #60a5fa; }",
    ".cp-modal-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".cp-modal-body { flex: 1; overflow-y: auto; padding: 16px; }",
    ".cp-modal-stats {",
    "display: flex; gap: 10px; margin-bottom: 16px;",
    "}",
    ".cp-stat-item {",
    "flex: 1; padding: 12px; background: #12122a; border-radius: 8px;",
    "text-align: center;",
    "}",
    ".cp-stat-value { display: block; font-size: 20px; font-weight: 600; color: #60a5fa; }",
    ".cp-stat-label { font-size: 11px; color: #888; }"
  ].join("");
  if (!document.getElementById("community-panel-style")) {
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
  createCommunitySystemPanel
};
//# sourceMappingURL=CommunitySystemPanel-vEEvaN1r.js.map

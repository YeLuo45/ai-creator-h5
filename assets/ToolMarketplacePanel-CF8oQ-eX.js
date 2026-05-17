import { T as Tool, e as toolRegistry } from "./index-zZBXRajj.js";
const MARKETPLACE_KEY = "ai-creator-tool-marketplace";
const builtInTools = [
  {
    id: "market-translate",
    name: "翻译助手",
    icon: "🌐",
    description: "中英互译，支持多种语言",
    category: "utility",
    author: "System",
    installs: 1234,
    rating: 4.5,
    code: `// 翻译工具
const text = ctx.text || '';
const api = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=zh|en';
const resp = await fetch(api);
const data = await resp.json();
return { original: text, translated: data.responseData.translatedText };`
  },
  {
    id: "market-summarize",
    name: "文本摘要",
    icon: "📄",
    description: "自动提取文本关键信息生成摘要",
    category: "ai",
    author: "AI Lab",
    installs: 892,
    rating: 4.2,
    code: `// 摘要工具 - 简单实现
const text = ctx.text || '';
const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
const summary = sentences.slice(0, 3).join('. ').trim();
return { original: text.slice(0, 100) + '...', summary: summary || text.slice(0, 50) };`
  },
  {
    id: "market-qrcode",
    name: "二维码生成",
    icon: "📱",
    description: "将文本或链接转换为二维码",
    category: "utility",
    author: "DevTools",
    installs: 2341,
    rating: 4.8,
    code: `// 二维码生成工具
const text = ctx.text || '';
return { qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(text) };`
  },
  {
    id: "market-json-format",
    name: "JSON 格式化",
    icon: "{}",
    description: "美化/压缩 JSON 数据",
    category: "developer",
    author: "DevTools",
    installs: 1567,
    rating: 4.6,
    code: `// JSON 格式化工具
const data = ctx.data || '';
try {
  const obj = JSON.parse(data);
  return { formatted: JSON.stringify(ctx.action === 'compress' ? obj : obj, null, 2) };
} catch (e) {
  return { error: 'Invalid JSON: ' + e.message };
}`
  },
  {
    id: "market-regex-tester",
    name: "正则测试",
    icon: "🔍",
    description: "实时测试正则表达式匹配结果",
    category: "developer",
    author: "DevTools",
    installs: 743,
    rating: 4.3,
    code: `// 正则测试工具
const pattern = ctx.pattern || '';
const text = ctx.text || '';
try {
  const regex = new RegExp(pattern, 'g');
  const matches = text.match(regex) || [];
  return { pattern, matches, count: matches.length };
} catch (e) {
  return { error: 'Invalid regex: ' + e.message };
}`
  },
  {
    id: "market-password-gen",
    name: "密码生成",
    icon: "🔐",
    description: "生成随机安全密码",
    category: "security",
    author: "Security Lab",
    installs: 987,
    rating: 4.4,
    code: `// 密码生成工具
const length = parseInt(ctx.length) || 16;
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
let password = '';
for (let i = 0; i < length; i++) {
  password += chars[Math.floor(Math.random() * chars.length)];
}
return { password, length };`
  },
  {
    id: "market-color-picker",
    name: "颜色转换",
    icon: "🎨",
    description: "HEX/RGB/HSL 颜色格式互转",
    category: "design",
    author: "Design Studio",
    installs: 654,
    rating: 4.1,
    code: `// 颜色转换工具
const color = ctx.color || '#000000';
const hex = color.match(/^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i);
if (hex) {
  const r = parseInt(hex[1], 16), g = parseInt(hex[2], 16), b = parseInt(hex[3], 16);
  return { hex: '#' + hex[1] + hex[2] + hex[3], rgb: 'rgb(' + r + ',' + g + ',' + b + ')', hsl: 'hsl(' + Math.round((r/255)*360) + ',' + Math.round((g/255)*100) + '%,' + Math.round((b/255)*100) + '%)' };
}
return { error: 'Invalid color format' };`
  },
  {
    id: "market-slugify",
    name: "Slug 生成",
    icon: "🔤",
    description: "将文本转换为 URL 友好的 slug",
    category: "utility",
    author: "Web Tools",
    installs: 432,
    rating: 4,
    code: `// Slug 生成工具
const text = ctx.text || '';
const slug = text.toLowerCase().replace(/[^\\w\\s-]/g, '').replace(/[\\s_-]+/g, '-').replace(/^-+|-+$/g, '');
return { original: text, slug };`
  }
];
function getMarketplaceTools() {
  return JSON.parse(localStorage.getItem(MARKETPLACE_KEY) || JSON.stringify(builtInTools));
}
function installTool(toolData) {
  try {
    const fn = new Function("ctx", toolData.code);
    const tool = new Tool({
      id: toolData.id,
      name: toolData.name,
      icon: toolData.icon,
      description: toolData.description,
      execute: fn
    });
    toolRegistry.register(tool);
    const installed = JSON.parse(localStorage.getItem("ai-creator-installed-tools") || "[]");
    if (!installed.find((t) => t.id === toolData.id)) {
      installed.push({ id: toolData.id, installedAt: Date.now() });
      localStorage.setItem("ai-creator-installed-tools", JSON.stringify(installed));
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
function uninstallTool(toolId) {
  toolRegistry.unregister(toolId);
  const installed = JSON.parse(localStorage.getItem("ai-creator-installed-tools") || "[]");
  const filtered = installed.filter((t) => t.id !== toolId);
  localStorage.setItem("ai-creator-installed-tools", JSON.stringify(filtered));
}
const REVIEWS_KEY = "ai-creator-tool-reviews";
function getToolReviews(toolId) {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  return all[toolId] || [];
}
function addReview(toolId, rating, comment) {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  if (!all[toolId]) all[toolId] = [];
  all[toolId].push({
    id: Date.now().toString(36),
    rating,
    comment: comment.slice(0, 500),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  return true;
}
function deleteReview(toolId, reviewId) {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  if (!all[toolId]) return false;
  all[toolId] = all[toolId].filter((r) => r.id !== reviewId);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  return true;
}
function getReviewStats(toolId) {
  const reviews = getToolReviews(toolId);
  if (reviews.length === 0) return { count: 0, average: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { count: reviews.length, average: (sum / reviews.length).toFixed(1) };
}
function createToolReviewPanel(toolId, toolName) {
  const panel = document.createElement("div");
  panel.id = "tool-review-panel";
  const reviews = getToolReviews(toolId);
  const stats = getReviewStats(toolId);
  panel.innerHTML = `
    <div class="rv-header">
      <span class="rv-title">💬 ${toolName} 的评论</span>
      <button class="rv-close" data-action="close">×</button>
    </div>
    <div class="rv-stats">
      <span class="rv-avg">★ ${stats.average}</span>
      <span class="rv-count">(${stats.count} 条评论)</span>
    </div>
    <div class="rv-form">
      <div class="rv-stars" id="rv-new-stars">
        <span data-rating="1">☆</span>
        <span data-rating="2">☆</span>
        <span data-rating="3">☆</span>
        <span data-rating="4">☆</span>
        <span data-rating="5">☆</span>
      </div>
      <textarea id="rv-comment" rows="3" placeholder="写下你的评论..." maxlength="500"></textarea>
      <button class="rv-submit" id="rv-submit">发表评论</button>
    </div>
    <div class="rv-list" id="rv-list">
      ${reviews.length === 0 ? '<p class="rv-empty">还没有评论，快来抢沙发！</p>' : ""}
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #tool-review-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 440px; max-height: 70vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .rv-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .rv-title { font-size: 15px; font-weight: 600; color: #a78bfa; }
    .rv-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .rv-close:hover { color: #fff; }
    .rv-stats {
      padding: 10px 16px; border-bottom: 1px solid #222;
      font-size: 14px; display: flex; gap: 8px; align-items: center;
    }
    .rv-avg { color: #fbbf24; font-weight: 600; }
    .rv-count { color: #888; }
    .rv-form { padding: 12px 16px; border-bottom: 1px solid #333; }
    .rv-stars { display: flex; gap: 4px; font-size: 24px; cursor: pointer; margin-bottom: 8px; }
    .rv-stars span { color: #444; transition: color 0.1s; }
    .rv-stars span.active { color: #fbbf24; }
    .rv-stars span:hover { color: #fbbf24; }
    .rv-form textarea {
      width: 100%; padding: 8px 10px; border: 1px solid #333; border-radius: 6px;
      background: #0d0d1a; color: #fff; font-size: 13px; resize: none; box-sizing: border-box;
    }
    .rv-form textarea:focus { outline: none; border-color: #a78bfa; }
    .rv-submit {
      margin-top: 8px; padding: 8px 16px; background: #a78bfa; border: none;
      border-radius: 6px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
      width: 100%;
    }
    .rv-submit:hover { opacity: 0.85; }
    .rv-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .rv-list { flex: 1; overflow-y: auto; padding: 12px 16px; }
    .rv-empty { text-align: center; color: #666; font-size: 13px; padding: 20px; }
    .rv-item { padding: 10px 0; border-bottom: 1px solid #222; }
    .rv-item:last-child { border-bottom: none; }
    .rv-item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .rv-item-stars { color: #fbbf24; font-size: 12px; }
    .rv-item-date { color: #666; font-size: 11px; }
    .rv-item-text { color: #ccc; font-size: 13px; line-height: 1.5; }
    .rv-item-delete {
      background: none; border: none; color: #dc2626; font-size: 11px; cursor: pointer;
      padding: 2px 4px; margin-top: 4px;
    }
    .rv-item-delete:hover { text-decoration: underline; }
  `;
  document.head.appendChild(style);
  let selectedRating = 0;
  const renderReviews = () => {
    const list = panel.querySelector("#rv-list");
    const allReviews = getToolReviews(toolId);
    if (allReviews.length === 0) {
      list.innerHTML = '<p class="rv-empty">还没有评论，快来抢沙发！</p>';
      return;
    }
    list.innerHTML = allReviews.map((r) => `
      <div class="rv-item">
        <div class="rv-item-header">
          <span class="rv-item-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
          <span class="rv-item-date">${new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="rv-item-text">${r.comment}</div>
        <button class="rv-item-delete" data-id="${r.id}">删除</button>
      </div>
    `).join("");
    list.querySelectorAll(".rv-item-delete").forEach((btn) => {
      btn.onclick = () => {
        deleteReview(toolId, btn.dataset.id);
        renderReviews();
        const statsEl = panel.querySelector(".rv-stats");
        const newStats = getReviewStats(toolId);
        statsEl.innerHTML = `<span class="rv-avg">★ ${newStats.average}</span><span class="rv-count">(${newStats.count} 条评论)</span>`;
      };
    });
  };
  panel.querySelectorAll("#rv-new-stars span").forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.rating);
      panel.querySelectorAll("#rv-new-stars span").forEach((s, i) => {
        s.classList.toggle("active", i < selectedRating);
        s.textContent = i < selectedRating ? "★" : "☆";
      });
    });
  });
  panel.querySelector("#rv-submit").addEventListener("click", () => {
    const comment = panel.querySelector("#rv-comment").value.trim();
    if (!selectedRating) {
      alert("请选择评分");
      return;
    }
    if (!comment) {
      alert("请输入评论内容");
      return;
    }
    addReview(toolId, selectedRating, comment);
    panel.querySelector("#rv-comment").value = "";
    selectedRating = 0;
    panel.querySelectorAll("#rv-new-stars span").forEach((s) => {
      s.classList.remove("active");
      s.textContent = "☆";
    });
    renderReviews();
    const statsEl = panel.querySelector(".rv-stats");
    const newStats = getReviewStats(toolId);
    statsEl.innerHTML = `<span class="rv-avg">★ ${newStats.average}</span><span class="rv-count">(${newStats.count} 条评论)</span>`;
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  renderReviews();
  return panel;
}
function createToolMarketplacePanel() {
  const tools = getMarketplaceTools();
  const installed = JSON.parse(localStorage.getItem("ai-creator-installed-tools") || "[]");
  const panel = document.createElement("div");
  panel.id = "tool-marketplace-panel";
  panel.innerHTML = `
    <div class="mp-header">
      <span class="mp-title">🛒 工具市场</span>
      <button class="mp-close" data-action="close">×</button>
    </div>
    <div class="mp-search">
      <input type="text" id="mp-search-input" placeholder="搜索工具..." />
    </div>
    <div class="mp-tabs">
      <button class="mp-tab active" data-category="all">全部</button>
      <button class="mp-tab" data-category="utility">工具</button>
      <button class="mp-tab" data-category="developer">开发</button>
      <button class="mp-tab" data-category="ai">AI</button>
      <button class="mp-tab" data-category="security">安全</button>
    </div>
    <div class="mp-list" id="mp-list"></div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #tool-marketplace-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 500px; max-height: 80vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1005; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .mp-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .mp-title { font-size: 16px; font-weight: 600; color: #60a5fa; }
    .mp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .mp-close:hover { color: #fff; }
    .mp-search { padding: 10px 12px; border-bottom: 1px solid #222; }
    .mp-search input {
      width: 100%; padding: 8px 12px; border: 1px solid #333; border-radius: 8px;
      background: #0d0d1a; color: #fff; font-size: 14px; box-sizing: border-box;
    }
    .mp-search input:focus { outline: none; border-color: #60a5fa; }
    .mp-tabs {
      display: flex; border-bottom: 1px solid #333; padding: 0 8px;
    }
    .mp-tab {
      padding: 8px 12px; background: none; border: none;
      color: #888; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent;
    }
    .mp-tab.active { color: #60a5fa; border-bottom-color: #60a5fa; }
    .mp-tab:hover { color: #fff; }
    .mp-list { flex: 1; overflow-y: auto; padding: 8px; }
    .mp-item {
      display: flex; gap: 12px; padding: 12px; border-radius: 8px;
      background: #12122a; margin-bottom: 8px; transition: background 0.15s;
    }
    .mp-item:hover { background: #1a1a3a; }
    .mp-item-icon { font-size: 28px; }
    .mp-item-info { flex: 1; }
    .mp-item-name { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .mp-item-desc { font-size: 12px; color: #888; margin-bottom: 6px; }
    .mp-item-meta {
      display: flex; gap: 12px; font-size: 11px; color: #666;
    }
    .mp-item-meta .stars { color: #fbbf24; }
    .mp-item-meta .installs { color: #888; }
    .mp-item-actions { display: flex; flex-direction: column; justify-content: center; gap: 6px; }
    .mp-btn-install {
      padding: 6px 14px; border: none; border-radius: 6px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      background: #22c55e; color: #fff;
    }
    .mp-btn-install:hover { opacity: 0.85; }
    .mp-btn-install.installed { background: #666; cursor: default; }
    .mp-btn-uninstall {
      padding: 4px 10px; border: 1px solid #dc2626; border-radius: 4px;
      background: transparent; color: #dc2626; font-size: 11px; cursor: pointer;
    }
    .mp-btn-uninstall:hover { background: #dc262622; }
    .mp-btn-review {
      padding: 4px 8px; border: 1px solid #a78bfa; border-radius: 4px;
      background: transparent; color: #a78bfa; font-size: 11px; cursor: pointer;
    }
    .mp-btn-review:hover { background: #a78bfa22; }
    .mp-category-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 4px;
      background: #60a5fa22; color: #60a5fa;
    }
  `;
  document.head.appendChild(style);
  let currentCategory = "all";
  let searchQuery = "";
  const mpList = panel.querySelector("#mp-list");
  const renderList = () => {
    let filtered = tools;
    if (currentCategory !== "all") {
      filtered = filtered.filter((t) => t.category === currentCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    installed.map((i) => i.id);
    mpList.innerHTML = filtered.map((t) => {
      const installed_now = toolRegistry.get(t.id) !== null;
      return `
        <div class="mp-item">
          <span class="mp-item-icon">${t.icon}</span>
          <div class="mp-item-info">
            <div class="mp-item-name">
              ${t.name}
              <span class="mp-category-badge">${t.category}</span>
            </div>
            <div class="mp-item-desc">${t.description}</div>
            <div class="mp-item-meta">
              <span class="stars">★ ${t.rating}</span>
              <span class="installs">📥 ${t.installs}</span>
              <span>by ${t.author}</span>
            </div>
          </div>
          <div class="mp-item-actions">
            ${installed_now ? `<button class="mp-btn-install installed" disabled>已安装</button>
                 <button class="mp-btn-uninstall" data-id="${t.id}">卸载</button>
                 <button class="mp-btn-review" data-id="${t.id}" data-name="${t.name}">💬</button>` : `<button class="mp-btn-install" data-id="${t.id}">安装</button>`}
          </div>
        </div>
      `;
    }).join("");
    mpList.querySelectorAll(".mp-btn-install:not(.installed)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = tools.find((t) => t.id === btn.dataset.id);
        if (tool) {
          const result = installTool(tool);
          if (result.success) {
            btn.textContent = "已安装";
            btn.classList.add("installed");
            btn.disabled = true;
            const actions = btn.parentElement;
            const uninstallBtn = document.createElement("button");
            uninstallBtn.className = "mp-btn-uninstall";
            uninstallBtn.dataset.id = tool.id;
            uninstallBtn.textContent = "卸载";
            actions.appendChild(uninstallBtn);
            bindUninstall();
          }
        }
      });
    });
    bindUninstall();
  };
  function bindUninstall() {
    mpList.querySelectorAll(".mp-btn-uninstall").forEach((btn) => {
      btn.onclick = () => {
        uninstallTool(btn.dataset.id);
        renderList();
      };
    });
  }
  function bindReview() {
    mpList.querySelectorAll(".mp-btn-review").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const reviewPanel = createToolReviewPanel(btn.dataset.id, btn.dataset.name);
        document.body.appendChild(reviewPanel);
      };
    });
  }
  bindReview();
  panel.querySelectorAll(".mp-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      panel.querySelectorAll(".mp-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.dataset.category;
      renderList();
    });
  });
  panel.querySelector("#mp-search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderList();
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  renderList();
  return panel;
}
export {
  createToolMarketplacePanel
};
//# sourceMappingURL=ToolMarketplacePanel-CF8oQ-eX.js.map

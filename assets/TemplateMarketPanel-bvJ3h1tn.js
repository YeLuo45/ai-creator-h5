import { g as getInstalledTemplates, a as getMarketTemplates, s as searchTemplates, c as createTemplate, i as installTemplate } from "./TemplateMarket-BFmIOwYb.js";
import "./index-zZBXRajj.js";
function createTemplateMarketPanel() {
  const panel = document.createElement("div");
  panel.id = "template-market-panel";
  const installed = getInstalledTemplates();
  getMarketTemplates();
  panel.innerHTML = `
    <div class="tmp-header">
      <span class="tmp-title">📋 创作模板</span>
      <button class="tmp-close" data-action="close">×</button>
    </div>
    <div class="tmp-tabs">
      <button class="tmp-tab active" data-tab="market">🏪 市场</button>
      <button class="tmp-tab" data-tab="installed">📥 已安装 (${installed.length})</button>
      <button class="tmp-tab" data-tab="create">➕ 创建</button>
    </div>
    <div class="tmp-search">
      <input type="text" id="tmp-search-input" placeholder="搜索模板..." />
    </div>
    <div class="tmp-content">
      <!-- 市场 -->
      <div class="tmp-tab-content active" id="tmp-tab-market">
        <div class="tmp-type-filter">
          <button class="tmp-type-btn active" data-type="">全部</button>
          <button class="tmp-type-btn" data-type="image">🎨 图片</button>
          <button class="tmp-type-btn" data-type="music">🎵 音乐</button>
          <button class="tmp-type-btn" data-type="tts">🔊 语音</button>
          <button class="tmp-type-btn" data-type="text">📝 文本</button>
        </div>
        <div class="tmp-list" id="tmp-market-list"></div>
      </div>
      
      <!-- 已安装 -->
      <div class="tmp-tab-content" id="tmp-tab-installed" style="display:none;">
        <div class="tmp-list" id="tmp-installed-list"></div>
      </div>
      
      <!-- 创建 -->
      <div class="tmp-tab-content" id="tmp-tab-create" style="display:none;">
        <div class="tmp-create-form">
          <div class="tmp-field">
            <label>模板名称:</label>
            <input type="text" id="tmp-create-name" placeholder="e.g. 我的风景画模板" />
          </div>
          <div class="tmp-field">
            <label>图标:</label>
            <input type="text" id="tmp-create-icon" placeholder="🏞️" style="width:60px;" />
          </div>
          <div class="tmp-field">
            <label>类型:</label>
            <select id="tmp-create-type">
              <option value="image">🎨 图片生成</option>
              <option value="music">🎵 音乐生成</option>
              <option value="tts">🔊 语音合成</option>
              <option value="text">📝 文本创作</option>
            </select>
          </div>
          <div class="tmp-field">
            <label>描述:</label>
            <input type="text" id="tmp-create-desc" placeholder="简短描述..." />
          </div>
          <div class="tmp-field">
            <label>提示词模板:</label>
            <textarea id="tmp-create-prompt" placeholder="使用 {param} 作为变量占位符..."></textarea>
          </div>
          <div class="tmp-hint">使用 <code>{"{变量名}"}</code> 作为参数占位符</div>
          <button class="tmp-btn" id="tmp-btn-create">创建模板</button>
        </div>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #template-market-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 480px; max-height: 80vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .tmp-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .tmp-title { font-size: 15px; font-weight: 600; color: #f472b6; }
    .tmp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .tmp-close:hover { color: #fff; }
    .tmp-tabs {
      display: flex; border-bottom: 1px solid #222;
    }
    .tmp-tab {
      flex: 1; padding: 10px; border: none; background: transparent;
      color: #888; font-size: 12px; cursor: pointer; transition: all 0.15s;
    }
    .tmp-tab:hover { color: #fff; }
    .tmp-tab.active { color: #f472b6; border-bottom: 2px solid #f472b6; }
    .tmp-search { padding: 10px 12px; border-bottom: 1px solid #222; }
    .tmp-search input {
      width: 100%; padding: 8px 12px; background: #12122a; border: 1px solid #333;
      border-radius: 6px; color: #fff; font-size: 13px;
    }
    .tmp-search input:focus { outline: none; border-color: #f472b6; }
    .tmp-content { flex: 1; overflow-y: auto; padding: 12px; }
    .tmp-tab-content { display: none; }
    .tmp-tab-content.active { display: block; }
    .tmp-type-filter { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    .tmp-type-btn {
      padding: 4px 10px; border: 1px solid #333; border-radius: 20px;
      background: transparent; color: #888; font-size: 11px; cursor: pointer;
    }
    .tmp-type-btn:hover { border-color: #f472b6; color: #f472b6; }
    .tmp-type-btn.active { background: #f472b622; border-color: #f472b6; color: #f472b6; }
    .tmp-list { display: flex; flex-direction: column; gap: 8px; }
    .tmp-item {
      padding: 12px; background: #12122a; border-radius: 8px;
      border: 1px solid #222; cursor: pointer; transition: border-color 0.15s;
    }
    .tmp-item:hover { border-color: #f472b644; }
    .tmp-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .tmp-item-icon { font-size: 20px; }
    .tmp-item-name { font-size: 14px; font-weight: 500; color: #fff; flex: 1; margin-left: 8px; }
    .tmp-item-stats { font-size: 11px; color: #888; }
    .tmp-item-desc { font-size: 12px; color: #888; margin-bottom: 6px; }
    .tmp-item-footer { display: flex; justify-content: space-between; align-items: center; }
    .tmp-item-tags { display: flex; gap: 4px; }
    .tmp-item-tag { font-size: 10px; padding: 2px 6px; background: #222; border-radius: 3px; color: #666; }
    .tmp-btn {
      width: 100%; padding: 10px; border: none; border-radius: 6px;
      background: #f472b6; color: #000; font-size: 13px; font-weight: 500; cursor: pointer;
      margin-top: 12px;
    }
    .tmp-btn:hover { opacity: 0.85; }
    .tmp-btn.secondary { background: #333; color: #fff; }
    .tmp-btn.small { padding: 6px 10px; width: auto; font-size: 11px; margin-top: 0; }
    .tmp-create-form { padding: 4px; }
    .tmp-field { margin-bottom: 12px; }
    .tmp-field label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
    .tmp-field input, .tmp-field select, .tmp-field textarea {
      width: 100%; padding: 8px 10px; background: #12122a; border: 1px solid #333;
      border-radius: 6px; color: #fff; font-size: 13px; font-family: inherit;
    }
    .tmp-field textarea { min-height: 60px; resize: vertical; }
    .tmp-field input:focus, .tmp-field select:focus, .tmp-field textarea:focus {
      outline: none; border-color: #f472b6;
    }
    .tmp-hint { font-size: 11px; color: #666; margin-top: -8px; }
    .tmp-hint code { background: #222; padding: 2px 4px; border-radius: 3px; color: #f472b6; }
    .tmp-result {
      padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px;
    }
    .tmp-result.success { background: #34d39922; color: #34d399; }
    .tmp-result.error { background: #dc262622; color: #dc2626; }
    .tmp-empty { text-align: center; color: #666; font-size: 13px; padding: 30px; }
  `;
  document.head.appendChild(style);
  panel.querySelectorAll(".tmp-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      panel.querySelectorAll(".tmp-tab").forEach((t) => t.classList.remove("active"));
      panel.querySelectorAll(".tmp-tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      panel.querySelector(`#tmp-tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
  const marketList = panel.querySelector("#tmp-market-list");
  panel.querySelector("#tmp-installed-list");
  const searchInput = panel.querySelector("#tmp-search-input");
  let currentFilter = "";
  function renderMarketList(templates) {
    if (templates.length === 0) {
      marketList.innerHTML = '<p class="tmp-empty">暂无模板</p>';
      return;
    }
    marketList.innerHTML = templates.map((t) => `
      <div class="tmp-item" data-id="${t.id}">
        <div class="tmp-item-header">
          <span class="tmp-item-icon">${t.icon}</span>
          <span class="tmp-item-name">${t.name}</span>
          <span class="tmp-item-stats">⭐ ${t.rating} | ${t.installCount}安装</span>
        </div>
        <div class="tmp-item-desc">${t.description}</div>
        <div class="tmp-item-footer">
          <div class="tmp-item-tags">
            ${t.tags.slice(0, 3).map((tag) => `<span class="tmp-item-tag">${tag}</span>`).join("")}
          </div>
          <button class="tmp-btn small secondary tmp-btn-install" data-id="${t.id}">安装</button>
        </div>
      </div>
    `).join("");
    marketList.querySelectorAll(".tmp-btn-install").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const result = installTemplate(btn.dataset.id);
        if (result.success) {
          btn.textContent = "已安装";
          btn.disabled = true;
          btn.classList.remove("secondary");
        }
      });
    });
  }
  panel.querySelectorAll(".tmp-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      panel.querySelectorAll(".tmp-type-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.type;
      const templates = currentFilter ? getMarketTemplates(currentFilter) : getMarketTemplates();
      renderMarketList(templates);
    });
  });
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    const templates = query ? searchTemplates(query, currentFilter || null) : getMarketTemplates(currentFilter || null);
    renderMarketList(templates);
  });
  const btnCreate = panel.querySelector("#tmp-btn-create");
  btnCreate.addEventListener("click", () => {
    const name = panel.querySelector("#tmp-create-name").value.trim();
    const icon = panel.querySelector("#tmp-create-icon").value.trim() || "📄";
    const type = panel.querySelector("#tmp-create-type").value;
    const desc = panel.querySelector("#tmp-create-desc").value.trim();
    const prompt = panel.querySelector("#tmp-create-prompt").value.trim();
    if (!name || !prompt) {
      alert("请填写名称和提示词模板");
      return;
    }
    createTemplate({ name, icon, type, description: desc, prompt });
    {
      alert(`模板 "${name}" 创建成功！`);
      panel.querySelector("#tmp-create-name").value = "";
      panel.querySelector("#tmp-create-icon").value = "";
      panel.querySelector("#tmp-create-desc").value = "";
      panel.querySelector("#tmp-create-prompt").value = "";
    }
  });
  renderMarketList(getMarketTemplates());
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createTemplateMarketPanel
};
//# sourceMappingURL=TemplateMarketPanel-bvJ3h1tn.js.map

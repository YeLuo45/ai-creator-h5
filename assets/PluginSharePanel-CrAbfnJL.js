import { e as toolRegistry } from "./index-zZBXRajj.js";
import { g as generateShareUrl, c as copyToClipboard, i as importPlugin, a as getSharedPlugins, e as exportFavorites } from "./PluginShare-CphKts8Q.js";
function createPluginSharePanel() {
  const panel = document.createElement("div");
  panel.id = "plugin-share-panel";
  panel.innerHTML = `
    <div class="psp-header">
      <span class="psp-title">🔗 插件分享</span>
      <button class="psp-close" data-action="close">×</button>
    </div>
    <div class="psp-tabs">
      <button class="psp-tab active" data-tab="export">导出工具</button>
      <button class="psp-tab" data-tab="import">导入插件</button>
      <button class="psp-tab" data-tab="favorites">批量分享</button>
    </div>
    <div class="psp-content">
      <!-- 导出 -->
      <div class="psp-tab-content active" id="psp-tab-export">
        <div class="psp-field">
          <label>选择要分享的工具:</label>
          <select id="psp-tool-select">
            <option value="">-- 选择工具 --</option>
            ${Array.from(toolRegistry.getAll()).map(
    (t) => `<option value="${t.id}">${t.icon} ${t.name}</option>`
  ).join("")}
          </select>
        </div>
        <div id="psp-export-preview" class="psp-preview" style="display:none;"></div>
        <div class="psp-actions">
          <button class="psp-btn" id="psp-btn-export">生成分享链接</button>
          <button class="psp-btn secondary" id="psp-btn-copy" style="display:none;">复制链接</button>
        </div>
        <div id="psp-export-result" class="psp-result" style="display:none;"></div>
      </div>
      
      <!-- 导入 -->
      <div class="psp-tab-content" id="psp-tab-import" style="display:none;">
        <div class="psp-field">
          <label>粘贴分享内容或链接:</label>
          <textarea id="psp-import-input" placeholder="粘贴插件代码或分享链接..."></textarea>
        </div>
        <div class="psp-actions">
          <button class="psp-btn" id="psp-btn-import">导入插件</button>
        </div>
        <div id="psp-import-result" class="psp-result" style="display:none;"></div>
        <div class="psp-shared-list" id="psp-shared-list" style="display:none;">
          <h4>已导入的插件:</h4>
          <div id="psp-shared-items"></div>
        </div>
      </div>
      
      <!-- 批量分享 -->
      <div class="psp-tab-content" id="psp-tab-favorites" style="display:none;">
        <div class="psp-field">
          <label>批量导出收藏的工具:</label>
          <p class="psp-hint">将所有收藏的工具打包成一个分享文件</p>
        </div>
        <div class="psp-actions">
          <button class="psp-btn" id="psp-btn-export-favs">导出收藏包</button>
          <button class="psp-btn secondary" id="psp-btn-copy-favs" style="display:none;">复制</button>
        </div>
        <div id="psp-favs-result" class="psp-result" style="display:none;"></div>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #plugin-share-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 440px; max-height: 75vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .psp-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .psp-title { font-size: 15px; font-weight: 600; color: #34d399; }
    .psp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .psp-close:hover { color: #fff; }
    .psp-tabs {
      display: flex; border-bottom: 1px solid #222;
    }
    .psp-tab {
      flex: 1; padding: 10px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .psp-tab:hover { color: #fff; }
    .psp-tab.active { color: #34d399; border-bottom: 2px solid #34d399; }
    .psp-content { flex: 1; overflow-y: auto; padding: 16px; }
    .psp-tab-content { display: none; }
    .psp-tab-content.active { display: block; }
    .psp-field { margin-bottom: 14px; }
    .psp-field label { display: block; font-size: 13px; color: #888; margin-bottom: 6px; }
    .psp-field select, .psp-field textarea {
      width: 100%; padding: 10px; background: #12122a; border: 1px solid #333;
      border-radius: 6px; color: #fff; font-size: 13px; font-family: inherit;
    }
    .psp-field textarea { min-height: 80px; resize: vertical; }
    .psp-field select:focus, .psp-field textarea:focus {
      outline: none; border-color: #34d399;
    }
    .psp-hint { font-size: 12px; color: #666; margin-top: 4px; }
    .psp-preview {
      padding: 10px; background: #12122a; border-radius: 6px;
      margin-bottom: 14px; font-size: 12px; color: #888;
    }
    .psp-actions { display: flex; gap: 8px; margin-bottom: 14px; }
    .psp-btn {
      flex: 1; padding: 10px 14px; border: none; border-radius: 6px;
      font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .psp-btn:hover { opacity: 0.85; }
    .psp-btn:not(.secondary) { background: #34d399; color: #000; }
    .psp-btn.secondary { background: #333; color: #fff; }
    .psp-result {
      padding: 10px 12px; border-radius: 6px; font-size: 13px;
      margin-bottom: 14px;
    }
    .psp-result.success { background: #34d39922; color: #34d399; }
    .psp-result.error { background: #dc262622; color: #dc2626; }
    .psp-shared-list { margin-top: 14px; }
    .psp-shared-list h4 { font-size: 13px; color: #888; margin-bottom: 8px; }
    .psp-shared-item {
      padding: 8px 10px; background: #12122a; border-radius: 4px;
      margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;
    }
    .psp-shared-item span { font-size: 12px; color: #fff; }
  `;
  document.head.appendChild(style);
  panel.querySelectorAll(".psp-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      panel.querySelectorAll(".psp-tab").forEach((t) => t.classList.remove("active"));
      panel.querySelectorAll(".psp-tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      panel.querySelector(`#psp-tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
  const toolSelect = panel.querySelector("#psp-tool-select");
  const exportPreview = panel.querySelector("#psp-export-preview");
  const btnExport = panel.querySelector("#psp-btn-export");
  const btnCopy = panel.querySelector("#btn-copy");
  const exportResult = panel.querySelector("#psp-export-result");
  toolSelect.addEventListener("change", () => {
    const toolId = toolSelect.value;
    if (!toolId) {
      exportPreview.style.display = "none";
      btnCopy.style.display = "none";
      return;
    }
    const tool = toolRegistry.get(toolId);
    exportPreview.style.display = "block";
    exportPreview.innerHTML = `
      <strong>${tool.icon} ${tool.name}</strong><br/>
      ${tool.description || "无描述"}<br/>
      <span style="color:#666">ID: ${tool.id}</span>
    `;
  });
  btnExport.addEventListener("click", () => {
    const toolId = toolSelect.value;
    if (!toolId) {
      exportResult.style.display = "block";
      exportResult.className = "psp-result error";
      exportResult.textContent = "请选择要分享的工具";
      return;
    }
    const url = generateShareUrl(toolId);
    if (url) {
      exportResult.style.display = "block";
      exportResult.className = "psp-result success";
      exportResult.innerHTML = `分享链接已生成（仅本地存储）:<br/>
        <input type="text" value="${url.slice(0, 60)}..." readonly 
          style="width:100%;margin-top:6px;padding:6px;background:#0a0a1a;border:1px solid #333;border-radius:4px;color:#fff;font-size:11px;" />`;
      btnCopy.style.display = "inline-block";
      btnCopy.onclick = async () => {
        await copyToClipboard(url);
        exportResult.innerHTML += '<br/><span style="color:#4ade80">已复制!</span>';
      };
    }
  });
  const importInput = panel.querySelector("#psp-import-input");
  const btnImport = panel.querySelector("#psp-btn-import");
  const importResult = panel.querySelector("#psp-import-result");
  const sharedList = panel.querySelector("#psp-shared-list");
  const sharedItems = panel.querySelector("#psp-shared-items");
  btnImport.addEventListener("click", () => {
    const input = importInput.value.trim();
    if (!input) {
      importResult.style.display = "block";
      importResult.className = "psp-result error";
      importResult.textContent = "请输入插件内容";
      return;
    }
    const result = importPlugin(input);
    importResult.style.display = "block";
    if (result.success) {
      importResult.className = "psp-result success";
      importResult.innerHTML = `导入成功: ${result.plugin.icon} ${result.plugin.name}`;
      importInput.value = "";
      const shared = getSharedPlugins();
      if (shared.length > 0) {
        sharedList.style.display = "block";
        sharedItems.innerHTML = shared.map((p) => `
          <div class="psp-shared-item">
            <span>${p.icon || "🔌"} ${p.name}</span>
            <span style="color:#666">v${p.version || "1.0"}</span>
          </div>
        `).join("");
      }
    } else {
      importResult.className = "psp-result error";
      importResult.textContent = result.error;
    }
  });
  const btnExportFavs = panel.querySelector("#psp-btn-export-favs");
  const btnCopyFavs = panel.querySelector("#psp-btn-copy-favs");
  const favsResult = panel.querySelector("#psp-favs-result");
  let currentFavsData = "";
  btnExportFavs.addEventListener("click", () => {
    const result = exportFavorites();
    favsResult.style.display = "block";
    if (result.success) {
      currentFavsData = result.encoded;
      favsResult.className = "psp-result success";
      favsResult.innerHTML = `成功导出 ${result.data.tools.length} 个收藏工具（已复制）:<br/>
        <input type="text" value="${currentFavsData.slice(0, 60)}..." readonly 
          style="width:100%;margin-top:6px;padding:6px;background:#0a0a1a;border:1px solid #333;border-radius:4px;color:#fff;font-size:11px;" />`;
      btnCopyFavs.style.display = "inline-block";
      copyToClipboard(currentFavsData);
      btnCopyFavs.onclick = async () => {
        await copyToClipboard(currentFavsData);
        favsResult.innerHTML += '<br/><span style="color:#4ade80">已复制!</span>';
      };
    } else {
      favsResult.className = "psp-result error";
      favsResult.textContent = result.error;
    }
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createPluginSharePanel
};
//# sourceMappingURL=PluginSharePanel-CrAbfnJL.js.map

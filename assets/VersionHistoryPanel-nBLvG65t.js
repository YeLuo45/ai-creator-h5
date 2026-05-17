import { getVersions, restoreVersion, deleteVersion } from "./OfflineStorage--KIH4Fbv.js";
function createVersionHistoryPanel(itemId, itemTitle) {
  const versions = getVersions(itemId);
  const panel = document.createElement("div");
  panel.id = "version-history-panel";
  panel.innerHTML = `
    <div class="vh-header">
      <span class="vh-title">📜 ${itemTitle} - 版本历史</span>
      <button class="vh-close" data-action="close">×</button>
    </div>
    <div class="vh-list" id="vh-list">
      ${versions.length === 0 ? '<p class="vh-empty">暂无版本记录</p>' : ""}
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #version-history-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 480px; max-height: 70vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .vh-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .vh-title { font-size: 14px; font-weight: 600; color: #38bdf8; }
    .vh-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .vh-close:hover { color: #fff; }
    .vh-list { flex: 1; overflow-y: auto; padding: 12px 16px; }
    .vh-empty { text-align: center; color: #666; font-size: 13px; padding: 30px; }
    .vh-item {
      padding: 12px; background: #12122a; border-radius: 8px; margin-bottom: 8px;
      border: 1px solid #222;
    }
    .vh-item:hover { border-color: #38bdf844; }
    .vh-item-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .vh-item-type { font-size: 11px; padding: 2px 8px; border-radius: 4px; }
    .vh-item-type.draft { background: #fbbf2422; color: #fbbf24; }
    .vh-item-type.published { background: #4ade8022; color: #4ade80; }
    .vh-item-type.backup { background: #60a5fa22; color: #60a5fa; }
    .vh-item-date { font-size: 11px; color: #888; }
    .vh-item-preview {
      font-size: 12px; color: #aaa; margin-bottom: 8px;
      max-height: 40px; overflow: hidden; white-space: pre-wrap;
    }
    .vh-item-actions { display: flex; gap: 6px; }
    .vh-btn {
      flex: 1; padding: 6px 10px; border: none; border-radius: 4px;
      font-size: 12px; cursor: pointer; transition: opacity 0.15s;
    }
    .vh-btn:hover { opacity: 0.8; }
    .vh-btn-restore { background: #4ade80; color: #000; }
    .vh-btn-delete { background: #dc262622; color: #dc2626; border: 1px solid #dc262666; }
  `;
  document.head.appendChild(style);
  const vhList = panel.querySelector("#vh-list");
  const render = () => {
    const vers = getVersions(itemId);
    if (vers.length === 0) {
      vhList.innerHTML = '<p class="vh-empty">暂无版本记录</p>';
      return;
    }
    vhList.innerHTML = vers.map((v) => `
      <div class="vh-item">
        <div class="vh-item-header">
          <span class="vh-item-type ${v.type}">${v.type === "draft" ? "草稿" : v.type === "published" ? "已发布" : "备份"}</span>
          <span class="vh-item-date">${new Date(v.createdAt).toLocaleString()}</span>
        </div>
        <div class="vh-item-preview">${(v.content || "").slice(0, 100)}...</div>
        <div class="vh-item-actions">
          <button class="vh-btn vh-btn-restore" data-id="${v.id}">恢复此版本</button>
          <button class="vh-btn vh-btn-delete" data-id="${v.id}">删除</button>
        </div>
      </div>
    `).join("");
    vhList.querySelectorAll(".vh-btn-restore").forEach((btn) => {
      btn.onclick = () => {
        if (confirm("确定要恢复到此版本吗？")) {
          restoreVersion(itemId, btn.dataset.id);
          alert("已恢复到选定版本");
          render();
        }
      };
    });
    vhList.querySelectorAll(".vh-btn-delete").forEach((btn) => {
      btn.onclick = () => {
        deleteVersion(itemId, btn.dataset.id);
        render();
      };
    });
  };
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  render();
  return panel;
}
export {
  createVersionHistoryPanel
};
//# sourceMappingURL=VersionHistoryPanel-nBLvG65t.js.map

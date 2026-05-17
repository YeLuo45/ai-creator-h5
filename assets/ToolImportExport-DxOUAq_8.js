import { T as Tool, e as toolRegistry } from "./index-zZBXRajj.js";
function createToolImportExport() {
  const panel = document.createElement("div");
  panel.id = "tool-import-export";
  panel.innerHTML = `
    <div class="ie-header">
      <span class="ie-title">📦 工具导入/导出</span>
      <button class="ie-close" data-action="close">×</button>
    </div>
    <div class="ie-content">
      <div class="ie-section">
        <h3>📤 导出</h3>
        <p>将所有自定义工具导出为 JSON 文件</p>
        <button class="btn-export" id="export-tools-btn">导出自定义工具</button>
      </div>
      <div class="ie-section">
        <h3>📥 导入</h3>
        <p>从 JSON 文件导入自定义工具</p>
        <input type="file" id="import-file" accept=".json" style="display:none" />
        <button class="btn-import" id="import-tools-btn">选择文件导入</button>
      </div>
      <div class="ie-result" id="ie-result"></div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #tool-import-export {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 400px; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1002; font-family: system-ui, sans-serif;
    }
    .ie-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .ie-title { font-size: 16px; font-weight: 600; color: #60a5fa; }
    .ie-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .ie-close:hover { color: #fff; }
    .ie-content { padding: 16px; }
    .ie-section { margin-bottom: 16px; }
    .ie-section h3 { margin: 0 0 8px 0; color: #e0e0e0; font-size: 14px; }
    .ie-section p { margin: 0 0 8px 0; color: #888; font-size: 12px; }
    .btn-export, .btn-import {
      width: 100%; padding: 10px; border: none; border-radius: 6px;
      font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-export { background: #60a5fa; color: #000; }
    .btn-import { background: #22c55e; color: #000; }
    .btn-export:hover, .btn-import:hover { opacity: 0.85; }
    .ie-result {
      margin-top: 12px; padding: 10px; background: #0d0d1a;
      border-radius: 6px; font-size: 13px; color: #4ade80; white-space: pre-wrap;
    }
  `;
  document.head.appendChild(style);
  const result = panel.querySelector("#ie-result");
  panel.querySelector("#export-tools-btn").addEventListener("click", () => {
    const customTools = JSON.parse(localStorage.getItem("ai-creator-custom-tools") || "[]");
    if (customTools.length === 0) {
      result.textContent = "📭 没有自定义工具可导出";
      return;
    }
    const blob = new Blob([JSON.stringify(customTools, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-creator-tools-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    result.textContent = `✅ 已导出 ${customTools.length} 个自定义工具`;
  });
  const fileInput = panel.querySelector("#import-file");
  panel.querySelector("#import-tools-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tools = JSON.parse(e.target.result);
        if (!Array.isArray(tools)) throw new Error("格式错误：需要数组");
        const existing = JSON.parse(localStorage.getItem("ai-creator-custom-tools") || "[]");
        const existingIds = new Set(existing.map((t) => t.id));
        let imported = 0, skipped = 0;
        for (const t of tools) {
          if (!t.id || !t.name || !t.code) {
            skipped++;
            continue;
          }
          if (existingIds.has(t.id)) {
            skipped++;
            continue;
          }
          try {
            const fn = new Function("ctx", t.code);
            const tool = new Tool({
              id: t.id,
              name: t.name,
              icon: t.icon || "🔧",
              description: t.desc || "",
              execute: fn
            });
            toolRegistry.register(tool);
            existing.push(t);
            imported++;
          } catch (err) {
            skipped++;
          }
        }
        localStorage.setItem("ai-creator-custom-tools", JSON.stringify(existing));
        result.textContent = `✅ 导入完成：${imported} 个成功，${skipped} 个跳过`;
      } catch (err) {
        result.textContent = `❌ 导入失败: ${err.message}`;
      }
    };
    reader.readAsText(file);
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createToolImportExport
};
//# sourceMappingURL=ToolImportExport-DxOUAq_8.js.map

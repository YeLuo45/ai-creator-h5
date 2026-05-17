import { e as toolRegistry, T as Tool } from "./index-zZBXRajj.js";
function createCustomToolEditor() {
  const panel = document.createElement("div");
  panel.id = "custom-tool-editor";
  panel.innerHTML = `
    <div class="editor-header">
      <span class="editor-title">➕ 创建自定义工具</span>
      <button class="editor-close" data-action="close">×</button>
    </div>
    <div class="editor-form">
      <div class="form-group">
        <label>工具 ID (英文唯一标识)</label>
        <input type="text" id="tool-id" placeholder="my-custom-tool" />
      </div>
      <div class="form-group">
        <label>工具名称</label>
        <input type="text" id="tool-name" placeholder="我的工具" />
      </div>
      <div class="form-group">
        <label>图标 (emoji)</label>
        <input type="text" id="tool-icon" placeholder="🔧" maxlength="2" />
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea id="tool-desc" rows="2" placeholder="工具功能描述..."></textarea>
      </div>
      <div class="form-group">
        <label>输入字段</label>
        <div id="input-fields-list"></div>
        <button class="btn-add-field" id="add-field-btn">+ 添加输入字段</button>
      </div>
      <div class="form-group">
        <label>执行逻辑 (JavaScript)</label>
        <textarea id="tool-code" rows="6" placeholder="// ctx 包含所有输入字段的值
// 返回结果对象
return { result: ctx.text + ' processed' };"></textarea>
      </div>
      <button class="btn-save-tool" id="save-tool-btn">💾 保存工具</button>
    </div>
    <div class="editor-result" id="editor-result"></div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #custom-tool-editor {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 440px; max-height: 85vh;
      background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1001; display: flex; flex-direction: column;
      font-family: system-ui, sans-serif;
      overflow: hidden;
    }
    .editor-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .editor-title { font-size: 16px; font-weight: 600; color: #4ade80; }
    .editor-close {
      background: none; border: none; color: #888; font-size: 20px; cursor: pointer;
      padding: 0 4px; border-radius: 4px;
    }
    .editor-close:hover { background: #333; color: #fff; }
    .editor-form { padding: 14px; overflow-y: auto; flex: 1; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; color: #a0a0b0; font-size: 13px; margin-bottom: 6px; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 8px 10px; border: 1px solid #333;
      border-radius: 6px; background: #0d0d1a; color: #fff; font-size: 13px;
      box-sizing: border-box; font-family: monospace;
    }
    .form-group input:focus, .form-group textarea:focus {
      outline: none; border-color: #4ade80;
    }
    .form-group textarea { resize: vertical; }
    #input-fields-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
    .input-field-item { display: flex; gap: 6px; align-items: center; }
    .input-field-item input { flex: 1; }
    .input-field-item button { background: #dc2626; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .btn-add-field {
      width: 100%; padding: 6px; background: #252540; border: 1px dashed #444;
      border-radius: 6px; color: #888; cursor: pointer; font-size: 12px;
    }
    .btn-add-field:hover { background: #2a2a50; color: #aaa; }
    .btn-save-tool {
      width: 100%; padding: 12px; background: linear-gradient(135deg, #4ade80, #22c55e);
      border: none; border-radius: 8px; color: #000; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-save-tool:hover { opacity: 0.9; }
    .editor-result {
      padding: 10px 14px; background: #0d0d1a; font-size: 13px;
      color: #4ade80; white-space: pre-wrap; max-height: 80px; overflow-y: auto;
    }
  `;
  document.head.appendChild(style);
  const fieldsList = panel.querySelector("#input-fields-list");
  const fields = [{ name: "", type: "text" }];
  const renderFields = () => {
    fieldsList.innerHTML = fields.map((f, i) => `
      <div class="input-field-item">
        <input type="text" placeholder="字段名" value="${f.name}" data-index="${i}" class="field-name" />
        <select class="field-type" data-index="${i}">
          <option value="text" ${f.type === "text" ? "selected" : ""}>文本</option>
          <option value="number" ${f.type === "number" ? "selected" : ""}>数字</option>
        </select>
        <button class="remove-field" data-index="${i}">×</button>
      </div>
    `).join("");
    fieldsList.querySelectorAll(".remove-field").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index);
        if (fields.length > 1) {
          fields.splice(idx, 1);
          renderFields();
        }
      });
    });
    fieldsList.querySelectorAll(".field-name").forEach((inp) => {
      inp.addEventListener("input", () => {
        fields[parseInt(inp.dataset.index)].name = inp.value;
      });
    });
    fieldsList.querySelectorAll(".field-type").forEach((sel) => {
      sel.addEventListener("change", () => {
        fields[parseInt(sel.dataset.index)].type = sel.value;
      });
    });
  };
  panel.querySelector("#add-field-btn").addEventListener("click", () => {
    fields.push({ name: "", type: "text" });
    renderFields();
  });
  panel.querySelector("#save-tool-btn").addEventListener("click", () => {
    const id = panel.querySelector("#tool-id").value.trim();
    const name = panel.querySelector("#tool-name").value.trim();
    const icon = panel.querySelector("#tool-icon").value.trim() || "🔧";
    const desc = panel.querySelector("#tool-desc").value.trim();
    const code = panel.querySelector("#tool-code").value.trim();
    const result = panel.querySelector("#editor-result");
    if (!id || !name || !code) {
      result.textContent = "❌ 请填写必填字段：ID、名称、执行逻辑";
      return;
    }
    if (toolRegistry.get(id)) {
      result.textContent = "❌ 工具 ID 已存在";
      return;
    }
    try {
      const toolFn = new Function("ctx", code);
      const customTool = new Tool({
        id,
        name,
        description: desc,
        icon,
        execute: toolFn,
        validate: (ctx) => {
          for (const f of fields) {
            if (f.name && !ctx[f.name]) {
              return { valid: false, error: `需要 ${f.name} 输入` };
            }
          }
          return { valid: true };
        }
      });
      toolRegistry.register(customTool);
      const customTools = JSON.parse(localStorage.getItem("ai-creator-custom-tools") || "[]");
      customTools.push({ id, name, icon, desc, fields, code });
      localStorage.setItem("ai-creator-custom-tools", JSON.stringify(customTools));
      result.textContent = `✅ 工具 "${name}" 已保存！`;
      setTimeout(() => panel.remove(), 1e3);
    } catch (e) {
      result.textContent = `❌ 代码错误: ${e.message}`;
    }
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  renderFields();
  return panel;
}
export {
  createCustomToolEditor
};
//# sourceMappingURL=CustomToolEditor-CIwzE_EI.js.map

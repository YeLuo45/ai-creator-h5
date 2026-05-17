const SETTINGS_KEY = "ai-creator-settings";
const SHORTCUTS_KEY = "ai-creator-shortcuts";
const THEME_KEY = "ai-creator-theme";
const DEFAULT_SETTINGS = {
  language: "zh-CN",
  autoSave: true,
  autoSaveInterval: 3e4,
  showTooltips: true,
  enableAnimations: true,
  compactMode: false,
  defaultView: "grid",
  itemsPerPage: 20,
  notifications: {
    toolUse: true,
    workflowComplete: true,
    syncComplete: true,
    errors: true
  },
  performance: {
    lazyLoadImages: true,
    virtualListThreshold: 100,
    cacheEnabled: true
  }
};
const DEFAULT_THEME = {
  id: "dark",
  name: "深色主题",
  colors: {
    primary: "#60a5fa",
    secondary: "#a78bfa",
    accent: "#f97316",
    background: "#0f0f1a",
    surface: "#1a1a2e",
    surfaceAlt: "#16162a",
    text: "#ffffff",
    textSecondary: "#888888",
    border: "#333333",
    success: "#10b981",
    warning: "#fbbf24",
    error: "#ef4444"
  }
};
const PRESET_THEMES = [
  { id: "dark", name: "深色主题", ...DEFAULT_THEME },
  { id: "light", name: "浅色主题", colors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#f97316",
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    success: "#10b981",
    warning: "#fbbf24",
    error: "#ef4444"
  } },
  { id: "synthwave", name: "霓虹风格", colors: {
    primary: "#ff00ff",
    secondary: "#00ffff",
    accent: "#ff6b35",
    background: "#1a0a2e",
    surface: "#2d1b4e",
    surfaceAlt: "#3d2b5e",
    text: "#ffffff",
    textSecondary: "#c792ea",
    border: "#8b5cf6",
    success: "#50fa7b",
    warning: "#ffb86c",
    error: "#ff5555"
  } },
  { id: "forest", name: "森林风格", colors: {
    primary: "#22c55e",
    secondary: "#84cc16",
    accent: "#f97316",
    background: "#0c0f0a",
    surface: "#1a2e1a",
    surfaceAlt: "#243a24",
    text: "#d9f5d9",
    textSecondary: "#86efac",
    border: "#3d5a3d",
    success: "#22c55e",
    warning: "#fbbf24",
    error: "#ef4444"
  } },
  { id: "ocean", name: "海洋风格", colors: {
    primary: "#0ea5e9",
    secondary: "#06b6d4",
    accent: "#f97316",
    background: "#0a1929",
    surface: "#132f4c",
    surfaceAlt: "#1e4976",
    text: "#e3f2fd",
    textSecondary: "#90caf9",
    border: "#1e3a5f",
    success: "#10b981",
    warning: "#fbbf24",
    error: "#ef4444"
  } }
];
const DEFAULT_SHORTCUTS = {
  toggleToolPanel: { key: "t", ctrl: true, shift: false, alt: false, description: "显示/隐藏工具箱" },
  newTool: { key: "n", ctrl: true, shift: false, alt: false, description: "新建工具" },
  search: { key: "f", ctrl: true, shift: false, alt: false, description: "搜索工具" },
  save: { key: "s", ctrl: true, shift: false, alt: false, description: "保存" },
  runWorkflow: { key: "Enter", ctrl: true, shift: false, alt: false, description: "运行工作流" },
  closePanel: { key: "Escape", ctrl: false, shift: false, alt: false, description: "关闭面板" },
  toggleTheme: { key: "d", ctrl: true, shift: true, alt: false, description: "切换主题" },
  settings: { key: ",", ctrl: true, shift: false, alt: false, description: "打开设置" }
};
function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
function saveSettings(updates) {
  const current = getSettings();
  const merged = { ...current, ...updates };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return current;
  }
}
function resetSettings() {
  localStorage.removeItem(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS };
}
function getCurrentTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (!stored) return { ...DEFAULT_THEME };
    const themeId = JSON.parse(stored);
    const preset = PRESET_THEMES.find((t) => t.id === themeId);
    return preset ? { ...preset } : { ...DEFAULT_THEME };
  } catch {
    return { ...DEFAULT_THEME };
  }
}
function setTheme(themeId) {
  const preset = PRESET_THEMES.find((t) => t.id === themeId);
  if (!preset) return false;
  localStorage.setItem(THEME_KEY, JSON.stringify(themeId));
  applyTheme(preset);
  return true;
}
function applyTheme(theme) {
  const root = document.documentElement;
  const colors = theme.colors;
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-secondary", colors.secondary);
  root.style.setProperty("--color-accent", colors.accent);
  root.style.setProperty("--color-background", colors.background);
  root.style.setProperty("--color-surface", colors.surface);
  root.style.setProperty("--color-surface-alt", colors.surfaceAlt);
  root.style.setProperty("--color-text", colors.text);
  root.style.setProperty("--color-text-secondary", colors.textSecondary);
  root.style.setProperty("--color-border", colors.border);
  root.style.setProperty("--color-success", colors.success);
  root.style.setProperty("--color-warning", colors.warning);
  root.style.setProperty("--color-error", colors.error);
  document.body.style.backgroundColor = colors.background;
  document.body.style.color = colors.text;
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement("meta");
    metaTheme.name = "theme-color";
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = colors.background;
}
function getShortcuts() {
  try {
    const stored = localStorage.getItem(SHORTCUTS_KEY);
    if (!stored) return { ...DEFAULT_SHORTCUTS };
    return { ...DEFAULT_SHORTCUTS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}
function saveShortcuts(shortcuts) {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
    return shortcuts;
  } catch {
    return getShortcuts();
  }
}
function resetShortcuts() {
  localStorage.removeItem(SHORTCUTS_KEY);
  return { ...DEFAULT_SHORTCUTS };
}
function updateShortcut(action, keyConfig) {
  const shortcuts = getShortcuts();
  shortcuts[action] = keyConfig;
  saveShortcuts(shortcuts);
  registerShortcuts();
  return shortcuts;
}
function matchShortcut(event, config) {
  if (!config) return false;
  const ctrlMatch = !!config.ctrl === (event.ctrlKey || event.metaKey);
  const shiftMatch = !!config.shift === event.shiftKey;
  const altMatch = !!config.alt === event.altKey;
  const keyMatch = config.key.toLowerCase() === event.key.toLowerCase();
  return ctrlMatch && shiftMatch && altMatch && keyMatch;
}
function formatShortcut(config) {
  if (!config) return "";
  const parts = [];
  if (config.ctrl) parts.push("Ctrl");
  if (config.shift) parts.push("Shift");
  if (config.alt) parts.push("Alt");
  parts.push(config.key);
  return parts.join(" + ");
}
const registeredHandlers = /* @__PURE__ */ new Map();
function registerShortcuts() {
  document.removeEventListener("keydown", handleKeyDown);
  const shortcuts = getShortcuts();
  for (const [action, config] of Object.entries(shortcuts)) {
    if (config && config.key) {
      registeredHandlers.set(action, config);
    }
  }
  document.addEventListener("keydown", handleKeyDown);
}
function handleKeyDown(event) {
  for (const [action, config] of registeredHandlers.entries()) {
    if (matchShortcut(event, config)) {
      event.preventDefault();
      handleShortcutAction(action);
      return;
    }
  }
}
const shortcutHandlers = {};
function handleShortcutAction(action) {
  const handler = shortcutHandlers[action];
  if (handler) {
    handler();
  }
}
function exportSettings() {
  return JSON.stringify({
    settings: getSettings(),
    theme: localStorage.getItem(THEME_KEY),
    shortcuts: getShortcuts()
  }, null, 2);
}
function importSettings(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.settings) {
      saveSettings(data.settings);
    }
    if (data.theme) {
      localStorage.setItem(THEME_KEY, data.theme);
      const themeId = JSON.parse(data.theme);
      const preset = PRESET_THEMES.find((t) => t.id === themeId);
      if (preset) applyTheme(preset);
    }
    if (data.shortcuts) {
      saveShortcuts(data.shortcuts);
      registerShortcuts();
    }
    return true;
  } catch {
    return false;
  }
}
function createAdvancedSettingsPanel() {
  const panel = document.createElement("div");
  panel.id = "settings-panel";
  let currentTab = "appearance";
  function render() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const settings = getSettings();
    const theme = getCurrentTheme();
    const shortcuts = getShortcuts();
    let content = '<div class="sp-header"><span class="sp-title">⚙️ 高级设置</span><button class="sp-close" data-action="close">×</button></div><div class="sp-tabs"><button class="sp-tab ' + (currentTab === "appearance" ? "active" : "") + '" data-tab="appearance">🎨 外观</button><button class="sp-tab ' + (currentTab === "shortcuts" ? "active" : "") + '" data-tab="shortcuts">⌨️ 快捷键</button><button class="sp-tab ' + (currentTab === "general" ? "active" : "") + '" data-tab="general">🔧 通用</button><button class="sp-tab ' + (currentTab === "data" ? "active" : "") + '" data-tab="data">💾 数据</button></div><div class="sp-body">';
    if (currentTab === "appearance") {
      content += '<div class="sp-section"><div class="sp-section-title">🎨 主题</div><div class="sp-themes-grid">';
      for (const t of PRESET_THEMES) {
        const isActive = theme.id === t.id;
        content += '<div class="sp-theme-card ' + (isActive ? "active" : "") + '" data-theme-id="' + t.id + '"><div class="sp-theme-preview" style="background: ' + t.colors.background + '"><div class="sp-theme-bar" style="background: ' + t.colors.primary + '"></div><div class="sp-theme-bar" style="background: ' + t.colors.secondary + '"></div><div class="sp-theme-bar" style="background: ' + t.colors.accent + '"></div></div><div class="sp-theme-name">' + t.name + "</div></div>";
      }
      content += "</div></div>";
      content += '<div class="sp-section"><div class="sp-section-title">🌈 自定义颜色</div><div class="sp-color-grid">';
      const colorFields = [
        { key: "primary", label: "主色" },
        { key: "secondary", label: "次色" },
        { key: "accent", label: "强调色" },
        { key: "background", label: "背景" },
        { key: "surface", label: "表面" },
        { key: "text", label: "文字" }
      ];
      for (const field of colorFields) {
        const color = theme.colors[field.key] || "#000000";
        content += '<div class="sp-color-item"><div class="sp-color-label">' + field.label + '</div><div class="sp-color-value" style="background: ' + color + '"></div><input type="color" class="sp-color-input" data-key="' + field.key + '" value="' + color + '"></div>';
      }
      content += "</div></div>";
    } else if (currentTab === "shortcuts") {
      content += '<div class="sp-section"><div class="sp-section-title">⌨️ 快捷键列表</div><div class="sp-shortcuts-list">';
      for (const [action, config] of Object.entries(shortcuts)) {
        const display = formatShortcut(config);
        content += '<div class="sp-shortcut-item"><div class="sp-shortcut-action">' + config.description + '</div><div class="sp-shortcut-key">' + (display || "未设置") + '</div><button class="sp-btn-small" data-action="edit-shortcut" data-key="' + action + '">编辑</button></div>';
      }
      content += "</div></div>";
      content += '<div class="sp-section"><button class="sp-btn" id="sp-reset-shortcuts">↺ 重置快捷键</button></div>';
    } else if (currentTab === "general") {
      content += '<div class="sp-section"><div class="sp-section-title">🔧 通用设置</div><div class="sp-setting-item"><div class="sp-setting-info"><div class="sp-setting-label">自动保存</div><div class="sp-setting-desc">自动保存工具编辑</div></div><label class="sp-switch"><input type="checkbox" id="sp-auto-save" ' + (settings.autoSave ? "checked" : "") + '><span class="sp-slider"></span></label></div><div class="sp-setting-item"><div class="sp-setting-info"><div class="sp-setting-label">显示提示</div><div class="sp-setting-desc">鼠标悬停显示工具提示</div></div><label class="sp-switch"><input type="checkbox" id="sp-show-tooltips" ' + (settings.showTooltips ? "checked" : "") + '><span class="sp-slider"></span></label></div><div class="sp-setting-item"><div class="sp-setting-info"><div class="sp-setting-label">启用动画</div><div class="sp-setting-desc">界面过渡动画效果</div></div><label class="sp-switch"><input type="checkbox" id="sp-animations" ' + (settings.enableAnimations ? "checked" : "") + '><span class="sp-slider"></span></label></div><div class="sp-setting-item"><div class="sp-setting-info"><div class="sp-setting-label">紧凑模式</div><div class="sp-setting-desc">减少界面元素间距</div></div><label class="sp-switch"><input type="checkbox" id="sp-compact" ' + (settings.compactMode ? "checked" : "") + '><span class="sp-slider"></span></label></div></div>';
      content += '<div class="sp-section"><div class="sp-section-title">🔔 通知设置</div><div class="sp-setting-item"><div class="sp-setting-label">工具使用通知</div><label class="sp-switch"><input type="checkbox" id="sp-notify-tool" ' + (((_a = settings.notifications) == null ? void 0 : _a.toolUse) ? "checked" : "") + '><span class="sp-slider"></span></label></div><div class="sp-setting-item"><div class="sp-setting-label">工作流完成通知</div><label class="sp-switch"><input type="checkbox" id="sp-notify-workflow" ' + (((_b = settings.notifications) == null ? void 0 : _b.workflowComplete) ? "checked" : "") + '><span class="sp-slider"></span></label></div><div class="sp-setting-item"><div class="sp-setting-label">同步完成通知</div><label class="sp-switch"><input type="checkbox" id="sp-notify-sync" ' + (((_c = settings.notifications) == null ? void 0 : _c.syncComplete) ? "checked" : "") + '><span class="sp-slider"></span></label></div><div class="sp-setting-item"><div class="sp-setting-label">错误通知</div><label class="sp-switch"><input type="checkbox" id="sp-notify-error" ' + (((_d = settings.notifications) == null ? void 0 : _d.errors) ? "checked" : "") + '><span class="sp-slider"></span></label></div></div>';
    } else if (currentTab === "data") {
      content += '<div class="sp-section"><div class="sp-section-title">💾 数据管理</div><div class="sp-data-info"><p>导出所有设置、主题和快捷键配置。</p></div><button class="sp-btn" id="sp-export">📤 导出设置</button><button class="sp-btn" id="sp-import">📥 导入设置</button><div class="sp-data-danger"><button class="sp-btn danger" id="sp-reset-all">⚠️ 重置所有设置</button></div></div>';
    }
    content += "</div>";
    panel.innerHTML = content;
    panel.querySelectorAll(".sp-tab").forEach((tab) => {
      tab.addEventListener("click", function() {
        currentTab = this.dataset.tab;
        render();
      });
    });
    panel.querySelectorAll(".sp-theme-card").forEach((card) => {
      card.addEventListener("click", function() {
        const themeId = this.dataset.themeId;
        setTheme(themeId);
        render();
      });
    });
    panel.querySelectorAll(".sp-color-input").forEach((input) => {
      input.addEventListener("change", function() {
        alert("自定义颜色功能开发中");
      });
    });
    panel.querySelectorAll('[data-action="edit-shortcut"]').forEach((btn) => {
      btn.addEventListener("click", function() {
        const action = this.dataset.key;
        editShortcut(action);
      });
    });
    (_e = panel.querySelector("#sp-reset-shortcuts")) == null ? void 0 : _e.addEventListener("click", function() {
      if (confirm("确定重置所有快捷键？")) {
        resetShortcuts();
        render();
        alert("快捷键已重置");
      }
    });
    const toggleSettings = [
      { id: "sp-auto-save", key: "autoSave" },
      { id: "sp-show-tooltips", key: "showTooltips" },
      { id: "sp-animations", key: "enableAnimations" },
      { id: "sp-compact", key: "compactMode" },
      { id: "sp-notify-tool", key: "notifications.toolUse" },
      { id: "sp-notify-workflow", key: "notifications.workflowComplete" },
      { id: "sp-notify-sync", key: "notifications.syncComplete" },
      { id: "sp-notify-error", key: "notifications.errors" }
    ];
    for (const t of toggleSettings) {
      const el = panel.querySelector("#" + t.id);
      if (el) {
        el.addEventListener("change", function() {
          const value = this.checked;
          updateSettingFromPath(t.key, value);
        });
      }
    }
    (_f = panel.querySelector("#sp-export")) == null ? void 0 : _f.addEventListener("click", function() {
      var _a2;
      const data = exportSettings();
      (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(data);
      alert("设置已复制到剪贴板");
    });
    (_g = panel.querySelector("#sp-import")) == null ? void 0 : _g.addEventListener("click", function() {
      const data = prompt("请粘贴导出的设置JSON：");
      if (data) {
        if (importSettings(data)) {
          alert("设置导入成功！");
          render();
        } else {
          alert("设置导入失败：格式错误");
        }
      }
    });
    (_h = panel.querySelector("#sp-reset-all")) == null ? void 0 : _h.addEventListener("click", function() {
      if (confirm("确定重置所有设置？此操作不可撤销！")) {
        resetSettings();
        resetShortcuts();
        setTheme("dark");
        alert("所有设置已重置");
        render();
      }
    });
  }
  function updateSettingFromPath(path, value) {
    const settings = getSettings();
    const keys = path.split(".");
    if (keys.length === 1) {
      settings[keys[0]] = value;
    } else {
      let current = settings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    }
    saveSettings(settings);
  }
  function editShortcut(action) {
    var _a, _b;
    const shortcuts = getShortcuts();
    const current = shortcuts[action];
    const modal = document.createElement("div");
    modal.className = "sp-modal";
    modal.innerHTML = '<div class="sp-modal-content"><div class="sp-modal-header"><span class="sp-modal-title">设置快捷键: ' + ((current == null ? void 0 : current.description) || action) + '</span><button class="sp-modal-close" data-action="close">×</button></div><div class="sp-modal-body"><div class="sp-modal-hint">请按下想要的按键组合...</div><div class="sp-modal-preview" id="sp-key-preview">等待输入</div><div class="sp-modal-actions"><button class="sp-btn" id="sp-clear-key">清除</button><button class="sp-btn primary" id="sp-save-key">保存</button></div></div></div>';
    document.body.appendChild(modal);
    let keyConfig = { ...current };
    modal.querySelector('[data-action="close"]').addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    modal.addEventListener("keydown", function listener(e) {
      e.preventDefault();
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      if (key === "Escape") {
        modal.remove();
        return;
      }
      keyConfig = {
        key: key.length === 1 ? key.toUpperCase() : key,
        ctrl,
        shift,
        alt
      };
      const preview = modal.querySelector("#sp-key-preview");
      preview.textContent = formatShortcut(keyConfig);
    });
    (_a = modal.querySelector("#sp-clear-key")) == null ? void 0 : _a.addEventListener("click", function() {
      keyConfig = { key: "", ctrl: false, shift: false, alt: false };
      modal.querySelector("#sp-key-preview").textContent = "未设置";
    });
    (_b = modal.querySelector("#sp-save-key")) == null ? void 0 : _b.addEventListener("click", function() {
      updateShortcut(action, keyConfig);
      modal.remove();
      render();
      alert("快捷键已保存");
    });
  }
  const style = document.createElement("style");
  style.id = "settings-panel-style";
  style.textContent = [
    "#settings-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 480px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1015; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".sp-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".sp-title { font-size: 15px; font-weight: 600; color: #60a5fa; }",
    ".sp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".sp-close:hover { color: #fff; }",
    ".sp-tabs {",
    "display: flex; padding: 8px 10px; gap: 4px; border-bottom: 1px solid #222;",
    "background: #12122a;",
    "}",
    ".sp-tab {",
    "flex: 1; padding: 8px 4px; border: none; border-radius: 6px;",
    "background: transparent; color: #888; font-size: 12px; cursor: pointer;",
    "}",
    ".sp-tab:hover { background: #1a1a3a; }",
    ".sp-tab.active { background: #60a5fa22; color: #60a5fa; }",
    ".sp-body { flex: 1; overflow-y: auto; padding: 12px; }",
    ".sp-section { margin-bottom: 20px; }",
    ".sp-section-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".sp-themes-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }",
    ".sp-theme-card {",
    "padding: 8px; background: #12122a; border-radius: 8px; cursor: pointer;",
    "border: 2px solid transparent; transition: border-color 0.15s;",
    "}",
    ".sp-theme-card:hover { border-color: #333; }",
    ".sp-theme-card.active { border-color: #60a5fa; }",
    ".sp-theme-preview {",
    "height: 40px; border-radius: 4px; display: flex; flex-direction: column;",
    "overflow: hidden; margin-bottom: 4px;",
    "}",
    ".sp-theme-bar { height: 8px; }",
    ".sp-theme-name { font-size: 10px; color: #888; text-align: center; }",
    ".sp-color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    ".sp-color-item { display: flex; align-items: center; gap: 8px; }",
    ".sp-color-label { font-size: 12px; color: #888; width: 50px; }",
    ".sp-color-value {",
    "width: 28px; height: 28px; border-radius: 6px; border: 1px solid #333; cursor: pointer;",
    "}",
    ".sp-color-input { display: none; }",
    ".sp-shortcuts-list { display: flex; flex-direction: column; gap: 6px; }",
    ".sp-shortcut-item {",
    "display: flex; align-items: center; gap: 8px; padding: 10px;",
    "background: #12122a; border-radius: 6px;",
    "}",
    ".sp-shortcut-action { flex: 1; font-size: 12px; color: #fff; }",
    ".sp-shortcut-key {",
    "padding: 4px 8px; background: #222; border-radius: 4px;",
    "font-size: 11px; color: #60a5fa; font-family: monospace;",
    "}",
    ".sp-btn-small {",
    "padding: 4px 8px; border: 1px solid #333; border-radius: 4px;",
    "background: #1a1a2e; color: #888; font-size: 11px; cursor: pointer;",
    "}",
    ".sp-btn-small:hover { background: #252540; color: #fff; }",
    ".sp-btn {",
    "width: 100%; padding: 10px; border: 1px solid #333; border-radius: 8px;",
    "background: #1a1a2e; color: #fff; font-size: 13px; cursor: pointer;",
    "margin-bottom: 8px;",
    "}",
    ".sp-btn:hover { background: #252540; }",
    ".sp-btn.primary { background: #60a5fa22; color: #60a5fa; border-color: #60a5fa44; }",
    ".sp-btn.danger { border-color: #dc262666; color: #dc2626; }",
    ".sp-btn.danger:hover { background: #dc262622; }",
    ".sp-setting-item {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 10px 0; border-bottom: 1px solid #222;",
    "}",
    ".sp-setting-label { font-size: 13px; color: #fff; }",
    ".sp-setting-desc { font-size: 11px; color: #666; margin-top: 2px; }",
    ".sp-switch {",
    "position: relative; width: 44px; height: 24px; cursor: pointer;",
    "}",
    ".sp-switch input { opacity: 0; width: 0; height: 0; }",
    ".sp-slider {",
    "position: absolute; top: 0; left: 0; right: 0; bottom: 0;",
    "background: #333; border-radius: 12px; transition: 0.2s;",
    "}",
    ".sp-slider:before {",
    'position: absolute; content: ""; height: 18px; width: 18px;',
    "left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s;",
    "}",
    "input:checked + .sp-slider { background: #60a5fa; }",
    "input:checked + .sp-slider:before { transform: translateX(20px); }",
    ".sp-data-info {",
    "padding: 10px; background: #12122a; border-radius: 8px; margin-bottom: 10px;",
    "font-size: 12px; color: #888;",
    "}",
    ".sp-data-danger { margin-top: 20px; }",
    ".sp-modal {",
    "position: fixed; top: 0; left: 0; right: 0; bottom: 0;",
    "background: rgba(0,0,0,0.8); z-index: 1016; display: flex;",
    "align-items: center; justify-content: center;",
    "}",
    ".sp-modal-content {",
    "width: 340px; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; overflow: hidden;",
    "}",
    ".sp-modal-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; background: #16162a;",
    "}",
    ".sp-modal-title { font-size: 14px; font-weight: 600; color: #60a5fa; }",
    ".sp-modal-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".sp-modal-body { padding: 20px; }",
    ".sp-modal-hint { text-align: center; color: #888; font-size: 13px; margin-bottom: 10px; }",
    ".sp-modal-preview {",
    "text-align: center; padding: 16px; background: #12122a; border-radius: 8px;",
    "font-size: 18px; font-weight: 600; color: #60a5fa; margin-bottom: 16px;",
    "}",
    ".sp-modal-actions { display: flex; gap: 8px; }",
    ".sp-modal-actions .sp-btn { margin-bottom: 0; }"
  ].join("");
  if (!document.getElementById("settings-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createAdvancedSettingsPanel
};
//# sourceMappingURL=AdvancedSettingsPanel-BEg6XeTR.js.map

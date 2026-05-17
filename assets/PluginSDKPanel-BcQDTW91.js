const SDK_PLUGINS_KEY = "ai-creator-sdk-plugins";
const SDK_CONFIG_KEY = "ai-creator-sdk-config";
const PluginStatus = {
  ENABLED: "enabled",
  DISABLED: "disabled"
};
const PluginType = {
  SERVICE: "service",
  EXTENSION: "extension"
};
const DEFAULT_SDK_CONFIG = {
  sandboxEnabled: true,
  autoUpdate: false,
  devMode: false,
  maxPlugins: 50,
  permissions: {
    network: false,
    storage: true,
    clipboard: true,
    notifications: true
  }
};
function getRegisteredPlugins() {
  try {
    const stored = localStorage.getItem(SDK_PLUGINS_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}
function savePlugins(plugins) {
  try {
    localStorage.setItem(SDK_PLUGINS_KEY, JSON.stringify(plugins));
  } catch {
  }
}
function registerBuiltinPlugin(pluginDef) {
  var _a;
  const plugins = getRegisteredPlugins();
  plugins[pluginDef.id] = {
    ...pluginDef,
    type: pluginDef.type || PluginType.EXTENSION,
    status: PluginStatus.ENABLED,
    builtin: true,
    installedAt: ((_a = plugins[pluginDef.id]) == null ? void 0 : _a.installedAt) || Date.now()
  };
  savePlugins(plugins);
  return plugins[pluginDef.id];
}
function initBuiltinPlugins() {
  const builtinPlugins = [
    {
      id: "sdk-core",
      name: "SDK核心",
      version: "1.0.0",
      description: "提供SDK核心API",
      author: "system",
      type: PluginType.SERVICE
    }
  ];
  for (const p of builtinPlugins) {
    registerBuiltinPlugin(p);
  }
}
function installPlugin(pluginDef) {
  const plugins = getRegisteredPlugins();
  if (plugins[pluginDef.id]) {
    return { success: false, error: "Plugin already installed" };
  }
  plugins[pluginDef.id] = {
    ...pluginDef,
    status: PluginStatus.ENABLED,
    builtin: false,
    installedAt: Date.now()
  };
  savePlugins(plugins);
  return { success: true, plugin: plugins[pluginDef.id] };
}
function uninstallPlugin(pluginId) {
  const plugins = getRegisteredPlugins();
  if (!plugins[pluginId]) {
    return { success: false, error: "Plugin not found" };
  }
  if (plugins[pluginId].builtin) {
    return { success: false, error: "Cannot uninstall builtin plugin" };
  }
  delete plugins[pluginId];
  savePlugins(plugins);
  return { success: true };
}
function enablePlugin(pluginId) {
  const plugins = getRegisteredPlugins();
  if (!plugins[pluginId]) {
    return { success: false, error: "Plugin not found" };
  }
  plugins[pluginId].status = PluginStatus.ENABLED;
  savePlugins(plugins);
  return { success: true };
}
function disablePlugin(pluginId) {
  const plugins = getRegisteredPlugins();
  if (!plugins[pluginId]) {
    return { success: false, error: "Plugin not found" };
  }
  plugins[pluginId].status = PluginStatus.DISABLED;
  savePlugins(plugins);
  return { success: true };
}
function getSDKConfig() {
  try {
    const stored = localStorage.getItem(SDK_CONFIG_KEY);
    if (!stored) return { ...DEFAULT_SDK_CONFIG };
    return { ...DEFAULT_SDK_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_SDK_CONFIG };
  }
}
function updateSDKConfig(updates) {
  const config = getSDKConfig();
  const merged = { ...config, ...updates };
  try {
    localStorage.setItem(SDK_CONFIG_KEY, JSON.stringify(merged));
  } catch {
  }
  return merged;
}
function initPluginSDK() {
  initBuiltinPlugins();
  const config = getSDKConfig();
  if (config.devMode) {
    console.log("[PluginSDK] SDK initialized in dev mode");
  }
  return {
    version: "1.0.0",
    plugins: getRegisteredPlugins(),
    config
  };
}
function createPluginSDKPanel() {
  const panel = document.createElement("div");
  panel.id = "sdk-panel";
  initPluginSDK();
  let currentTab = "plugins";
  function render() {
    var _a, _b, _c, _d, _e, _f;
    const plugins = getRegisteredPlugins();
    const config = getSDKConfig();
    const pluginList = Object.values(plugins);
    const enabledPlugins = pluginList.filter((p) => p.status === PluginStatus.ENABLED);
    let content = '<div class="sdk-header"><span class="sdk-title">🔌 API开放平台</span><button class="sdk-close" data-action="close">×</button></div><div class="sdk-tabs"><button class="sdk-tab ' + (currentTab === "plugins" ? "active" : "") + '" data-tab="plugins">🔧 插件</button><button class="sdk-tab ' + (currentTab === "config" ? "active" : "") + '" data-tab="config">⚙️ 配置</button><button class="sdk-tab ' + (currentTab === "docs" ? "active" : "") + '" data-tab="docs">📖 文档</button></div><div class="sdk-body">';
    if (currentTab === "plugins") {
      content += '<div class="sdk-section"><div class="sdk-section-title">📦 已安装插件 (' + enabledPlugins.length + "/" + pluginList.length + ")</div>";
      if (pluginList.length > 0) {
        content += '<div class="sdk-plugin-list">';
        for (const p of pluginList) {
          const isEnabled = p.status === PluginStatus.ENABLED;
          const isBuiltin = p.builtin;
          content += '<div class="sdk-plugin-item ' + (isEnabled ? "enabled" : "") + '"><div class="sdk-plugin-icon">' + getPluginTypeIcon(p.type) + '</div><div class="sdk-plugin-info"><div class="sdk-plugin-name">' + p.name + '</div><div class="sdk-plugin-meta"><span>v' + p.version + "</span>";
          if (p.builtin) {
            content += '<span class="sdk-badge builtin">内置</span>';
          }
          content += '<span class="sdk-badge status ' + p.status + '">' + p.status + '</span></div><div class="sdk-plugin-desc">' + (p.description || "无描述") + '</div></div><div class="sdk-plugin-actions">';
          if (!isBuiltin) {
            if (isEnabled) {
              content += '<button class="sdk-btn-small" data-action="disable" data-id="' + p.id + '">禁用</button>';
            } else {
              content += '<button class="sdk-btn-small primary" data-action="enable" data-id="' + p.id + '">启用</button>';
            }
            content += '<button class="sdk-btn-small danger" data-action="uninstall" data-id="' + p.id + '">卸载</button>';
          }
          content += "</div></div>";
        }
        content += "</div>";
      } else {
        content += '<div class="sdk-empty">暂无已安装插件</div>';
      }
      content += "</div>";
      content += '<div class="sdk-section"><div class="sdk-section-title">📦 安装插件</div><div class="sdk-install-form"><input type="text" id="sdk-plugin-id" class="sdk-input" placeholder="插件ID (如: my-plugin)"><input type="text" id="sdk-plugin-url" class="sdk-input" placeholder="插件URL (可选，留空使用内置)"><button class="sdk-btn primary" id="sdk-install-btn">安装插件</button></div><div class="sdk-hint">提示：安装插件需要提供插件定义，包括ID、名称、版本、描述等信息。</div></div>';
    } else if (currentTab === "config") {
      content += '<div class="sdk-section"><div class="sdk-section-title">⚙️ SDK配置</div><div class="sdk-setting-item"><div class="sdk-setting-info"><div class="sdk-setting-label">沙箱模式</div><div class="sdk-setting-desc">限制插件API访问权限</div></div><label class="sdk-switch"><input type="checkbox" id="sdk-sandbox" ' + (config.sandboxEnabled ? "checked" : "") + '><span class="sdk-slider"></span></label></div><div class="sdk-setting-item"><div class="sdk-setting-info"><div class="sdk-setting-label">开发者模式</div><div class="sdk-setting-desc">显示详细调试信息</div></div><label class="sdk-switch"><input type="checkbox" id="sdk-dev-mode" ' + (config.devMode ? "checked" : "") + '><span class="sdk-slider"></span></label></div><div class="sdk-setting-item"><div class="sdk-setting-info"><div class="sdk-setting-label">自动更新</div><div class="sdk-setting-desc">自动更新已安装插件</div></div><label class="sdk-switch"><input type="checkbox" id="sdk-auto-update" ' + (config.autoUpdate ? "checked" : "") + '><span class="sdk-slider"></span></label></div></div><div class="sdk-section"><div class="sdk-section-title">🔐 权限设置</div><div class="sdk-setting-item"><div class="sdk-setting-label">网络访问</div><label class="sdk-switch"><input type="checkbox" id="sdk-perm-network" ' + (((_a = config.permissions) == null ? void 0 : _a.network) ? "checked" : "") + '><span class="sdk-slider"></span></label></div><div class="sdk-setting-item"><div class="sdk-setting-label">存储访问</div><label class="sdk-switch"><input type="checkbox" id="sdk-perm-storage" ' + (((_b = config.permissions) == null ? void 0 : _b.storage) ? "checked" : "") + '><span class="sdk-slider"></span></label></div><div class="sdk-setting-item"><div class="sdk-setting-label">剪贴板访问</div><label class="sdk-switch"><input type="checkbox" id="sdk-perm-clipboard" ' + (((_c = config.permissions) == null ? void 0 : _c.clipboard) ? "checked" : "") + '><span class="sdk-slider"></span></label></div><div class="sdk-setting-item"><div class="sdk-setting-label">通知权限</div><label class="sdk-switch"><input type="checkbox" id="sdk-perm-notifications" ' + (((_d = config.permissions) == null ? void 0 : _d.notifications) ? "checked" : "") + '><span class="sdk-slider"></span></label></div></div><div class="sdk-section"><button class="sdk-btn danger" id="sdk-reset-config">重置SDK配置</button></div>';
    } else if (currentTab === "docs") {
      content += '<div class="sdk-section"><div class="sdk-section-title">📖 插件开发文档</div><div class="sdk-docs-content"><div class="sdk-doc-block"><div class="sdk-doc-title">1. 创建插件</div><pre class="sdk-code">// 插件定义示例\nconst myPlugin = {\n  id: "my-plugin",\n  name: "我的插件",\n  version: "1.0.0",\n  description: "插件描述",\n  type: "tool", // tool/panel/service/theme/extension\n  api: {\n    init: () => { /* 初始化 */ },\n    execute: (params) => { /* 执行 */ }\n  }\n};</pre></div><div class="sdk-doc-block"><div class="sdk-doc-title">2. 使用SDK API</div><pre class="sdk-code">// 在插件中使用SDK\nconst sdk = window.__pluginSDK;\n\n// 获取工具列表\nconst tools = sdk.tool.list();\n\n// 存储数据\nsdk.storage.set("key", "value");\n\n// 发送事件\nsdk.event.emit("my-event", { data: 123 });</pre></div><div class="sdk-doc-block"><div class="sdk-doc-title">3. 注册按钮</div><pre class="sdk-code">// 注册工具箱按钮\nsdk.panel.registerButton({\n  id: "my-button",\n  icon: "🎯",\n  label: "我的按钮",\n  color: "#60a5fa",\n  onClick: () => {\n    console.log("按钮点击");\n  }\n});</pre></div><div class="sdk-doc-block"><div class="sdk-doc-title">4. 生命周期</div><pre class="sdk-code">// 插件生命周期\n{\n  onInstall: () => {},      // 安装时\n  onEnable: () => {},       // 启用时\n  onDisable: () => {},      // 禁用时\n  onUninstall: () => {}     // 卸载时\n}</pre></div><div class="sdk-doc-block"><div class="sdk-doc-title">5. 事件系统</div><pre class="sdk-code">// 监听全局事件\nsdk.event.onGlobal("tool-created", (data) => {\n  console.log("工具创建:", data);\n});\n\n// 在插件内通信\nsdk.event.emit("plugin-event", payload);</pre></div><div class="sdk-doc-block"><div class="sdk-doc-title">6. 示例插件</div><pre class="sdk-code">// 完整示例\n{\n  id: "example-tool",\n  name: "示例工具",\n  version: "1.0.0",\n  description: "这是一个示例插件",\n  type: "tool",\n  api: {\n    init() {\n      // 注册按钮\n      this.sdk.panel.registerButton({\n        icon: "🔧",\n        label: "示例",\n        onClick: () => alert("Hello!")\n      });\n    },\n    execute(params) {\n      return { result: "success" };\n    }\n  }\n}</pre></div></div></div>';
    }
    content += "</div>";
    panel.innerHTML = content;
    panel.querySelectorAll(".sdk-tab").forEach((tab) => {
      tab.addEventListener("click", function() {
        currentTab = this.dataset.tab;
        render();
      });
    });
    panel.querySelectorAll('[data-action="enable"]').forEach((btn) => {
      btn.addEventListener("click", function() {
        const id = this.dataset.id;
        enablePlugin(id);
        render();
      });
    });
    panel.querySelectorAll('[data-action="disable"]').forEach((btn) => {
      btn.addEventListener("click", function() {
        const id = this.dataset.id;
        disablePlugin(id);
        render();
      });
    });
    panel.querySelectorAll('[data-action="uninstall"]').forEach((btn) => {
      btn.addEventListener("click", function() {
        const id = this.dataset.id;
        if (confirm("确定卸载此插件？")) {
          uninstallPlugin(id);
          render();
        }
      });
    });
    (_e = panel.querySelector("#sdk-install-btn")) == null ? void 0 : _e.addEventListener("click", function() {
      var _a2, _b2;
      const id = (_a2 = panel.querySelector("#sdk-plugin-id")) == null ? void 0 : _a2.value.trim();
      (_b2 = panel.querySelector("#sdk-plugin-url")) == null ? void 0 : _b2.value.trim();
      if (!id) {
        alert("请输入插件ID");
        return;
      }
      const pluginDef = {
        id,
        name: id,
        version: "1.0.0",
        description: "用户安装的插件",
        type: PluginType.EXTENSION,
        api: {
          init: () => console.log(`Plugin ${id} initialized`),
          execute: (params) => ({ result: "ok", plugin: id })
        }
      };
      const result = installPlugin(pluginDef);
      if (result.success) {
        alert("插件安装成功");
        panel.querySelector("#sdk-plugin-id").value = "";
        panel.querySelector("#sdk-plugin-url").value = "";
        render();
      } else {
        alert("插件安装失败: " + result.error);
      }
    });
    const configToggles = [
      { id: "sdk-sandbox", key: "sandboxEnabled" },
      { id: "sdk-dev-mode", key: "devMode" },
      { id: "sdk-auto-update", key: "autoUpdate" },
      { id: "sdk-perm-network", key: "permissions.network" },
      { id: "sdk-perm-storage", key: "permissions.storage" },
      { id: "sdk-perm-clipboard", key: "permissions.clipboard" },
      { id: "sdk-perm-notifications", key: "permissions.notifications" }
    ];
    for (const t of configToggles) {
      const el = panel.querySelector("#" + t.id);
      if (el) {
        el.addEventListener("change", function() {
          const value = this.checked;
          updateConfigFromPath(t.key, value);
        });
      }
    }
    (_f = panel.querySelector("#sdk-reset-config")) == null ? void 0 : _f.addEventListener("click", function() {
      if (confirm("确定重置SDK配置？")) {
        updateSDKConfig({
          sandboxEnabled: true,
          autoUpdate: false,
          devMode: false,
          permissions: {
            network: false,
            storage: true,
            clipboard: true,
            notifications: true
          }
        });
        render();
        alert("SDK配置已重置");
      }
    });
  }
  function updateConfigFromPath(path, value) {
    const config = getSDKConfig();
    const keys = path.split(".");
    if (keys.length === 1) {
      config[keys[0]] = value;
    } else {
      let current = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    }
    updateSDKConfig(config);
  }
  function getPluginTypeIcon(type) {
    const icons = {
      tool: "🔧",
      panel: "🖥️",
      service: "⚙️",
      theme: "🎨",
      extension: "📦"
    };
    return icons[type] || "📦";
  }
  const style = document.createElement("style");
  style.id = "sdk-panel-style";
  style.textContent = [
    "#sdk-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 520px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1016; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".sdk-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".sdk-title { font-size: 15px; font-weight: 600; color: #8b5cf6; }",
    ".sdk-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".sdk-tabs {",
    "display: flex; padding: 8px 10px; gap: 4px; border-bottom: 1px solid #222;",
    "background: #12122a;",
    "}",
    ".sdk-tab {",
    "flex: 1; padding: 8px 4px; border: none; border-radius: 6px;",
    "background: transparent; color: #888; font-size: 12px; cursor: pointer;",
    "}",
    ".sdk-tab:hover { background: #1a1a3a; }",
    ".sdk-tab.active { background: #8b5cf622; color: #8b5cf6; }",
    ".sdk-body { flex: 1; overflow-y: auto; padding: 12px; }",
    ".sdk-section { margin-bottom: 20px; }",
    ".sdk-section-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".sdk-plugin-list { display: flex; flex-direction: column; gap: 8px; }",
    ".sdk-plugin-item {",
    "display: flex; align-items: center; gap: 10px; padding: 12px;",
    "background: #12122a; border-radius: 8px; border: 1px solid transparent;",
    "}",
    ".sdk-plugin-item.enabled { border-color: #10b98144; }",
    ".sdk-plugin-icon { font-size: 24px; }",
    ".sdk-plugin-info { flex: 1; min-width: 0; }",
    ".sdk-plugin-name { font-size: 13px; font-weight: 600; color: #fff; }",
    ".sdk-plugin-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 11px; color: #888; }",
    ".sdk-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; }",
    ".sdk-badge.builtin { background: #60a5fa22; color: #60a5fa; }",
    ".sdk-badge.status.enabled { background: #10b98122; color: #10b981; }",
    ".sdk-badge.status.disabled { background: #888822; color: #888; }",
    ".sdk-badge.status.error { background: #ef444422; color: #ef4444; }",
    ".sdk-plugin-desc { font-size: 11px; color: #666; margin-top: 4px; }",
    ".sdk-plugin-actions { display: flex; gap: 4px; }",
    ".sdk-btn-small {",
    "padding: 4px 8px; border: 1px solid #333; border-radius: 4px;",
    "background: #1a1a2e; color: #888; font-size: 11px; cursor: pointer;",
    "}",
    ".sdk-btn-small:hover { background: #252540; color: #fff; }",
    ".sdk-btn-small.primary { border-color: #10b98144; color: #10b981; }",
    ".sdk-btn-small.danger { border-color: #dc262666; color: #dc2626; }",
    ".sdk-empty {",
    "text-align: center; padding: 30px; color: #666; font-size: 13px;",
    "background: #12122a; border-radius: 8px;",
    "}",
    ".sdk-install-form { display: flex; flex-direction: column; gap: 8px; }",
    ".sdk-input {",
    "width: 100%; padding: 10px 12px; background: #12122a; border: 1px solid #333;",
    "border-radius: 6px; color: #fff; font-size: 13px; box-sizing: border-box;",
    "}",
    ".sdk-input:focus { outline: none; border-color: #8b5cf6; }",
    ".sdk-input::placeholder { color: #555; }",
    ".sdk-btn {",
    "width: 100%; padding: 10px; border: 1px solid #333; border-radius: 8px;",
    "background: #1a1a2e; color: #fff; font-size: 13px; cursor: pointer;",
    "}",
    ".sdk-btn:hover { background: #252540; }",
    ".sdk-btn.primary { background: #8b5cf622; color: #8b5cf6; border-color: #8b5cf644; }",
    ".sdk-btn.danger { border-color: #dc262666; color: #dc2626; }",
    ".sdk-hint {",
    "margin-top: 8px; font-size: 11px; color: #666; line-height: 1.5;",
    "}",
    ".sdk-setting-item {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 10px 0; border-bottom: 1px solid #222;",
    "}",
    ".sdk-setting-label { font-size: 13px; color: #fff; }",
    ".sdk-setting-desc { font-size: 11px; color: #666; margin-top: 2px; }",
    ".sdk-switch {",
    "position: relative; width: 44px; height: 24px; cursor: pointer;",
    "}",
    ".sdk-switch input { opacity: 0; width: 0; height: 0; }",
    ".sdk-slider {",
    "position: absolute; top: 0; left: 0; right: 0; bottom: 0;",
    "background: #333; border-radius: 12px; transition: 0.2s;",
    "}",
    ".sdk-slider:before {",
    'position: absolute; content: ""; height: 18px; width: 18px;',
    "left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s;",
    "}",
    "input:checked + .sdk-slider { background: #8b5cf6; }",
    "input:checked + .sdk-slider:before { transform: translateX(20px); }",
    ".sdk-docs-content { background: #12122a; border-radius: 8px; padding: 12px; }",
    ".sdk-doc-block { margin-bottom: 16px; }",
    ".sdk-doc-title { font-size: 12px; font-weight: 600; color: #8b5cf6; margin-bottom: 8px; }",
    ".sdk-code {",
    "background: #0f0f1a; padding: 10px; border-radius: 6px;",
    "font-size: 11px; color: #a5d6ff; overflow-x: auto;",
    'font-family: "SF Mono", Monaco, monospace; line-height: 1.5;',
    "}"
  ].join("");
  if (!document.getElementById("sdk-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createPluginSDKPanel
};
//# sourceMappingURL=PluginSDKPanel-BcQDTW91.js.map

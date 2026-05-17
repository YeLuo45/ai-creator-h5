import { e as toolRegistry, a as getFavorites } from "./index-zZBXRajj.js";
const SHARE_KEY = "ai-creator-shared-plugins";
function getSharedPlugins() {
  const data = localStorage.getItem(SHARE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return parsed.plugins || [];
  } catch {
    return [];
  }
}
function saveSharedPlugin(plugin) {
  const all = getSharedPlugins();
  const existing = all.findIndex((p) => p.id === plugin.id);
  if (existing >= 0) {
    all[existing] = plugin;
  } else {
    all.push(plugin);
  }
  localStorage.setItem(SHARE_KEY, JSON.stringify({ plugins: all }));
}
function exportPlugin(pluginId) {
  const tool = toolRegistry.get(pluginId);
  if (!tool) {
    return { success: false, error: "工具不存在" };
  }
  const shareData = {
    id: tool.id,
    name: tool.name,
    icon: tool.icon,
    description: tool.description,
    version: "1.0.0",
    author: "anonymous",
    config: tool.config || {},
    tools: tool.tools || [],
    tags: tool.tags || [],
    createdAt: Date.now()
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
  return {
    success: true,
    data: shareData,
    encoded,
    url: `${window.location.origin}?plugin=${encoded}`
  };
}
function importPlugin(shareDataOrEncoded) {
  try {
    let data;
    if (typeof shareDataOrEncoded === "string" && shareDataOrEncoded.length > 100) {
      try {
        data = JSON.parse(decodeURIComponent(escape(atob(shareDataOrEncoded))));
      } catch {
        data = JSON.parse(shareDataOrEncoded);
      }
    } else if (typeof shareDataOrEncoded === "string") {
      data = JSON.parse(shareDataOrEncoded);
    } else {
      data = shareDataOrEncoded;
    }
    if (!data.id || !data.name) {
      return { success: false, error: "无效的插件数据" };
    }
    if (toolRegistry.get(data.id)) {
      return { success: false, error: "插件已存在" };
    }
    toolRegistry.register({
      id: data.id,
      name: data.name,
      icon: data.icon || "🔌",
      description: data.description || "",
      version: data.version,
      author: data.author,
      config: data.config || {},
      tools: data.tools || [],
      tags: data.tags || ["shared"]
    });
    saveSharedPlugin(data);
    return { success: true, plugin: data };
  } catch (e) {
    return { success: false, error: "解析失败: " + e.message };
  }
}
function generateShareUrl(pluginId) {
  const result = exportPlugin(pluginId);
  if (!result.success) return null;
  const jsonStr = JSON.stringify(result.data);
  const compressed = btoa(unescape(encodeURIComponent(jsonStr)));
  return `${window.location.origin}${window.location.pathname}#plugin=${compressed}`;
}
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}
function exportFavorites() {
  const favorites = getFavorites();
  const favoriteTools = favorites.map((id) => toolRegistry.get(id)).filter(Boolean);
  if (favoriteTools.length === 0) {
    return { success: false, error: "没有收藏的工具" };
  }
  const exportData = {
    type: "ai-creator-favorites",
    version: "1.0",
    tools: favoriteTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      description: tool.description,
      config: tool.config || {},
      tools: tool.tools || [],
      tags: tool.tags || []
    })),
    exportedAt: Date.now()
  };
  return {
    success: true,
    data: exportData,
    encoded: btoa(unescape(encodeURIComponent(JSON.stringify(exportData))))
  };
}
export {
  getSharedPlugins as a,
  copyToClipboard as c,
  exportFavorites as e,
  generateShareUrl as g,
  importPlugin as i
};
//# sourceMappingURL=PluginShare-CphKts8Q.js.map

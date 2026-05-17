const isTauri = typeof window !== "undefined" && window.__TAURI__;
let tauriApi = null;
if (isTauri) {
  tauriApi = window.__TAURI__;
}
async function showNotification(title, body) {
  if (!isTauri) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
      return { success: true, method: "web-notification" };
    }
    return { success: false, error: "通知权限未授权" };
  }
  try {
    const { Notification: Notification2 } = tauriApi.notification;
    await Notification2.sendNotification({ title, body });
    return { success: true, method: "tauri" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function readClipboard() {
  if (!isTauri) {
    try {
      const text = await navigator.clipboard.readText();
      return { success: true, text, method: "web" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  try {
    const { clipboard } = tauriApi;
    const text = await clipboard.readText();
    return { success: true, text, method: "tauri" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function writeClipboard(text) {
  if (!isTauri) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "web" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  try {
    const { clipboard } = tauriApi;
    await clipboard.writeText(text);
    return { success: true, method: "tauri" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function openUrl(url) {
  if (!isTauri) {
    window.open(url, "_blank");
    return { success: true, method: "web" };
  }
  try {
    const { shell } = tauriApi;
    await shell.open(url);
    return { success: true, method: "tauri" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
let storeInstance = null;
async function getStore() {
  if (!isTauri) {
    return null;
  }
  if (!storeInstance) {
    try {
      const { Store } = tauriApi.store;
      storeInstance = await Store.load("ai-creator-data.json");
    } catch (e) {
      console.warn("Tauri Store 加载失败:", e);
      return null;
    }
  }
  return storeInstance;
}
async function storeGet(key) {
  const store = await getStore();
  if (!store) {
    const value = localStorage.getItem(`tauri-store-${key}`);
    return value ? JSON.parse(value) : null;
  }
  try {
    return await store.get(key);
  } catch (e) {
    return null;
  }
}
async function storeSet(key, value) {
  const store = await getStore();
  if (!store) {
    localStorage.setItem(`tauri-store-${key}`, JSON.stringify(value));
    return;
  }
  try {
    await store.set(key, value);
    await store.save();
  } catch (e) {
    console.warn("Tauri Store 保存失败:", e);
  }
}
async function getSystemInfo() {
  const info = {
    platform: isTauri ? "desktop" : "web",
    tauri: isTauri,
    timestamp: Date.now()
  };
  if (!isTauri) {
    info.userAgent = navigator.userAgent;
    info.language = navigator.language;
    return info;
  }
  try {
    const { os } = tauriApi;
    const [platform, version, arch] = await Promise.all([
      os.platform(),
      os.version(),
      os.arch()
    ]);
    info.platform = platform;
    info.version = version;
    info.arch = arch;
  } catch (e) {
  }
  return info;
}
function createNativeAPIPanel() {
  const panel = document.createElement("div");
  panel.id = "native-api-panel";
  panel.innerHTML = `
    <div class="nap-header">
      <span class="nap-title">🖥️ 桌面端</span>
      <button class="nap-close" data-action="close">×</button>
    </div>
    <div class="nap-content">
      <!-- 环境状态 -->
      <div class="nap-section">
        <div class="nap-status ${isTauri ? "desktop" : "web"}">
          <div class="nap-status-icon">${isTauri ? "🖥️" : "🌐"}</div>
          <div class="nap-status-info">
            <div class="nap-status-label">当前环境</div>
            <div class="nap-status-value">${isTauri ? "Tauri 桌面端" : "Web 浏览器"}</div>
          </div>
        </div>
      </div>
      
      <!-- 系统信息 -->
      <div class="nap-section">
        <div class="nap-section-title">系统信息</div>
        <div class="nap-info-grid" id="nap-sysinfo">
          <div class="nap-info-item">
            <span class="nap-info-label">平台</span>
            <span class="nap-info-value" id="nap-platform">加载中...</span>
          </div>
          <div class="nap-info-item">
            <span class="nap-info-label">语言</span>
            <span class="nap-info-value" id="nap-language">-</span>
          </div>
        </div>
        <button class="nap-btn" id="nap-btn-refresh-info">🔄 刷新系统信息</button>
      </div>
      
      <!-- 剪贴板 -->
      <div class="nap-section">
        <div class="nap-section-title">剪贴板</div>
        <div class="nap-field">
          <textarea id="nap-clipboard-text" placeholder="输入要复制的内容..."></textarea>
        </div>
        <div class="nap-btn-row">
          <button class="nap-btn" id="nap-btn-copy">📋 复制</button>
          <button class="nap-btn secondary" id="nap-btn-paste">📥 粘贴</button>
        </div>
      </div>
      
      <!-- 通知 -->
      <div class="nap-section">
        <div class="nap-section-title">系统通知</div>
        <div class="nap-field">
          <input type="text" id="nap-notif-title" placeholder="通知标题" />
        </div>
        <div class="nap-field">
          <input type="text" id="nap-notif-body" placeholder="通知内容" />
        </div>
        <button class="nap-btn" id="nap-btn-notify">🔔 发送通知</button>
      </div>
      
      <!-- 快捷操作 -->
      <div class="nap-section">
        <div class="nap-section-title">快捷操作</div>
        <div class="nap-shortcuts">
          <button class="nap-shortcut" id="nap-btn-github">
            <span class="nap-shortcut-icon">🐙</span>
            <span class="nap-shortcut-label">GitHub 仓库</span>
          </button>
          <button class="nap-shortcut" id="nap-btn-docs">
            <span class="nap-shortcut-icon">📚</span>
            <span class="nap-shortcut-label">使用文档</span>
          </button>
        </div>
      </div>
      
      <!-- 存储状态 -->
      <div class="nap-section">
        <div class="nap-section-title">持久化存储</div>
        <div class="nap-storage-info" id="nap-storage-info">
          <div class="nap-storage-item">
            <span class="nap-storage-label">localStorage</span>
            <span class="nap-storage-value">${(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB</span>
          </div>
          <div class="nap-storage-item">
            <span class="nap-storage-label">Tauri Store</span>
            <span class="nap-storage-value">${isTauri ? "可用" : "仅桌面端"}</span>
          </div>
        </div>
        <button class="nap-btn secondary" id="nap-btn-test-store">🧪 测试存储</button>
      </div>
      
      <!-- 版本信息 -->
      <div class="nap-section">
        <div class="nap-version">
          <div class="nap-version-text">AI Creator H5 v1.0.23</div>
          <div class="nap-version-sub">${isTauri ? "Tauri Desktop" : "Web App"}</div>
        </div>
      </div>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #native-api-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 380px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1009; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .nap-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .nap-title { font-size: 15px; font-weight: 600; color: #a78bfa; }
    .nap-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .nap-close:hover { color: #fff; }
    .nap-content { flex: 1; overflow-y: auto; padding: 16px; }
    .nap-section { margin-bottom: 20px; }
    .nap-section:last-child { margin-bottom: 0; }
    .nap-section-title {
      font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase;
      margin-bottom: 10px; letter-spacing: 0.5px;
    }
    .nap-status {
      display: flex; align-items: center; gap: 12px;
      padding: 14px; background: #12122a; border-radius: 10px;
      border: 1px solid #222;
    }
    .nap-status.desktop { border-color: #a78bfa44; }
    .nap-status.web { border-color: #34d39944; }
    .nap-status-icon { font-size: 28px; }
    .nap-status-label { font-size: 12px; color: #888; }
    .nap-status-value { font-size: 14px; font-weight: 500; color: #fff; margin-top: 2px; }
    .nap-info-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .nap-info-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px; background: #12122a; border-radius: 6px;
    }
    .nap-info-label { font-size: 12px; color: #888; }
    .nap-info-value { font-size: 13px; color: #fff; font-weight: 500; }
    .nap-btn {
      width: 100%; padding: 10px 14px; border: none; border-radius: 8px;
      font-size: 13px; cursor: pointer; transition: all 0.15s;
      background: #a78bfa22; color: #a78bfa; border: 1px solid #a78bfa44;
    }
    .nap-btn:hover { background: #a78bfa33; }
    .nap-btn.secondary { background: #333; color: #fff; border-color: #333; }
    .nap-btn.secondary:hover { background: #444; }
    .nap-field { margin-bottom: 10px; }
    .nap-field input, .nap-field textarea {
      width: 100%; padding: 10px; background: #0a0a1a; border: 1px solid #333;
      border-radius: 6px; color: #fff; font-size: 13px; font-family: inherit;
      box-sizing: border-box;
    }
    .nap-field textarea { min-height: 60px; resize: vertical; }
    .nap-field input:focus, .nap-field textarea:focus { outline: none; border-color: #a78bfa; }
    .nap-btn-row { display: flex; gap: 8px; }
    .nap-btn-row .nap-btn { flex: 1; }
    .nap-shortcuts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .nap-shortcut {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 14px 8px; background: #12122a; border: 1px solid #222;
      border-radius: 8px; cursor: pointer; transition: all 0.15s;
    }
    .nap-shortcut:hover { background: #1a1a3a; border-color: #333; }
    .nap-shortcut-icon { font-size: 22px; }
    .nap-shortcut-label { font-size: 11px; color: #888; }
    .nap-storage-info { margin-bottom: 10px; }
    .nap-storage-item {
      display: flex; justify-content: space-between; padding: 8px 10px;
      background: #12122a; border-radius: 6px; margin-bottom: 6px;
    }
    .nap-storage-label { font-size: 12px; color: #888; }
    .nap-storage-value { font-size: 12px; color: #fff; }
    .nap-version {
      text-align: center; padding: 16px; background: #12122a;
      border-radius: 8px; border: 1px solid #222;
    }
    .nap-version-text { font-size: 14px; font-weight: 600; color: #a78bfa; }
    .nap-version-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .nap-result {
      padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 12px;
      text-align: center;
    }
    .nap-result.success { background: #34d39922; color: #34d399; }
    .nap-result.error { background: #dc262622; color: #dc2626; }
    .nap-result.info { background: #60a5fa22; color: #60a5fa; }
  `;
  document.head.appendChild(style);
  const resultArea = document.createElement("div");
  panel.querySelector(".nap-content").appendChild(resultArea);
  function showResult(message, type = "success") {
    resultArea.innerHTML = '<div class="nap-result ' + type + '">' + message + "</div>";
    setTimeout(function() {
      if (resultArea) resultArea.innerHTML = "";
    }, 3e3);
  }
  async function refreshSystemInfo() {
    var info = await getSystemInfo();
    panel.querySelector("#nap-platform").textContent = info.platform + (info.arch ? " (" + info.arch + ")" : "");
    panel.querySelector("#nap-language").textContent = info.language || info.platform;
  }
  refreshSystemInfo();
  panel.querySelector("#nap-btn-refresh-info").addEventListener("click", function() {
    refreshSystemInfo();
    showResult("系统信息已刷新", "success");
  });
  panel.querySelector("#nap-btn-copy").addEventListener("click", function() {
    var text = panel.querySelector("#nap-clipboard-text").value;
    if (!text) {
      showResult("请输入要复制的内容", "error");
      return;
    }
    writeClipboard(text).then(function(result) {
      if (result.success) {
        showResult("已复制到剪贴板", "success");
      } else {
        showResult("复制失败: " + result.error, "error");
      }
    });
  });
  panel.querySelector("#nap-btn-paste").addEventListener("click", function() {
    readClipboard().then(function(result) {
      if (result.success) {
        panel.querySelector("#nap-clipboard-text").value = result.text;
        showResult("已从剪贴板粘贴", "success");
      } else {
        showResult("粘贴失败: " + result.error, "error");
      }
    });
  });
  panel.querySelector("#nap-btn-notify").addEventListener("click", function() {
    var title = panel.querySelector("#nap-notif-title").value || "AI Creator";
    var body = panel.querySelector("#nap-notif-body").value || "这是一条测试通知";
    showNotification(title, body).then(function(result) {
      if (result.success) {
        showResult("通知已发送 (" + result.method + ")", "success");
      } else {
        showResult("通知失败: " + result.error, "error");
      }
    });
  });
  panel.querySelector("#nap-btn-github").addEventListener("click", function() {
    openUrl("https://github.com/YeLuo45/ai-creator-h5");
  });
  panel.querySelector("#nap-btn-docs").addEventListener("click", function() {
    openUrl("https://yeluo45.github.io/ai-creator-h5/");
  });
  panel.querySelector("#nap-btn-test-store").addEventListener("click", function() {
    var testKey = "nap-test-" + Date.now();
    var testValue = { timestamp: Date.now(), message: "Tauri存储测试" };
    storeSet(testKey, testValue).then(function() {
      storeGet(testKey).then(function(retrieved) {
        if (retrieved && retrieved.message === testValue.message) {
          showResult("存储测试成功!", "success");
        } else {
          showResult("存储测试: 使用localStorage fallback", "info");
        }
      });
    });
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", function() {
    panel.remove();
  });
  panel.addEventListener("click", function(e) {
    e.stopPropagation();
  });
  return panel;
}
export {
  createNativeAPIPanel
};
//# sourceMappingURL=NativeAPIPanel-dFHTXqXa.js.map

const VOICE_STATE_KEY = "ai-creator-voice-state";
const VOICE_CONFIG = {
  lang: "zh-CN",
  continuous: false,
  interimResults: true,
  maxAlternatives: 1
};
function getVoiceState() {
  try {
    const stored = localStorage.getItem(VOICE_STATE_KEY);
    if (!stored) return getDefaultVoiceState();
    return JSON.parse(stored);
  } catch {
    return getDefaultVoiceState();
  }
}
function saveVoiceState(state) {
  try {
    localStorage.setItem(VOICE_STATE_KEY, JSON.stringify(state));
  } catch {
  }
}
function getDefaultVoiceState() {
  return {
    enabled: true,
    wakeWordEnabled: true,
    voiceFeedbackEnabled: true,
    commandSuggestions: true,
    lastUsed: null,
    totalCommands: 0
  };
}
function updateVoiceState(updates) {
  const state = getVoiceState();
  const merged = { ...state, ...updates, lastUsed: Date.now() };
  saveVoiceState(merged);
  return merged;
}
function isVoiceSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function getSpeechRecognition() {
  const win = window;
  return win.SpeechRecognition || win.webkitSpeechRecognition;
}
const BUILTIN_COMMANDS = {
  // 工具相关
  "打开工具箱": () => {
    const btn = document.querySelector("#tool-panel-btn");
    if (btn) btn.click();
  },
  "关闭工具箱": () => {
    const panel = document.querySelector(".tool-panel");
    if (panel) panel.remove();
  },
  "打开创建工具": () => {
    const btn = document.querySelector("#btn-create-tool");
    if (btn) btn.click();
  },
  "打开导入导出": () => {
    const btn = document.querySelector("#btn-import-export");
    if (btn) btn.click();
  },
  "打开排行榜": () => {
    const btn = document.querySelector("#btn-leaderboard");
    if (btn) btn.click();
  },
  "打开市场": () => {
    const btn = document.querySelector("#btn-marketplace");
    if (btn) btn.click();
  },
  // 功能相关
  "打开AI推荐": () => {
    const btn = document.querySelector("#btn-ai");
    if (btn) btn.click();
  },
  "打开社区": () => {
    const btn = document.querySelector("#btn-community");
    if (btn) btn.click();
  },
  "打开流程编辑器": () => {
    const btn = document.querySelector("#btn-flow");
    if (btn) btn.click();
  },
  "打开性能优化": () => {
    const btn = document.querySelector("#btn-perf");
    if (btn) btn.click();
  },
  "打开数据分析": () => {
    const btn = document.querySelector("#btn-analytics");
    if (btn) btn.click();
  },
  "打开设置": () => {
    const btn = document.querySelector("#btn-settings");
    if (btn) btn.click();
  },
  "打开SDK": () => {
    const btn = document.querySelector("#btn-sdk");
    if (btn) btn.click();
  },
  "打开AR": () => {
    const btn = document.querySelector("#btn-ar");
    if (btn) btn.click();
  },
  // 操作相关
  "刷新页面": () => location.reload(),
  "滚到顶部": () => window.scrollTo(0, 0),
  "滚到底部": () => window.scrollTo(0, document.body.scrollHeight),
  "显示帮助": () => showVoiceHelp(),
  "关闭面板": () => {
    document.querySelectorAll('[id$="-panel"]').forEach((p) => p.remove());
  },
  // 生成相关
  "生成图片": () => triggerImageGeneration(),
  "生成音乐": () => triggerMusicGeneration(),
  "文字转语音": () => triggerTTS(),
  // 快捷命令
  "截图": () => takeScreenshot(),
  "保存": () => triggerSave(),
  "撤销": () => document.execCommand("undo"),
  "重做": () => document.execCommand("redo")
};
const COMMAND_ALIASES = {
  "打开工具箱": ["开启工具箱", "显示工具箱", "打开工具面板"],
  "关闭工具箱": ["关闭工具面板", "隐藏工具箱"],
  "打开设置": ["打开配置", "进入设置", "打开偏好设置"],
  "刷新页面": ["刷新", "重新加载", "刷新一下"],
  "滚到顶部": ["回到顶部", "置顶", "到顶部"],
  "滚到底部": ["到底部", "到末尾", "置底"],
  "生成图片": ["画图", "创建图片", "生成图像"],
  "生成音乐": ["作曲", "创建音乐", "生成音频"]
};
function matchCommand(text) {
  const normalized = text.trim().toLowerCase();
  if (BUILTIN_COMMANDS[text]) {
    return text;
  }
  for (const [cmd, aliases] of Object.entries(COMMAND_ALIASES)) {
    for (const alias of aliases) {
      if (normalized.includes(alias.toLowerCase()) || alias.includes(text)) {
        return cmd;
      }
    }
  }
  for (const cmd of Object.keys(BUILTIN_COMMANDS)) {
    if (normalized.includes(cmd.toLowerCase()) || cmd.toLowerCase().includes(normalized)) {
      return cmd;
    }
  }
  return null;
}
let recognition = null;
let isListening = false;
function initVoiceAssistant(onCommand) {
  if (!isVoiceSupported()) {
    console.warn("[VoiceAssistant] Speech recognition not supported");
    return false;
  }
  const SpeechRecognition = getSpeechRecognition();
  recognition = new SpeechRecognition();
  recognition.lang = VOICE_CONFIG.lang;
  recognition.continuous = VOICE_CONFIG.continuous;
  recognition.interimResults = VOICE_CONFIG.interimResults;
  recognition.maxAlternatives = VOICE_CONFIG.maxAlternatives;
  recognition.onstart = () => {
    isListening = true;
  };
  recognition.onend = () => {
    isListening = false;
  };
  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    const isFinal = result.isFinal;
    if (isFinal && onCommand) {
      const command = matchCommand(transcript);
      if (command) {
        updateVoiceState({ totalCommands: getVoiceState().totalCommands + 1 });
        onCommand(command, transcript);
        speakFeedback(`已执行: ${command.replace("打开", "").replace("打开", "")}`);
      }
    }
  };
  recognition.onerror = (event) => {
    console.error("[VoiceAssistant] Error:", event.error);
    if (event.error === "no-speech") ;
    else if (event.error === "not-allowed") ;
  };
  return true;
}
function startListening() {
  if (!recognition || isListening) return;
  try {
    recognition.start();
  } catch (e) {
    console.error("[VoiceAssistant] Start failed:", e);
  }
}
function stopListening() {
  if (!recognition || !isListening) return;
  try {
    recognition.stop();
  } catch (e) {
    console.error("[VoiceAssistant] Stop failed:", e);
  }
}
function getListeningState() {
  return isListening;
}
function speakFeedback(text, options = {}) {
  const { lang = "zh-CN", rate = 1, pitch = 1 } = options;
  if (!("speechSynthesis" in window)) {
    console.warn("[VoiceAssistant] Speech synthesis not supported");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find((v) => v.lang.includes("zh"));
  if (zhVoice) {
    utterance.voice = zhVoice;
  }
  window.speechSynthesis.speak(utterance);
}
function executeCommand(command) {
  const handler = BUILTIN_COMMANDS[command];
  if (handler) {
    handler();
    return true;
  }
  return false;
}
function getCommandList() {
  return Object.keys(BUILTIN_COMMANDS);
}
function getCommandSuggestions() {
  const state = getVoiceState();
  if (!state.commandSuggestions) return [];
  const common = [
    "打开工具箱",
    "打开设置",
    "打开AI推荐",
    "刷新页面",
    "滚到顶部"
  ];
  return common;
}
function showVoiceHelp() {
  const commands = getCommandList();
  const msg = `语音助手支持以下命令：${commands.slice(0, 10).join("、")}等`;
  alert(msg);
}
function triggerImageGeneration() {
  const btn = document.querySelector('[data-action="generate-image"]');
  if (btn) btn.click();
}
function triggerMusicGeneration() {
  const btn = document.querySelector('[data-action="generate-music"]');
  if (btn) btn.click();
}
function triggerTTS() {
  const btn = document.querySelector('[data-action="tts"]');
  if (btn) btn.click();
}
function takeScreenshot() {
  speakFeedback("截图功能开发中");
}
function triggerSave() {
  document.execCommand("save");
}
function createVoiceAssistantPanel() {
  const panel = document.createElement("div");
  panel.id = "voice-panel";
  const supported = isVoiceSupported();
  const voiceState = getVoiceState();
  let currentTab = "control";
  let isListening2 = false;
  function render() {
    var _a;
    getCommandSuggestions();
    const commands = getCommandList();
    let content = '<div class="vp-header"><span class="vp-title">🎤 语音助手</span><button class="vp-close" data-action="close">×</button></div><div class="vp-tabs"><button class="vp-tab ' + (currentTab === "control" ? "active" : "") + '" data-tab="control">🎤 控制</button><button class="vp-tab ' + (currentTab === "commands" ? "active" : "") + '" data-tab="commands">📋 命令</button><button class="vp-tab ' + (currentTab === "settings" ? "active" : "") + '" data-tab="settings">⚙️ 设置</button></div><div class="vp-body">';
    if (currentTab === "control") {
      content += '<div class="vp-section"><div class="vp-status ' + (supported ? "supported" : "unsupported") + '"><span class="vp-status-icon">' + (supported ? "✓" : "✗") + '</span><span class="vp-status-text">' + (supported ? "语音功能可用" : "语音功能受限") + "</span></div></div>";
      content += '<div class="vp-section"><div class="vp-mic-container ' + (isListening2 ? "listening" : "") + '" id="vp-mic-btn"><div class="vp-mic-icon">🎤</div><div class="vp-mic-ring"></div><div class="vp-mic-ring ring-2"></div></div><div class="vp-mic-hint" id="vp-mic-hint">' + (isListening2 ? "正在监听..." : "点击开始说话") + '</div><div class="vp-mic-commands"><span>例如："打开工具箱"、"刷新页面"、"滚到顶部"</span></div></div>';
      content += '<div class="vp-section"><div class="vp-section-title">⚡ 快速命令</div><div class="vp-quick-commands">';
      const quickCommands = [
        { cmd: "打开工具箱", icon: "🧰" },
        { cmd: "打开设置", icon: "⚙️" },
        { cmd: "打开AI推荐", icon: "🧠" },
        { cmd: "刷新页面", icon: "🔄" }
      ];
      for (const qc of quickCommands) {
        content += '<button class="vp-quick-cmd" data-cmd="' + qc.cmd + '"><span class="vp-quick-icon">' + qc.icon + '</span><span class="vp-quick-text">' + qc.cmd + "</span></button>";
      }
      content += "</div></div>";
      content += '<div class="vp-section"><div class="vp-stats"><div class="vp-stat-item"><div class="vp-stat-value">' + (voiceState.totalCommands || 0) + '</div><div class="vp-stat-label">总命令数</div></div><div class="vp-stat-item"><div class="vp-stat-value">' + (voiceState.lastUsed ? "是" : "否") + '</div><div class="vp-stat-label">上次使用</div></div></div></div>';
    } else if (currentTab === "commands") {
      content += '<div class="vp-section"><div class="vp-section-title">📋 所有语音命令 (' + commands.length + ')</div><div class="vp-commands-list">';
      const categories = {
        "工具": ["打开工具箱", "关闭工具箱", "打开创建工具", "打开导入导出", "打开排行榜", "打开市场"],
        "功能": ["打开AI推荐", "打开社区", "打开流程编辑器", "打开性能优化", "打开数据分析", "打开设置", "打开SDK", "打开AR"],
        "操作": ["刷新页面", "滚到顶部", "滚到底部", "显示帮助", "关闭面板"],
        "生成": ["生成图片", "生成音乐", "文字转语音"],
        "快捷": ["截图", "保存", "撤销", "重做"]
      };
      for (const [cat, cmds] of Object.entries(categories)) {
        content += '<div class="vp-command-category"><div class="vp-category-title">' + cat + "</div>";
        for (const cmd of cmds) {
          content += '<div class="vp-command-item"><span class="vp-command-text">' + cmd + '</span><button class="vp-btn-small" data-action="test-cmd" data-cmd="' + cmd + '">测试</button></div>';
        }
        content += "</div>";
      }
      content += "</div></div>";
    } else if (currentTab === "settings") {
      content += '<div class="vp-section"><div class="vp-section-title">⚙️ 语音设置</div><div class="vp-setting-item"><div class="vp-setting-info"><div class="vp-setting-label">启用语音助手</div><div class="vp-setting-desc">开启语音控制功能</div></div><label class="vp-switch"><input type="checkbox" id="vp-enabled" ' + (voiceState.enabled ? "checked" : "") + '><span class="vp-slider"></span></label></div><div class="vp-setting-item"><div class="vp-setting-info"><div class="vp-setting-label">语音反馈</div><div class="vp-setting-desc">执行命令时播放语音反馈</div></div><label class="vp-switch"><input type="checkbox" id="vp-feedback" ' + (voiceState.voiceFeedbackEnabled ? "checked" : "") + '><span class="vp-slider"></span></label></div><div class="vp-setting-item"><div class="vp-setting-info"><div class="vp-setting-label">命令提示</div><div class="vp-setting-desc">显示常用命令建议</div></div><label class="vp-switch"><input type="checkbox" id="vp-suggestions" ' + (voiceState.commandSuggestions ? "checked" : "") + '><span class="vp-slider"></span></label></div></div><div class="vp-section"><div class="vp-section-title">🗣️ 测试语音</div><div class="vp-test-voice"><button class="vp-btn" id="vp-test-speak">🔊 测试语音反馈</button></div></div><div class="vp-section"><div class="vp-section-title">📖 命令语法</div><div class="vp-info-box"><p>语音命令支持以下格式：</p><ul><li><b>直接命令</b>："打开工具箱"</li><li><b>方言支持</b>："开启工具箱"、"显示工具箱"</li><li><b>模糊匹配</b>：包含关键词即可识别</li></ul><p>尝试说："打开设置" 或 "打开工具箱"</p></div></div>';
    }
    content += "</div>";
    panel.innerHTML = content;
    panel.querySelectorAll(".vp-tab").forEach((tab) => {
      tab.addEventListener("click", function() {
        currentTab = this.dataset.tab;
        render();
      });
    });
    const micBtn = panel.querySelector("#vp-mic-btn");
    if (micBtn) {
      micBtn.addEventListener("click", function() {
        toggleMic();
      });
    }
    panel.querySelectorAll(".vp-quick-cmd").forEach((btn) => {
      btn.addEventListener("click", function() {
        const cmd = this.dataset.cmd;
        executeVoiceCommand(cmd);
      });
    });
    panel.querySelectorAll('[data-action="test-cmd"]').forEach((btn) => {
      btn.addEventListener("click", function() {
        const cmd = this.dataset.cmd;
        executeVoiceCommand(cmd);
      });
    });
    const settingToggles = [
      { id: "vp-enabled", key: "enabled" },
      { id: "vp-feedback", key: "voiceFeedbackEnabled" },
      { id: "vp-suggestions", key: "commandSuggestions" }
    ];
    for (const t of settingToggles) {
      const el = panel.querySelector("#" + t.id);
      if (el) {
        el.addEventListener("change", function() {
          updateVoiceState({ [t.key]: this.checked });
        });
      }
    }
    (_a = panel.querySelector("#vp-test-speak")) == null ? void 0 : _a.addEventListener("click", function() {
      speakFeedback("这是一条语音测试消息");
    });
    initVoiceAssistant((command, transcript) => {
      const hint = panel.querySelector("#vp-mic-hint");
      if (hint) {
        hint.textContent = `识别: ${transcript}`;
        setTimeout(() => {
          if (!isListening2) {
            hint.textContent = "点击开始说话";
          }
        }, 2e3);
      }
    });
  }
  function toggleMic() {
    if (isListening2) {
      stopListening();
    } else {
      startListening();
    }
    isListening2 = getListeningState();
    const hint = panel.querySelector("#vp-mic-hint");
    if (hint) {
      hint.textContent = isListening2 ? "正在监听..." : "点击开始说话";
    }
    const container = panel.querySelector(".vp-mic-container");
    if (container) {
      container.classList.toggle("listening", isListening2);
    }
  }
  function executeVoiceCommand(cmd) {
    executeCommand(cmd);
    const state = getVoiceState();
    if (state.voiceFeedbackEnabled) {
      speakFeedback(`已执行: ${cmd.replace("打开", "")}`);
    }
  }
  const style = document.createElement("style");
  style.id = "voice-panel-style";
  style.textContent = [
    "#voice-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 420px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1018; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".vp-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".vp-title { font-size: 15px; font-weight: 600; color: #10b981; }",
    ".vp-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".vp-tabs {",
    "display: flex; padding: 8px 10px; gap: 4px; border-bottom: 1px solid #222;",
    "background: #12122a;",
    "}",
    ".vp-tab {",
    "flex: 1; padding: 8px 4px; border: none; border-radius: 6px;",
    "background: transparent; color: #888; font-size: 12px; cursor: pointer;",
    "}",
    ".vp-tab:hover { background: #1a1a3a; }",
    ".vp-tab.active { background: #10b98122; color: #10b981; }",
    ".vp-body { flex: 1; overflow-y: auto; padding: 12px; }",
    ".vp-section { margin-bottom: 16px; }",
    ".vp-section-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".vp-status {",
    "display: flex; align-items: center; gap: 8px; padding: 10px 12px;",
    "border-radius: 8px; font-size: 13px;",
    "}",
    ".vp-status.supported { background: #10b98122; color: #10b981; }",
    ".vp-status.unsupported { background: #888822; color: #888; }",
    ".vp-mic-container {",
    "width: 100px; height: 100px; margin: 20px auto; border-radius: 50%;",
    "background: #12122a; border: 3px solid #333;",
    "display: flex; align-items: center; justify-content: center;",
    "cursor: pointer; position: relative; transition: border-color 0.3s;",
    "}",
    ".vp-mic-container:hover { border-color: #10b981; }",
    ".vp-mic-container.listening { border-color: #10b981; animation: pulse-border 1.5s infinite; }",
    ".vp-mic-icon { font-size: 36px; }",
    ".vp-mic-ring {",
    "position: absolute; width: 100%; height: 100%; border-radius: 50%;",
    "border: 2px solid #10b98144; animation: ripple 1.5s infinite; opacity: 0;",
    "}",
    ".vp-mic-container.listening .vp-mic-ring { opacity: 1; }",
    ".vp-mic-ring.ring-2 { animation-delay: 0.5s; }",
    "@keyframes ripple {",
    "0% { transform: scale(1); opacity: 1; }",
    "100% { transform: scale(1.5); opacity: 0; }",
    "}",
    "@keyframes pulse-border {",
    "0%, 100% { border-color: #10b981; }",
    "50% { border-color: #10b98188; }",
    "}",
    ".vp-mic-hint {",
    "text-align: center; font-size: 13px; color: #888; margin-top: 10px;",
    "}",
    ".vp-mic-commands {",
    "text-align: center; font-size: 11px; color: #666; margin-top: 8px;",
    "}",
    ".vp-quick-commands { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".vp-quick-cmd {",
    "display: flex; align-items: center; gap: 6px; padding: 8px 12px;",
    "background: #12122a; border: 1px solid #333; border-radius: 8px;",
    "color: #fff; font-size: 12px; cursor: pointer; transition: background 0.2s;",
    "}",
    ".vp-quick-cmd:hover { background: #1a2a3a; border-color: #10b98144; }",
    ".vp-quick-icon { font-size: 16px; }",
    ".vp-stats { display: flex; gap: 16px; }",
    ".vp-stat-item {",
    "flex: 1; padding: 12px; background: #12122a; border-radius: 8px; text-align: center;",
    "}",
    ".vp-stat-value { font-size: 20px; font-weight: 600; color: #10b981; }",
    ".vp-stat-label { font-size: 11px; color: #888; margin-top: 4px; }",
    ".vp-commands-list { display: flex; flex-direction: column; gap: 12px; }",
    ".vp-command-category { background: #12122a; border-radius: 8px; padding: 10px; }",
    ".vp-category-title {",
    "font-size: 11px; font-weight: 600; color: #10b981; margin-bottom: 8px; text-transform: uppercase;",
    "}",
    ".vp-command-item {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 6px 0; border-bottom: 1px solid #1a1a2e;",
    "}",
    ".vp-command-item:last-child { border-bottom: none; }",
    ".vp-command-text { font-size: 12px; color: #fff; }",
    ".vp-btn-small {",
    "padding: 4px 8px; border: 1px solid #333; border-radius: 4px;",
    "background: #1a1a2e; color: #888; font-size: 11px; cursor: pointer;",
    "}",
    ".vp-btn-small:hover { background: #252540; color: #fff; }",
    ".vp-setting-item {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 10px 0; border-bottom: 1px solid #222;",
    "}",
    ".vp-setting-label { font-size: 13px; color: #fff; }",
    ".vp-setting-desc { font-size: 11px; color: #666; margin-top: 2px; }",
    ".vp-switch {",
    "position: relative; width: 44px; height: 24px; cursor: pointer;",
    "}",
    ".vp-switch input { opacity: 0; width: 0; height: 0; }",
    ".vp-slider {",
    "position: absolute; top: 0; left: 0; right: 0; bottom: 0;",
    "background: #333; border-radius: 12px; transition: 0.2s;",
    "}",
    ".vp-slider:before {",
    'position: absolute; content: ""; height: 18px; width: 18px;',
    "left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s;",
    "}",
    "input:checked + .vp-slider { background: #10b981; }",
    "input:checked + .vp-slider:before { transform: translateX(20px); }",
    ".vp-btn {",
    "width: 100%; padding: 10px; border: 1px solid #333; border-radius: 8px;",
    "background: #1a1a2e; color: #fff; font-size: 13px; cursor: pointer;",
    "}",
    ".vp-btn:hover { background: #252540; }",
    ".vp-info-box {",
    "background: #12122a; border-radius: 8px; padding: 12px;",
    "font-size: 12px; color: #888; line-height: 1.6;",
    "}",
    ".vp-info-box p { margin: 0 0 8px; }",
    ".vp-info-box ul { margin: 0; padding-left: 16px; }",
    ".vp-info-box li { margin-bottom: 4px; }"
  ].join("");
  if (!document.getElementById("voice-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createVoiceAssistantPanel
};
//# sourceMappingURL=VoiceAssistantPanel-CPVL4OHW.js.map

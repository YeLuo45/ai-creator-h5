import { e as toolRegistry } from "./index-zZBXRajj.js";
const AR_STATE_KEY = "ai-creator-ar-state";
function isARSupported() {
  var _a;
  return !!(navigator.xr || ((_a = navigator.mediaDevices) == null ? void 0 : _a.getUserMedia));
}
function getARState() {
  try {
    const stored = localStorage.getItem(AR_STATE_KEY);
    if (!stored) return getDefaultARState();
    return JSON.parse(stored);
  } catch {
    return getDefaultARState();
  }
}
function saveARState(state) {
  try {
    localStorage.setItem(AR_STATE_KEY, JSON.stringify(state));
  } catch {
  }
}
function getDefaultARState() {
  return {
    enabled: true,
    quality: "medium",
    showGuide: true,
    lastUsed: null
  };
}
function updateARState(updates) {
  const state = getARState();
  const merged = { ...state, ...updates, lastUsed: Date.now() };
  saveARState(merged);
  return merged;
}
const AR_TOOL_CONFIGS = {
  "image-generator": {
    type: "3d-model",
    modelUrl: null,
    previewColor: "#60a5fa",
    animation: "float",
    scale: 1,
    description: "AI图像生成工具"
  },
  "music-generator": {
    type: "3d-model",
    modelUrl: null,
    previewColor: "#a78bfa",
    animation: "pulse",
    scale: 0.8,
    description: "AI音乐生成工具"
  },
  "tts-service": {
    type: "3d-model",
    modelUrl: null,
    previewColor: "#f97316",
    animation: "wave",
    scale: 0.9,
    description: "文字转语音服务"
  },
  "workflow": {
    type: "diagram",
    previewColor: "#10b981",
    animation: "flow",
    scale: 1,
    description: "工作流编排引擎"
  },
  "default": {
    type: "icon",
    previewColor: "#8b5cf6",
    animation: "rotate",
    scale: 1,
    description: "通用工具"
  }
};
function getToolARConfig(toolId) {
  return AR_TOOL_CONFIGS[toolId] || AR_TOOL_CONFIGS["default"];
}
function createARCanvas(container, options = {}) {
  const {
    width = 320,
    height = 240,
    backgroundColor = "#0f0f1a"
  } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background: ${backgroundColor};
  `;
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let animationId = null;
  function drawTool(config, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    const t = time / 1e3;
    const floatY = Math.sin(t * 2) * 10;
    const pulseScale = 1 + Math.sin(t * 3) * 0.1;
    const rotateAngle = t * 0.5;
    ctx.save();
    ctx.translate(centerX, centerY + floatY);
    if (config.animation === "pulse") {
      ctx.scale(pulseScale, pulseScale);
    } else if (config.animation === "rotate") {
      ctx.rotate(rotateAngle);
    }
    const size = 60 * (config.scale || 1);
    const color = config.previewColor || "#8b5cf6";
    ctx.fillStyle = "#00000040";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.6, size * 0.6, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, adjustColor(color, -30));
    gradient.addColorStop(1, adjustColor(color, -60));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    if (config.type === "diagram") {
      drawFlowDiagram(ctx, size, color, t);
    } else {
      drawSphere(ctx, size);
    }
    ctx.restore();
    const glowSize = size * 1.5 * (1 + Math.sin(t * 2) * 0.2);
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
    glowGradient.addColorStop(0, color + "30");
    glowGradient.addColorStop(0.5, color + "10");
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(config.description || "AR Preview", centerX, height - 20);
    drawARMarkers(ctx, centerX, centerY, size, t);
  }
  function drawSphere(ctx2, size, gradient) {
    ctx2.beginPath();
    ctx2.arc(0, 0, size, 0, Math.PI * 2);
    ctx2.fill();
    const highlightGradient = ctx2.createRadialGradient(
      -size * 0.3,
      -size * 0.3,
      0,
      -size * 0.3,
      -size * 0.3,
      size * 0.5
    );
    highlightGradient.addColorStop(0, "rgba(255,255,255,0.4)");
    highlightGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.fillStyle = highlightGradient;
    ctx2.beginPath();
    ctx2.arc(0, 0, size, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = "rgba(255,255,255,0.2)";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.arc(0, 0, size, 0, Math.PI * 2);
    ctx2.stroke();
  }
  function drawFlowDiagram(ctx2, size, color, t) {
    const nodes = [
      { x: -size * 0.5, label: "输入" },
      { x: 0, label: "处理" },
      { x: size * 0.5, label: "输出" }
    ];
    ctx2.strokeStyle = color;
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.moveTo(nodes[0].x + 20, 0);
    ctx2.lineTo(nodes[1].x - 20, 0);
    ctx2.moveTo(nodes[1].x + 20, 0);
    ctx2.lineTo(nodes[2].x - 20, 0);
    ctx2.stroke();
    const flowPos = t * 50 % 60 - 20;
    ctx2.fillStyle = "#ffffff";
    ctx2.beginPath();
    ctx2.arc(nodes[1].x + flowPos, 0, 5, 0, Math.PI * 2);
    ctx2.fill();
    for (const node of nodes) {
      ctx2.fillStyle = color;
      ctx2.beginPath();
      ctx2.roundRect(node.x - 20, -15, 40, 30, 6);
      ctx2.fill();
      ctx2.fillStyle = "#ffffff";
      ctx2.font = "10px system-ui";
      ctx2.textAlign = "center";
      ctx2.fillText(node.label, node.x, 3);
    }
  }
  function drawARMarkers(ctx2, cx, cy, size, t) {
    const corners = [
      { x: 20, y: 20 },
      { x: width - 20, y: 20 },
      { x: 20, y: height - 20 },
      { x: width - 20, y: height - 20 }
    ];
    ctx2.strokeStyle = "#60a5fa";
    ctx2.lineWidth = 2;
    for (const corner of corners) {
      const offset = Math.sin(t * 3) * 2;
      ctx2.beginPath();
      ctx2.moveTo(corner.x, corner.y + 10 + offset);
      ctx2.lineTo(corner.x, corner.y + offset);
      ctx2.lineTo(corner.x + 10, corner.y + offset);
      ctx2.stroke();
    }
    ctx2.fillStyle = "#60a5fa";
    ctx2.font = "9px system-ui";
    ctx2.textAlign = "left";
    ctx2.fillText("AR", 20, 15);
    ctx2.textAlign = "right";
    ctx2.fillText("AI-CREATOR", width - 20, 15);
  }
  function adjustColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, (num >> 8 & 255) + amount));
    const b = Math.min(255, Math.max(0, (num & 255) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }
  function startRender(toolId) {
    const config = getToolARConfig(toolId);
    function render(time) {
      drawTool(config, time);
      animationId = requestAnimationFrame(render);
    }
    animationId = requestAnimationFrame(render);
  }
  function stopRender() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
  function dispose() {
    stopRender();
    canvas.remove();
  }
  return {
    canvas,
    startRender,
    stopRender,
    dispose
  };
}
function createARInteractionLayer(container, options = {}) {
  const {
    onTap,
    onSwipe
  } = options;
  let startX = 0;
  let startY = 0;
  let lastTap = 0;
  function handleTouchStart(e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }
  function handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const now = Date.now();
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (now - lastTap < 300) {
        onTap == null ? void 0 : onTap({ x: touch.clientX, y: touch.clientY, type: "double-tap" });
      } else {
        onTap == null ? void 0 : onTap({ x: touch.clientX, y: touch.clientY, type: "tap" });
      }
      lastTap = now;
    }
    if (Math.abs(deltaX) > 50) {
      onSwipe == null ? void 0 : onSwipe({ direction: deltaX > 0 ? "right" : "left", deltaX });
    }
    if (Math.abs(deltaY) > 50) {
      onSwipe == null ? void 0 : onSwipe({ direction: deltaY > 0 ? "down" : "up", deltaY });
    }
  }
  container.addEventListener("touchstart", handleTouchStart, { passive: true });
  container.addEventListener("touchend", handleTouchEnd, { passive: true });
  function dispose() {
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchend", handleTouchEnd);
  }
  return { dispose };
}
function createARExplorerPanel() {
  const panel = document.createElement("div");
  panel.id = "ar-panel";
  const arState = getARState();
  const supported = isARSupported();
  let currentTool = null;
  let arRenderer = null;
  let interactionLayer = null;
  function render() {
    var _a, _b, _c;
    const tools = Object.keys(toolRegistry).slice(0, 12);
    let content = '<div class="ar-header"><span class="ar-title">🔮 AR探索</span><button class="ar-close" data-action="close">×</button></div><div class="ar-body">';
    content += '<div class="ar-section"><div class="ar-status ' + (supported ? "supported" : "unsupported") + '"><span class="ar-status-icon">' + (supported ? "✓" : "✗") + '</span><span class="ar-status-text">' + (supported ? "AR功能可用" : "AR功能受限") + "</span></div></div>";
    content += '<div class="ar-section"><div class="ar-section-title">🖼️ 实时预览</div><div class="ar-preview-container" id="ar-preview-container"><div class="ar-preview-placeholder"><span>选择下方工具查看AR效果</span></div></div><div class="ar-preview-info" id="ar-preview-info"><span>点击画布交互，双击放大</span></div></div>';
    content += '<div class="ar-section"><div class="ar-section-title">🧰 工具AR效果</div><div class="ar-tools-grid">';
    for (const toolId of tools) {
      const config = getToolARConfig(toolId);
      const isActive = currentTool === toolId;
      content += '<div class="ar-tool-card ' + (isActive ? "active" : "") + '" data-tool="' + toolId + '"><div class="ar-tool-icon" style="background: ' + config.previewColor + "20; color: " + config.previewColor + '">' + getToolIcon(toolId) + '</div><div class="ar-tool-name">' + toolId.replace(/-/g, " ") + '</div><div class="ar-tool-animation">' + config.animation + "</div></div>";
    }
    content += "</div></div>";
    content += '<div class="ar-section"><div class="ar-section-title">⚙️ AR设置</div><div class="ar-setting-item"><div class="ar-setting-info"><div class="ar-setting-label">启用AR</div><div class="ar-setting-desc">在工具预览中显示AR效果</div></div><label class="ar-switch"><input type="checkbox" id="ar-enabled" ' + (arState.enabled ? "checked" : "") + '><span class="ar-slider"></span></label></div><div class="ar-setting-item"><div class="ar-setting-label">显示引导</div><label class="ar-switch"><input type="checkbox" id="ar-guide" ' + (arState.showGuide ? "checked" : "") + '><span class="ar-slider"></span></label></div><div class="ar-setting-item"><div class="ar-setting-label">质量</div><select id="ar-quality" class="ar-select"><option value="low" ' + (arState.quality === "low" ? "selected" : "") + '>低</option><option value="medium" ' + (arState.quality === "medium" ? "selected" : "") + '>中</option><option value="high" ' + (arState.quality === "high" ? "selected" : "") + ">高</option></select></div></div>";
    content += "</div>";
    panel.innerHTML = content;
    panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
    panel.addEventListener("click", (e) => e.stopPropagation());
    panel.querySelectorAll(".ar-tool-card").forEach((card) => {
      card.addEventListener("click", function() {
        const toolId = this.dataset.tool;
        selectTool(toolId);
      });
    });
    (_a = panel.querySelector("#ar-enabled")) == null ? void 0 : _a.addEventListener("change", function() {
      updateARState({ enabled: this.checked });
    });
    (_b = panel.querySelector("#ar-guide")) == null ? void 0 : _b.addEventListener("change", function() {
      updateARState({ showGuide: this.checked });
    });
    (_c = panel.querySelector("#ar-quality")) == null ? void 0 : _c.addEventListener("change", function() {
      updateARState({ quality: this.value });
    });
  }
  function selectTool(toolId) {
    currentTool = toolId;
    panel.querySelectorAll(".ar-tool-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.tool === toolId);
    });
    const container = panel.querySelector("#ar-preview-container");
    if (!container) return;
    if (arRenderer) {
      arRenderer.dispose();
      arRenderer = null;
    }
    if (interactionLayer) {
      interactionLayer.dispose();
      interactionLayer = null;
    }
    container.innerHTML = "";
    arRenderer = createARCanvas(container, {
      width: 300,
      height: 200,
      backgroundColor: "#0f0f1a"
    });
    arRenderer.startRender(toolId);
    interactionLayer = createARInteractionLayer(container, {
      onTap: (info2) => {
        showTapEffect(info2.x, info2.y);
        if (info2.type === "double-tap") {
          toggleFullscreen();
        }
      },
      onSwipe: (info2) => {
        const tools = Object.keys(toolRegistry).slice(0, 12);
        const currentIdx = tools.indexOf(currentTool);
        let nextIdx;
        if (info2.direction === "left") {
          nextIdx = (currentIdx + 1) % tools.length;
        } else if (info2.direction === "right") {
          nextIdx = (currentIdx - 1 + tools.length) % tools.length;
        }
        if (nextIdx !== void 0) {
          selectTool(tools[nextIdx]);
        }
      }
    });
    const info = panel.querySelector("#ar-preview-info");
    if (info) {
      info.innerHTML = "<span>双击放大 · 左右滑动切换工具</span>";
    }
  }
  function showTapEffect(x, y) {
    const container = panel.querySelector("#ar-preview-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const effect = document.createElement("div");
    effect.className = "ar-tap-effect";
    effect.style.cssText = `
      position: absolute;
      left: ${x - rect.left}px;
      top: ${y - rect.top}px;
      width: 40px;
      height: 40px;
      margin: -20px 0 0 -20px;
      border-radius: 50%;
      border: 2px solid #60a5fa;
      animation: ar-tap 0.6s ease-out forwards;
      pointer-events: none;
    `;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
  }
  function toggleFullscreen() {
    var _a;
    const container = panel.querySelector("#ar-preview-container");
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      (_a = container.requestFullscreen) == null ? void 0 : _a.call(container);
    }
  }
  function getToolIcon(toolId) {
    const icons = {
      "image-generator": "🎨",
      "music-generator": "🎵",
      "tts-service": "🗣️",
      "workflow": "⚡",
      "default": "🔧"
    };
    return icons[toolId] || icons["default"];
  }
  const style = document.createElement("style");
  style.id = "ar-panel-style";
  style.textContent = [
    "#ar-panel {",
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);",
    "width: 480px; max-height: 85vh; background: #1a1a2e; border: 1px solid #333;",
    "border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);",
    "z-index: 1017; font-family: system-ui, sans-serif; display: flex; flex-direction: column;",
    "}",
    ".ar-header {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 14px 16px; border-bottom: 1px solid #333;",
    "background: #16162a; border-radius: 12px 12px 0 0;",
    "}",
    ".ar-title { font-size: 15px; font-weight: 600; color: #a78bfa; }",
    ".ar-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }",
    ".ar-body { flex: 1; overflow-y: auto; padding: 12px; }",
    ".ar-section { margin-bottom: 16px; }",
    ".ar-section-title {",
    "font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;",
    "margin-bottom: 10px; letter-spacing: 0.5px;",
    "}",
    ".ar-status {",
    "display: flex; align-items: center; gap: 8px; padding: 10px 12px;",
    "border-radius: 8px; font-size: 13px;",
    "}",
    ".ar-status.supported { background: #10b98122; color: #10b981; }",
    ".ar-status.unsupported { background: #888822; color: #888; }",
    ".ar-status-icon { font-size: 16px; }",
    ".ar-preview-container {",
    "position: relative; height: 200px; background: #0f0f1a; border-radius: 8px;",
    "overflow: hidden; display: flex; align-items: center; justify-content: center;",
    "}",
    ".ar-preview-placeholder {",
    "text-align: center; color: #666; font-size: 13px;",
    "}",
    ".ar-preview-info {",
    "text-align: center; font-size: 11px; color: #666; margin-top: 8px;",
    "}",
    ".ar-tools-grid {",
    "display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;",
    "}",
    ".ar-tool-card {",
    "padding: 10px 6px; background: #12122a; border-radius: 8px;",
    "text-align: center; cursor: pointer; border: 2px solid transparent;",
    "transition: border-color 0.2s, transform 0.2s;",
    "}",
    ".ar-tool-card:hover { transform: scale(1.02); }",
    ".ar-tool-card.active { border-color: #a78bfa; }",
    ".ar-tool-icon {",
    "font-size: 24px; width: 40px; height: 40px; border-radius: 8px;",
    "display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;",
    "}",
    ".ar-tool-name {",
    "font-size: 9px; color: #888; text-transform: capitalize;",
    "white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",
    "}",
    ".ar-tool-animation {",
    "font-size: 8px; color: #666; margin-top: 2px;",
    "}",
    ".ar-setting-item {",
    "display: flex; justify-content: space-between; align-items: center;",
    "padding: 8px 0; border-bottom: 1px solid #222;",
    "}",
    ".ar-setting-label { font-size: 13px; color: #fff; }",
    ".ar-setting-desc { font-size: 11px; color: #666; }",
    ".ar-switch {",
    "position: relative; width: 44px; height: 24px; cursor: pointer;",
    "}",
    ".ar-switch input { opacity: 0; width: 0; height: 0; }",
    ".ar-slider {",
    "position: absolute; top: 0; left: 0; right: 0; bottom: 0;",
    "background: #333; border-radius: 12px; transition: 0.2s;",
    "}",
    ".ar-slider:before {",
    'position: absolute; content: ""; height: 18px; width: 18px;',
    "left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s;",
    "}",
    "input:checked + .ar-slider { background: #a78bfa; }",
    "input:checked + .ar-slider:before { transform: translateX(20px); }",
    ".ar-select {",
    "padding: 6px 10px; background: #12122a; border: 1px solid #333;",
    "border-radius: 6px; color: #fff; font-size: 12px; cursor: pointer;",
    "}",
    "@keyframes ar-tap {",
    "0% { transform: scale(0); opacity: 1; }",
    "100% { transform: scale(2); opacity: 0; }",
    "}"
  ].join("");
  if (!document.getElementById("ar-panel-style")) {
    document.head.appendChild(style);
  }
  render();
  panel.querySelector('[data-action="close"]').addEventListener("click", () => {
    if (arRenderer) arRenderer.dispose();
    if (interactionLayer) interactionLayer.dispose();
    panel.remove();
  });
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createARExplorerPanel
};
//# sourceMappingURL=ARExplorerPanel-Bfy-9_fj.js.map

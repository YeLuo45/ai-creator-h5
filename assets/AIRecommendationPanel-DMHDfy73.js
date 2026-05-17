import { e as toolRegistry } from "./index-zZBXRajj.js";
const TASK_TYPE_KEYWORDS = {
  image: ["图片", "画", "图像", "生成图片", "绘图", "油画", "水彩", "素描", "logo", "icon", "插画", "海报", "封面"],
  music: ["音乐", "歌曲", "作曲", "哼唱", "旋律", "BGM", "背景音乐", "编曲", "音频"],
  tts: ["语音", "配音", "朗读", "文字转语音", "TTS", "有声", "播报", "解说"],
  text: ["文章", "文案", "脚本", "对话", "故事", "诗歌", "歌词", "摘要", "翻译", "改写"],
  coding: ["代码", "编程", "脚本", "函数", "算法", "debug", "开发"],
  creative: ["创意", "头脑风暴", "灵感", "点子", "想法", "设计思路"]
};
const TASK_TOOL_RECOMMENDATIONS = {
  image: [
    { id: "style-tag", score: 90, reason: "根据风格需求推荐合适的艺术风格标签" },
    { id: "quality-check", score: 70, reason: "检查图片描述的完整性和质量" },
    { id: "char-count", score: 40, reason: "统计描述文本长度" }
  ],
  music: [
    { id: "rhyme-search", score: 90, reason: "为歌词创作查找押韵词汇" },
    { id: "style-tag", score: 70, reason: "标记音乐风格标签" },
    { id: "word-count", score: 50, reason: "统计歌词字数" }
  ],
  tts: [
    { id: "punctuation-check", score: 90, reason: "优化标点以提升朗读自然度" },
    { id: "word-count", score: 70, reason: "统计文本长度估算朗读时长" },
    { id: "quality-check", score: 60, reason: "检查文本质量" }
  ],
  text: [
    { id: "synonym-search", score: 90, reason: "丰富表达方式" },
    { id: "punctuation-check", score: 80, reason: "修正标点符号" },
    { id: "rhyme-search", score: 60, reason: "查找近义词" },
    { id: "quality-check", score: 70, reason: "检查文本质量" }
  ],
  coding: [
    { id: "json-formatter", score: 90, reason: "格式化 JSON 数据" },
    { id: "regex-tester", score: 85, reason: "测试正则表达式" },
    { id: "format-convert", score: 80, reason: "格式转换" }
  ],
  creative: [
    { id: "style-tag", score: 95, reason: "提供创意风格选项" },
    { id: "synonym-search", score: 70, reason: "扩展创意表达" },
    { id: "rhyme-search", score: 60, reason: "激发创意灵感" }
  ]
};
function analyzeTaskType(input) {
  if (!input || typeof input !== "string") {
    return { type: "unknown", confidence: 0 };
  }
  const text = input.toLowerCase();
  const scores = {};
  for (const [type, keywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[type] = matchCount / keywords.length;
    }
  }
  let bestType = "text";
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  return {
    type: bestType,
    confidence: Math.min(bestScore * 3, 1),
    // 标准化到 0-1
    allScores: scores
  };
}
function recommendTools(input) {
  const analysis = analyzeTaskType(input);
  const recommendations = [];
  const recs = TASK_TOOL_RECOMMENDATIONS[analysis.type] || [];
  for (const rec of recs) {
    const tool = toolRegistry.get(rec.id);
    if (tool) {
      recommendations.push({
        tool,
        score: rec.score * analysis.confidence,
        reason: rec.reason,
        matchedType: analysis.type
      });
    }
  }
  if (recommendations.length === 0) {
    const generalTools = [
      { id: "word-count", reason: "快速统计文本长度" },
      { id: "quality-check", reason: "检查内容质量" }
    ];
    for (const g of generalTools) {
      const tool = toolRegistry.get(g.id);
      if (tool) {
        recommendations.push({
          tool,
          score: 50,
          reason: g.reason,
          matchedType: "general"
        });
      }
    }
  }
  recommendations.sort((a, b) => b.score - a.score);
  return {
    analysis,
    recommendations: recommendations.slice(0, 5),
    // 最多返回5个
    timestamp: Date.now()
  };
}
function createAIRecommendationPanel(inputText = "") {
  var _a, _b;
  const panel = document.createElement("div");
  panel.id = "ai-recommendation-panel";
  const currentInput = inputText || (((_a = document.querySelector("#prompt-input")) == null ? void 0 : _a.value) || "") || (((_b = document.querySelector("#user-input")) == null ? void 0 : _b.value) || "");
  const result = recommendTools(currentInput);
  const analysis = result.analysis;
  const confidencePercent = (analysis.confidence * 100).toFixed(0);
  const typeLabels = {
    image: "🎨 图片生成",
    music: "🎵 音乐创作",
    tts: "🔊 语音合成",
    text: "📝 文本处理",
    coding: "💻 开发任务",
    creative: "💡 创意发散",
    unknown: "❓ 未知"
  };
  panel.innerHTML = `
    <div class="air-header">
      <span class="air-title">🤖 AI 工具推荐</span>
      <button class="air-close" data-action="close">×</button>
    </div>
    ${currentInput ? `
    <div class="air-analysis">
      <div class="air-analysis-type">
        <span class="air-type-label">识别任务类型:</span>
        <span class="air-type-value">${typeLabels[analysis.type] || "未知"}</span>
        <span class="air-confidence">${confidencePercent}% 置信度</span>
      </div>
      <div class="air-analysis-preview">"${currentInput.slice(0, 60)}${currentInput.length > 60 ? "..." : ""}"</div>
    </div>
    ` : ""}
    <div class="air-list" id="air-list">
      ${result.recommendations.length === 0 ? '<p class="air-empty">暂无推荐</p>' : ""}
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #ai-recommendation-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 400px; max-height: 70vh; background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1006; font-family: system-ui, sans-serif; display: flex; flex-direction: column;
    }
    .air-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .air-title { font-size: 15px; font-weight: 600; color: #a78bfa; }
    .air-close { background: none; border: none; color: #888; font-size: 20px; cursor: pointer; }
    .air-close:hover { color: #fff; }
    .air-analysis {
      padding: 12px 16px; border-bottom: 1px solid #222;
    }
    .air-analysis-type {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .air-type-label { font-size: 12px; color: #888; }
    .air-type-value { font-size: 14px; font-weight: 600; color: #a78bfa; }
    .air-confidence { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #a78bfa22; color: #a78bfa; }
    .air-analysis-preview { font-size: 12px; color: #666; font-style: italic; }
    .air-list { flex: 1; overflow-y: auto; padding: 12px 16px; }
    .air-empty { text-align: center; color: #666; font-size: 13px; padding: 30px; }
    .air-item {
      padding: 12px; background: #12122a; border-radius: 8px; margin-bottom: 8px;
      border: 1px solid #222; cursor: pointer; transition: border-color 0.15s;
    }
    .air-item:hover { border-color: #a78bfa44; }
    .air-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .air-item-icon { font-size: 18px; }
    .air-item-name { font-size: 14px; font-weight: 500; color: #fff; flex: 1; margin-left: 8px; }
    .air-item-score {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
      background: ${analysis.type === "image" ? "#4ade8022" : analysis.type === "music" ? "#60a5fa22" : "#a78bfa22"};
      color: ${analysis.type === "image" ? "#4ade80" : analysis.type === "music" ? "#60a5fa" : "#a78bfa"};
    }
    .air-item-reason { font-size: 12px; color: #888; margin-bottom: 6px; }
    .air-item-type { font-size: 11px; color: #666; }
    .air-item-actions { margin-top: 8px; }
    .air-btn {
      padding: 6px 12px; border: none; border-radius: 4px;
      font-size: 12px; cursor: pointer; width: 100%;
      transition: opacity 0.15s;
    }
    .air-btn:hover { opacity: 0.8; }
    .air-btn-use { background: #a78bfa; color: #fff; }
  `;
  document.head.appendChild(style);
  const airList = panel.querySelector("#air-list");
  airList.innerHTML = result.recommendations.map((rec) => `
    <div class="air-item" data-tool-id="${rec.tool.id}">
      <div class="air-item-header">
        <span class="air-item-icon">${rec.tool.icon}</span>
        <span class="air-item-name">${rec.tool.name}</span>
        <span class="air-item-score">${rec.score.toFixed(0)}%</span>
      </div>
      <div class="air-item-reason">${rec.reason}</div>
      <div class="air-item-type">类型: ${rec.matchedType}</div>
      <div class="air-item-actions">
        <button class="air-btn air-btn-use">使用此工具</button>
      </div>
    </div>
  `).join("");
  airList.querySelectorAll(".air-btn-use").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const toolId = btn.closest(".air-item").dataset.toolId;
      panel.remove();
      if (window.__openToolPanel) {
        window.__openToolPanel(toolId);
      }
    });
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  return panel;
}
export {
  createAIRecommendationPanel
};
//# sourceMappingURL=AIRecommendationPanel-DMHDfy73.js.map

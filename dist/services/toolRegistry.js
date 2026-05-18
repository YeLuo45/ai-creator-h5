/**
 * toolRegistry.js - Tool Registry System
 * Based on nanobot-design Tool System architecture
 */

/**
 * Tool Registry Class
 * Manages registration and execution of tools
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a new tool
   * @param {Object} tool - Tool object with { id, name, description, execute }
   * @returns {boolean} - Success status
   */
  registerTool(tool) {
    if (!tool.id || !tool.name || typeof tool.execute !== 'function') {
      console.error('[ToolRegistry] Invalid tool format:', tool);
      return false;
    }
    if (this.tools.has(tool.id)) {
      console.warn('[ToolRegistry] Tool already registered:', tool.id);
      return false;
    }
    this.tools.set(tool.id, tool);
    console.log('[ToolRegistry] Registered tool:', tool.id);
    return true;
  }

  /**
   * Get a tool by ID
   * @param {string} id - Tool ID
   * @returns {Object|undefined} - Tool object
   */
  getTool(id) {
    return this.tools.get(id);
  }

  /**
   * List all registered tools
   * @returns {Array} - Array of tool objects
   */
  listTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by ID
   * @param {string} id - Tool ID
   * @param {Object} params - Parameters for tool execution
   * @returns {*} - Tool execution result
   */
  executeTool(id, params = {}) {
    const tool = this.tools.get(id);
    if (!tool) {
      console.error('[ToolRegistry] Tool not found:', id);
      return { error: 'Tool not found: ' + id };
    }
    try {
      return tool.execute(params);
    } catch (e) {
      console.error('[ToolRegistry] Tool execution error:', e);
      return { error: e.message };
    }
  }
}

// Create singleton instance
window.toolRegistry = new ToolRegistry();

// ==========================================
// Built-in Tools
// ==========================================

/**
 * Tool 1: wordCount - Count words, characters, sentences
 */
window.toolRegistry.registerTool({
  id: 'wordCount',
  name: '字数统计',
  description: '统计文本的字数、字符数、句子数',
  execute: function(params) {
    const { text = '' } = params;
    if (!text) {
      return { error: '请输入文本' };
    }
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    return {
      chars,
      words,
      sentences,
      paragraphs,
      charCount: chars,
      wordCount: words
    };
  }
});

/**
 * Tool 2: promptPreview - Preview and optimize prompts
 */
window.toolRegistry.registerTool({
  id: 'promptPreview',
  name: 'Prompt预览',
  description: '预览和优化AI提示词',
  execute: function(params) {
    const { prompt = '', type = 'image' } = params;
    if (!prompt) {
      return { error: '请输入Prompt' };
    }
    const charCount = prompt.length;
    const wordCount = prompt.trim().split(/\s+/).length;
    const hasKeywords = {
      image: ['style', 'color', 'light', 'background', 'detail'].some(k => prompt.toLowerCase().includes(k)),
      music: ['rhythm', 'tempo', 'melody', 'genre', 'mood'].some(k => prompt.toLowerCase().includes(k)),
      tts: ['voice', 'speed', 'tone', 'emotion'].some(k => prompt.toLowerCase().includes(k))
    };
    let suggestion = '';
    if (charCount < 20) {
      suggestion = '提示词较短，建议添加更多细节描述';
    } else if (charCount > 500) {
      suggestion = '提示词较长，建议精简关键信息';
    } else {
      suggestion = '提示词长度适中';
    }
    return {
      charCount,
      wordCount,
      suggestion,
      type,
      hasKeywords: hasKeywords[type] || false,
      preview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
    };
  }
});

/**
 * Tool 3: syntaxCheck - Check prompt syntax and common issues
 */
window.toolRegistry.registerTool({
  id: 'syntaxCheck',
  name: '语法检查',
  description: '检查Prompt语法和常见问题',
  execute: function(params) {
    const { prompt = '' } = params;
    if (!prompt) {
      return { error: '请输入Prompt' };
    }
    const issues = [];
    const checks = {
      hasEndPunctuation: /[.!?。！？]$/.test(prompt.trim()),
      hasMultipleSpaces: /\s{2,}/.test(prompt),
      hasSpecialChars: /[<>{}]/.test(prompt),
      startsWithCapital: /^[A-Z]/.test(prompt),
      hasQuotes: /["'"]/.test(prompt),
      length: prompt.length
    };
    if (!checks.hasEndPunctuation) {
      issues.push('建议以标点符号结尾');
    }
    if (checks.hasMultipleSpaces) {
      issues.push('存在多余空格');
    }
    if (checks.hasSpecialChars) {
      issues.push('包含特殊字符可能导致解析问题');
    }
    if (checks.length < 10) {
      issues.push('内容过短，可能缺乏描述性');
    }
    if (checks.length > 1000) {
      issues.push('内容过长，可能被截断');
    }
    return {
      issues,
      issueCount: issues.length,
      checks,
      score: Math.max(0, 100 - issues.length * 15),
      passed: issues.length === 0
    };
  }
});

/**
 * Tool 4: imageRatio - Calculate image aspect ratios
 */
window.toolRegistry.registerTool({
  id: 'imageRatio',
  name: '图片比例',
  description: '计算图片宽高比和推荐尺寸',
  execute: function(params) {
    const { width = 0, height = 0, ratio = '' } = params;
    if (ratio) {
      // Parse ratio like "16:9" or "16/9"
      const parts = ratio.replace(':', '/').split('/');
      if (parts.length === 2) {
        const w = parseInt(parts[0]);
        const h = parseInt(parts[1]);
        if (w && h) {
          const gcd = getGCD(w, h);
          const simplifiedW = w / gcd;
          const simplifiedH = h / gcd;
          const decimal = (w / h).toFixed(2);
          const commonRatios = getCommonRatio(simplifiedW, simplifiedH);
          return {
            original: ratio,
            simplified: `${simplifiedW}:${simplifiedH}`,
            decimal: parseFloat(decimal),
            commonName: commonRatios,
            recommendations: getSizeRecommendations(simplifiedW, simplifiedH)
          };
        }
      }
      return { error: '无效的比例格式' };
    }
    if (width && height) {
      const gcd = getGCD(width, height);
      const simplifiedW = width / gcd;
      const simplifiedH = height / gcd;
      const decimal = (width / height).toFixed(4);
      const commonRatios = getCommonRatio(simplifiedW, simplifiedH);
      return {
        width,
        height,
        simplified: `${simplifiedW}:${simplifiedH}`,
        decimal: parseFloat(decimal),
        commonName: commonRatios,
        recommendations: getSizeRecommendations(simplifiedW, simplifiedH)
      };
    }
    return { error: '请提供宽度和高度，或选择预设比例' };
  }
});

/**
 * Tool 5: musicDuration - Estimate music duration from tempo and bars
 */
window.toolRegistry.registerTool({
  id: 'musicDuration',
  name: '音乐时长',
  description: '根据节拍和小节数估算音乐时长',
  execute: function(params) {
    const { bpm = 120, bars = 16, timeSignature = '4/4' } = params;
    if (bpm < 20 || bpm > 300) {
      return { error: 'BPM应在20-300之间' };
    }
    if (bars < 1 || bars > 1000) {
      return { error: '小节数应在1-1000之间' };
    }
    const [beatsPerBar, noteValue] = timeSignature.split('/').map(Number);
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * beatsPerBar;
    const totalSeconds = secondsPerBar * bars;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    // Estimate file size (assuming 128kbps MP3)
    const fileSizeKB = Math.round((totalSeconds * 128) / 8);
    const fileSizeMB = (fileSizeKB / 1024).toFixed(2);
    return {
      bpm,
      bars,
      timeSignature,
      duration: totalSeconds,
      formatted,
      minutes,
      seconds,
      estimatedSizeMB: parseFloat(fileSizeMB)
    };
  }
});

// ==========================================
// Helper Functions
// ==========================================

function getGCD(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function getCommonRatio(w, h) {
  const ratios = {
    '1:1': ['方形', '1:1'],
    '4:3': ['标准', '4:3'],
    '3:2': ['经典照片', '3:2'],
    '16:9': ['宽屏', '16:9'],
    '21:9': ['超宽屏', '21:9'],
    '9:16': ['竖屏', '9:16'],
    '3:4': ['竖向照片', '3:4'],
    '2:3': ['人像', '2:3']
  };
  const key = `${w}:${h}`;
  const reverseKey = `${h}:${w}`;
  if (ratios[key]) return ratios[key];
  if (ratios[reverseKey]) return ratios[reverseKey];
  // Check decimal equivalence
  const decimal = (w / h).toFixed(2);
  for (const [k, v] of Object.entries(ratios)) {
    const [rw, rh] = k.split(':').map(Number);
    if ((rw / rh).toFixed(2) === decimal) {
      return v;
    }
  }
  return ['自定义', `${w}:${h}`];
}

function getSizeRecommendations(w, h) {
  const recommendations = [];
  if (w > h) {
    recommendations.push(
      { name: '小图', width: Math.round(400 * (w / h)), height: 400 },
      { name: '中图', width: Math.round(800 * (w / h)), height: 800 },
      { name: '大图', width: Math.round(1920 * (w / h)), height: 1920 },
      { name: '原图', width: Math.round(2560 * (w / h)), height: 2560 }
    );
  } else {
    recommendations.push(
      { name: '小图', width: 400, height: Math.round(400 * (h / w)) },
      { name: '中图', width: 800, height: Math.round(800 * (h / w)) },
      { name: '大图', width: 1920, height: Math.round(1920 * (h / w)) },
      { name: '原图', width: 2560, height: Math.round(2560 * (h / w)) }
    );
  }
  return recommendations;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ToolRegistry };
}
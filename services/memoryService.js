/**
 * memoryService.js - Dream Memory 记忆系统
 * 基于 IndexedDB 存储生成历史，分析偏好，智能推荐
 */

// ========== IndexedDB Configuration ==========
const DB_NAME = 'AICreatorMemory';
const DB_VERSION = 1;
const STORE_NAME = 'generations';

let db = null;

/**
 * 初始化 IndexedDB
 */
async function initDB() {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB 初始化失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        // 索引用于查询和分析
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('prompt', 'prompt', { unique: false });
      }
    };
  });
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * 记录一次生成到记忆
 * @param {string} type - 生成类型: 'image', 'music', 'tts'
 * @param {string} prompt - 原始 Prompt
 * @param {Array} tags - 提取的标签数组
 * @param {Object} extraData - 额外数据 (style, size, genre 等)
 */
async function recordGeneration(type, prompt, tags = [], extraData = {}) {
  try {
    await initDB();
    
    const record = {
      id: generateId(),
      type,
      prompt,
      tags: tags.length > 0 ? tags : extractTags(prompt),
      timestamp: Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      extraData
    };
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(record);
    
    return record;
  } catch (e) {
    console.error('记录生成历史失败:', e);
    return null;
  }
}

/**
 * 从 Prompt 中提取标签关键词
 */
function extractTags(prompt) {
  const tags = [];
  if (!prompt) return tags;
  
  // 常见风格/主题关键词
  const keywords = [
    // 风格
    '写实', '自然', '抽象', '动漫', '水彩', '油画', '素描', '国画', '插画', '摄影',
    '科幻', '奇幻', '复古', '现代', '极简', '梦幻', '赛博朋克', '蒸汽朋克',
    '可爱', '酷炫', '优雅', '浪漫', '恐怖', '幽默',
    // 主题
    '猫', '狗', '风景', '人物', '建筑', '自然', '动物', '植物', '食物', '汽车',
    '城市', '乡村', '海', '山', '森林', '沙漠', '星空', '日落', '日出',
    '音乐', '舞蹈', '运动', '游戏', '电影', '书籍'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  keywords.forEach(kw => {
    if (lowerPrompt.includes(kw)) {
      tags.push(kw);
    }
  });
  
  // 限制标签数量
  return [...new Set(tags)].slice(0, 10);
}

/**
 * 获取所有生成历史
 */
async function getAllGenerations() {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('获取生成历史失败:', e);
    return [];
  }
}

/**
 * 获取最近 N 条生成历史
 */
async function getRecentGenerations(limit = 10) {
  const all = await getAllGenerations();
  return all.slice(0, limit);
}

/**
 * 分析用户偏好
 * @returns {Object} 偏好分析结果
 */
async function analyzePreferences() {
  try {
    const generations = await getAllGenerations();
    
    if (generations.length === 0) {
      return {
        totalCount: 0,
        typeStats: { image: 0, music: 0, tts: 0 },
        topKeywords: [],
        styleStats: {},
        recentThemes: [],
        averageTagsPerGeneration: 0
      };
    }
    
    // 类型统计
    const typeStats = { image: 0, music: 0, tts: 0 };
    generations.forEach(g => {
      if (g.type in typeStats) {
        typeStats[g.type]++;
      }
    });
    
    // 关键词频率统计
    const keywordCount = {};
    generations.forEach(g => {
      (g.tags || []).forEach(tag => {
        keywordCount[tag] = (keywordCount[tag] || 0) + 1;
      });
    });
    
    // 按频率排序，获取高频关键词
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));
    
    // 风格统计（从 extraData 中提取）
    const styleStats = {};
    generations.forEach(g => {
      const style = g.extraData?.style || g.extraData?.genre || g.extraData?.voice || 'default';
      styleStats[style] = (styleStats[style] || 0) + 1;
    });
    
    // 最近主题（取最近 20 条的标签）
    const recentGenerations = generations.slice(0, 20);
    const recentKeywords = {};
    recentGenerations.forEach(g => {
      (g.tags || []).forEach(tag => {
        recentKeywords[tag] = (recentKeywords[tag] || 0) + 1;
      });
    });
    const recentThemes = Object.entries(recentKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
    
    // 平均标签数
    const totalTags = generations.reduce((sum, g) => sum + (g.tags?.length || 0), 0);
    const averageTagsPerGeneration = generations.length > 0 ? (totalTags / generations.length).toFixed(1) : 0;
    
    return {
      totalCount: generations.length,
      typeStats,
      topKeywords,
      styleStats,
      recentThemes,
      averageTagsPerGeneration: parseFloat(averageTagsPerGeneration),
      lastGeneration: generations[0] || null
    };
  } catch (e) {
    console.error('分析偏好失败:', e);
    return {
      totalCount: 0,
      typeStats: { image: 0, music: 0, tts: 0 },
      topKeywords: [],
      styleStats: {},
      recentThemes: [],
      averageTagsPerGeneration: 0
    };
  }
}

/**
 * 获取智能推荐 Prompt
 * @param {string} type - 生成类型
 * @param {number} limit - 返回数量
 * @returns {Array} 推荐 Prompt 列表
 */
async function getRecommendations(type = null, limit = 5) {
  try {
    const preferences = await analyzePreferences();
    const recommendations = [];
    
    if (preferences.totalCount === 0) {
      // 无历史记录，返回默认推荐
      return getDefaultRecommendations(type);
    }
    
    // 基于高频关键词生成推荐
    const topKeywords = preferences.topKeywords.slice(0, 5).map(k => k.keyword);
    
    if (topKeywords.length > 0) {
      // 类型偏好
      const typePreference = getMostFrequentType(preferences.typeStats);
      const effectiveType = type || typePreference;
      
      // 根据类型生成不同风格的推荐
      const templates = getRecommendationTemplates(effectiveType);
      
      templates.forEach(template => {
        recommendations.push({
          prompt: template.prompt.replace('{keyword}', topKeywords[0] || '创意'),
          reason: template.reason,
          type: effectiveType,
          matchScore: calculateMatchScore(template, preferences)
        });
      });
    }
    
    // 按匹配度排序
    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    
    return recommendations.slice(0, limit);
  } catch (e) {
    console.error('获取推荐失败:', e);
    return getDefaultRecommendations(type);
  }
}

/**
 * 计算推荐 Prompt 与用户偏好的匹配分数
 */
function calculateMatchScore(template, preferences) {
  let score = 0;
  const templateKeywords = extractTags(template.prompt);
  
  // 标签匹配
  templateKeywords.forEach(tag => {
    const found = preferences.topKeywords.find(k => k.keyword === tag);
    if (found) {
      score += found.count * 10;
    }
  });
  
  // 类型匹配
  if (template.type === getMostFrequentType(preferences.typeStats)) {
    score += 20;
  }
  
  return score;
}

/**
 * 获取最频繁的生成类型
 */
function getMostFrequentType(typeStats) {
  let maxType = 'image';
  let maxCount = 0;
  
  Object.entries(typeStats).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  });
  
  return maxType;
}

/**
 * 获取推荐模板
 */
function getRecommendationTemplates(type) {
  const imageTemplates = [
    { prompt: '{keyword}风格的精美插画，细节丰富', type: 'image', reason: '基于你的风格偏好' },
    { prompt: '可爱{keyword}的特写摄影', type: 'image', reason: '热门主题' },
    { prompt: '{keyword}主题的壁纸设计', type: 'image', reason: '热门格式' },
    { prompt: '梦幻{keyword}场景插画', type: 'image', reason: '近期流行' },
    { prompt: '写实风格{keyword}绘画', type: 'image', reason: '常用风格' }
  ];
  
  const musicTemplates = [
    { prompt: '轻松愉快的{keyword}音乐', type: 'music', reason: '热门风格' },
    { prompt: '舒缓的钢琴{keyword}曲', type: 'music', reason: '常用乐器' },
    { prompt: '充满能量的{keyword}配乐', type: 'music', reason: '热门类型' },
    { prompt: '梦幻{keyword}氛围音乐', type: 'music', reason: '近期流行' }
  ];
  
  const ttsTemplates = [
    { prompt: '温柔的女声朗读关于{keyword}的文章', type: 'tts', reason: '常用音色' },
    { prompt: '富有感情的{keyword}故事讲述', type: 'tts', reason: '热门内容' },
    { prompt: '专业的{keyword}解说配音', type: 'tts', reason: '热门场景' }
  ];
  
  switch (type) {
    case 'music':
      return musicTemplates;
    case 'tts':
      return ttsTemplates;
    default:
      return imageTemplates;
  }
}

/**
 * 默认推荐（无历史时使用）
 */
function getDefaultRecommendations(type) {
  const defaults = {
    image: [
      { prompt: '梦幻星空下的古老城堡插画', reason: '热门推荐', type: 'image', matchScore: 50 },
      { prompt: '可爱猫咪的特写摄影', reason: '热门主题', type: 'image', matchScore: 40 },
      { prompt: '未来城市赛博朋克风格', reason: '热门风格', type: 'image', matchScore: 35 },
      { prompt: '宁静的日出海景', reason: '热门场景', type: 'image', matchScore: 30 },
      { prompt: '精美花卉水彩画', reason: '热门题材', type: 'image', matchScore: 25 }
    ],
    music: [
      { prompt: '轻松愉快的背景音乐', reason: '热门推荐', type: 'music', matchScore: 50 },
      { prompt: '舒缓的钢琴曲', reason: '热门风格', type: 'music', matchScore: 40 },
      { prompt: '充满能量的电子音乐', reason: '热门类型', type: 'music', matchScore: 35 }
    ],
    tts: [
      { prompt: '温柔的女声朗读', reason: '热门推荐', type: 'tts', matchScore: 50 },
      { prompt: '专业的新闻配音', reason: '热门场景', type: 'tts', matchScore: 40 },
      { prompt: '故事讲述配音', reason: '热门内容', type: 'tts', matchScore: 35 }
    ]
  };
  
  return defaults[type] || defaults.image;
}

/**
 * 获取高频关键词
 */
async function getTopKeywords(limit = 10) {
  const preferences = await analyzePreferences();
  return preferences.topKeywords.slice(0, limit);
}

/**
 * 获取风格分布统计
 */
async function getStyleStats() {
  const preferences = await analyzePreferences();
  return preferences.styleStats;
}

/**
 * 获取类型占比
 */
async function getTypeStats() {
  const preferences = await analyzePreferences();
  return preferences.typeStats;
}

/**
 * 获取创作统计摘要
 */
async function getStatsSummary() {
  const preferences = await analyzePreferences();
  
  return {
    totalGenerations: preferences.totalCount,
    imageCount: preferences.typeStats.image,
    musicCount: preferences.typeStats.music,
    ttsCount: preferences.typeStats.tts,
    topKeyword: preferences.topKeywords[0]?.keyword || '暂无',
    topKeywordCount: preferences.topKeywords[0]?.count || 0
  };
}

/**
 * 清除所有记忆数据
 */
async function clearAllMemory() {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('清除记忆失败:', e);
    return false;
  }
}

/**
 * 删除单条记录
 */
async function deleteGeneration(id) {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('删除记录失败:', e);
    return false;
  }
}

// ========== L0-L4 Layered Memory Integration ==========

// 初始化统一的记忆系统
let unifiedMemory = null;
let dreamManager = null;

function getUnifiedMemory() {
  if (!unifiedMemory) {
    unifiedMemory = new window.MemoryLayer.UnifiedMemorySystem({
      L0: { capacity: 500 },  // 规则引擎
      L1: { capacity: 2000 }, // 语义索引
      L2: { capacity: 500 },  // 全局上下文
      L3: { capacity: 300 },  // 技能结晶
      L4: { capacity: 200 }  // 会话记忆
    });
  }
  return unifiedMemory;
}

function getDreamManager() {
  if (!dreamManager) {
    dreamManager = new window.DreamConsolidation.DreamManager();
    // 创建默认巩固器
    dreamManager.createConsolidator('default', {
      minIdleTime: 3000,
      maxBatchSize: 20
    });
  }
  return dreamManager;
}

/**
 * 存储创作规则到 L0 层
 */
async function storeRule(key, rule, options = {}) {
  const memory = getUnifiedMemory();
  return memory.store('L0_META', key, rule, { ...options, priority: 100 });
}

/**
 * 获取创作规则
 */
async function getRule(key) {
  const memory = getUnifiedMemory();
  return memory.retrieve('L0_META', key);
}

/**
 * 存储创作索引到 L1 层
 */
async function storeIndex(key, value, options = {}) {
  const memory = getUnifiedMemory();
  return memory.store('L1_INDEX', key, value, options);
}

/**
 * 搜索创作索引
 */
async function searchIndex(pattern, options = {}) {
  const memory = getUnifiedMemory();
  return memory.queryAll(pattern, options);
}

/**
 * 存储全局上下文
 */
async function storeGlobalContext(key, value) {
  const memory = getUnifiedMemory();
  return memory.store('L2_GLOBAL', key, value, { priority: 80 });
}

/**
 * 获取全局上下文
 */
async function getGlobalContext(key) {
  const memory = getUnifiedMemory();
  return memory.retrieve('L2_GLOBAL', key);
}

/**
 * 结晶技能到 L3 层
 */
async function crystallizeSkill(skillId, skillData, options = {}) {
  const memory = getUnifiedMemory();
  return memory.store('L3_SKILL', skillId, skillData, { ...options, priority: 90 });
}

/**
 * 获取技能
 */
async function getSkill(skillId) {
  const memory = getUnifiedMemory();
  return memory.retrieve('L3_SKILL', skillId);
}

/**
 * 存储会话消息到 L4 层
 */
async function storeMessage(role, content, options = {}) {
  const memory = getUnifiedMemory();
  const timestamp = Date.now();
  return memory.store('L4_SESSION', `msg_${timestamp}`, { role, content, timestamp }, { priority: 30, tags: ['message', role] });
}

/**
 * 获取会话历史
 */
async function getSessionHistory(limit = 20) {
  const memory = getUnifiedMemory();
  const results = memory.queryAll('', { tags: ['message'], sorted: true });
  return results.slice(0, limit).map(r => r.value);
}

/**
 * 获取完整记忆上下文
 */
async function getMemoryContext(options = {}) {
  const memory = getUnifiedMemory();
  return memory.getContext(options);
}

/**
 * 获取记忆系统统计
 */
async function getMemoryStats() {
  const memory = getUnifiedMemory();
  return memory.getStats();
}

/**
 * 执行记忆巩固（触发两阶段巩固）
 */
async function consolidateMemory() {
  const manager = getDreamManager();
  return manager.consolidateAll();
}

/**
 * 捕获高优先级记忆到巩固队列
 */
async function captureMemory(entry) {
  const manager = getDreamManager();
  const consolidator = manager.getConsolidator('default');
  if (consolidator) {
    return consolidator.capture(entry);
  }
  return { captured: false, reason: 'no_consolidator' };
}

/**
 * 导出记忆快照
 */
async function exportMemorySnapshot() {
  const memory = getUnifiedMemory();
  return memory.export();
}

/**
 * 从快照恢复记忆
 */
async function restoreMemorySnapshot(snapshot) {
  const memory = getUnifiedMemory();
  memory.restore(snapshot);
  return true;
}

/**
 * 清空所有记忆层
 */
async function clearAllMemoryLayers() {
  const memory = getUnifiedMemory();
  memory.clearAll();
  return true;
}

// ========== Export Service ==========
window.MemoryService = {
  // 原有功能
  initDB,
  recordGeneration,
  getAllGenerations,
  getRecentGenerations,
  analyzePreferences,
  getRecommendations,
  getTopKeywords,
  getStyleStats,
  getTypeStats,
  getStatsSummary,
  clearAllMemory,
  deleteGeneration,
  
  // L0-L4 Layered Memory 新功能
  getUnifiedMemory,
  getDreamManager,
  storeRule,
  getRule,
  storeIndex,
  searchIndex,
  storeGlobalContext,
  getGlobalContext,
  crystallizeSkill,
  getSkill,
  storeMessage,
  getSessionHistory,
  getMemoryContext,
  getMemoryStats,
  consolidateMemory,
  captureMemory,
  exportMemorySnapshot,
  restoreMemorySnapshot,
  clearAllMemoryLayers
};
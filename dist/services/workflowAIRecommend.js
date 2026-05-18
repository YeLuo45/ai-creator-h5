/**
 * workflowAIRecommend.js - AI Smart Recommendation Service
 * Recommends workflow templates based on user goals
 */

/**
 * Extract keywords from creation goal
 * @param {string} goal - User's creation goal
 * @returns {string[]} Array of keywords
 */
function extractKeywords(goal) {
  if (!goal || typeof goal !== 'string') return [];
  
  const normalized = goal.toLowerCase().trim();
  
  // Category keywords mapping
  const categoryMap = {
    music: ['音乐', '歌曲', '配乐', '曲子', '旋律', '编曲', '作曲', 'music', 'song', 'melody'],
    drawing: ['插画', '画', '绘画', '绘图', '美术', '画作', 'illustration', 'draw', 'painting'],
    video: ['视频', '剪辑', '影片', 'movie', 'video', '剪辑'],
    text: ['文案', '文章', '写作', '文本', '文字', 'copy', 'writing', 'article'],
    voice: ['配音', '语音', '声音', '朗读', 'tts', 'voice', 'speech']
  };
  
  // Style keywords mapping
  const styleMap = {
    ancient: ['古风', '古典', '传统', '古代', '水墨', 'ancient', 'classical', 'traditional'],
    scifi: ['科幻', '未来', '赛博', '科技', '电子', 'scifi', 'sci-fi', 'futuristic', 'cyber'],
    realistic: ['写实', '真实', '逼真', 'realistic', 'real', 'photo'],
    abstract: ['抽象', '艺术', '创意', 'abstract', 'artistic', 'creative']
  };
  
  // Difficulty keywords
  const difficultyMap = {
    beginner: ['简单', '入门', '初级', '初学', 'easy', 'simple', 'beginner', 'basic'],
    intermediate: ['中等', '中级', '进阶', 'intermediate', 'medium', 'advanced'],
    expert: ['复杂', '高级', '专业', 'expert', 'complex', 'professional', 'hard']
  };
  
  const keywords = [];
  
  // Extract categories
  for (const [category, terms] of Object.entries(categoryMap)) {
    if (terms.some(term => normalized.includes(term))) {
      keywords.push(category);
    }
  }
  
  // Extract styles
  for (const [style, terms] of Object.entries(styleMap)) {
    if (terms.some(term => normalized.includes(term))) {
      keywords.push(style);
    }
  }
  
  // Extract difficulty
  for (const [difficulty, terms] of Object.entries(difficultyMap)) {
    if (terms.some(term => normalized.includes(term))) {
      keywords.push(difficulty);
    }
  }
  
  // Extract key phrases
  const phrases = normalized.split(/[,，、\s]+/).filter(p => p.length > 1);
  keywords.push(...phrases);
  
  return [...new Set(keywords)];
}

/**
 * Calculate keyword match score
 * @param {string[]} keywords - Extracted keywords
 * @param {Object} template - Template object
 * @returns {number} Score 0-1
 */
function keywordsMatchScore(keywords, template) {
  if (!keywords.length || !template) return 0;
  
  let matchCount = 0;
  const templateText = [
    template.name || '',
    template.category || '',
    template.style || '',
    template.description || '',
    template.author || ''
  ].join(' ').toLowerCase();
  
  for (const keyword of keywords) {
    if (templateText.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }
  
  // Check if any keyword matches category
  const categoryMatch = keywords.some(k => 
    ['music', 'drawing', 'video', 'text', 'voice'].includes(k) && k === template.category
  );
  
  const styleMatch = keywords.some(k => 
    ['ancient', 'scifi', 'realistic', 'abstract'].includes(k) && k === template.style
  );
  
  // Category match is more important
  let score = matchCount / keywords.length;
  if (categoryMatch) score += 0.3;
  if (styleMatch) score += 0.2;
  
  return Math.min(1, score);
}

/**
 * Calculate popularity score based on use count
 * @param {Object} template - Template object
 * @returns {number} Score 0-1
 */
function popularityScore(template) {
  if (!template || template.useCount === undefined) return 0.5;
  
  // Normalize use count to 0-1 range
  // Assuming max use count is around 1000 for popular templates
  const maxUseCount = 1000;
  return Math.min(1, (template.useCount || 0) / maxUseCount);
}

/**
 * Calculate rating score based on user ratings
 * @param {Object} template - Template object
 * @returns {number} Score 0-1
 */
function ratingScore(template) {
  if (!template || template.rating === undefined) return 0.5;
  
  // Normalize rating (1-5) to 0-1 range
  return ((template.rating || 3) - 1) / 4;
}

/**
 * Recommend top templates based on goal
 * @param {string} goal - User's creation goal
 * @param {Object[]} templates - Array of templates
 * @param {number} topN - Number of recommendations (default 3)
 * @returns {Object[]} Top N recommended templates with scores
 */
function recommend(goal, templates, topN = 3) {
  if (!goal || !Array.isArray(templates) || templates.length === 0) {
    return [];
  }
  
  const keywords = extractKeywords(goal);
  
  const scoredTemplates = templates.map(template => {
    const keywordScore = keywordsMatchScore(keywords, template);
    const popScore = popularityScore(template);
    const ratingS = ratingScore(template);
    
    // Weighted total score
    // Keywords: 70%, Popularity: 20%, Rating: 10%
    const totalScore = (keywordScore * 0.7) + (popScore * 0.2) + (ratingS * 0.1);
    
    return {
      template,
      score: totalScore,
      breakdown: {
        keyword: keywordScore,
        popularity: popScore,
        rating: ratingS
      },
      matchedKeywords: keywords.filter(k => 
        [template.name, template.category, template.style, template.description]
          .join(' ').toLowerCase().includes(k.toLowerCase())
      )
    };
  });
  
  // Sort by score descending
  scoredTemplates.sort((a, b) => b.score - a.score);
  
  return scoredTemplates.slice(0, topN);
}

/**
 * Get recommendation explanation
 * @param {Object} recommendation - Recommendation result
 * @returns {string} Human readable explanation
 */
function getRecommendationReason(recommendation) {
  const { template, score, matchedKeywords } = recommendation;
  
  const reasons = [];
  
  if (matchedKeywords.length > 0) {
    reasons.push(`关键词匹配: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }
  
  if (template.useCount > 100) {
    reasons.push(`热门模板 (${template.useCount}次使用)`);
  }
  
  if (template.rating >= 4.5) {
    reasons.push(`高评分 (${template.rating}★)`);
  }
  
  reasons.push(`适合${template.difficulty === 'beginner' ? '初学者' : template.difficulty === 'intermediate' ? '进阶用户' : '专业用户'}`);
  
  return reasons.join(' | ');
}

// Export for use in other modules
window.WorkflowAIRecommend = {
  extractKeywords,
  keywordsMatchScore,
  popularityScore,
  ratingScore,
  recommend,
  getRecommendationReason
};
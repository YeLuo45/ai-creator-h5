'use strict';

/**
 * UserEvolutionSystem - 用户自进化系统
 * 基于 GenericAgent 自进化机制
 * 
 * 功能：
 * - 用户习惯学习
 * - 提示词模板库
 * - 风格画像
 * - 技能/模板自动结晶
 */

// 用户状态常量
const USER_EVOLUTION_STATE = {
  LEARNING: 'learning',
  EVOLVING: 'evolving',
  CRYSTALLIZING: 'crystallizing',
  IDLE: 'idle'
};

/**
 * UserProfile - 用户画像
 */
class UserProfile {
  constructor(userId) {
    this.userId = userId;
    this.preferences = {
      themes: {},        // 主题偏好
      styles: {},        // 风格偏好
      genres: {},        // 类型偏好
      length: 'medium'   // 内容长度
    };
    this.usageStats = {
      totalGenerations: 0,
      successfulGenerations: 0,
      averageRating: 0,
      lastActive: null
    };
    this.learningData = {
      successfulPrompts: [],
      rejectedPrompts: [],
      commonPatterns: []
    };
    this.evolvedAt = null;
  }

  recordGeneration(prompt, success, rating = 5) {
    this.usageStats.totalGenerations++;
    if (success) {
      this.usageStats.successfulGenerations++;
      this.learningData.successfulPrompts.push({
        prompt,
        rating,
        timestamp: Date.now()
      });
    } else {
      this.learningData.rejectedPrompts.push({
        prompt,
        timestamp: Date.now()
      });
    }
    this.usageStats.lastActive = new Date().toISOString();
    this._updateAverageRating(rating);
    this._analyzePatterns(prompt);
  }

  _updateAverageRating(rating) {
    const current = this.usageStats.averageRating;
    const total = this.usageStats.successfulGenerations;
    this.usageStats.averageRating = (current * (total - 1) + rating) / total;
  }

  _analyzePatterns(prompt) {
    // 主题检测
    const themes = ['科幻', '爱情', '友情', '悬疑', '恐怖', '成长', '奇幻', '都市', '校园', '穿越'];
    themes.forEach(t => {
      if (prompt.includes(t)) {
        this.preferences.themes[t] = (this.preferences.themes[t] || 0) + 1;
      }
    });
    // 风格检测
    const styles = ['温暖', '虐心', '搞笑', '治愈', '暗黑', '浪漫', '现实', '诗意'];
    styles.forEach(s => {
      if (prompt.includes(s)) {
        this.preferences.styles[s] = (this.preferences.styles[s] || 0) + 1;
      }
    });
    // 简单关键词提取
    const keywords = prompt.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    keywords.forEach(kw => {
      if (!this.learningData.commonPatterns.includes(kw)) {
        this.learningData.commonPatterns.push(kw);
      }
    });
    // 保持最多50个模式
    if (this.learningData.commonPatterns.length > 50) {
      this.learningData.commonPatterns = this.learningData.commonPatterns.slice(-50);
    }
  }

  getTopThemes(limit = 5) {
    return Object.entries(this.preferences.themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([theme]) => theme);
  }

  getTopStyles(limit = 3) {
    return Object.entries(this.preferences.styles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([style]) => style);
  }

  toJSON() {
    return {
      userId: this.userId,
      preferences: this.preferences,
      usageStats: this.usageStats,
      learningData: this.learningData,
      evolvedAt: this.evolvedAt
    };
  }

  static fromJSON(data) {
    const profile = new UserProfile(data.userId);
    profile.preferences = data.preferences;
    profile.usageStats = data.usageStats;
    profile.learningData = data.learningData;
    profile.evolvedAt = data.evolvedAt;
    return profile;
  }
}

/**
 * TemplateLibrary - 模板库
 */
class TemplateLibrary {
  constructor() {
    this.templates = new Map(); // id -> template
    this.tags = new Map();      // tag -> template ids
    this.usageCount = new Map(); // template id -> usage count
  }

  addTemplate(template) {
    const id = template.id || 'tpl_' + Date.now();
    this.templates.set(id, {
      ...template,
      id,
      createdAt: template.createdAt || new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    });
    
    // 更新标签索引
    if (template.tags) {
      template.tags.forEach(tag => {
        if (!this.tags.has(tag)) this.tags.set(tag, []);
        this.tags.get(tag).push(id);
      });
    }
    
    return id;
  }

  getTemplate(id) {
    return this.templates.get(id);
  }

  useTemplate(id) {
    const template = this.templates.get(id);
    if (template) {
      template.lastUsed = new Date().toISOString();
      template.usageCount++;
      this.usageCount.set(id, (this.usageCount.get(id) || 0) + 1);
    }
    return template;
  }

  findByTag(tag) {
    const ids = this.tags.get(tag) || [];
    return ids.map(id => this.templates.get(id)).filter(Boolean);
  }

  findByText(text) {
    const results = [];
    this.templates.forEach(tpl => {
      if (tpl.title.includes(text) || tpl.prompt.includes(text)) {
        results.push(tpl);
      }
    });
    return results;
  }

  getMostUsed(limit = 10) {
    return Array.from(this.templates.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  exportTemplates() {
    return Array.from(this.templates.values());
  }

  importTemplates(templates) {
    templates.forEach(tpl => this.addTemplate(tpl));
  }
}

/**
 * SkillCrystallizer - 技能结晶器
 * 将成功的执行路径 crystallize 为可复用 Skill
 */
class SkillCrystallizer {
  constructor() {
    this.skills = new Map();
    this.skillPatterns = new Map(); // pattern -> skill id
  }

  /**
   * 结晶技能
   * @param {string} name - 技能名称
   * @param {string} description - 技能描述
   * @param {Array} successfulPaths - 成功的执行路径
   * @returns {string} skill id
   */
  crystallize(name, description, successfulPaths) {
    const id = 'skill_' + Date.now();
    
    // 从成功路径中提取模式
    const pattern = this._extractPattern(successfulPaths);
    
    const skill = {
      id,
      name,
      description,
      pattern,
      steps: successfulPaths,
      crystallizedAt: new Date().toISOString(),
      usageCount: 0,
      successRate: 1.0
    };
    
    this.skills.set(id, skill);
    this.skillPatterns.set(pattern, id);
    
    return id;
  }

  _extractPattern(paths) {
    // 提取共同模式
    if (!paths || paths.length === 0) return '';
    const first = paths[0];
    // 简化：使用第一个路径作为模式
    return first.substring(0, Math.min(50, first.length));
  }

  getSkill(id) {
    return this.skills.get(id);
  }

  findByPattern(pattern) {
    const id = this.skillPatterns.get(pattern);
    return id ? this.skills.get(id) : null;
  }

  useSkill(id) {
    const skill = this.skills.get(id);
    if (skill) {
      skill.usageCount++;
    }
    return skill;
  }

  getAllSkills() {
    return Array.from(this.skills.values());
  }

  getSkillsByCategory(category) {
    return Array.from(this.skills.values())
      .filter(s => s.category === category);
  }
}

/**
 * UserEvolutionSystem - 用户自进化系统主类
 */
class UserEvolutionSystem {
  constructor(options = {}) {
    this.userId = options.userId || 'default';
    this.profile = new UserProfile(this.userId);
    this.templateLibrary = new TemplateLibrary();
    this.skillCrystallizer = new SkillCrystallizer();
    this.state = USER_EVOLUTION_STATE.IDLE;
    this.options = {
      autoCrystallize: options.autoCrystallize !== false,
      minSuccessForTemplate: options.minSuccessForTemplate || 3,
      ...options
    };
  }

  /**
   * 记录生成结果
   */
  recordGeneration(prompt, success, rating = 5) {
    this.profile.recordGeneration(prompt, success, rating);
    
    if (success && rating >= 4) {
      // 检查是否需要结晶为模板
      if (this.options.autoCrystallize) {
        this._checkAndCrystallize(prompt);
      }
    }
  }

  _checkAndCrystallize(prompt) {
    const recent = this.profile.learningData.successfulPrompts.slice(-this.options.minSuccessForTemplate);
    if (recent.length >= this.options.minSuccessForTemplate) {
      // 检查是否已经存在类似模板
      const existing = this.templateLibrary.findByText(prompt.substring(0, 30));
      if (existing.length === 0) {
        // 结晶为模板
        this.templateLibrary.addTemplate({
          title: prompt.substring(0, 20) + '...',
          prompt,
          tags: this._extractTags(prompt)
        });
        this.state = USER_EVOLUTION_STATE.CRYSTALLIZING;
        setTimeout(() => { this.state = USER_EVOLUTION_STATE.IDLE; }, 1000);
      }
    }
  }

  _extractTags(prompt) {
    const tags = [];
    const themes = ['科幻', '爱情', '友情', '悬疑', '恐怖', '成长'];
    themes.forEach(t => { if (prompt.includes(t)) tags.push(t); });
    return tags;
  }

  /**
   * 获取推荐模板
   */
  getRecommendedTemplates(limit = 5) {
    const topThemes = this.profile.getTopThemes(3);
    const recommendations = [];
    
    topThemes.forEach(theme => {
      const byTag = this.templateLibrary.findByTag(theme);
      recommendations.push(...byTag);
    });
    
    // 如果推荐不够，返回最常用的
    if (recommendations.length < limit) {
      const mostUsed = this.templateLibrary.getMostUsed(limit);
      mostUsed.forEach(t => {
        if (!recommendations.find(r => r.id === t.id)) {
          recommendations.push(t);
        }
      });
    }
    
    return recommendations.slice(0, limit);
  }

  /**
   * 获取用户画像摘要
   */
  getProfileSummary() {
    return {
      userId: this.userId,
      totalGenerations: this.profile.usageStats.totalGenerations,
      successRate: this.profile.usageStats.totalGenerations > 0 
        ? (this.profile.usageStats.successfulGenerations / this.profile.usageStats.totalGenerations * 100).toFixed(1) + '%'
        : '0%',
      topThemes: this.profile.getTopThemes(3),
      topStyles: this.profile.getTopStyles(2),
      templateCount: this.templateLibrary.templates.size,
      skillCount: this.skillCrystallizer.skills.size
    };
  }

  /**
   * 导出用户数据
   */
  exportUserData() {
    return {
      profile: this.profile.toJSON(),
      templates: this.templateLibrary.exportTemplates(),
      skills: this.skillCrystallizer.getAllSkills()
    };
  }

  /**
   * 导入用户数据
   */
  importUserData(data) {
    if (data.profile) {
      this.profile = UserProfile.fromJSON(data.profile);
      // 保持本地 userId 不被导入数据覆盖
      this.profile.userId = this.userId;
    }
    if (data.templates) {
      this.templateLibrary.importTemplates(data.templates);
    }
  }

  getState() {
    return {
      state: this.state,
      profileComplete: this.profile.usageStats.totalGenerations > 0
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    UserEvolutionSystem, 
    UserProfile, 
    TemplateLibrary, 
    SkillCrystallizer,
    USER_EVOLUTION_STATE 
  };
}

if (typeof global !== 'undefined') {
  global.UserEvolutionSystem = UserEvolutionSystem;
  global.UserProfile = UserProfile;
  global.TemplateLibrary = TemplateLibrary;
  global.SkillCrystallizer = SkillCrystallizer;
  global.USER_EVOLUTION_STATE = USER_EVOLUTION_STATE;
}
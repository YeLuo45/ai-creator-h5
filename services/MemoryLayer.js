/**
 * MemoryLayer.js - L0-L4 分层记忆系统
 * 基于 generic-agent L0-L4 Memory Architecture + nanobot Dream Memory
 * 
 * L0 (Meta)     : 规则引擎 - 创作规范/禁忌词/风格约束
 * L1 (Index)    : 语义索引 - 创作历史 + 标签检索
 * L2 (Global)   : 全局上下文 - 当前项目/角色/插件状态
 * L3 (Skill)    : 技能结晶 - 已固化的创作模式
 * L4 (Session)  : 会话级记忆 - 本次对话上下文
 */

(function() {
  'use strict';

  // ========== Constants ==========
  const LAYER_L0 = 'L0_META';
  const LAYER_L1 = 'L1_INDEX';
  const LAYER_L2 = 'L2_GLOBAL';
  const LAYER_L3 = 'L3_SKILL';
  const LAYER_L4 = 'L4_SESSION';

  const LAYER_PRIORITY = {
    L0_META: 0,
    L1_INDEX: 1,
    L2_GLOBAL: 2,
    L3_SKILL: 3,
    L4_SESSION: 4
  };

  // ========== MemoryLayer Class ==========
  class MemoryLayer {
    constructor(options = {}) {
      this.id = options.id || this._generateId();
      this.name = options.name || 'DefaultMemoryLayer';
      this.layerType = options.layerType || LAYER_L0;
      this.capacity = options.capacity || 1000;
      this.entries = [];
      this.metadata = {
        createdAt: Date.now(),
        lastAccess: Date.now(),
        accessCount: 0,
        consolidationCount: 0
      };
    }

    _generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    // 添加记忆条目
    add(key, value, options = {}) {
      const entry = {
        key,
        value,
        timestamp: Date.now(),
        layer: this.layerType,
        tags: options.tags || [],
        priority: options.priority || 0,
        metadata: options.metadata || {}
      };

      // 检查容量限制
      if (this.entries.length >= this.capacity) {
        this._evictLRU();
      }

      this.entries.push(entry);
      this._updateAccess();
      return entry;
    }

    // 获取记忆条目
    get(key) {
      const entry = this.entries.find(e => e.key === key);
      if (entry) {
        this._updateAccess();
      }
      return entry ? entry.value : null;
    }

    // 查询记忆条目（模糊匹配）
    query(pattern, options = {}) {
      const results = this.entries.filter(e => {
        const keyMatch = typeof pattern === 'string' 
          ? e.key.toLowerCase().includes(pattern.toLowerCase())
          : pattern.test(e.key);
        
        const tagMatch = options.tags 
          ? options.tags.some(tag => e.tags.includes(tag))
          : true;

        return keyMatch && tagMatch;
      });

      if (options.sorted) {
        results.sort((a, b) => b.priority - a.priority || b.timestamp - a.timestamp);
      }

      return results;
    }

    // 移除记忆条目
    remove(key) {
      const index = this.entries.findIndex(e => e.key === key);
      if (index !== -1) {
        this.entries.splice(index, 1);
        return true;
      }
      return false;
    }

    // 清空该层记忆
    clear() {
      this.entries = [];
    }

    // 获取所有条目
    getAll(options = {}) {
      let results = [...this.entries];
      
      if (options.sorted) {
        results.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      if (options.limit) {
        results = results.slice(0, options.limit);
      }

      return results;
    }

    // 获取条目数量
    size() {
      return this.entries.length;
    }

    // 检查是否为空
    isEmpty() {
      return this.entries.length === 0;
    }

    // 检查是否已满
    isFull() {
      return this.entries.length >= this.capacity;
    }

    // LRU 淘汰
    _evictLRU() {
      if (this.entries.length === 0) return null;
      
      // 找到最久未访问的条目
      let oldestIndex = 0;
      let oldestAccess = this.entries[0].timestamp;

      for (let i = 1; i < this.entries.length; i++) {
        if (this.entries[i].timestamp < oldestAccess) {
          oldestAccess = this.entries[i].timestamp;
          oldestIndex = i;
        }
      }

      const evicted = this.entries.splice(oldestIndex, 1)[0];
      return evicted;
    }

    // 更新访问时间
    _updateAccess() {
      this.metadata.lastAccess = Date.now();
      this.metadata.accessCount++;
    }

    // 获取统计信息
    getStats() {
      return {
        id: this.id,
        name: this.name,
        layerType: this.layerType,
        capacity: this.capacity,
        size: this.entries.length,
        usagePercent: ((this.entries.length / this.capacity) * 100).toFixed(1) + '%',
        lastAccess: this.metadata.lastAccess,
        accessCount: this.metadata.accessCount,
        consolidationCount: this.metadata.consolidationCount
      };
    }
  }

  // ========== L0_META Layer (规则引擎) ==========
  class L0MetaLayer extends MemoryLayer {
    constructor(options = {}) {
      super({ ...options, layerType: LAYER_L0 });
      this.name = 'L0_META';
      // 规则优先级最高
      this.capacity = options.capacity || 500;
    }

    // 添加规则
    addRule(key, rule, options = {}) {
      return this.add(key, rule, { 
        ...options, 
        priority: 100, // 规则高优先级
        tags: ['rule', ...(options.tags || [])]
      });
    }

    // 获取规则
    getRule(key) {
      return this.get(key);
    }

    // 获取所有规则
    getAllRules() {
      return this.getAll({ sorted: true });
    }

    // 检查规则是否存在
    hasRule(key) {
      return this.get(key) !== null;
    }

    // 验证输入是否符合规则
    validate(input, context = {}) {
      const rules = this.getAll({ sorted: true });
      const violations = [];

      for (const rule of rules) {
        if (rule.tags.includes('rule') && typeof rule.value === 'function') {
          const result = rule.value(input, context);
          if (!result.valid) {
            violations.push({
              ruleKey: rule.key,
              message: result.message || 'Rule validation failed'
            });
          }
        }
      }

      return {
        valid: violations.length === 0,
        violations
      };
    }
  }

  // ========== L1_INDEX Layer (语义索引) ==========
  class L1IndexLayer extends MemoryLayer {
    constructor(options = {}) {
      super({ ...options, layerType: LAYER_L1 });
      this.name = 'L1_INDEX';
      // 索引层容量较大
      this.capacity = options.capacity || 2000;
    }

    // 添加索引条目
    addIndex(key, value, options = {}) {
      return this.add(key, value, {
        ...options,
        priority: 50,
        tags: options.tags || []
      });
    }

    // 语义搜索
    semanticSearch(query, options = {}) {
      return this.query(query, { ...options, sorted: true });
    }

    // 按标签搜索
    searchByTag(tag) {
      return this.entries.filter(e => e.tags.includes(tag));
    }

    // 构建倒排索引
    buildInvertedIndex() {
      const index = {};
      
      this.entries.forEach(entry => {
        entry.tags.forEach(tag => {
          if (!index[tag]) {
            index[tag] = [];
          }
          index[tag].push({
            key: entry.key,
            value: entry.value,
            timestamp: entry.timestamp
          });
        });
      });

      return index;
    }

    // 获取高频标签
    getTopTags(limit = 10) {
      const tagCount = {};
      
      this.entries.forEach(entry => {
        entry.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });

      return Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
    }
  }

  // ========== L2_GLOBAL Layer (全局上下文) ==========
  class L2GlobalLayer extends MemoryLayer {
    constructor(options = {}) {
      super({ ...options, layerType: LAYER_L2 });
      this.name = 'L2_GLOBAL';
      this.capacity = options.capacity || 500;
      this.projectContext = null;
      this.roleContext = null;
      this.pluginStates = {};
    }

    // 设置项目上下文
    setProjectContext(project) {
      this.projectContext = project;
      this.add('project', project, { priority: 100, tags: ['project', 'context'] });
    }

    // 获取项目上下文
    getProjectContext() {
      return this.projectContext || this.get('project');
    }

    // 设置角色上下文
    setRoleContext(role) {
      this.roleContext = role;
      this.add('role', role, { priority: 100, tags: ['role', 'context'] });
    }

    // 获取角色上下文
    getRoleContext() {
      return this.roleContext || this.get('role');
    }

    // 更新插件状态
    updatePluginState(pluginId, state) {
      this.pluginStates[pluginId] = state;
      this.add(`plugin_${pluginId}`, state, { priority: 80, tags: ['plugin', pluginId] });
    }

    // 获取插件状态
    getPluginState(pluginId) {
      return this.pluginStates[pluginId] || this.get(`plugin_${pluginId}`);
    }

    // 获取全局状态快照
    getGlobalSnapshot() {
      return {
        project: this.getProjectContext(),
        role: this.getRoleContext(),
        plugins: { ...this.pluginStates },
        timestamp: Date.now()
      };
    }

    // 恢复全局状态
    restoreFromSnapshot(snapshot) {
      if (snapshot.project) this.setProjectContext(snapshot.project);
      if (snapshot.role) this.setRoleContext(snapshot.role);
      if (snapshot.plugins) {
        Object.entries(snapshot.plugins).forEach(([id, state]) => {
          this.updatePluginState(id, state);
        });
      }
    }
  }

  // ========== L3_SKILL Layer (技能结晶) ==========
  class L3SkillLayer extends MemoryLayer {
    constructor(options = {}) {
      super({ ...options, layerType: LAYER_L3 });
      this.name = 'L3_SKILL';
      this.capacity = options.capacity || 300;
      this.skillGraph = {};
    }

    // 结晶技能
    crystallizeSkill(skillId, skillData, options = {}) {
      const entry = this.add(skillId, skillData, {
        ...options,
        priority: 90,
        tags: ['skill', skillData.category || 'general', ...(options.tags || [])]
      });

      // 更新技能图谱
      this._updateSkillGraph(skillId, skillData);
      
      return entry;
    }

    // 更新技能图谱
    _updateSkillGraph(skillId, skillData) {
      if (!this.skillGraph[skillData.category]) {
        this.skillGraph[skillData.category] = [];
      }
      
      if (!this.skillGraph[skillData.category].includes(skillId)) {
        this.skillGraph[skillData.category].push(skillId);
      }
    }

    // 获取技能
    getSkill(skillId) {
      return this.get(skillId);
    }

    // 获取技能列表
    getSkillsByCategory(category) {
      return this.entries.filter(e => 
        e.tags.includes('skill') && e.tags.includes(category)
      );
    }

    // 获取所有技能分类
    getCategories() {
      return Object.keys(this.skillGraph);
    }

    // 查找相似技能
    findSimilarSkills(skillId, options = {}) {
      const skill = this.get(skillId);
      if (!skill) return [];

      return this.entries.filter(e => {
        if (e.key === skillId) return false;
        if (!e.tags.includes('skill')) return false;
        
        // 基于标签相似度
        const similarity = this._calculateSimilarity(skill, e.value);
        return similarity >= (options.threshold || 0.5);
      }).map(e => ({
        ...e,
        similarity: this._calculateSimilarity(skill, e.value)
      })).sort((a, b) => b.similarity - a.similarity);
    }

    // 计算相似度
    _calculateSimilarity(skill1, skill2) {
      if (!skill1 || !skill2) return 0;
      
      const tags1 = skill1.tags || [];
      const tags2 = skill2.tags || [];
      
      const intersection = tags1.filter(t => tags2.includes(t)).length;
      const union = new Set([...tags1, ...tags2]).size;
      
      return union > 0 ? intersection / union : 0;
    }

    // 获取技能图谱
    getSkillGraph() {
      return { ...this.skillGraph };
    }

    // 解锁技能（使技能可用）
    unlockSkill(skillId) {
      const skill = this.get(skillId);
      if (skill) {
        if (!skill.metadata) skill.metadata = {};
        skill.metadata.locked = false;
        skill.metadata.unlockedAt = Date.now();
        return true;
      }
      return false;
    }

    // 锁定技能
    lockSkill(skillId) {
      const skill = this.get(skillId);
      if (skill) {
        if (!skill.metadata) skill.metadata = {};
        skill.metadata.locked = true;
        return true;
      }
      return false;
    }
  }

  // ========== L4_SESSION Layer (会话级记忆) ==========
  class L4SessionLayer extends MemoryLayer {
    constructor(options = {}) {
      super({ ...options, layerType: LAYER_L4 });
      this.name = 'L4_SESSION';
      this.capacity = options.capacity || 200;
      this.sessionId = options.sessionId || this._generateId();
      this.createdAt = Date.now();
    }

    // 添加会话消息
    addMessage(role, content, options = {}) {
      return this.add(`msg_${Date.now()}`, {
        role,
        content,
        timestamp: Date.now(),
        ...options
      }, {
        priority: 30,
        tags: ['message', role, ...(options.tags || [])]
      });
    }

    // 获取会话历史
    getHistory(options = {}) {
      const messages = this.getAll({ sorted: true });
      return messages.map(m => m.value);
    }

    // 获取最近 N 条消息
    getRecentMessages(count = 10) {
      return this.getAll({ sorted: true, limit: count }).map(m => m.value);
    }

    // 搜索会话内容
    searchSession(query) {
      // 搜索消息内容，而不仅仅是键
      return this.entries.filter(e => {
        if (!e.tags.includes('message')) return false;
        const content = e.value && e.value.content ? e.value.content : '';
        return typeof query === 'string' 
          ? content.toLowerCase().includes(query.toLowerCase())
          : query.test(content);
      });
    }

    // 获取会话摘要
    getSummary() {
      const messages = this.getAll();
      const roles = {};
      
      messages.forEach(m => {
        const role = m.value.role;
        roles[role] = (roles[role] || 0) + 1;
      });

      return {
        sessionId: this.sessionId,
        messageCount: messages.length,
        roles,
        createdAt: this.createdAt,
        lastMessage: messages[messages.length - 1]?.value || null
      };
    }

    // 清空会话（但保留关键记忆）
    clearSession(preserveKeys = []) {
      // 保留指定键的条目（保留完整entry对象，不只是value）
      const toPreserve = this.entries.filter(e => preserveKeys.includes(e.key));
      
      this.clear();
      
      // 恢复保留的条目（还原完整entry，包含metadata）
      toPreserve.forEach(entry => {
        this.entries.push({ ...entry, timestamp: Date.now() });
      });
    }
  }

  // ========== MemoryLayerFactory ==========
  const MemoryLayerFactory = {
    createL0(options = {}) {
      return new L0MetaLayer(options);
    },
    
    createL1(options = {}) {
      return new L1IndexLayer(options);
    },
    
    createL2(options = {}) {
      return new L2GlobalLayer(options);
    },
    
    createL3(options = {}) {
      return new L3SkillLayer(options);
    },
    
    createL4(options = {}) {
      return new L4SessionLayer(options);
    },
    
    createAll(options = {}) {
      return {
        L0: this.createL0(options.L0),
        L1: this.createL1(options.L1),
        L2: this.createL2(options.L2),
        L3: this.createL3(options.L3),
        L4: this.createL4(options.L4)
      };
    },

    getLayerType(layerType) {
      switch (layerType) {
        case LAYER_L0: return 'L0MetaLayer';
        case LAYER_L1: return 'L1IndexLayer';
        case LAYER_L2: return 'L2GlobalLayer';
        case LAYER_L3: return 'L3SkillLayer';
        case LAYER_L4: return 'L4SessionLayer';
        default: return 'MemoryLayer';
      }
    }
  };

  // ========== UnifiedMemorySystem ==========
  class UnifiedMemorySystem {
    constructor(options = {}) {
      this.layers = MemoryLayerFactory.createAll(options);
      this.layerKeyMap = {
        'L0_META': 'L0',
        'L1_INDEX': 'L1',
        'L2_GLOBAL': 'L2',
        'L3_SKILL': 'L3',
        'L4_SESSION': 'L4'
      };
      this.config = {
        consolidationEnabled: options.consolidationEnabled !== false,
        autoEvict: options.autoEvict !== false,
        ...options
      };
    }

    _getLayer(layerType) {
      const key = this.layerKeyMap[layerType] || layerType;
      const layer = this.layers[key];
      if (!layer) {
        throw new Error(`Invalid layer type: ${layerType}`);
      }
      return layer;
    }

    // 存储到指定层
    store(layerType, key, value, options = {}) {
      return this._getLayer(layerType).add(key, value, options);
    }

    // 从指定层读取
    retrieve(layerType, key) {
      return this._getLayer(layerType).get(key);
    }

    // 查询所有层
    queryAll(pattern, options = {}) {
      const results = [];
      
      Object.entries(this.layers).forEach(([layerKey, layer]) => {
        const layerResults = layer.query(pattern, options);
        results.push(...layerResults.map(r => ({
          ...r,
          layer: layerKey // Use actual layer key for priority lookup
        })));
      });

      // 按优先级和时间排序
      results.sort((a, b) => {
        const priorityA = LAYER_PRIORITY[a.layer] || 5;
        const priorityB = LAYER_PRIORITY[b.layer] || 5;
        return priorityA - priorityB || b.timestamp - a.timestamp;
      });

      return results;
    }

    // 获取完整记忆上下文
    getContext(options = {}) {
      const context = {};
      
      // L0 规则
      context.rules = this.layers.L0.getAllRules();
      
      // L1 索引
      if (options.includeIndex !== false) {
        context.index = this.layers.L1.getAll({ limit: options.indexLimit || 100 });
        context.topTags = this.layers.L1.getTopTags(20);
      }
      
      // L2 全局
      if (options.includeGlobal !== false) {
        context.global = this.layers.L2.getGlobalSnapshot();
      }
      
      // L3 技能
      if (options.includeSkills !== false) {
        context.skills = {
          all: this.layers.L3.getAll({ sorted: true }),
          categories: this.layers.L3.getCategories(),
          graph: this.layers.L3.getSkillGraph()
        };
      }
      
      // L4 会话
      if (options.includeSession !== false) {
        context.session = this.layers.L4.getSummary();
        context.recentMessages = this.layers.L4.getRecentMessages(20);
      }

      return context;
    }

    // 获取所有层统计
    getStats() {
      return {
        L0: this.layers.L0.getStats(),
        L1: this.layers.L1.getStats(),
        L2: this.layers.L2.getStats(),
        L3: this.layers.L3.getStats(),
        L4: this.layers.L4.getStats(),
        totalEntries: Object.values(this.layers).reduce((sum, l) => sum + l.size(), 0)
      };
    }

    // 清空所有层
    clearAll() {
      Object.values(this.layers).forEach(layer => layer.clear());
    }

    // 从快照恢复
    restore(snapshot) {
      if (snapshot.L0) this.layers.L0.clear();
      if (snapshot.L1) this.layers.L1.clear();
      if (snapshot.L2) this.layers.L2.clear();
      if (snapshot.L3) this.layers.L3.clear();
      if (snapshot.L4) this.layers.L4.clear();
      
      // 恢复各层数据
      if (snapshot.data) {
        if (snapshot.data.L0) {
          snapshot.data.L0.forEach(e => this.layers.L0.add(e.key, e.value, e));
        }
        if (snapshot.data.L1) {
          snapshot.data.L1.forEach(e => this.layers.L1.add(e.key, e.value, e));
        }
        if (snapshot.data.L2) {
          this.layers.L2.restoreFromSnapshot(snapshot.data.L2);
        }
        if (snapshot.data.L3) {
          snapshot.data.L3.forEach(e => this.layers.L3.crystallizeSkill(e.key, e.value, e));
        }
        if (snapshot.data.L4) {
          snapshot.data.L4.forEach(e => this.layers.L4.add(e.key, e.value, e));
        }
      }
    }

    // 导出快照
    export() {
      return {
        timestamp: Date.now(),
        config: this.config,
        data: {
          L0: this.layers.L0.getAll(),
          L1: this.layers.L1.getAll(),
          L2: this.layers.L2.getGlobalSnapshot(),
          L3: this.layers.L3.getAll(),
          L4: this.layers.L4.getAll()
        }
      };
    }
  }

  // ========== Export ==========
  window.MemoryLayer = {
    // Classes
    MemoryLayer,
    L0MetaLayer,
    L1IndexLayer,
    L2GlobalLayer,
    L3SkillLayer,
    L4SessionLayer,
    UnifiedMemorySystem,
    MemoryLayerFactory,
    
    // Constants
    LAYER_L0,
    LAYER_L1,
    LAYER_L2,
    LAYER_L3,
    LAYER_L4,
    LAYER_PRIORITY
  };

  // 别名导出
  window.MemoryLayerSystem = window.MemoryLayer;

})();
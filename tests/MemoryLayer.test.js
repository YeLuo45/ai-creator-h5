/**
 * MemoryLayer Tests - L0-L4 分层记忆系统测试
 * 覆盖所有核心类和方法
 */

(function() {
  'use strict';

  // Test utilities
  const assert = {
    eq: (a, b, msg) => {
      if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`);
    },
    deepEq: (a, b, msg) => {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
    },
    truthy: (a, msg) => {
      if (!a) throw new Error(`${msg}: expected truthy, got ${a}`);
    },
    falsy: (a, msg) => {
      if (a) throw new Error(`${msg}: expected falsy, got ${a}`);
    },
    throws: (fn, msg) => {
      let threw = false;
      try { fn(); } catch(e) { threw = true; }
      if (!threw) throw new Error(`${msg}: expected to throw`);
    }
  };

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${name}: ${e.message}`);
    }
  }

  // ========== MemoryLayer Base Class Tests ==========
  console.log('\n--- MemoryLayer Base Tests ---');

  test('MemoryLayer: 创建实例', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    assert.truthy(layer.id, 'should have id');
    assert.truthy(layer.name, 'should have name');
    assert.truthy(layer.layerType, 'should have layerType');
    assert.eq(layer.capacity, 1000, 'default capacity');
    assert.eq(layer.size(), 0, 'should be empty');
  });

  test('MemoryLayer: 自定义选项', () => {
    const layer = new window.MemoryLayer.MemoryLayer({
      id: 'custom-id',
      name: 'TestLayer',
      layerType: 'CUSTOM',
      capacity: 500
    });
    assert.eq(layer.id, 'custom-id', 'custom id');
    assert.eq(layer.name, 'TestLayer', 'custom name');
    assert.eq(layer.capacity, 500, 'custom capacity');
  });

  test('MemoryLayer: 添加和获取条目', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('key1', 'value1');
    assert.eq(layer.get('key1'), 'value1', 'should retrieve value');
    assert.falsy(layer.get('nonexistent'), 'should return null for missing key');
  });

  test('MemoryLayer: 查询条目', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('apple-red', 'apple-red-value', { tags: ['fruit', 'red'] });
    layer.add('apple-green', 'apple-green-value', { tags: ['fruit', 'green'] });
    layer.add('banana', 'banana-value', { tags: ['fruit', 'yellow'] });
    
    const results = layer.query('apple');
    assert.eq(results.length, 2, 'should find 2 apples');
    
    const fruitResults = layer.query('', { tags: ['fruit'] });
    assert.eq(fruitResults.length, 3, 'should find all fruits');
  });

  test('MemoryLayer: 移除条目', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('key1', 'value1');
    assert.truthy(layer.remove('key1'), 'should return true');
    assert.falsy(layer.get('key1'), 'should be null after removal');
    assert.falsy(layer.remove('nonexistent'), 'should return false');
  });

  test('MemoryLayer: 清空层', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('key1', 'value1');
    layer.add('key2', 'value2');
    assert.eq(layer.size(), 2, 'should have 2 entries');
    layer.clear();
    assert.eq(layer.size(), 0, 'should be empty');
    assert.truthy(layer.isEmpty(), 'should be empty');
  });

  test('MemoryLayer: LRU淘汰', () => {
    const layer = new window.MemoryLayer.MemoryLayer({ capacity: 3 });
    layer.add('key1', 'value1');
    layer.add('key2', 'value2');
    layer.add('key3', 'value3');
    layer.add('key4', 'value4'); // should evict key1
    assert.falsy(layer.get('key1'), 'key1 should be evicted');
    assert.truthy(layer.get('key2'), 'key2 should still exist');
  });

  test('MemoryLayer: 容量满时自动淘汰', () => {
    const layer = new window.MemoryLayer.MemoryLayer({ capacity: 2 });
    layer.add('a', 1);
    layer.add('b', 2);
    layer.add('c', 3);
    assert.eq(layer.size(), 2, 'should not exceed capacity');
  });

  test('MemoryLayer: 获取所有条目', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('key1', 'value1');
    layer.add('key2', 'value2');
    const all = layer.getAll();
    assert.eq(all.length, 2, 'should return all entries');
  });

  test('MemoryLayer: 获取统计信息', () => {
    const layer = new window.MemoryLayer.MemoryLayer({ name: 'TestLayer' });
    layer.add('key1', 'value1');
    layer.get('key1'); // access to increment count
    const stats = layer.getStats();
    assert.eq(stats.name, 'TestLayer', 'name should match');
    assert.eq(stats.size, 1, 'size should be 1');
    assert.truthy(stats.usagePercent, 'should have usage percent');
  });

  test('MemoryLayer: 按标签查询', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('k1', 'v1', { tags: ['tag1', 'tag2'] });
    layer.add('k2', 'v2', { tags: ['tag2', 'tag3'] });
    
    const results = layer.query('', { tags: ['tag1'] });
    assert.eq(results.length, 1, 'should find 1 entry');
    assert.eq(results[0].key, 'k1', 'should be k1');
  });

  // ========== L0MetaLayer Tests ==========
  console.log('\n--- L0MetaLayer Tests ---');

  test('L0MetaLayer: 创建实例', () => {
    const layer = new window.MemoryLayer.L0MetaLayer();
    assert.eq(layer.layerType, 'L0_META', 'layerType');
    assert.truthy(layer, 'should create');
  });

  test('L0MetaLayer: 添加规则', () => {
    const layer = new window.MemoryLayer.L0MetaLayer();
    layer.addRule('no-adult', (input) => ({
      valid: !input.includes('adult'),
      message: 'Adult content not allowed'
    }), { tags: ['content-filter'] });
    
    const rule = layer.getRule('no-adult');
    assert.truthy(rule, 'should retrieve rule');
    assert.truthy(typeof rule === 'function', 'should be function');
  });

  test('L0MetaLayer: 验证输入 - 通过', () => {
    const layer = new window.MemoryLayer.L0MetaLayer();
    layer.addRule('no-adult', (input) => ({
      valid: !input.includes('adult'),
      message: 'Adult content not allowed'
    }));
    
    const result = layer.validate('normal content');
    assert.truthy(result.valid, 'should be valid');
    assert.eq(result.violations.length, 0, 'no violations');
  });

  test('L0MetaLayer: 验证输入 - 失败', () => {
    const layer = new window.MemoryLayer.L0MetaLayer();
    layer.addRule('no-adult', (input) => ({
      valid: !input.includes('adult'),
      message: 'Adult content not allowed'
    }));
    
    const result = layer.validate('adult content here');
    assert.falsy(result.valid, 'should be invalid');
    assert.eq(result.violations.length, 1, 'should have 1 violation');
  });

  test('L0MetaLayer: 获取所有规则', () => {
    const layer = new window.MemoryLayer.L0MetaLayer();
    layer.addRule('rule1', () => ({ valid: true }));
    layer.addRule('rule2', () => ({ valid: true }));
    const rules = layer.getAllRules();
    assert.eq(rules.length, 2, 'should have 2 rules');
  });

  test('L0MetaLayer: 规则存在检查', () => {
    const layer = new window.MemoryLayer.L0MetaLayer();
    layer.addRule('rule1', () => ({ valid: true }));
    assert.truthy(layer.hasRule('rule1'), 'should have rule1');
    assert.falsy(layer.hasRule('rule2'), 'should not have rule2');
  });

  // ========== L1IndexLayer Tests ==========
  console.log('\n--- L1IndexLayer Tests ---');

  test('L1IndexLayer: 创建实例', () => {
    const layer = new window.MemoryLayer.L1IndexLayer();
    assert.eq(layer.layerType, 'L1_INDEX', 'layerType');
  });

  test('L1IndexLayer: 语义搜索', () => {
    const layer = new window.MemoryLayer.L1IndexLayer();
    layer.addIndex('anime-girl', 'anime-girl-value', { tags: ['anime', 'girl'] });
    layer.addIndex('anime-boy', 'anime-boy-value', { tags: ['anime', 'boy'] });
    layer.addIndex('real-photo', 'photo-value', { tags: ['photo', 'real'] });
    
    const results = layer.semanticSearch('anime');
    assert.eq(results.length, 2, 'should find 2 anime entries');
  });

  test('L1IndexLayer: 按标签搜索', () => {
    const layer = new window.MemoryLayer.L1IndexLayer();
    layer.addIndex('k1', 'v1', { tags: ['tag1', 'tag2'] });
    layer.addIndex('k2', 'v2', { tags: ['tag2'] });
    
    const results = layer.searchByTag('tag1');
    assert.eq(results.length, 1, 'should find 1 entry');
  });

  test('L1IndexLayer: 构建倒排索引', () => {
    const layer = new window.MemoryLayer.L1IndexLayer();
    layer.addIndex('k1', 'v1', { tags: ['tag1', 'tag2'] });
    layer.addIndex('k2', 'v2', { tags: ['tag2', 'tag3'] });
    
    const index = layer.buildInvertedIndex();
    assert.truthy(index['tag1'], 'should have tag1');
    assert.truthy(index['tag2'], 'should have tag2');
    assert.eq(index['tag1'].length, 1, 'tag1 has 1 entry');
    assert.eq(index['tag2'].length, 2, 'tag2 has 2 entries');
  });

  test('L1IndexLayer: 获取高频标签', () => {
    const layer = new window.MemoryLayer.L1IndexLayer();
    layer.addIndex('k1', 'v1', { tags: ['tag1', 'tag2'] });
    layer.addIndex('k2', 'v2', { tags: ['tag2', 'tag3'] });
    layer.addIndex('k3', 'v3', { tags: ['tag2'] });
    
    const topTags = layer.getTopTags(2);
    assert.eq(topTags[0].tag, 'tag2', 'tag2 should be top');
    assert.eq(topTags[0].count, 3, 'tag2 count should be 3');
  });

  // ========== L2GlobalLayer Tests ==========
  console.log('\n--- L2GlobalLayer Tests ---');

  test('L2GlobalLayer: 创建实例', () => {
    const layer = new window.MemoryLayer.L2GlobalLayer();
    assert.eq(layer.layerType, 'L2_GLOBAL', 'layerType');
  });

  test('L2GlobalLayer: 设置/获取项目上下文', () => {
    const layer = new window.MemoryLayer.L2GlobalLayer();
    layer.setProjectContext({ id: 'proj1', name: 'Test Project' });
    const ctx = layer.getProjectContext();
    assert.eq(ctx.id, 'proj1', 'should have project id');
    assert.eq(ctx.name, 'Test Project', 'should have project name');
  });

  test('L2GlobalLayer: 设置/获取角色上下文', () => {
    const layer = new window.MemoryLayer.L2GlobalLayer();
    layer.setRoleContext({ id: 'role1', name: 'Artist' });
    const ctx = layer.getRoleContext();
    assert.eq(ctx.id, 'role1', 'should have role id');
  });

  test('L2GlobalLayer: 更新/获取插件状态', () => {
    const layer = new window.MemoryLayer.L2GlobalLayer();
    layer.updatePluginState('plugin1', { enabled: true, version: '1.0' });
    const state = layer.getPluginState('plugin1');
    assert.truthy(state, 'should retrieve state');
    assert.eq(state.enabled, true, 'should be enabled');
    assert.eq(state.version, '1.0', 'should have version');
  });

  test('L2GlobalLayer: 获取全局快照', () => {
    const layer = new window.MemoryLayer.L2GlobalLayer();
    layer.setProjectContext({ id: 'proj1' });
    layer.setRoleContext({ id: 'role1' });
    layer.updatePluginState('plugin1', { enabled: true });
    
    const snapshot = layer.getGlobalSnapshot();
    assert.truthy(snapshot.project, 'should have project');
    assert.truthy(snapshot.role, 'should have role');
    assert.truthy(snapshot.plugins, 'should have plugins');
  });

  test('L2GlobalLayer: 从快照恢复', () => {
    const layer = new window.MemoryLayer.L2GlobalLayer();
    layer.restoreFromSnapshot({
      project: { id: 'proj1', name: 'Restored Project' },
      role: { id: 'role1', name: 'Writer' },
      plugins: { 'plugin1': { enabled: true } }
    });
    
    const ctx = layer.getProjectContext();
    assert.eq(ctx.id, 'proj1', 'should restore project');
    assert.eq(ctx.name, 'Restored Project', 'should have name');
  });

  // ========== L3SkillLayer Tests ==========
  console.log('\n--- L3SkillLayer Tests ---');

  test('L3SkillLayer: 创建实例', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    assert.eq(layer.layerType, 'L3_SKILL', 'layerType');
  });

  test('L3SkillLayer: 结晶技能', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    layer.crystallizeSkill('anime-style', {
      category: 'style',
      name: 'Anime Style',
      tags: ['anime', 'illustration']
    });
    
    const skill = layer.getSkill('anime-style');
    assert.truthy(skill, 'should retrieve skill');
    assert.eq(skill.category, 'style', 'should have category');
  });

  test('L3SkillLayer: 按分类获取技能', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    layer.crystallizeSkill('skill1', { category: 'style', name: 'Style 1' });
    layer.crystallizeSkill('skill2', { category: 'color', name: 'Color 1' });
    layer.crystallizeSkill('skill3', { category: 'style', name: 'Style 2' });
    
    const styles = layer.getSkillsByCategory('style');
    assert.eq(styles.length, 2, 'should have 2 style skills');
  });

  test('L3SkillLayer: 获取所有分类', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    layer.crystallizeSkill('s1', { category: 'cat1' });
    layer.crystallizeSkill('s2', { category: 'cat2' });
    
    const cats = layer.getCategories();
    assert.eq(cats.length, 2, 'should have 2 categories');
  });

  test('L3SkillLayer: 技能图谱', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    layer.crystallizeSkill('s1', { category: 'style' });
    layer.crystallizeSkill('s2', { category: 'style' });
    
    const graph = layer.getSkillGraph();
    assert.truthy(graph['style'], 'should have style category');
    assert.eq(graph['style'].length, 2, 'should have 2 skills');
  });

  test('L3SkillLayer: 查找相似技能', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    layer.crystallizeSkill('anime-girl', { 
      category: 'character', 
      name: 'Anime Girl',
      tags: ['anime', 'character', 'girl']
    });
    layer.crystallizeSkill('anime-boy', { 
      category: 'character', 
      name: 'Anime Boy',
      tags: ['anime', 'character', 'boy']
    });
    layer.crystallizeSkill('photo-cat', { 
      category: 'subject', 
      name: 'Cat Photo',
      tags: ['photo', 'animal', 'cat']
    });
    
    const similar = layer.findSimilarSkills('anime-girl', { threshold: 0.3 });
    assert.eq(similar.length >= 1, true, 'should find similar');
  });

  test('L3SkillLayer: 解锁/锁定技能', () => {
    const layer = new window.MemoryLayer.L3SkillLayer();
    layer.crystallizeSkill('skill1', { category: 'test' });
    
    assert.truthy(layer.unlockSkill('skill1'), 'should unlock');
    assert.truthy(layer.lockSkill('skill1'), 'should lock');
  });

  // ========== L4SessionLayer Tests ==========
  console.log('\n--- L4SessionLayer Tests ---');

  test('L4SessionLayer: 创建实例', () => {
    const layer = new window.MemoryLayer.L4SessionLayer();
    assert.eq(layer.layerType, 'L4_SESSION', 'layerType');
    assert.truthy(layer.sessionId, 'should have sessionId');
  });

  test('L4SessionLayer: 添加消息', () => {
    const layer = new window.MemoryLayer.L4SessionLayer();
    layer.addMessage('user', 'Hello');
    layer.addMessage('assistant', 'Hi there');
    
    const messages = layer.getHistory();
    assert.eq(messages.length, 2, 'should have 2 messages');
    assert.eq(messages[0].role, 'user', 'first message role');
    assert.eq(messages[1].role, 'assistant', 'second message role');
  });

  test('L4SessionLayer: 获取最近消息', () => {
    const layer = new window.MemoryLayer.L4SessionLayer();
    for (let i = 0; i < 15; i++) {
      layer.addMessage('user', `Message ${i}`);
    }
    
    const recent = layer.getRecentMessages(5);
    assert.eq(recent.length, 5, 'should have 5 recent messages');
  });

  test('L4SessionLayer: 搜索会话', () => {
    const layer = new window.MemoryLayer.L4SessionLayer();
    layer.addMessage('user', 'I love anime style');
    layer.addMessage('assistant', 'Great, let me create an anime image');
    
    const results = layer.searchSession('anime');
    assert.eq(results.length >= 1, true, 'should find anime');
  });

  test('L4SessionLayer: 获取摘要', () => {
    const layer = new window.MemoryLayer.L4SessionLayer();
    layer.addMessage('user', 'Hello');
    layer.addMessage('assistant', 'Hi');
    layer.addMessage('user', 'How are you');
    
    const summary = layer.getSummary();
    assert.truthy(summary.sessionId, 'should have sessionId');
    assert.eq(summary.messageCount, 3, 'should have 3 messages');
    assert.truthy(summary.roles, 'should have roles');
    assert.truthy(summary.createdAt, 'should have createdAt');
  });

  test('L4SessionLayer: 清空会话保留关键记忆', () => {
    const layer = new window.MemoryLayer.L4SessionLayer();
    layer.add('important-key', 'important-value');
    layer.addMessage('user', 'temp message');
    
    layer.clearSession(['important-key']);
    
    assert.truthy(layer.get('important-key'), 'should preserve important');
    const messages = layer.getHistory();
    const tempMsg = messages.find(m => m.content === 'temp message');
    assert.falsy(tempMsg, 'should not find temp message');
  });

  // ========== UnifiedMemorySystem Tests ==========
  console.log('\n--- UnifiedMemorySystem Tests ---');

  test('UnifiedMemorySystem: 创建实例', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    assert.truthy(system.layers.L0, 'should have L0');
    assert.truthy(system.layers.L1, 'should have L1');
    assert.truthy(system.layers.L2, 'should have L2');
    assert.truthy(system.layers.L3, 'should have L3');
    assert.truthy(system.layers.L4, 'should have L4');
  });

  test('UnifiedMemorySystem: 存储到指定层', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    system.store('L0_META', 'rule1', { valid: true });
    
    const value = system.retrieve('L0_META', 'rule1');
    assert.truthy(value, 'should retrieve value');
  });

  test('UnifiedMemorySystem: 存储到无效层抛出错误', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    assert.throws(() => {
      system.store('INVALID', 'key', 'value');
    }, 'should throw for invalid layer');
  });

  test('UnifiedMemorySystem: 查询所有层', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    system.store('L0_META', 'rule1', { data: 'rule' });
    system.store('L1_INDEX', 'index1', { data: 'index' });
    
    const results = system.queryAll('rule');
    assert.eq(results.length >= 1, true, 'should find results');
  });

  test('UnifiedMemorySystem: 获取完整上下文', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    system.store('L0_META', 'rule1', { data: 'rule' });
    system.store('L3_SKILL', 'skill1', { category: 'test' });
    
    const ctx = system.getContext();
    assert.truthy(ctx.rules, 'should have rules');
    assert.truthy(ctx.index, 'should have index');
    assert.truthy(ctx.global, 'should have global');
    assert.truthy(ctx.skills, 'should have skills');
    assert.truthy(ctx.session, 'should have session');
  });

  test('UnifiedMemorySystem: 获取所有层统计', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    system.store('L0_META', 'rule1', {});
    system.store('L1_INDEX', 'idx1', {});
    
    const stats = system.getStats();
    assert.truthy(stats.L0, 'should have L0 stats');
    assert.truthy(stats.L1, 'should have L1 stats');
    assert.truthy(stats.totalEntries >= 0, 'should have totalEntries');
  });

  test('UnifiedMemorySystem: 清空所有层', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    system.store('L0_META', 'rule1', {});
    system.store('L1_INDEX', 'idx1', {});
    system.store('L4_SESSION', 'msg1', {});
    
    system.clearAll();
    
    const stats = system.getStats();
    assert.eq(stats.L0.size, 0, 'L0 should be empty');
    assert.eq(stats.L1.size, 0, 'L1 should be empty');
    assert.eq(stats.L4.size, 0, 'L4 should be empty');
  });

  test('UnifiedMemorySystem: 导出和恢复快照', () => {
    const system = new window.MemoryLayer.UnifiedMemorySystem();
    system.store('L0_META', 'rule1', { data: 'test' });
    system.store('L1_INDEX', 'idx1', { data: 'index' });
    
    const snapshot = system.export();
    assert.truthy(snapshot.timestamp, 'should have timestamp');
    assert.truthy(snapshot.data.L0, 'should have L0 data');
    
    // 创建新系统并恢复
    const system2 = new window.MemoryLayer.UnifiedMemorySystem();
    system2.restore(snapshot);
    
    const value = system2.retrieve('L0_META', 'rule1');
    assert.truthy(value, 'should have restored value');
  });

  // ========== MemoryLayerFactory Tests ==========
  console.log('\n--- MemoryLayerFactory Tests ---');

  test('MemoryLayerFactory: 创建各层', () => {
    const L0 = window.MemoryLayer.MemoryLayerFactory.createL0();
    const L1 = window.MemoryLayer.MemoryLayerFactory.createL1();
    const L2 = window.MemoryLayer.MemoryLayerFactory.createL2();
    const L3 = window.MemoryLayer.MemoryLayerFactory.createL3();
    const L4 = window.MemoryLayer.MemoryLayerFactory.createL4();
    
    assert.eq(L0.layerType, 'L0_META', 'L0 type');
    assert.eq(L1.layerType, 'L1_INDEX', 'L1 type');
    assert.eq(L2.layerType, 'L2_GLOBAL', 'L2 type');
    assert.eq(L3.layerType, 'L3_SKILL', 'L3 type');
    assert.eq(L4.layerType, 'L4_SESSION', 'L4 type');
  });

  test('MemoryLayerFactory: 创建所有层', () => {
    const layers = window.MemoryLayer.MemoryLayerFactory.createAll();
    assert.truthy(layers.L0, 'should have L0');
    assert.truthy(layers.L1, 'should have L1');
    assert.truthy(layers.L2, 'should have L2');
    assert.truthy(layers.L3, 'should have L3');
    assert.truthy(layers.L4, 'should have L4');
  });

  test('MemoryLayerFactory: 获取层类型名称', () => {
    assert.eq(window.MemoryLayer.MemoryLayerFactory.getLayerType('L0_META'), 'L0MetaLayer');
    assert.eq(window.MemoryLayer.MemoryLayerFactory.getLayerType('L1_INDEX'), 'L1IndexLayer');
    assert.eq(window.MemoryLayer.MemoryLayerFactory.getLayerType('L2_GLOBAL'), 'L2GlobalLayer');
    assert.eq(window.MemoryLayer.MemoryLayerFactory.getLayerType('L3_SKILL'), 'L3SkillLayer');
    assert.eq(window.MemoryLayer.MemoryLayerFactory.getLayerType('L4_SESSION'), 'L4SessionLayer');
    assert.eq(window.MemoryLayer.MemoryLayerFactory.getLayerType('UNKNOWN'), 'MemoryLayer');
  });

  // ========== Constants Tests ==========
  console.log('\n--- Constants Tests ---');

  test('Constants: Layer constants defined', () => {
    assert.eq(window.MemoryLayer.LAYER_L0, 'L0_META', 'LAYER_L0');
    assert.eq(window.MemoryLayer.LAYER_L1, 'L1_INDEX', 'LAYER_L1');
    assert.eq(window.MemoryLayer.LAYER_L2, 'L2_GLOBAL', 'LAYER_L2');
    assert.eq(window.MemoryLayer.LAYER_L3, 'L3_SKILL', 'LAYER_L3');
    assert.eq(window.MemoryLayer.LAYER_L4, 'L4_SESSION', 'LAYER_L4');
  });

  test('Constants: Layer priority ordering', () => {
    const p = window.MemoryLayer.LAYER_PRIORITY;
    assert.eq(p['L0_META'] < p['L1_INDEX'], true, 'L0 < L1');
    assert.eq(p['L1_INDEX'] < p['L2_GLOBAL'], true, 'L1 < L2');
    assert.eq(p['L2_GLOBAL'] < p['L3_SKILL'], true, 'L2 < L3');
    assert.eq(p['L3_SKILL'] < p['L4_SESSION'], true, 'L3 < L4');
  });

  // ========== Edge Cases ==========
  console.log('\n--- Edge Cases ---');

  test('Edge case: Empty key', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('', 'empty-key-value');
    assert.eq(layer.get(''), 'empty-key-value', 'should handle empty key');
  });

  test('Edge case: Null value', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('key', null);
    assert.truthy(layer.get('key') === null, 'should handle null value');
  });

  test('Edge case: undefined value', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('key', undefined);
    assert.truthy(layer.get('key') === undefined, 'should handle undefined');
  });

  test('Edge case: Object value', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    const obj = { nested: { data: 'test' }, array: [1, 2, 3] };
    layer.add('obj', obj);
    const retrieved = layer.get('obj');
    assert.eq(retrieved.nested.data, 'test', 'should preserve nested objects');
    assert.eq(retrieved.array.length, 3, 'should preserve arrays');
  });

  test('Edge case: Query with regex special chars', () => {
    const layer = new window.MemoryLayer.MemoryLayer();
    layer.add('test[1]', 'value1');
    layer.add('test(2)', 'value2');
    const results = layer.query('test');
    assert.eq(results.length, 2, 'should find both');
  });

  test('Edge case: isFull check', () => {
    const layer = new window.MemoryLayer.MemoryLayer({ capacity: 2 });
    assert.falsy(layer.isFull(), 'should not be full initially');
    layer.add('a', 1);
    layer.add('b', 2);
    assert.truthy(layer.isFull(), 'should be full');
  });

  test('Edge case: 访问已淘汰的key后get不会报错', () => {
    const layer = new window.MemoryLayer.MemoryLayer({ capacity: 2 });
    layer.add('a', 1);
    layer.add('b', 2);
    layer.add('c', 3); // evicts 'a'
    layer.get('a'); // should return null without error
  });

  // ========== Summary ==========
  console.log('\n========== Test Summary ==========');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed!');
  }

  // Export results for external testing
  if (typeof window !== 'undefined') {
    window.MemoryLayerTests = {
      passed,
      failed,
      total: passed + failed,
      success: failed === 0
    };
  }

})();
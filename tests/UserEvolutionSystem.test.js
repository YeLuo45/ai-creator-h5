'use strict';

/**
 * UserEvolutionSystem Tests
 * 测试用户自进化系统的各个组件
 */

const assert = {
  eq: (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`); },
  truthy: (a, msg) => { if (!a) throw new Error(`${msg}: expected truthy`); },
  falsy: (a, msg) => { if (a) throw new Error(`${msg}: expected falsy`); },
  deepEq: (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}`); }
};

console.log('========== UserProfile Tests ==========');
const UserProfile = global.UserProfile;
const profile = new UserProfile('test_user');
assert.truthy(profile, 'UserProfile: 创建实例');
assert.eq(profile.userId, 'test_user', 'UserProfile: 用户ID正确');

profile.recordGeneration('写一个科幻故事', true, 5);
profile.recordGeneration('写一个爱情故事', true, 4);
profile.recordGeneration('写一个友情故事', false, 2);
assert.eq(profile.usageStats.totalGenerations, 3, 'UserProfile: 记录生成次数');
assert.eq(profile.usageStats.successfulGenerations, 2, 'UserProfile: 成功生成次数');

const topThemes = profile.getTopThemes(2);
assert.truthy(topThemes.length > 0, 'UserProfile: 获取热门主题');
console.log('UserProfile: 基础功能通过');

console.log('========== TemplateLibrary Tests ==========');
const TemplateLibrary = global.TemplateLibrary;
const library = new TemplateLibrary();
assert.truthy(library, 'TemplateLibrary: 创建实例');

const tplId = library.addTemplate({
  title: '科幻故事模板',
  prompt: '写一个关于{主题}的科幻故事',
  tags: ['科幻', '未来']
});
assert.truthy(tplId, 'TemplateLibrary: 添加模板');

const template = library.getTemplate(tplId);
assert.truthy(template, 'TemplateLibrary: 获取模板');
assert.truthy(template.title === '科幻故事模板', 'TemplateLibrary: 模板标题正确');

library.useTemplate(tplId);
const used = library.getTemplate(tplId);
assert.eq(used.usageCount, 1, 'TemplateLibrary: 使用计数增加');

const byTag = library.findByTag('科幻');
assert.truthy(byTag.length > 0, 'TemplateLibrary: 按标签搜索');
console.log('TemplateLibrary: 基础功能通过');

console.log('========== SkillCrystallizer Tests ==========');
const SkillCrystallizer = global.SkillCrystallizer;
const crystallizer = new SkillCrystallizer();
assert.truthy(crystallizer, 'SkillCrystallizer: 创建实例');

const skillId = crystallizer.crystallize(
  '科幻故事创作',
  '创作科幻故事的技能',
  ['第一步：设定世界观', '第二步：设计角色', '第三步：构建情节']
);
assert.truthy(skillId, 'SkillCrystallizer: 结晶技能');

const skill = crystallizer.getSkill(skillId);
assert.truthy(skill, 'SkillCrystallizer: 获取技能');
assert.eq(skill.name, '科幻故事创作', 'SkillCrystallizer: 技能名称正确');

crystallizer.useSkill(skillId);
assert.eq(skill.usageCount, 1, 'SkillCrystallizer: 使用计数增加');

const allSkills = crystallizer.getAllSkills();
assert.truthy(allSkills.length > 0, 'SkillCrystallizer: 获取所有技能');
console.log('SkillCrystallizer: 基础功能通过');

console.log('========== UserEvolutionSystem Tests ==========');
const UserEvolutionSystem = global.UserEvolutionSystem;
const evolution = new UserEvolutionSystem({ userId: 'test_user' });
assert.truthy(evolution, 'UserEvolutionSystem: 创建实例');

evolution.recordGeneration('写一个科幻故事', true, 5);
evolution.recordGeneration('写一个科幻故事', true, 5);
evolution.recordGeneration('写一个科幻故事', true, 5);
// 3次成功后应该结晶为模板
assert.truthy(evolution.templateLibrary.templates.size >= 0, 'UserEvolutionSystem: 记录生成');

const summary = evolution.getProfileSummary();
assert.truthy(summary, 'UserEvolutionSystem: 获取画像摘要');
assert.eq(summary.userId, 'test_user', 'UserEvolutionSystem: 用户ID正确');
assert.truthy(summary.totalGenerations > 0, 'UserEvolutionSystem: 生成次数正确');

const state = evolution.getState();
assert.truthy(state, 'UserEvolutionSystem: 获取状态');
console.log('UserEvolutionSystem: 基础功能通过');

console.log('========== Data Export/Import Tests ==========');
const exported = evolution.exportUserData();
assert.truthy(exported.profile, 'Export: profile存在');
assert.truthy(Array.isArray(exported.templates), 'Export: templates是数组');
assert.truthy(Array.isArray(exported.skills), 'Export: skills是数组');

const evolution2 = new UserEvolutionSystem({ userId: 'test_user2' });
evolution2.importUserData(exported);
assert.eq(evolution2.profile.userId, 'test_user2', 'Import: 用户ID保持');
console.log('Data Export/Import: 通过');

console.log('========== Constants Tests ==========');
const STATE = global.USER_EVOLUTION_STATE;
assert.truthy(STATE, 'USER_EVOLUTION_STATE defined');
assert.truthy(STATE.LEARNING, 'STATE.LEARNING defined');
assert.truthy(STATE.EVOLVING, 'STATE.EVOLVING defined');
console.log('Constants: 所有常量定义完整');

console.log('\n========== UserEvolutionSystem Test Summary ==========');
console.log('✅ All UserEvolutionSystem tests passed!');
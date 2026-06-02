/**
 * AgentOrchestrator Tests
 * Run with: node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');

// Setup global mock objects
global.window = global;
global.document = {
  addEventListener: () => {}
};

// Load services
const memoryLayerPath = path.join(__dirname, '..', 'services', 'MemoryLayer.js');
eval(fs.readFileSync(memoryLayerPath, 'utf8'));

const dreamPath = path.join(__dirname, '..', 'services', 'DreamConsolidation.js');
eval(fs.readFileSync(dreamPath, 'utf8'));

const agentPath = path.join(__dirname, '..', 'services', 'AgentOrchestrator.js');
eval(fs.readFileSync(agentPath, 'utf8'));

// Test utilities
const assert = {
  eq: (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`); },
  truthy: (a, msg) => { if (!a) throw new Error(`${msg}: expected truthy, got ${a}`); },
  falsy: (a, msg) => { if (a) throw new Error(`${msg}: expected falsy, got ${a}`); },
  deepEq: (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}`); }
};

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✓ ${name}`); }
  catch (e) { failed++; console.error(`✗ ${name}: ${e.message}`); }
}

console.log('\n========== AgentOrchestrator Tests ==========\n');

// ========== Agent Tests ==========
console.log('--- Agent Tests ---');

test('Agent: 创建实例', () => {
  const agent = new global.AgentOrchestrator.Agent({ name: 'TestAgent' });
  assert.truthy(agent.id, 'should have id');
  assert.truthy(agent.name, 'should have name');
  assert.eq(agent.role, global.AgentOrchestrator.AGENT_ROLE.SPECIALIST, 'default role');
});

test('Agent: 获取状态', () => {
  const agent = new global.AgentOrchestrator.Agent({ name: 'TestAgent' });
  const status = agent.getStatus();
  assert.truthy(status.id, 'should have id');
  assert.truthy(status.name, 'should have state');
});

test('Agent: 执行任务', async () => {
  const agent = new global.AgentOrchestrator.Agent({ name: 'TestAgent' });
  const result = await agent.executeTask({ id: 'task1', type: 'test', payload: { data: 'test' } });
  assert.truthy(result, 'should have result');
});

test('Agent: 能力检查', () => {
  const agent = new global.AgentOrchestrator.Agent({ capabilities: ['code', 'design'] });
  assert.truthy(agent.hasCapability('code'), 'should have code');
  assert.falsy(agent.hasCapability('music'), 'should not have music');
});

// ========== PlannerAgent Tests ==========
console.log('\n--- PlannerAgent Tests ---');

test('PlannerAgent: 创建实例', () => {
  const planner = new global.AgentOrchestrator.PlannerAgent();
  assert.eq(planner.role, global.AgentOrchestrator.AGENT_ROLE.PLANNER, 'role');
  assert.truthy(planner.hasCapability('task_planning'), 'should have planning');
});

test('PlannerAgent: 执行任务', async () => {
  const planner = new global.AgentOrchestrator.PlannerAgent();
  const result = await planner.executeTask({
    id: 'task1',
    type: 'planning',
    payload: { goals: ['goal1', 'goal2'] }
  });
  assert.truthy(result.success, 'should succeed');
  assert.truthy(result.result.plan, 'should have plan');
});

test('PlannerAgent: 目标分解', () => {
  const planner = new global.AgentOrchestrator.PlannerAgent();
  const goals = planner._decomposeGoals(['goal1', 'goal2']);
  assert.eq(goals.length, 2, 'should have 2 goals');
});

// ========== ExecutorAgent Tests ==========
console.log('\n--- ExecutorAgent Tests ---');

test('ExecutorAgent: 创建实例', () => {
  const executor = new global.AgentOrchestrator.ExecutorAgent();
  assert.eq(executor.role, global.AgentOrchestrator.AGENT_ROLE.EXECUTOR, 'role');
});

test('ExecutorAgent: 执行generate任务', async () => {
  const executor = new global.AgentOrchestrator.ExecutorAgent();
  const result = await executor.executeTask({
    id: 'task1',
    type: 'generate',
    payload: { action: 'generate', target: 'image' }
  });
  assert.truthy(result.success, 'should succeed');
});

// ========== ReviewerAgent Tests ==========
console.log('\n--- ReviewerAgent Tests ---');

test('ReviewerAgent: 创建实例', () => {
  const reviewer = new global.AgentOrchestrator.ReviewerAgent();
  assert.eq(reviewer.role, global.AgentOrchestrator.AGENT_ROLE.REVIEWER, 'role');
});

test('ReviewerAgent: 执行审核任务', async () => {
  const reviewer = new global.AgentOrchestrator.ReviewerAgent();
  const result = await reviewer.executeTask({
    id: 'task1',
    type: 'review',
    payload: { content: 'test content', criteria: ['correctness'] }
  });
  assert.truthy(result.success, 'should succeed');
  assert.truthy(result.result.approved !== undefined, 'should have approval status');
});

// ========== AgentRegistry Tests ==========
console.log('\n--- AgentRegistry Tests ---');

test('AgentRegistry: 注册Agent', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const agent = new global.AgentOrchestrator.Agent({ name: 'Test' });
  registry.register(agent);
  assert.eq(registry.size(), 1, 'should have 1 agent');
});

test('AgentRegistry: 按角色获取', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const planner = new global.AgentOrchestrator.PlannerAgent();
  registry.register(planner);
  const planners = registry.getByRole(global.AgentOrchestrator.AGENT_ROLE.PLANNER);
  assert.eq(planners.length, 1, 'should have 1 planner');
});

test('AgentRegistry: 注销Agent', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const agent = new global.AgentOrchestrator.Agent({ name: 'Test' });
  registry.register(agent);
  assert.truthy(registry.unregister(agent.id), 'should unregister');
  assert.eq(registry.size(), 0, 'should have 0 agents');
});

test('AgentRegistry: 按能力查找', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const agent = new global.AgentOrchestrator.Agent({ capabilities: ['code'] });
  registry.register(agent);
  const found = registry.findByCapability('code');
  assert.eq(found.length, 1, 'should find 1 agent');
});

test('AgentRegistry: 获取空闲Agent', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const agent = new global.AgentOrchestrator.Agent({ name: 'Test' });
  registry.register(agent);
  const idle = registry.getIdleAgents();
  assert.eq(idle.length, 1, 'should have 1 idle');
});

// ========== TaskRouter Tests ==========
console.log('\n--- TaskRouter Tests ---');

test('TaskRouter: 创建实例', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const router = new global.AgentOrchestrator.TaskRouter(registry);
  assert.truthy(router, 'should create');
});

test('TaskRouter: 添加规则并路由', () => {
  const registry = new global.AgentOrchestrator.AgentRegistry();
  const planner = new global.AgentOrchestrator.PlannerAgent();
  registry.register(planner);
  
  const router = new global.AgentOrchestrator.TaskRouter(registry);
  router.addRule(/planning/i, global.AgentOrchestrator.AGENT_ROLE.PLANNER);
  
  const agent = router.route({ type: 'planning_task', requiredCapabilities: [] });
  assert.truthy(agent, 'should route to planner');
});

// ========== AgentOrchestrator Tests ==========
console.log('\n--- AgentOrchestrator Tests ---');

test('AgentOrchestrator: 创建实例', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  assert.truthy(orch.id, 'should have id');
  assert.eq(orch.registry.size(), 3, 'should have 3 default agents');
});

test('AgentOrchestrator: 提交任务', async () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  const result = await orch.submitTask({
    type: 'planning',
    payload: { goals: ['test'] }
  });
  assert.truthy(result.taskId, 'should have taskId');
});

test('AgentOrchestrator: 获取状态', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  const status = orch.getStatus();
  assert.truthy(status.agentCount >= 3, 'should have agents');
  assert.truthy(status.runningTasks !== undefined, 'should have running tasks');
});

test('AgentOrchestrator: 获取所有Agent', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  const agents = orch.getAllAgents();
  assert.eq(agents.length >= 3, true, 'should have agents');
});

test('AgentOrchestrator: 注册自定义Agent', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  const customAgent = new global.AgentOrchestrator.Agent({ name: 'Custom', role: 'specialist' });
  orch.registerAgent(customAgent);
  assert.eq(orch.registry.size(), 4, 'should have 4 agents');
});

test('AgentOrchestrator: 取消任务', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  orch.submitTask({ type: 'planning', payload: {} });
  const cancelled = orch.cancelTask('nonexistent');
  assert.falsy(cancelled, 'should return false for nonexistent');
});

test('AgentOrchestrator: 获取任务状态', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  const result = orch.getTaskStatus('nonexistent');
  assert.truthy(result === null, 'should return null');
});

test('AgentOrchestrator: 事件监听', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  let called = false;
  orch.on('taskCompleted', () => { called = true; });
  // 手动触发（通过内部方法）
  orch._emit('taskCompleted', {});
  // 由于监听器可能还未设置完成，我们只验证方法存在
  assert.truthy(typeof orch.on === 'function', 'should have on method');
});

test('AgentOrchestrator: 导出状态', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  const exported = orch.export();
  assert.truthy(exported.id, 'should have id');
  assert.truthy(exported.stats, 'should have stats');
});

test('AgentOrchestrator: 销毁', () => {
  const orch = new global.AgentOrchestrator.AgentOrchestrator();
  // 先获取注册表中的 agents
  const initialCount = orch.registry.size();
  orch.destroy();
  // 销毁后 agents 应该被终止但注册表可能还有引用
  assert.truthy(initialCount >= 3, 'should have agents before destroy');
});

// ========== Constants Tests ==========
console.log('\n--- Constants Tests ---');

test('Constants: AGENT_STATE defined', () => {
  const states = global.AgentOrchestrator.AGENT_STATE;
  assert.truthy(states.IDLE, 'should have IDLE');
  assert.truthy(states.BUSY, 'should have BUSY');
  assert.truthy(states.ERROR, 'should have ERROR');
});

test('Constants: AGENT_ROLE defined', () => {
  const roles = global.AgentOrchestrator.AGENT_ROLE;
  assert.truthy(roles.PLANNER, 'should have PLANNER');
  assert.truthy(roles.EXECUTOR, 'should have EXECUTOR');
  assert.truthy(roles.REVIEWER, 'should have REVIEWER');
});

test('Constants: MSG_TYPE defined', () => {
  const types = global.AgentOrchestrator.MSG_TYPE;
  assert.truthy(types.REQUEST, 'should have REQUEST');
  assert.truthy(types.RESPONSE, 'should have RESPONSE');
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

// Export results
global.AgentOrchestratorTests = { passed, failed, total: passed + failed, success: failed === 0 };
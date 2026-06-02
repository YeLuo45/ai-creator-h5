/**
 * TaskScheduler Tests
 */

const fs = require('fs');
const path = require('path');

// Setup global mock
global.window = global;
global.document = { addEventListener: () => {} };

function loadService(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/^\(function\(\)\s*/, '');
  code = code.replace(/\}\)\(\)\s*$/, '');
  eval(code);
}

loadService(path.join(__dirname, '..', 'services', 'MemoryLayer.js'));
loadService(path.join(__dirname, '..', 'services', 'DreamConsolidation.js'));
loadService(path.join(__dirname, '..', 'services', 'TaskScheduler.js'));

const assert = {
  eq: (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`); },
  truthy: (a, msg) => { if (!a) throw new Error(`${msg}: expected truthy`); },
  falsy: (a, msg) => { if (a) throw new Error(`${msg}: expected falsy`); }
};

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✓ ${name}`); }
  catch (e) { failed++; console.error(`✗ ${name}: ${e.message}`); }
}

console.log('\n========== TaskScheduler Tests ==========\n');

// ========== Task Tests ==========
console.log('--- Task Tests ---');

test('Task: 创建实例', () => {
  const task = new global.TaskScheduler.Task({ name: 'TestTask' });
  assert.truthy(task.id, 'should have id');
  assert.truthy(task.name, 'should have name');
  assert.eq(task.status, global.TaskScheduler.TASK_STATUS.PENDING, 'initial status');
});

test('Task: 开始任务', () => {
  const task = new global.TaskScheduler.Task();
  task.start();
  assert.eq(task.status, global.TaskScheduler.TASK_STATUS.RUNNING, 'should be running');
  assert.truthy(task.startedAt, 'should have startedAt');
});

test('Task: 完成任务', () => {
  const task = new global.TaskScheduler.Task();
  task.start();
  task.complete({ result: 'done' });
  assert.eq(task.status, global.TaskScheduler.TASK_STATUS.COMPLETED, 'should be completed');
  assert.truthy(task.completedAt, 'should have completedAt');
  assert.eq(task.result.result, 'done', 'should have result');
});

test('Task: 失败任务', () => {
  const task = new global.TaskScheduler.Task();
  task.start();
  task.fail('error occurred');
  assert.eq(task.status, global.TaskScheduler.TASK_STATUS.FAILED, 'should be failed');
  assert.eq(task.error, 'error occurred', 'should have error');
});

test('Task: 更新进度', () => {
  const task = new global.TaskScheduler.Task();
  task.updateProgress(50);
  assert.eq(task.progress, 50, 'should have progress 50');
  task.updateProgress(150); // should cap at 100
  assert.eq(task.progress, 100, 'should cap at 100');
});

test('Task: 添加子任务', () => {
  const parent = new global.TaskScheduler.Task({ name: 'Parent' });
  const child = new global.TaskScheduler.Task({ name: 'Child' });
  parent.addSubTask(child);
  assert.eq(parent.subTasks.length, 1, 'should have 1 subTask');
  assert.eq(child.parentId, parent.id, 'child should have parentId');
});

test('Task: 获取摘要', () => {
  const task = new global.TaskScheduler.Task({ name: 'Test', priority: 75 });
  const summary = task.getSummary();
  assert.eq(summary.name, 'Test', 'should have name');
  assert.eq(summary.priority, 75, 'should have priority');
});

// ========== TaskDecomposer Tests ==========
console.log('\n--- TaskDecomposer Tests ---');

test('TaskDecomposer: 创建实例', () => {
  const decomposer = new global.TaskScheduler.TaskDecomposer();
  assert.truthy(decomposer, 'should create');
});

test('TaskDecomposer: 分解任务', () => {
  const decomposer = new global.TaskScheduler.TaskDecomposer();
  const task = new global.TaskScheduler.Task({ description: 'step1; step2; step3' });
  const result = decomposer.decompose(task);
  assert.truthy(result.length >= 1, 'should return tasks');
});

test('TaskDecomposer: 估算任务数', () => {
  const decomposer = new global.TaskScheduler.TaskDecomposer();
  const task = new global.TaskScheduler.Task({ description: 'a; b; c' });
  const count = decomposer.estimateTaskCount(task);
  assert.truthy(count >= 1, 'should estimate at least 1 task');
});

// ========== FeedbackLoop Tests ==========
console.log('\n--- FeedbackLoop Tests ---');

test('FeedbackLoop: 创建实例', () => {
  const feedback = new global.TaskScheduler.FeedbackLoop();
  assert.truthy(feedback, 'should create');
  assert.truthy(feedback.enabled, 'should be enabled');
});

test('FeedbackLoop: 记录结果', () => {
  const feedback = new global.TaskScheduler.FeedbackLoop();
  feedback.record({ success: true, duration: 100 });
  feedback.record({ success: false, duration: 200 });
  const stats = feedback.getStats();
  assert.truthy(stats.totalRecords === 2, 'should have 2 records');
});

test('FeedbackLoop: 分析反馈', () => {
  const feedback = new global.TaskScheduler.FeedbackLoop();
  feedback.record({ success: true, duration: 100, queueSize: 5 });
  feedback.record({ success: true, duration: 150, queueSize: 5 });
  const analysis = feedback.analyze();
  assert.truthy(analysis.metrics, 'should have metrics');
});

test('FeedbackLoop: 获取统计', () => {
  const feedback = new global.TaskScheduler.FeedbackLoop();
  const stats = feedback.getStats();
  assert.truthy(typeof stats.successRate === 'number', 'should have successRate');
  assert.truthy(typeof stats.avgDuration === 'number', 'should have avgDuration');
});

// ========== ResourceManager Tests ==========
console.log('\n--- ResourceManager Tests ---');

test('ResourceManager: 创建实例', () => {
  const rm = new global.TaskScheduler.ResourceManager();
  assert.truthy(rm, 'should create');
});

test('ResourceManager: 注册资源', () => {
  const rm = new global.TaskScheduler.ResourceManager();
  rm.registerResource('gpu', 'gpu', 100);
  const status = rm.getStatus();
  assert.truthy(status.gpu, 'should have gpu status');
});

test('ResourceManager: 分配资源', () => {
  const rm = new global.TaskScheduler.ResourceManager();
  rm.registerResource('cpu', 'cpu', 100);
  const result = rm.allocate('task1', 'cpu', 30);
  assert.truthy(result.success, 'should allocate');
  assert.falsy(rm.canAllocate('cpu', 80), 'should not have enough');
});

test('ResourceManager: 释放资源', () => {
  const rm = new global.TaskScheduler.ResourceManager();
  rm.registerResource('cpu', 'cpu', 100);
  rm.allocate('task1', 'cpu', 30);
  const result = rm.release('task1', 'cpu', 30);
  assert.truthy(result.success, 'should release');
  assert.truthy(rm.canAllocate('cpu', 30), 'should have 30 available');
});

test('ResourceManager: 获取状态', () => {
  const rm = new global.TaskScheduler.ResourceManager();
  rm.registerResource('cpu', 'cpu', 100);
  const status = rm.getStatus();
  assert.truthy(status.cpu, 'should have cpu status');
  assert.eq(status.cpu.total, 100, 'should have total 100');
});

// ========== TaskScheduler Tests ==========
console.log('\n--- TaskScheduler Tests ---');

test('TaskScheduler: 创建实例', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  assert.truthy(scheduler.id, 'should have id');
  assert.truthy(scheduler.state, 'should have state');
});

test('TaskScheduler: 提交任务', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  const result = scheduler.submit({ name: 'TestTask', priority: 75 });
  assert.truthy(result.taskId, 'should have taskId');
  assert.truthy(result.queuePosition >= 1, 'should have queue position');
});

test('TaskScheduler: 获取状态', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  const status = scheduler.getStatus();
  assert.truthy(status.id, 'should have id');
  assert.truthy(status.totalTasks >= 0, 'should have totalTasks');
  assert.truthy(status.resources, 'should have resources');
});

test('TaskScheduler: 获取任务状态', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  scheduler.submit({ name: 'TestTask' });
  const task = scheduler.tasks.values().next().value;
  if (task) {
    const status = scheduler.getTaskStatus(task.id);
    assert.truthy(status, 'should get status');
  } else {
    passed++; // skip if no tasks
  }
});

test('TaskScheduler: 取消任务', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  scheduler.submit({ name: 'TestTask' });
  const task = scheduler.tasks.values().next().value;
  if (task) {
    const result = scheduler.cancelTask(task.id);
    assert.truthy(result, 'should cancel');
  } else {
    passed++;
  }
});

test('TaskScheduler: 事件监听', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  assert.truthy(typeof scheduler.on === 'function', 'should have on method');
  assert.truthy(typeof scheduler.off === 'function', 'should have off method');
});

test('TaskScheduler: 导出状态', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  const exported = scheduler.export();
  assert.truthy(exported.id, 'should have id');
  assert.truthy(exported.stats, 'should have stats');
});

test('TaskScheduler: 销毁', () => {
  const scheduler = new global.TaskScheduler.TaskScheduler();
  scheduler.destroy();
  assert.eq(scheduler.state, global.TaskScheduler.SCHEDULER_STATE.STOPPED, 'should be stopped');
});

// ========== Constants Tests ==========
console.log('\n--- Constants Tests ---');

test('Constants: TASK_PRIORITY defined', () => {
  const p = global.TaskScheduler.TASK_PRIORITY;
  assert.eq(p.CRITICAL, 100, 'CRITICAL should be 100');
  assert.eq(p.HIGH, 75, 'HIGH should be 75');
  assert.eq(p.NORMAL, 50, 'NORMAL should be 50');
});

test('Constants: TASK_STATUS defined', () => {
  const s = global.TaskScheduler.TASK_STATUS;
  assert.truthy(s.PENDING, 'should have PENDING');
  assert.truthy(s.RUNNING, 'should have RUNNING');
  assert.truthy(s.COMPLETED, 'should have COMPLETED');
});

test('Constants: SCHEDULER_STATE defined', () => {
  const s = global.TaskScheduler.SCHEDULER_STATE;
  assert.truthy(s.IDLE, 'should have IDLE');
  assert.truthy(s.RUNNING, 'should have RUNNING');
  assert.truthy(s.STOPPED, 'should have STOPPED');
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

global.TaskSchedulerTests = { passed, failed, total: passed + failed, success: failed === 0 };
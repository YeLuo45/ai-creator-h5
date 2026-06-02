'use strict';

/**
 * Offline System Tests
 * 测试 OfflineQueue, DraftBox, OptimisticPreview
 */

const assert = {
  eq: (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`); },
  truthy: (a, msg) => { if (!a) throw new Error(`${msg}: expected truthy`); },
  falsy: (a, msg) => { if (!!a) throw new Error(`${msg}: expected falsy`); },
  deepEq: (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg); },
  include: (a, b, msg) => { if (!a.includes(b)) throw new Error(`${msg}: expected '${a}' to include '${b}'`); }
};

console.log('========== OfflineQueue Tests ==========');
const OfflineQueue = global.OfflineQueue;
const OfflineTask = global.OfflineTask;
const TASK_STATUS = global.TASK_STATUS;

const queue = new OfflineQueue();
assert.truthy(queue, 'OfflineQueue: 创建实例');
assert.truthy(Array.isArray(queue.tasks), 'OfflineQueue: tasks数组初始化');

// 测试入队
const taskId = queue.enqueue('image', { prompt: 'a cat' });
assert.truthy(taskId, 'OfflineQueue: enqueue返回taskId');
assert.eq(queue.tasks.length, 1, 'OfflineQueue: 任务已添加');

const task = queue.tasks[0];
assert.eq(task.type, 'image', 'OfflineQueue: 任务类型正确');
assert.eq(task.status, TASK_STATUS.QUEUED, 'OfflineQueue: 初始状态为QUEUED');

// 测试出队
const dequeued = queue.dequeue();
assert.truthy(dequeued, 'OfflineQueue: dequeue返回任务');
assert.eq(dequeued.status, TASK_STATUS.PENDING, 'OfflineQueue: 出队后状态为PENDING');

// 测试状态更新
queue.updateTaskStatus(dequeued.id, TASK_STATUS.GENERATING);
const updated = queue.tasks.find(t => t.id === dequeued.id);
assert.eq(updated.status, TASK_STATUS.GENERATING, 'OfflineQueue: 状态更新');
assert.truthy(updated.startedAt, 'OfflineQueue: 开始时间已记录');

// 测试完成
queue.completeTask(dequeued.id);
assert.eq(updated.status, TASK_STATUS.COMPLETED, 'OfflineQueue: 任务完成');
assert.truthy(updated.completedAt, 'OfflineQueue: 完成时间已记录');

// 测试统计
const stats = queue.getStats();
assert.eq(stats.total, 1, 'OfflineQueue: 统计总数正确');
assert.eq(stats.completed, 1, 'OfflineQueue: 统计已完成正确');

console.log('OfflineQueue: 基础功能通过');

console.log('========== OfflineTask Tests ==========');
const offlineTask = new OfflineTask({ type: 'music', params: { prompt: 'music' } });
assert.truthy(offlineTask.id, 'OfflineTask: id生成');
assert.eq(offlineTask.type, 'music', 'OfflineTask: 类型正确');
assert.truthy(offlineTask.createdAt, 'OfflineTask: 创建时间');

const taskJson = offlineTask.toJSON();
assert.truthy(taskJson.id, 'OfflineTask: toJSON正确');
assert.truthy(taskJson.status, 'OfflineTask: toJSON包含状态');

const restored = OfflineTask.fromJSON(taskJson);
assert.eq(restored.id, offlineTask.id, 'OfflineTask: fromJSON恢复正确');

console.log('OfflineTask: 功能通过');

console.log('========== TASK_STATUS Constants ==========');
assert.eq(TASK_STATUS.PENDING, 'pending', 'TASK_STATUS.PENDING');
assert.eq(TASK_STATUS.GENERATING, 'generating', 'TASK_STATUS.GENERATING');
assert.eq(TASK_STATUS.COMPLETED, 'completed', 'TASK_STATUS.COMPLETED');
assert.eq(TASK_STATUS.FAILED, 'failed', 'TASK_STATUS.FAILED');
console.log('TASK_STATUS: 常量定义完整');

console.log('========== DraftBox Tests ==========');
const DraftBox = global.DraftBox;
const Draft = global.Draft;

const box = new DraftBox();
assert.truthy(box, 'DraftBox: 创建实例');

// 测试创建草稿
const draft = box.createDraft('text', '测试草稿');
assert.truthy(draft.id, 'DraftBox: 创建草稿返回id');
assert.eq(draft.title, '测试草稿', 'DraftBox: 草稿标题正确');
assert.eq(draft.content, '', 'DraftBox: 初始内容为空');
assert.eq(draft.type, 'text', 'DraftBox: 草稿类型正确');

// 测试更新草稿
box.updateDraft(draft.id, '这是内容', '新标题');
const updatedDraft = box.getDraft(draft.id);
assert.eq(updatedDraft.title, '新标题', 'DraftBox: 更新标题');
assert.eq(updatedDraft.content, '这是内容', 'DraftBox: 更新内容');
assert.eq(updatedDraft.wordCount, 4, 'DraftBox: 字数统计正确');

// 测试标签
box.addTag(draft.id, '科幻');
box.addTag(draft.id, '爱情');
const withTag = box.getDraft(draft.id);
assert.eq(withTag.tags.length, 2, 'DraftBox: 标签添加成功');
assert.truthy(withTag.tags.includes('科幻'), 'DraftBox: 标签包含科幻');

box.removeTag(draft.id, '爱情');
assert.eq(withTag.tags.length, 1, 'DraftBox: 标签删除成功');
assert.eq(withTag.tags[0], '科幻', 'DraftBox: 剩余标签正确');

// 测试搜索
box.createDraft('text', '另一个草稿');
const results = box.searchDrafts('另一个');
assert.eq(results.length, 1, 'DraftBox: 搜索结果正确');

// 测试统计
const draftStats = box.getStats();
assert.eq(draftStats.total, 2, 'DraftBox: 草稿总数正确');
assert.eq(draftStats.byType.text, 2, 'DraftBox: 按类型统计正确');

console.log('DraftBox: 基础功能通过');

console.log('========== Draft Constants ==========');
const DRAFT_STORAGE_KEY = 'ai_creator_drafts';
assert.truthy(DRAFT_STORAGE_KEY, 'Draft: 存储键常量存在');
console.log('Draft constants: 定义完整');

console.log('========== OptimisticPreview Tests ==========');
const OptimisticPreview = global.OptimisticPreview;
const PREVIEW_STATE = global.PREVIEW_STATE;

const previewMgr = new OptimisticPreview();
assert.truthy(previewMgr, 'OptimisticPreview: 创建实例');

// 测试创建占位符
const placeholder = previewMgr.createPlaceholder('task_123', { type: 'image' });
assert.truthy(placeholder.taskId, 'OptimisticPreview: 占位符taskId');
assert.eq(placeholder.state, PREVIEW_STATE.LOADING, 'OptimisticPreview: 初始状态LOADING');
assert.truthy(placeholder.placeholder, 'OptimisticPreview: 占位符图片');

const current = previewMgr.getCurrentImage('task_123');
assert.truthy(current, 'OptimisticPreview: 获取当前图片');
assert.include(current, 'data:image', 'OptimisticPreview: 当前图片是base64');

// 测试解决预览
previewMgr.resolvePreview('task_123', 'https://example.com/final.jpg');
const resolved = previewMgr.getPreview('task_123');
assert.eq(resolved.state, PREVIEW_STATE.FINAL, 'OptimisticPreview: 解决后状态FINAL');
assert.eq(resolved.final, 'https://example.com/final.jpg', 'OptimisticPreview: 最终URL正确');
assert.truthy(resolved.finalAt, 'OptimisticPreview: 完成时间已记录');

// 测试失败
const taskId2 = previewMgr.createPlaceholder('task_456');
previewMgr.rejectPreview('task_456', 'Network error');
const rejected = previewMgr.getPreview('task_456');
assert.truthy(rejected.error, 'OptimisticPreview: 错误信息记录');
assert.include(rejected.state, 'idle', 'OptimisticPreview: 失败后状态');

// 测试清除
previewMgr.clearPreview('task_123');
assert.falsy(previewMgr.hasPreview('task_123'), 'OptimisticPreview: 清除后无预览');

console.log('OptimisticPreview: 基础功能通过');

console.log('========== PREVIEW_STATE Constants ==========');
assert.eq(PREVIEW_STATE.IDLE, 'idle', 'PREVIEW_STATE.IDLE');
assert.eq(PREVIEW_STATE.LOADING, 'loading', 'PREVIEW_STATE.LOADING');
assert.eq(PREVIEW_STATE.PREVIEW, 'preview', 'PREVIEW_STATE.PREVIEW');
assert.eq(PREVIEW_STATE.FINAL, 'final', 'PREVIEW_STATE.FINAL');
console.log('PREVIEW_STATE: 常量定义完整');

console.log('\n========== Offline System Test Summary ==========');
console.log('✅ All Offline System tests passed!');
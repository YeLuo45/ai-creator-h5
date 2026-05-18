/**
 * Time Travel Service v11
 * 时间旅行服务 - 快照管理和状态回溯
 */
class TimeTravel {
  constructor(executionTracer) {
    this.executionTracer = executionTracer;
    this.snapshots = []; // { index, timestamp, state, description }
    this.maxSnapshots = 50;
  }

  // 快照管理
  takeSnapshot(timestamp = Date.now(), state = null, description = '') {
    const snapshot = {
      index: this.snapshots.length,
      timestamp,
      state: state ? JSON.parse(JSON.stringify(state)) : null,
      description
    };

    this.snapshots.push(snapshot);

    // 限制快照数量
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
      // 重新索引
      this.snapshots.forEach((s, i) => s.index = i);
    }

    console.log('[TimeTravel] Snapshot taken:', snapshot.index, description);
    return snapshot;
  }

  getSnapshot(index) {
    return this.snapshots[index] || null;
  }

  getSnapshotCount() {
    return this.snapshots.length;
  }

  getAllSnapshots() {
    return [...this.snapshots];
  }

  clearSnapshots() {
    this.snapshots = [];
    console.log('[TimeTravel] All snapshots cleared');
  }

  // 时间旅行
  travelTo(index) {
    const snapshot = this.getSnapshot(index);
    if (!snapshot) {
      console.warn('[TimeTravel] Snapshot not found:', index);
      return null;
    }

    console.log('[TimeTravel] Traveling to snapshot:', index);
    return snapshot.state;
  }

  getStateAt(index) {
    const snapshot = this.getSnapshot(index);
    return snapshot ? snapshot.state : null;
  }

  // 获取最近的快照
  getLatestSnapshot() {
    if (this.snapshots.length === 0) return null;
    return this.snapshots[this.snapshots.length - 1];
  }

  // 变更分析
  diff(indexA, indexB) {
    const snapshotA = this.getSnapshot(indexA);
    const snapshotB = this.getSnapshot(indexB);

    if (!snapshotA || !snapshotB) {
      console.warn('[TimeTravel] One or both snapshots not found for diff');
      return null;
    }

    const stateA = snapshotA.state || {};
    const stateB = snapshotB.state || {};

    const diff = {
      added: {},
      removed: {},
      changed: {},
      unchanged: {}
    };

    // 找出新增的键
    for (const key in stateB) {
      if (!(key in stateA)) {
        diff.added[key] = stateB[key];
      }
    }

    // 找出删除的键
    for (const key in stateA) {
      if (!(key in stateB)) {
        diff.removed[key] = stateA[key];
      }
    }

    // 找出变化的键
    for (const key in stateA) {
      if (key in stateB) {
        if (JSON.stringify(stateA[key]) !== JSON.stringify(stateB[key])) {
          diff.changed[key] = {
            old: stateA[key],
            new: stateB[key]
          };
        } else {
          diff.unchanged[key] = stateA[key];
        }
      }
    }

    return diff;
  }

  // 根据执行轨迹创建快照
  createSnapshotFromTrace(description = '') {
    if (!this.executionTracer) return null;

    const currentState = {
      trace: this.executionTracer.getTrace(),
      executionPath: this.executionTracer.getExecutionPath(),
      stats: this.executionTracer.getStats()
    };

    return this.takeSnapshot(Date.now(), currentState, description);
  }

  // 从快照恢复执行轨迹
  restoreTraceFromSnapshot(index) {
    const snapshot = this.getSnapshot(index);
    if (!snapshot || !snapshot.state || !snapshot.state.trace) {
      return null;
    }

    return snapshot.state.trace;
  }
}

// 导出
window.TimeTravel = TimeTravel;
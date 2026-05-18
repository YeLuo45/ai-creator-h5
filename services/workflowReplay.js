/**
 * WorkflowReplay - 操作回放系统 v22
 * 记录操作序列、时间线回放、快进/快退/暂停、步骤注释
 */
class WorkflowReplay {
  constructor() {
    this.RECORD_KEY = 'workflow_replay_records';
    this.MAX_STEPS = 500;
    this.MAX_RECORDS = 50;
    
    this.currentRecord = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackSpeed = 1; // 1x, 2x, 4x, 8x
    this.currentStepIndex = 0;
    this.playbackTimer = null;
    this.stepCallbacks = [];
  }

  /**
   * 开始新录制
   * @param {string} workflowId - 工作流ID
   * @param {string} workflowName - 工作流名称
   */
  startRecording(workflowId, workflowName = '未命名') {
    this.stopRecording();
    
    this.currentRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      workflowId,
      workflowName,
      startTime: Date.now(),
      endTime: null,
      steps: [],
      annotations: {}, // stepIndex -> annotation
      duration: 0,
      isComplete: false
    };
    
    console.log('[WorkflowReplay] Recording started:', this.currentRecord.id);
    return this.currentRecord.id;
  }

  /**
   * 停止录制
   */
  stopRecording() {
    if (this.currentRecord && !this.currentRecord.isComplete) {
      this.currentRecord.endTime = Date.now();
      this.currentRecord.duration = this.currentRecord.endTime - this.currentRecord.startTime;
      this.currentRecord.isComplete = true;
      this._saveRecord(this.currentRecord);
      console.log('[WorkflowReplay] Recording stopped:', this.currentRecord.id);
    }
    this.currentRecord = null;
    this._stopPlayback();
  }

  /**
   * 记录操作步骤
   * @param {string} action - 操作类型
   * @param {Object} data - 操作数据
   * @param {string} description - 操作描述
   */
  recordStep(action, data = {}, description = '') {
    if (!this.currentRecord || this.currentRecord.isComplete) {
      console.warn('[WorkflowReplay] No active recording');
      return null;
    }
    
    const step = {
      index: this.currentRecord.steps.length,
      timestamp: Date.now(),
      relativeTime: this.currentRecord.steps.length > 0 
        ? Date.now() - this.currentRecord.startTime 
        : 0,
      action,
      data: JSON.parse(JSON.stringify(data)),
      description: description || this._getDefaultDescription(action)
    };
    
    this.currentRecord.steps.push(step);
    
    // 限制步骤数量
    if (this.currentRecord.steps.length > this.MAX_STEPS) {
      this.currentRecord.steps.shift();
      // 重新索引
      this.currentRecord.steps.forEach((s, i) => s.index = i);
    }
    
    // 触发步骤回调
    this._notifyStepCallbacks(step);
    
    return step;
  }

  /**
   * 添加步骤注释
   */
  addAnnotation(stepIndex, annotation) {
    if (!this.currentRecord) return false;
    
    this.currentRecord.annotations[stepIndex] = {
      text: annotation,
      createdAt: Date.now()
    };
    
    return true;
  }

  /**
   * 获取默认描述
   */
  _getDefaultDescription(action) {
    const descriptions = {
      'create_node': '创建节点',
      'delete_node': '删除节点',
      'move_node': '移动节点',
      'resize_node': '调整节点大小',
      'configure_node': '配置节点',
      'connect': '创建连接',
      'disconnect': '断开连接',
      'select_node': '选中节点',
      'deselect': '取消选中',
      'run_workflow': '运行工作流',
      'pause_workflow': '暂停工作流',
      'stop_workflow': '停止工作流',
      'save_workflow': '保存工作流',
      'load_workflow': '加载工作流',
      'undo': '撤销',
      'redo': '重做',
      'paste': '粘贴',
      'cut': '剪切',
      'copy': '复制',
      'delete_selection': '删除选中'
    };
    return descriptions[action] || action;
  }

  /**
   * 开始播放
   */
  play(recordId = null, startStep = 0) {
    let record;
    
    if (recordId) {
      record = this._getRecord(recordId);
      if (!record) {
        console.error('[WorkflowReplay] Record not found:', recordId);
        return false;
      }
    } else if (this.currentRecord && !this.currentRecord.isComplete) {
      record = this.currentRecord;
    } else {
      console.error('[WorkflowReplay] No record to play');
      return false;
    }
    
    this._stopPlayback();
    this.isPlaying = true;
    this.isPaused = false;
    this.currentRecord = record;
    this.currentStepIndex = startStep;
    
    this._startPlaybackTimer();
    this._notifyPlayStateChange();
    
    console.log('[WorkflowReplay] Playing:', record.id);
    return true;
  }

  /**
   * 暂停
   */
  pause() {
    if (!this.isPlaying) return;
    
    this.isPaused = true;
    this._stopPlaybackTimer();
    this._notifyPlayStateChange();
  }

  /**
   * 继续播放
   */
  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    
    this.isPaused = false;
    this._startPlaybackTimer();
    this._notifyPlayStateChange();
  }

  /**
   * 停止播放
   */
  stop() {
    this._stopPlayback();
    this.currentStepIndex = 0;
    this._notifyPlayStateChange();
  }

  /**
   * 快进
   */
  fastForward() {
    const speeds = [1, 2, 4, 8];
    const currentIdx = speeds.indexOf(this.playbackSpeed);
    this.playbackSpeed = speeds[Math.min(currentIdx + 1, speeds.length - 1)];
    
    if (this.isPlaying && !this.isPaused) {
      this._stopPlaybackTimer();
      this._startPlaybackTimer();
    }
    
    this._notifySpeedChange();
    return this.playbackSpeed;
  }

  /**
   * 快退
   */
  rewind() {
    const speeds = [1, 2, 4, 8];
    const currentIdx = speeds.indexOf(this.playbackSpeed);
    this.playbackSpeed = speeds[Math.max(currentIdx - 1, 0)];
    
    if (this.isPlaying && !this.isPaused) {
      this._stopPlaybackTimer();
      this._startPlaybackTimer();
    }
    
    this._notifySpeedChange();
    return this.playbackSpeed;
  }

  /**
   * 跳到指定步骤
   */
  seekTo(stepIndex) {
    if (!this.currentRecord) return false;
    
    this.currentStepIndex = Math.max(0, Math.min(stepIndex, this.currentRecord.steps.length - 1));
    this._notifySeek();
    
    return true;
  }

  /**
   * 下一步
   */
  nextStep() {
    if (!this.currentRecord) return false;
    
    if (this.currentStepIndex < this.currentRecord.steps.length - 1) {
      this.currentStepIndex++;
      this._notifyStepChange();
      return true;
    }
    return false;
  }

  /**
   * 上一步
   */
  previousStep() {
    if (!this.currentRecord) return false;
    
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this._notifyStepChange();
      return true;
    }
    return false;
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep() {
    if (!this.currentRecord || this.currentRecord.steps.length === 0) {
      return null;
    }
    return this.currentRecord.steps[this.currentStepIndex] || null;
  }

  /**
   * 获取回放记录列表
   */
  getRecordList() {
    try {
      const records = JSON.parse(localStorage.getItem(this.RECORD_KEY)) || [];
      return records.sort((a, b) => b.startTime - a.startTime);
    } catch {
      return [];
    }
  }

  /**
   * 获取指定记录
   */
  _getRecord(recordId) {
    const records = this.getRecordList();
    return records.find(r => r.id === recordId) || null;
  }

  /**
   * 保存记录
   */
  _saveRecord(record) {
    const records = this.getRecordList();
    
    // 检查是否已存在
    const existingIdx = records.findIndex(r => r.id === record.id);
    if (existingIdx >= 0) {
      records[existingIdx] = record;
    } else {
      records.unshift(record);
    }
    
    // 限制记录数量
    if (records.length > this.MAX_RECORDS) {
      records.splice(this.MAX_RECORDS);
    }
    
    localStorage.setItem(this.RECORD_KEY, JSON.stringify(records));
  }

  /**
   * 删除记录
   */
  deleteRecord(recordId) {
    const records = this.getRecordList();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      records.splice(idx, 1);
      localStorage.setItem(this.RECORD_KEY, JSON.stringify(records));
      return true;
    }
    return false;
  }

  /**
   * 清空所有记录
   */
  clearAllRecords() {
    localStorage.removeItem(this.RECORD_KEY);
  }

  /**
   * 开始播放定时器
   */
  _startPlaybackTimer() {
    this._stopPlaybackTimer();
    
    if (!this.currentRecord || this.currentRecord.steps.length === 0) return;
    
    const step = () => {
      if (this.isPaused) return;
      
      if (this.currentStepIndex < this.currentRecord.steps.length - 1) {
        this.currentStepIndex++;
        this._notifyStepChange();
        
        // 计算到下一步的时间间隔
        const nextStep = this.currentRecord.steps[this.currentStepIndex + 1];
        if (nextStep) {
          const delay = Math.max(100, (nextStep.relativeTime - this.currentRecord.steps[this.currentStepIndex].relativeTime) / this.playbackSpeed);
          this.playbackTimer = setTimeout(step, delay);
        }
      } else {
        // 回放完成
        this.isPlaying = false;
        this._notifyPlayStateChange();
      }
    };
    
    // 启动
    const firstStep = this.currentRecord.steps[this.currentStepIndex + 1];
    if (firstStep) {
      const delay = Math.max(100, (firstStep.relativeTime - this.currentRecord.steps[this.currentStepIndex].relativeTime) / this.playbackSpeed);
      this.playbackTimer = setTimeout(step, delay);
    }
  }

  /**
   * 停止播放定时器
   */
  _stopPlaybackTimer() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  /**
   * 停止播放
   */
  _stopPlayback() {
    this.isPlaying = false;
    this.isPaused = false;
    this._stopPlaybackTimer();
  }

  /**
   * 注册步骤回调
   */
  onStep(callback) {
    this.stepCallbacks.push(callback);
  }

  /**
   * 移除步骤回调
   */
  offStep(callback) {
    this.stepCallbacks = this.stepCallbacks.filter(cb => cb !== callback);
  }

  /**
   * 通知步骤变化
   */
  _notifyStepCallbacks(step) {
    this.stepCallbacks.forEach(cb => {
      try {
        cb(step);
      } catch (e) {
        console.error('[WorkflowReplay] Step callback error:', e);
      }
    });
  }

  /**
   * 通知步骤变化
   */
  _notifyStepChange() {
    const step = this.getCurrentStep();
    document.dispatchEvent(new CustomEvent('replayStepChange', { 
      detail: { step, index: this.currentStepIndex }
    }));
    this._notifyStepCallbacks(step);
  }

  /**
   * 通知播放状态变化
   */
  _notifyPlayStateChange() {
    document.dispatchEvent(new CustomEvent('replayPlayStateChange', { 
      detail: { 
        isPlaying: this.isPlaying, 
        isPaused: this.isPaused,
        record: this.currentRecord
      }
    }));
  }

  /**
   * 通知速度变化
   */
  _notifySpeedChange() {
    document.dispatchEvent(new CustomEvent('replaySpeedChange', { 
      detail: { speed: this.playbackSpeed }
    }));
  }

  /**
   * 通知跳转
   */
  _notifySeek() {
    const step = this.getCurrentStep();
    document.dispatchEvent(new CustomEvent('replaySeek', { 
      detail: { step, index: this.currentStepIndex }
    }));
    this._notifyStepCallbacks(step);
  }

  /**
   * 导出记录
   */
  exportRecord(recordId) {
    const record = this._getRecord(recordId);
    if (!record) return null;
    
    return {
      ...record,
      exportedAt: Date.now(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * 导入记录
   */
  importRecord(data) {
    if (!data.id || !data.steps) return false;
    
    const records = this.getRecordList();
    const existingIdx = records.findIndex(r => r.id === data.id);
    
    if (existingIdx >= 0) {
      records[existingIdx] = data;
    } else {
      records.unshift(data);
    }
    
    localStorage.setItem(this.RECORD_KEY, JSON.stringify(records));
    return true;
  }

  /**
   * 获取回放状态
   */
  getState() {
    return {
      isRecording: this.currentRecord !== null && !this.currentRecord.isComplete,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      playbackSpeed: this.playbackSpeed,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.currentRecord ? this.currentRecord.steps.length : 0,
      currentRecordId: this.currentRecord ? this.currentRecord.id : null
    };
  }
}

// 导出
window.WorkflowReplay = WorkflowReplay;

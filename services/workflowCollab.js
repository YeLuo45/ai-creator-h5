/**
 * WorkflowCollab - 协作状态服务
 * 使用 localStorage + BroadcastChannel 模拟实时协作
 */
class WorkflowCollab {
  constructor() {
    this.SESSION_KEY = 'workflow_collab_sessions';
    this.LOCK_KEY = 'workflow_collab_locks';
    this.EVENTS_KEY = 'workflow_collab_events';
    this._callbacks = {};
    this._init();
  }

  /**
   * 初始化
   */
  _init() {
    // 尝试使用 BroadcastChannel 进行跨标签页通信
    if (typeof BroadcastChannel !== 'undefined') {
      this._channel = new BroadcastChannel('workflow_collab');
      this._channel.onmessage = (e) => this._handleBroadcast(e.data);
    }

    // 定期检查过期会话
    setInterval(() => this._cleanupExpiredSessions(), 30000);
  }

  /**
   * 加入协作会话
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @param {string} userName - 用户名
   * @returns {Object} 会话信息
   */
  joinSession(workflowId, userId, userName) {
    const session = {
      workflowId,
      userId,
      userName,
      joinedAt: Date.now(),
      lastActive: Date.now()
    };

    const sessions = this._getSessions();
    // 移除旧会话
    const filtered = sessions.filter(s => !(s.workflowId === workflowId && s.userId === userId));
    filtered.push(session);
    this._saveSessions(filtered);

    // 广播用户加入事件
    this._broadcastEvent({
      type: COLLAB_EVENTS.USER_JOIN,
      workflowId,
      userId,
      userName,
      timestamp: Date.now()
    });

    return session;
  }

  /**
   * 离开协作会话
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   */
  leaveSession(workflowId, userId) {
    const sessions = this._getSessions();
    const session = sessions.find(s => s.workflowId === workflowId && s.userId === userId);
    
    if (session) {
      // 移除会话
      this._saveSessions(sessions.filter(s => !(s.workflowId === workflowId && s.userId === userId)));
      
      // 解锁该用户的所有节点
      this._unlockAllByUser(userId);

      // 广播用户离开事件
      this._broadcastEvent({
        type: COLLAB_EVENTS.USER_LEAVE,
        workflowId,
        userId,
        userName: session.userName,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 获取在线用户
   * @param {string} workflowId - 工作流ID
   * @returns {Array} 用户列表
   */
  getActiveUsers(workflowId) {
    const sessions = this._getSessions();
    const now = Date.now();
    
    return sessions
      .filter(s => s.workflowId === workflowId && (now - s.lastActive < 60000))
      .map(s => ({
        userId: s.userId,
        userName: s.userName,
        joinedAt: s.joinedAt
      }));
  }

  /**
   * 锁定节点
   * @param {string} nodeId - 节点ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否成功
   */
  lockNode(nodeId, userId) {
    const locks = this._getLocks();
    const existing = locks.find(l => l.nodeId === nodeId);
    
    if (existing && existing.userId !== userId) {
      // 节点已被其他用户锁定
      return false;
    }

    // 移除该用户的其他锁
    const filtered = locks.filter(l => l.userId !== userId);
    filtered.push({
      nodeId,
      userId,
      lockedAt: Date.now()
    });
    
    this._saveLocks(filtered);

    // 广播节点锁定事件
    const userName = this._getUserName(userId);
    this._broadcastEvent({
      type: COLLAB_EVENTS.NODE_LOCK,
      nodeId,
      userId,
      userName,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * 解锁节点
   * @param {string} nodeId - 节点ID
   */
  unlockNode(nodeId) {
    const locks = this._getLocks();
    const lock = locks.find(l => l.nodeId === nodeId);
    
    if (lock) {
      this._saveLocks(locks.filter(l => l.nodeId !== nodeId));
      
      // 广播节点解锁事件
      this._broadcastEvent({
        type: COLLAB_EVENTS.NODE_UNLOCK,
        nodeId,
        userId: lock.userId,
        userName: this._getUserName(lock.userId),
        timestamp: Date.now()
      });
    }
  }

  /**
   * 节点是否被锁定
   * @param {string} nodeId - 节点ID
   * @returns {boolean}
   */
  isNodeLocked(nodeId) {
    const locks = this._getLocks();
    const lock = locks.find(l => l.nodeId === nodeId);
    
    if (!lock) return false;
    
    // 锁定期30秒，过期自动解锁
    if (Date.now() - lock.lockedAt > 30000) {
      this.unlockNode(nodeId);
      return false;
    }
    
    return true;
  }

  /**
   * 获取锁定者
   * @param {string} nodeId - 节点ID
   * @returns {Object|null} 锁定者信息
   */
  getLocker(nodeId) {
    const locks = this._getLocks();
    const lock = locks.find(l => l.nodeId === nodeId);
    
    if (!lock) return null;
    
    return {
      userId: lock.userId,
      userName: this._getUserName(lock.userId),
      lockedAt: lock.lockedAt
    };
  }

  /**
   * 广播事件
   * @param {Object} event - 事件对象
   */
  broadcastEvent(event) {
    this._broadcastEvent(event);
  }

  /**
   * 用户加入回调
   * @param {Function} callback - 回调函数
   */
  onUserJoin(callback) {
    this._addCallback('userJoin', callback);
  }

  /**
   * 用户离开回调
   * @param {Function} callback - 回调函数
   */
  onUserLeave(callback) {
    this._addCallback('userLeave', callback);
  }

  /**
   * 节点锁定回调
   * @param {Function} callback - 回调函数
   */
  onNodeLocked(callback) {
    this._addCallback('nodeLocked', callback);
  }

  /**
   * 添加回调
   * @param {string} event - 事件名
   * @param {Function} callback - 回调
   */
  _addCallback(event, callback) {
    if (!this._callbacks[event]) {
      this._callbacks[event] = [];
    }
    this._callbacks[event].push(callback);
  }

  /**
   * 触发回调
   * @param {string} event - 事件名
   * @param {Object} data - 数据
   */
  _triggerCallback(event, data) {
    const callbacks = this._callbacks[event] || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error('Collab callback error:', e);
      }
    });
  }

  /**
   * 广播事件
   * @param {Object} event - 事件
   */
  _broadcastEvent(event) {
    // 存储到 localStorage
    const events = this._getEvents();
    events.push({ ...event, _id: Date.now() + '_' + Math.random().toString(36).slice(2, 8) });
    // 只保留最近100个事件
    if (events.length > 100) events.splice(0, events.length - 100);
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));

    // 通过 BroadcastChannel 发送
    if (this._channel) {
      this._channel.postMessage(event);
    }
  }

  /**
   * 处理广播消息
   * @param {Object} event - 事件
   */
  _handleBroadcast(event) {
    // 触发相应回调
    switch (event.type) {
      case COLLAB_EVENTS.USER_JOIN:
        this._triggerCallback('userJoin', event);
        break;
      case COLLAB_EVENTS.USER_LEAVE:
        this._triggerCallback('userLeave', event);
        break;
      case COLLAB_EVENTS.NODE_LOCK:
        this._triggerCallback('nodeLocked', event);
        break;
      case COLLAB_EVENTS.NODE_UNLOCK:
        this._triggerCallback('nodeUnlocked', event);
        break;
      case COLLAB_EVENTS.WORKFLOW_UPDATE:
        this._triggerCallback('workflowUpdate', event);
        break;
    }
  }

  /**
   * 获取会话列表
   * @returns {Array}
   */
  _getSessions() {
    try {
      return JSON.parse(localStorage.getItem(this.SESSION_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存会话列表
   * @param {Array} sessions
   */
  _saveSessions(sessions) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessions));
  }

  /**
   * 获取锁列表
   * @returns {Array}
   */
  _getLocks() {
    try {
      return JSON.parse(localStorage.getItem(this.LOCK_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存锁列表
   * @param {Array} locks
   */
  _saveLocks(locks) {
    localStorage.setItem(this.LOCK_KEY, JSON.stringify(locks));
  }

  /**
   * 获取事件列表
   * @returns {Array}
   */
  _getEvents() {
    try {
      return JSON.parse(localStorage.getItem(this.EVENTS_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 获取用户名
   * @param {string} userId
   * @returns {string}
   */
  _getUserName(userId) {
    if (userId === this._getCurrentUserId()) {
      return localStorage.getItem('workflow_user_name') || '我';
    }
    return '用户_' + userId.slice(-4);
  }

  /**
   * 获取当前用户ID
   * @returns {string}
   */
  _getCurrentUserId() {
    let user = localStorage.getItem('workflow_current_user');
    if (!user) {
      user = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('workflow_current_user', user);
    }
    return user;
  }

  /**
   * 清理过期会话
   */
  _cleanupExpiredSessions() {
    const sessions = this._getSessions();
    const now = Date.now();
    const active = sessions.filter(s => now - s.lastActive < 60000);
    
    if (active.length !== sessions.length) {
      this._saveSessions(active);
    }
  }

  /**
   * 解锁用户的所有节点
   * @param {string} userId
   */
  _unlockAllByUser(userId) {
    const locks = this._getLocks();
    const userLocks = locks.filter(l => l.userId === userId);
    
    userLocks.forEach(lock => {
      this._broadcastEvent({
        type: COLLAB_EVENTS.NODE_UNLOCK,
        nodeId: lock.nodeId,
        userId,
        userName: this._getUserName(userId),
        timestamp: Date.now()
      });
    });
    
    this._saveLocks(locks.filter(l => l.userId !== userId));
  }
}

// 协作事件类型常量
const COLLAB_EVENTS = {
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  NODE_LOCK: 'node_lock',
  NODE_UNLOCK: 'node_unlock',
  WORKFLOW_UPDATE: 'workflow_update'
};

// 导出
window.WorkflowCollab = WorkflowCollab;
window.COLLAB_EVENTS = COLLAB_EVENTS;
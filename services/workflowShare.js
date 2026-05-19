/**
 * WorkflowShare - 分享与权限服务
 * 使用 localStorage 模拟多用户协作（无需后端）
 */
class WorkflowShare {
  constructor() {
    this.SHARE_KEY = 'workflow_shares';
    this.PERMISSION_KEY = 'workflow_permissions';
  }

  /**
   * 生成分享链接
   * @param {string} workflowId - 工作流ID
   * @param {string} permission - 权限级别 ('view' | 'edit')
   * @param {number} expiresIn - 有效期（毫秒），0 表示永不过期
   * @returns {string} 分享令牌
   */
  generateShareLink(workflowId, permission = 'view', expiresIn = 7 * 24 * 60 * 60 * 1000) {
    const token = this._generateToken();
    const share = {
      id: 'share_' + Date.now(),
      token,
      workflowId,
      permission,
      createdAt: Date.now(),
      expiresAt: expiresIn > 0 ? Date.now() + expiresIn : 0,
      creatorId: this._getCurrentUserId()
    };

    const shares = this._getShares();
    shares.push(share);
    this._saveShares(shares);

    return token;
  }

  /**
   * 验证分享令牌
   * @param {string} token - 分享令牌
   * @returns {Object|null} 分享信息或null
   */
  validateShareToken(token) {
    const shares = this._getShares();
    const share = shares.find(s => s.token === token);
    
    if (!share) return null;
    
    // 检查是否过期
    if (share.expiresAt > 0 && Date.now() > share.expiresAt) {
      return null;
    }

    return share;
  }

  /**
   * 获取分享列表
   * @param {string} workflowId - 工作流ID
   * @returns {Array} 分享列表
   */
  getShareList(workflowId) {
    const shares = this._getShares();
    return shares.filter(s => s.workflowId === workflowId);
  }

  /**
   * 撤销分享
   * @param {string} shareId - 分享ID
   * @returns {boolean} 是否成功
   */
  revokeShare(shareId) {
    const shares = this._getShares();
    const index = shares.findIndex(s => s.id === shareId);
    
    if (index === -1) return false;
    
    shares.splice(index, 1);
    this._saveShares(shares);
    return true;
  }

  /**
   * 检查用户权限
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @returns {string|null} 权限级别或null
   */
  checkPermission(workflowId, userId) {
    const permissions = this._getPermissions();
    const perm = permissions.find(p => p.workflowId === workflowId && p.userId === userId);
    return perm ? perm.level : null;
  }

  /**
   * 获取权限级别
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @returns {string} 'owner' | 'edit' | 'view' | null
   */
  getPermissionLevel(workflowId, userId) {
    // 工作流创建者拥有 owner 权限
    const workflowData = this._getWorkflowData(workflowId);
    if (workflowData && workflowData.ownerId === userId) {
      return 'owner';
    }

    // 检查分享权限
    const share = this._getShareByWorkflowAndUser(workflowId, userId);
    if (share) {
      return share.permission;
    }

    // 检查直接权限配置
    return this.checkPermission(workflowId, userId);
  }

  /**
   * 是否可编辑
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @returns {boolean}
   */
  canEdit(workflowId, userId) {
    const level = this.getPermissionLevel(workflowId, userId);
    return level === 'owner' || level === 'edit';
  }

  /**
   * 是否可删除
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @returns {boolean}
   */
  canDelete(workflowId, userId) {
    const level = this.getPermissionLevel(workflowId, userId);
    return level === 'owner';
  }

  /**
   * 是否可分享
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @returns {boolean}
   */
  canShare(workflowId, userId) {
    const level = this.getPermissionLevel(workflowId, userId);
    return level === 'owner' || level === 'edit';
  }

  /**
   * 设置用户权限
   * @param {string} workflowId - 工作流ID
   * @param {string} userId - 用户ID
   * @param {string} level - 权限级别
   */
  setPermission(workflowId, userId, level) {
    const permissions = this._getPermissions();
    const existing = permissions.find(p => p.workflowId === workflowId && p.userId === userId);
    
    if (existing) {
      existing.level = level;
    } else {
      permissions.push({ workflowId, userId, level });
    }
    
    this._savePermissions(permissions);
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
   * 生成随机令牌
   * @returns {string}
   */
  _generateToken() {
    return 'tk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  }

  /**
   * 获取分享列表
   * @returns {Array}
   */
  _getShares() {
    try {
      return JSON.parse(localStorage.getItem(this.SHARE_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存分享列表
   * @param {Array} shares
   */
  _saveShares(shares) {
    localStorage.setItem(this.SHARE_KEY, JSON.stringify(shares));
  }

  /**
   * 获取权限列表
   * @returns {Array}
   */
  _getPermissions() {
    try {
      return JSON.parse(localStorage.getItem(this.PERMISSION_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存权限列表
   * @param {Array} permissions
   */
  _savePermissions(permissions) {
    localStorage.setItem(this.PERMISSION_KEY, JSON.stringify(permissions));
  }

  /**
   * 获取工作流数据（临时存储）
   * @param {string} workflowId
   * @returns {Object|null}
   */
  _getWorkflowData(workflowId) {
    try {
      const data = localStorage.getItem('workflow_data_' + workflowId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * 根据工作流和用户获取分享记录
   * @param {string} workflowId
   * @param {string} userId
   * @returns {Object|null}
   */
  _getShareByWorkflowAndUser(workflowId, userId) {
    const shares = this._getShares();
    return shares.find(s => s.workflowId === workflowId && s.creatorId === userId) || null;
  }
}

// 权限级别常量
const PERMISSION = {
  VIEW: 'view',
  EDIT: 'edit',
  OWNER: 'owner'
};

// 导出
window.WorkflowShare = WorkflowShare;
window.PERMISSION = PERMISSION;
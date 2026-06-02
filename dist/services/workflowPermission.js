/**
 * WorkflowPermission - 权限管理系统 v22
 * 多层级角色、节点级权限、继承/覆盖、申请/审批流程
 */
class WorkflowPermission {
  constructor() {
    this.PERMISSION_KEY = 'workflow_permissions';
    this.ROLE_KEY = 'workflow_roles';
    this.MAX_LOGS = 1000;
    
    // 角色层级
    this.ROLES = {
      OWNER: 'owner',     // 所有者 - 最高权限
      ADMIN: 'admin',     // 管理员 - 大部分权限
      EDITOR: 'editor',   // 编辑 - 可修改工作流
      VIEWER: 'viewer',   // 查看者 - 只读
      GUEST: 'guest'      // 访客 - 最低权限
    };
    
    // 角色权限矩阵
    this.ROLE_PERMISSIONS = {
      [this.ROLES.OWNER]: {
        all: true,
        view: true,
        edit: true,
        delete: true,
        share: true,
        managePermissions: true,
        execute: true,
        export: true,
        configureNodes: true,
        deleteNodes: true,
        createNodes: true
      },
      [this.ROLES.ADMIN]: {
        all: false,
        view: true,
        edit: true,
        delete: false,
        share: true,
        managePermissions: true,
        execute: true,
        export: true,
        configureNodes: true,
        deleteNodes: true,
        createNodes: true
      },
      [this.ROLES.EDITOR]: {
        all: false,
        view: true,
        edit: true,
        delete: false,
        share: false,
        managePermissions: false,
        execute: true,
        export: false,
        configureNodes: true,
        deleteNodes: true,
        createNodes: true
      },
      [this.ROLES.VIEWER]: {
        all: false,
        view: true,
        edit: false,
        delete: false,
        share: false,
        managePermissions: false,
        execute: false,
        export: false,
        configureNodes: false,
        deleteNodes: false,
        createNodes: false
      },
      [this.ROLES.GUEST]: {
        all: false,
        view: true,
        edit: false,
        delete: false,
        share: false,
        managePermissions: false,
        execute: false,
        export: false,
        configureNodes: false,
        deleteNodes: false,
        createNodes: false
      }
    };
  }

  /**
   * 初始化权限系统
   */
  init() {
    this._ensureDefaultRoles();
    console.log('[WorkflowPermission] Initialized');
  }

  /**
   * 确保默认角色存在
   */
  _ensureDefaultRoles() {
    const roles = this._getRoles();
    if (roles.length === 0) {
      const defaultUser = this._getCurrentUser();
      const defaultRoles = [{
        id: 'role_owner',
        userId: defaultUser.id,
        userName: defaultUser.name,
        role: this.ROLES.OWNER,
        workflowId: 'default',
        isDefault: true,
        createdAt: Date.now()
      }];
      this._saveRoles(defaultRoles);
    }
  }

  /**
   * 获取当前用户
   */
  _getCurrentUser() {
    let userId = localStorage.getItem('workflow_current_user');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('workflow_current_user', userId);
    }
    let userName = localStorage.getItem('workflow_user_name') || '用户' + userId.slice(-4);
    return { id: userId, name: userName };
  }

  /**
   * 检查用户权限
   * @param {string} permission - 权限名称
   * @param {string} workflowId - 工作流ID
   * @param {string} nodeId - 节点ID（可选，节点级权限）
   */
  hasPermission(permission, workflowId, nodeId = null) {
    const user = this._getCurrentUser();
    const roles = this._getRoles();
    
    // 查找用户在当前工作流的角色
    let userRole = roles.find(r => r.userId === user.id && r.workflowId === workflowId);
    
    // 如果没有找到工作流特定角色，查找默认角色
    if (!userRole) {
      userRole = roles.find(r => r.userId === user.id && r.isDefault);
    }
    
    if (!userRole) {
      // 默认作为访客
      return this.ROLE_PERMISSIONS[this.ROLES.GUEST][permission] || false;
    }
    
    // 检查节点级权限覆盖
    if (nodeId) {
      const nodeOverride = this._getNodePermissionOverride(workflowId, nodeId);
      if (nodeOverride && nodeOverride[user.id]) {
        return nodeOverride[user.id][permission] || false;
      }
    }
    
    const perms = this.ROLE_PERMISSIONS[userRole.role] || {};
    return perms[permission] || perms.all || false;
  }

  /**
   * 获取用户在某个工作流的角色
   */
  getUserRole(userId, workflowId) {
    const roles = this._getRoles();
    let role = roles.find(r => r.userId === userId && r.workflowId === workflowId);
    if (!role) {
      role = roles.find(r => r.userId === userId && r.isDefault);
    }
    return role ? role.role : this.ROLES.GUEST;
  }

  /**
   * 设置用户角色
   */
  setUserRole(userId, userName, workflowId, role) {
    const roles = this._getRoles();
    const existingIdx = roles.findIndex(r => r.userId === userId && r.workflowId === workflowId);
    
    const roleEntry = {
      id: existingIdx >= 0 ? roles[existingIdx].id : 'role_' + Date.now(),
      userId,
      userName,
      role,
      workflowId,
      isDefault: false,
      createdAt: existingIdx >= 0 ? roles[existingIdx].createdAt : Date.now()
    };
    
    if (existingIdx >= 0) {
      roles[existingIdx] = roleEntry;
    } else {
      roles.push(roleEntry);
    }
    
    this._saveRoles(roles);
    
    // 记录审计日志
    this._logAction(userId, userName, 'assign_role', { workflowId, role });
    
    return roleEntry;
  }

  /**
   * 获取工作流的所有成员
   */
  getWorkflowMembers(workflowId) {
    const roles = this._getRoles();
    return roles.filter(r => r.workflowId === workflowId);
  }

  /**
   * 移除成员
   */
  removeMember(userId, workflowId) {
    const roles = this._getRoles();
    const idx = roles.findIndex(r => r.userId === userId && r.workflowId === workflowId);
    if (idx >= 0) {
      const removed = roles.splice(idx, 1)[0];
      this._saveRoles(roles);
      this._logAction(userId, removed.userName, 'remove_member', { workflowId });
      return true;
    }
    return false;
  }

  /**
   * 获取节点权限覆盖
   */
  _getNodePermissionOverride(workflowId, nodeId) {
    const perms = this._getPermissions();
    return perms.nodeOverrides?.[workflowId]?.[nodeId] || null;
  }

  /**
   * 设置节点级权限覆盖
   */
  setNodePermission(workflowId, nodeId, userId, permissions) {
    const perms = this._getPermissions();
    if (!perms.nodeOverrides) perms.nodeOverrides = {};
    if (!perms.nodeOverrides[workflowId]) perms.nodeOverrides[workflowId] = {};
    if (!perms.nodeOverrides[workflowId][nodeId]) perms.nodeOverrides[workflowId][nodeId] = {};
    
    perms.nodeOverrides[workflowId][nodeId][userId] = permissions;
    this._savePermissions(perms);
    
    const userName = this._getUserName(userId);
    this._logAction(userId, userName, 'set_node_permission', { workflowId, nodeId, permissions });
  }

  /**
   * 清除节点权限覆盖
   */
  clearNodePermission(workflowId, nodeId, userId) {
    const perms = this._getPermissions();
    if (perms.nodeOverrides?.[workflowId]?.[nodeId]?.[userId]) {
      delete perms.nodeOverrides[workflowId][nodeId][userId];
      this._savePermissions(perms);
      return true;
    }
    return false;
  }

  /**
   * 创建权限申请
   */
  createPermissionRequest(workflowId, requestedRole, reason = '') {
    const user = this._getCurrentUser();
    const requests = this._getRequests();
    
    // 检查是否有待处理的申请
    const existing = requests.find(r => 
      r.userId === user.id && 
      r.workflowId === workflowId && 
      r.status === 'pending'
    );
    
    if (existing) {
      return { success: false, message: '已有待处理的申请' };
    }
    
    const request = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: user.id,
      userName: user.name,
      workflowId,
      requestedRole,
      reason,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    requests.unshift(request);
    this._saveRequests(requests);
    
    this._logAction(user.id, user.name, 'request_permission', { 
      workflowId, 
      requestedRole, 
      reason 
    });
    
    return { success: true, request };
  }

  /**
   * 获取权限申请列表
   */
  getPermissionRequests(workflowId, status = null) {
    const requests = this._getRequests();
    let filtered = requests.filter(r => r.workflowId === workflowId);
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    return filtered;
  }

  /**
   * 审批权限申请
   */
  approveRequest(requestId, approverId, approverName, grantRole = null) {
    const requests = this._getRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    
    if (idx < 0) {
      return { success: false, message: '申请不存在' };
    }
    
    const request = requests[idx];
    if (request.status !== 'pending') {
      return { success: false, message: '申请已被处理' };
    }
    
    const roleToGrant = grantRole || request.requestedRole;
    
    // 更新申请状态
    requests[idx] = {
      ...request,
      status: 'approved',
      approverId,
      approverName,
      grantedRole: roleToGrant,
      updatedAt: Date.now()
    };
    
    // 授予角色
    this.setUserRole(request.userId, request.userName, request.workflowId, roleToGrant);
    
    this._saveRequests(requests);
    
    this._logAction(approverId, approverName, 'approve_permission', { 
      requestId, 
      workflowId: request.workflowId,
      grantedRole: roleToGrant 
    });
    
    return { success: true, request: requests[idx] };
  }

  /**
   * 拒绝权限申请
   */
  rejectRequest(requestId, rejecterId, rejecterName, reason = '') {
    const requests = this._getRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    
    if (idx < 0) {
      return { success: false, message: '申请不存在' };
    }
    
    if (requests[idx].status !== 'pending') {
      return { success: false, message: '申请已被处理' };
    }
    
    requests[idx] = {
      ...requests[idx],
      status: 'rejected',
      rejecterId,
      rejecterName,
      rejectionReason: reason,
      updatedAt: Date.now()
    };
    
    this._saveRequests(requests);
    
    this._logAction(rejecterId, rejecterName, 'reject_permission', { 
      requestId, 
      workflowId: requests[idx].workflowId,
      reason 
    });
    
    return { success: true, request: requests[idx] };
  }

  /**
   * 获取继承权限的工作流
   */
  getPermissionInheritance(workflowId) {
    const perms = this._getPermissions();
    return perms.inheritance?.[workflowId] || null;
  }

  /**
   * 设置权限继承
   */
  setPermissionInheritance(workflowId, parentWorkflowId) {
    const perms = this._getPermissions();
    if (!perms.inheritance) perms.inheritance = {};
    perms.inheritance[workflowId] = {
      parentWorkflowId,
      enabled: true,
      updatedAt: Date.now()
    };
    this._savePermissions(perms);
    
    this._logAction(this._getCurrentUser().id, this._getCurrentUser().name, 'set_inheritance', {
      workflowId,
      parentWorkflowId
    });
  }

  /**
   * 禁用权限继承
   */
  disablePermissionInheritance(workflowId) {
    const perms = this._getPermissions();
    if (perms.inheritance?.[workflowId]) {
      perms.inheritance[workflowId].enabled = false;
      perms.inheritance[workflowId].updatedAt = Date.now();
      this._savePermissions(perms);
      return true;
    }
    return false;
  }

  /**
   * 获取用户名称
   */
  _getUserName(userId) {
    const roles = this._getRoles();
    const role = roles.find(r => r.userId === userId);
    return role ? role.userName : '未知用户';
  }

  /**
   * 记录操作日志
   */
  _logAction(userId, userName, action, details = {}) {
    const logs = this._getLogs();
    logs.unshift({
      id: 'perm_log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId,
      userName,
      action,
      details,
      timestamp: Date.now()
    });
    
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }
    
    this._saveLogs(logs);
  }

  _getRoles() {
    try {
      return JSON.parse(localStorage.getItem(this.ROLE_KEY)) || [];
    } catch {
      return [];
    }
  }

  _saveRoles(roles) {
    localStorage.setItem(this.ROLE_KEY, JSON.stringify(roles));
  }

  _getPermissions() {
    try {
      return JSON.parse(localStorage.getItem(this.PERMISSION_KEY)) || {};
    } catch {
      return {};
    }
  }

  _savePermissions(perms) {
    localStorage.setItem(this.PERMISSION_KEY, JSON.stringify(perms));
  }

  _getRequests() {
    try {
      return JSON.parse(localStorage.getItem(this.PERMISSION_KEY + '_requests')) || [];
    } catch {
      return [];
    }
  }

  _saveRequests(requests) {
    localStorage.setItem(this.PERMISSION_KEY + '_requests', JSON.stringify(requests));
  }

  _getLogs() {
    try {
      return JSON.parse(localStorage.getItem(this.PERMISSION_KEY + '_logs')) || [];
    } catch {
      return [];
    }
  }

  _saveLogs(logs) {
    localStorage.setItem(this.PERMISSION_KEY + '_logs', JSON.stringify(logs));
  }

  /**
   * 导出权限配置
   */
  exportPermissions(workflowId) {
    const roles = this.getWorkflowMembers(workflowId);
    const perms = this._getPermissions();
    
    return {
      workflowId,
      exportedAt: Date.now(),
      roles,
      nodeOverrides: perms.nodeOverrides?.[workflowId] || {},
      inheritance: perms.inheritance?.[workflowId] || null
    };
  }

  /**
   * 导入权限配置
   */
  importPermissions(data) {
    if (data.roles) {
      const roles = this._getRoles();
      const wfRoles = roles.filter(r => r.workflowId !== data.workflowId);
      this._saveRoles([...wfRoles, ...data.roles]);
    }
    
    if (data.nodeOverrides) {
      const perms = this._getPermissions();
      if (!perms.nodeOverrides) perms.nodeOverrides = {};
      perms.nodeOverrides[data.workflowId] = data.nodeOverrides;
      this._savePermissions(perms);
    }
  }
}

// 权限常量
const PERMISSION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  GUEST: 'guest'
};

const PERMISSION_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  SHARE: 'share',
  MANAGE_PERMISSIONS: 'managePermissions',
  EXECUTE: 'execute',
  EXPORT: 'export',
  CONFIGURE_NODES: 'configureNodes',
  DELETE_NODES: 'deleteNodes',
  CREATE_NODES: 'createNodes'
};

// 导出
window.WorkflowPermission = WorkflowPermission;
window.PERMISSION_ROLES = PERMISSION_ROLES;
window.PERMISSION_ACTIONS = PERMISSION_ACTIONS;

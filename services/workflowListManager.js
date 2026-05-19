/**
 * Workflow List Manager Service v14
 * Multi-workflow management: list, tags, favorites, search, batch operations
 */
const WorkflowListManager = {
  // Preset tags with colors
  PRESET_TAGS: [
    { id: 'creation', name: '创作', color: '#6366F1' },
    { id: 'automation', name: '自动化', color: '#10B981' },
    { id: 'ai', name: 'AI', color: '#F59E0B' },
    { id: 'data', name: '数据处理', color: '#3B82F6' },
    { id: 'media', name: '媒体', color: '#EC4899' },
    { id: 'utility', name: '工具', color: '#8B5CF6' }
  ],

  // Storage key for custom tags
  CUSTOM_TAGS_KEY: 'workflow_custom_tags',

  // Get custom tags from localStorage
  getCustomTags() {
    try {
      return JSON.parse(localStorage.getItem(this.CUSTOM_TAGS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  // Save custom tags to localStorage
  saveCustomTags(tags) {
    localStorage.setItem(this.CUSTOM_TAGS_KEY, JSON.stringify(tags));
  },

  // Get all tags (preset + custom)
  getAllTags() {
    const custom = this.getCustomTags();
    return [...this.PRESET_TAGS, ...custom];
  },

  // Add a custom tag
  addCustomTag(name, color) {
    const tags = this.getCustomTags();
    const id = 'custom_' + Date.now();
    tags.push({ id, name, color });
    this.saveCustomTags(tags);
    return { id, name, color };
  },

  // Remove a custom tag
  removeCustomTag(tagId) {
    const tags = this.getCustomTags().filter(t => t.id !== tagId);
    this.saveCustomTags(tags);
  },

  // Get tag by ID
  getTagById(tagId) {
    return this.getAllTags().find(t => t.id === tagId);
  },

  // Get tag color by ID
  getTagColor(tagId) {
    const tag = this.getTagById(tagId);
    return tag ? tag.color : '#888888';
  },

  // Get all workflows with metadata from IndexedDB
  async getAllWorkflowsWithMeta() {
    const workflows = await WorkflowStorage.list();
    return workflows.map(w => ({
      ...w,
      // Ensure tags array exists
      tags: w.tags || [],
      // Ensure metadata exists
      isFavorite: w.isFavorite || false,
      isPinned: w.isPinned || false,
      createdAt: w.createdAt || w.updatedAt || Date.now(),
      updatedAt: w.updatedAt || Date.now()
    }));
  },

  // Toggle favorite status
  async toggleFavorite(workflowId) {
    const workflows = await WorkflowStorage.list();
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.isFavorite = !workflow.isFavorite;
      await WorkflowStorage.save(workflow);
      return workflow.isFavorite;
    }
    return false;
  },

  // Toggle pinned status
  async togglePinned(workflowId) {
    const workflows = await WorkflowStorage.list();
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.isPinned = !workflow.isPinned;
      await WorkflowStorage.save(workflow);
      return workflow.isPinned;
    }
    return false;
  },

  // Update workflow tags
  async updateTags(workflowId, tagIds) {
    const workflows = await WorkflowStorage.list();
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.tags = tagIds;
      await WorkflowStorage.save(workflow);
      return true;
    }
    return false;
  },

  // Duplicate a workflow
  async duplicateWorkflow(workflowId) {
    const workflows = await WorkflowStorage.list();
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      const duplicate = JSON.parse(JSON.stringify(workflow));
      duplicate.id = null; // New ID will be assigned
      duplicate.name = workflow.name + ' (副本)';
      duplicate.createdAt = Date.now();
      duplicate.updatedAt = Date.now();
      // Generate new node IDs
      const idMap = {};
      duplicate.nodes = duplicate.nodes.map(node => {
        const newId = 'n' + Date.now() + Math.random().toString(36).slice(2, 6);
        idMap[node.id] = newId;
        return { ...node, id: newId };
      });
      duplicate.connections = (duplicate.connections || []).map(conn => ({
        ...conn,
        from: idMap[conn.from] || conn.from,
        to: idMap[conn.to] || conn.to
      }));
      const newId = await WorkflowStorage.save(duplicate);
      return newId;
    }
    return null;
  },

  // Delete multiple workflows
  async batchDelete(workflowIds) {
    for (const id of workflowIds) {
      await WorkflowStorage.delete(id);
    }
  },

  // Batch update tags
  async batchUpdateTags(workflowIds, tagIds) {
    for (const id of workflowIds) {
      await this.updateTags(id, tagIds);
    }
  },

  // Export multiple workflows as JSON
  exportMultiple(workflows) {
    const json = JSON.stringify(workflows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflows_export_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  // Search workflows
  async searchWorkflows(query, options = {}) {
    const { tagFilter = null, sortBy = 'updatedAt', sortOrder = 'desc' } = options;
    let workflows = await this.getAllWorkflowsWithMeta();

    // Filter by tag
    if (tagFilter) {
      workflows = workflows.filter(w => w.tags && w.tags.includes(tagFilter));
    }

    // Search by name
    if (query && query.trim()) {
      const q = query.toLowerCase();
      workflows = workflows.filter(w =>
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q))
      );
    }

    // Sort
    workflows.sort((a, b) => {
      // Pinned always first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortBy === 'createdAt') {
        valA = a.createdAt;
        valB = b.createdAt;
      } else {
        valA = a.updatedAt;
        valB = b.updatedAt;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return workflows;
  },

  // Get top favorites (top 5)
  async getTopFavorites() {
    const workflows = await this.getAllWorkflowsWithMeta();
    return workflows
      .filter(w => w.isFavorite)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);
  },

  // Format relative time
  formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  },

  // Format full date
  formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Export for use
window.WorkflowListManager = WorkflowListManager;

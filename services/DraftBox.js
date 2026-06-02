'use strict';

/**
 * DraftBox - 草稿箱服务
 * 未完成的内容自动保存为草稿，支持继续编辑
 */

const DRAFT_STORAGE_KEY = 'ai_creator_drafts';

/**
 * 草稿项
 */
class Draft {
  constructor({ id, title, content, type, tags = [], createdAt = Date.now(), updatedAt = Date.now() }) {
    this.id = id || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.title = title || '未命名草稿';
    this.content = content || '';
    this.type = type || 'text'; // 'text' | 'image' | 'music' | 'tts' | 'code'
    this.tags = tags;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.wordCount = this._countWords(content);
  }
  
  _countWords(text) {
    if (!text) return 0;
    // 中文字符数 + 英文单词数
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const english = (text.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english;
  }
  
  update(content, title) {
    this.content = content;
    if (title !== undefined) this.title = title;
    this.updatedAt = Date.now();
    this.wordCount = this._countWords(content);
  }
  
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }
  
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  }
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      type: this.type,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      wordCount: this.wordCount
    };
  }
  
  static fromJSON(json) {
    const draft = new Draft(json);
    draft.updatedAt = json.updatedAt;
    draft.wordCount = json.wordCount || 0;
    return draft;
  }
}

/**
 * DraftBox - 草稿箱管理器
 */
class DraftBox {
  constructor() {
    this.drafts = [];
    this.autoSaveTimer = null;
    this.autoSaveInterval = 30000; // 30秒自动保存
    this.listeners = {};
    this._loadFromStorage();
  }
  
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.drafts = (data.drafts || []).map(d => Draft.fromJSON(d));
      }
    } catch (e) {
      this.drafts = [];
    }
  }
  
  _saveToStorage() {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        drafts: this.drafts.map(d => d.toJSON()),
        savedAt: Date.now()
      }));
    } catch (e) {
      console.error('DraftBox: Failed to save to storage', e);
    }
  }
  
  /**
   * 创建新草稿
   */
  createDraft(type = 'text', title = '未命名草稿') {
    const draft = new Draft({ title, type });
    this.drafts.unshift(draft);
    this._saveToStorage();
    this._emit('create', draft);
    return draft;
  }
  
  /**
   * 获取草稿
   */
  getDraft(id) {
    return this.drafts.find(d => d.id === id) || null;
  }
  
  /**
   * 获取所有草稿
   */
  getAllDrafts() {
    return this.drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * 按类型获取草稿
   */
  getDraftsByType(type) {
    return this.drafts.filter(d => d.type === type)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * 按标签获取草稿
   */
  getDraftsByTag(tag) {
    return this.drafts.filter(d => d.tags.includes(tag))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * 更新草稿
   */
  updateDraft(id, content, title) {
    const draft = this.getDraft(id);
    if (!draft) return null;
    
    draft.update(content, title);
    this._saveToStorage();
    this._emit('update', draft);
    return draft;
  }
  
  /**
   * 删除草稿
   */
  deleteDraft(id) {
    const index = this.drafts.findIndex(d => d.id === id);
    if (index === -1) return false;
    
    const draft = this.drafts[index];
    this.drafts.splice(index, 1);
    this._saveToStorage();
    this._emit('delete', draft);
    return true;
  }
  
  /**
   * 保存草稿（别名）
   */
  saveDraft(id, content, title) {
    return this.updateDraft(id, content, title);
  }
  
  /**
   * 搜索草稿
   */
  searchDrafts(query) {
    const q = query.toLowerCase();
    return this.drafts.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.content.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    ).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * 添加标签
   */
  addTag(draftId, tag) {
    const draft = this.getDraft(draftId);
    if (!draft) return false;

    draft.addTag(tag);
    this._saveToStorage();
    this._emit('tagAdd', draft);
    return true;
  }

  removeTag(draftId, tag) {
    const draft = this.getDraft(draftId);
    if (!draft) return false;

    draft.removeTag(tag);
    this._saveToStorage();
    this._emit('tagRemove', draft);
    return true;
  }
  
  /**
   * 获取草稿统计
   */
  getStats() {
    return {
      total: this.drafts.length,
      byType: {
        text: this.drafts.filter(d => d.type === 'text').length,
        image: this.drafts.filter(d => d.type === 'image').length,
        music: this.drafts.filter(d => d.type === 'music').length,
        tts: this.drafts.filter(d => d.type === 'tts').length,
        code: this.drafts.filter(d => d.type === 'code').length
      },
      totalWords: this.drafts.reduce((sum, d) => sum + d.wordCount, 0)
    };
  }
  
  /**
   * 开始自动保存
   */
  startAutoSave(draftId, getContentFn) {
    this.stopAutoSave(); // 先停止之前的
    
    this.autoSaveTimer = setInterval(() => {
      const draft = this.getDraft(draftId);
      if (draft) {
        const content = getContentFn();
        draft.update(content);
        this._saveToStorage();
        this._emit('autoSave', draft);
      }
    }, this.autoSaveInterval);
  }
  
  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  
  _emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
  
  /**
   * 导出所有草稿
   */
  exportAll() {
    return {
      drafts: this.drafts.map(d => d.toJSON()),
      exportedAt: Date.now()
    };
  }
  
  /**
   * 导入草稿
   */
  importDrafts(data) {
    if (data && data.drafts) {
      data.drafts.forEach(d => {
        const draft = Draft.fromJSON(d);
        if (!this.drafts.find(existing => existing.id === draft.id)) {
          this.drafts.push(draft);
        }
      });
      this._saveToStorage();
      return true;
    }
    return false;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Draft, DraftBox };
}
if (typeof global !== 'undefined') {
  global.Draft = Draft;
  global.DraftBox = DraftBox;
}
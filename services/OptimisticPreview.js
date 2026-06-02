'use strict';

/**
 * OptimisticPreview - 乐观预览服务
 * 先生成低分辨率预览，图生成完成后替换为高清
 */

const PREVIEW_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  PREVIEW: 'preview',
  FINAL: 'final'
};

/**
 * 预览占位符
 */
const PLACEHOLDER_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkbWluYWxlLWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM2NjYiIHRleHQtYWxpZ249Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5HZW5lcmF0aW5nLjYuLjwvdGV4dD48L3N2Zz4=';

/**
 * OptimisticPreview - 乐观更新预览
 */
class OptimisticPreview {
  constructor() {
    this.previews = new Map(); // taskId -> preview data
    this.listeners = {};
  }
  
  /**
   * 创建预览占位符
   */
  createPlaceholder(taskId, metadata = {}) {
    const preview = {
      taskId,
      state: PREVIEW_STATE.LOADING,
      placeholder: PLACEHOLDER_BASE64,
      final: null,
      metadata,
      createdAt: Date.now(),
      finalAt: null
    };
    this.previews.set(taskId, preview);
    this._emit('placeholder', preview);
    return preview;
  }
  
  /**
   * 标记预览为已完成
   */
  resolvePreview(taskId, finalUrl) {
    const preview = this.previews.get(taskId);
    if (!preview) return null;
    
    preview.state = PREVIEW_STATE.FINAL;
    preview.final = finalUrl;
    preview.finalAt = Date.now();
    
    this._emit('resolved', preview);
    return preview;
  }
  
  /**
   * 标记预览失败
   */
  rejectPreview(taskId, error) {
    const preview = this.previews.get(taskId);
    if (!preview) return null;
    
    preview.state = PREVIEW_STATE.IDLE;
    preview.error = error;
    preview.finalAt = Date.now();
    
    this._emit('rejected', preview);
    return preview;
  }
  
  /**
   * 获取预览数据
   */
  getPreview(taskId) {
    return this.previews.get(taskId) || null;
  }
  
  /**
   * 获取当前显示的图片（预览或最终）
   */
  getCurrentImage(taskId) {
    const preview = this.previews.get(taskId);
    if (!preview) return null;
    
    if (preview.state === PREVIEW_STATE.FINAL) {
      return preview.final;
    }
    return preview.placeholder;
  }
  
  /**
   * 是否有预览
   */
  hasPreview(taskId) {
    return this.previews.has(taskId);
  }
  
  /**
   * 清除预览
   */
  clearPreview(taskId) {
    const preview = this.previews.get(taskId);
    if (preview) {
      this._emit('cleared', preview);
    }
    this.previews.delete(taskId);
  }
  
  /**
   * 获取所有活跃预览
   */
  getActivePreviews() {
    return Array.from(this.previews.values())
      .filter(p => p.state === PREVIEW_STATE.PREVIEW || p.state === PREVIEW_STATE.LOADING);
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
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PREVIEW_STATE, PLACEHOLDER_BASE64, OptimisticPreview };
}
if (typeof global !== 'undefined') {
  global.PREVIEW_STATE = PREVIEW_STATE;
  global.PLACEHOLDER_BASE64 = PLACEHOLDER_BASE64;
  global.OptimisticPreview = OptimisticPreview;
}
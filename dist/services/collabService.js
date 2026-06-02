/**
 * collabService.js - 协作服务（分享、评论）
 * 提供作品分享、评论、实时协作功能
 */

const CollabService = {
  // 存储键
  SHARED_WORKS_KEY: 'collab_shared_works',
  COMMENTS_KEY: 'collab_comments',
  NOTIFY_KEY: 'collab_notifications',

  // 基础URL（GitHub Pages部署地址）
  BASE_URL: 'https://yeluo45.github.io/ai-creator-h5/',

  /**
   * 生成唯一ID
   */
  generateId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  },

  /**
   * 分享作品 - 生成分享链接
   * @param {Object} workData - 作品数据
   * @param {string} workData.type - 类型：image/music/tts
   * @param {string} workData.prompt - 创作描述
   * @param {string} workData.url - 资源URL
   * @param {string} workData.title - 标题
   * @param {Object} workData.extra - 额外信息
   * @returns {Object} 分享信息
   */
  shareWork(workData) {
    const shareId = this.generateId();
    const shareUrl = `${this.BASE_URL}pages/shared.html?shareId=${shareId}`;
    
    const sharedWork = {
      id: shareId,
      type: workData.type || 'image',
      prompt: workData.prompt || '',
      url: workData.url || '',
      title: workData.title || this.getDefaultTitle(workData.type),
      coverUrl: workData.coverUrl || '',
      duration: workData.duration || 0,
      style: workData.style || '',
      size: workData.size || '',
      createdAt: Date.now(),
      views: 0,
      likes: 0
    };

    // 保存到本地存储
    const works = this.getSharedWorks();
    works[shareId] = sharedWork;
    localStorage.setItem(this.SHARED_WORKS_KEY, JSON.stringify(works));

    // 初始化评论
    const comments = this.getComments(shareId);
    // 确保该作品有评论存储

    return {
      shareId,
      shareUrl,
      work: sharedWork
    };
  },

  /**
   * 获取默认标题
   */
  getDefaultTitle(type) {
    const titles = {
      image: '🎨 AI 创作图片',
      music: '🎵 AI 创作音乐',
      tts: '🎤 AI 语音合成'
    };
    return titles[type] || '✨ AI Creator';
  },

  /**
   * 通过分享ID获取作品
   * @param {string} shareId - 分享ID
   * @returns {Object|null} 作品数据或null
   */
  getSharedWork(shareId) {
    try {
      const works = this.getSharedWorks();
      const work = works[shareId];
      
      if (work) {
        // 增加浏览数
        work.views = (work.views || 0) + 1;
        localStorage.setItem(this.SHARED_WORKS_KEY, JSON.stringify(works));
        return work;
      }
    } catch (e) {
      console.error('Failed to get shared work:', e);
    }
    return null;
  },

  /**
   * 获取所有分享作品
   */
  getSharedWorks() {
    try {
      return JSON.parse(localStorage.getItem(this.SHARED_WORKS_KEY) || '{}');
    } catch {
      return {};
    }
  },

  /**
   * 添加评论
   * @param {string} shareId - 分享ID
   * @param {Object} comment - 评论内容
   * @param {string} comment.author - 评论者
   * @param {string} comment.content - 评论内容
   * @returns {Object} 添加的评论
   */
  addComment(shareId, comment) {
    const newComment = {
      id: this.generateId(),
      shareId,
      author: comment.author || '匿名用户',
      content: comment.content || '',
      createdAt: Date.now(),
      likes: 0
    };

    const comments = this.getComments(shareId);
    comments.push(newComment);
    localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments));

    // 记录通知
    this.addNotification({
      type: 'comment',
      shareId,
      content: `${newComment.author} 评论了你的作品`,
      createdAt: Date.now()
    });

    return newComment;
  },

  /**
   * 获取分享作品的评论列表
   * @param {string} shareId - 分享ID
   * @returns {Array} 评论列表
   */
  getComments(shareId) {
    try {
      const allComments = JSON.parse(localStorage.getItem(this.COMMENTS_KEY) || '[]');
      return allComments
        .filter(c => c.shareId === shareId)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  },

  /**
   * 获取最近评论（供通知用）
   * @param {number} limit - 返回数量限制
   * @returns {Array} 最近评论列表
   */
  getRecentComments(limit = 10) {
    try {
      const allComments = JSON.parse(localStorage.getItem(this.COMMENTS_KEY) || '[]');
      return allComments
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  /**
   * 点赞评论
   * @param {string} commentId - 评论ID
   */
  likeComment(commentId) {
    try {
      const allComments = JSON.parse(localStorage.getItem(this.COMMENTS_KEY) || '[]');
      const comment = allComments.find(c => c.id === commentId);
      if (comment) {
        comment.likes = (comment.likes || 0) + 1;
        localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(allComments));
        return comment.likes;
      }
    } catch (e) {
      console.error('Failed to like comment:', e);
    }
    return 0;
  },

  /**
   * 添加通知
   * @param {Object} notification - 通知数据
   */
  addNotification(notification) {
    try {
      const notifications = this.getNotifications();
      notifications.unshift({
        id: this.generateId(),
        ...notification,
        read: false
      });
      // 保留最近50条通知
      localStorage.setItem(this.NOTIFY_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      console.error('Failed to add notification:', e);
    }
  },

  /**
   * 获取通知列表
   */
  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(this.NOTIFY_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * 标记通知为已读
   * @param {string} notificationId - 通知ID
   */
  markNotificationRead(notificationId) {
    try {
      const notifications = this.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem(this.NOTIFY_KEY, JSON.stringify(notifications));
      }
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  },

  /**
   * 模拟实时更新 - 监听本地存储变化
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消监听函数
   */
  subscribeToUpdates(callback) {
    // 使用storage事件监听其他标签页的变化
    const handler = (e) => {
      if (e.key === this.COMMENTS_KEY || e.key === this.NOTIFY_KEY) {
        callback({
          type: e.key === this.COMMENTS_KEY ? 'comment' : 'notification',
          data: e.newValue ? JSON.parse(e.newValue) : null
        });
      }
    };

    window.addEventListener('storage', handler);

    // 返回取消订阅函数
    return () => {
      window.removeEventListener('storage', handler);
    };
  },

  /**
   * 获取分享统计
   */
  getStats() {
    const works = this.getSharedWorks();
    const comments = this.getRecentComments(100);
    
    return {
      totalShares: Object.keys(works).length,
      totalComments: comments.length,
      works: Object.values(works)
    };
  }
};

// 导出为全局对象
window.CollabService = CollabService;
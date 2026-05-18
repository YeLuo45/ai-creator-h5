/**
 * Workflow Marketplace Service v15
 * Workflow publishing, rating, comments, favorites for marketplace
 */

(function() {
  'use strict';

  const MARKET_KEY = 'workflow_marketplace';
  const COMMENTS_KEY = 'workflow_market_comments';
  const RATINGS_KEY = 'workflow_market_ratings';

  // Default sample workflows for marketplace
  const DEFAULT_MARKET_WORKFLOWS = [
    {
      id: 'mkt_001',
      name: 'AI图像生成工作流',
      description: '使用多个AI模型串联生成高质量图像，支持风格迁移和图像增强',
      tags: ['creation', 'ai', 'media'],
      category: 'image',
      author: 'AI Creator',
      authorId: 'system',
      visibility: 'public',
      rating: 4.8,
      ratingCount: 234,
      favorites: 567,
      views: 3420,
      coverGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
      icon: '🎨',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-15T14:30:00Z',
      workflowData: null
    },
    {
      id: 'mkt_002',
      name: '自动化数据处理管道',
      description: '自动化数据清洗、转换和分析的完整管道，支持批量处理',
      tags: ['automation', 'data'],
      category: 'data',
      author: 'AI Creator',
      authorId: 'system',
      visibility: 'public',
      rating: 4.5,
      ratingCount: 156,
      favorites: 289,
      views: 2100,
      coverGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      icon: '⚙️',
      createdAt: '2026-05-03T08:00:00Z',
      updatedAt: '2026-05-14T09:15:00Z',
      workflowData: null
    },
    {
      id: 'mkt_003',
      name: '智能客服对话系统',
      description: '基于LLM的智能客服，支持多轮对话和意图识别',
      tags: ['ai', 'automation'],
      category: 'chat',
      author: 'AI Creator',
      authorId: 'system',
      visibility: 'public',
      rating: 4.9,
      ratingCount: 412,
      favorites: 890,
      views: 5600,
      coverGradient: 'linear-gradient(135deg, #fa709a, #fee140)',
      icon: '💬',
      createdAt: '2026-04-28T12:00:00Z',
      updatedAt: '2026-05-16T16:45:00Z',
      workflowData: null
    },
    {
      id: 'mkt_004',
      name: '音乐生成工作流',
      description: '使用AI生成背景音乐，支持多种风格和时长控制',
      tags: ['creation', 'ai', 'media'],
      category: 'music',
      author: 'AI Creator',
      authorId: 'system',
      visibility: 'public',
      rating: 4.6,
      ratingCount: 98,
      favorites: 234,
      views: 1450,
      coverGradient: 'linear-gradient(135deg, #a8edea, #fed6e3)',
      icon: '🎵',
      createdAt: '2026-05-05T14:00:00Z',
      updatedAt: '2026-05-13T11:20:00Z',
      workflowData: null
    },
    {
      id: 'mkt_005',
      name: '视频剪辑自动化',
      description: '自动识别精彩片段，生成短视频剪辑',
      tags: ['automation', 'media'],
      category: 'video',
      author: 'AI Creator',
      authorId: 'system',
      visibility: 'public',
      rating: 4.3,
      ratingCount: 67,
      favorites: 156,
      views: 980,
      coverGradient: 'linear-gradient(135deg, #f5af19, #f12711)',
      icon: '🎬',
      createdAt: '2026-05-07T09:30:00Z',
      updatedAt: '2026-05-12T15:00:00Z',
      workflowData: null
    },
    {
      id: 'mkt_006',
      name: '文本摘要生成器',
      description: '自动提取文章要点，生成简洁摘要',
      tags: ['ai', 'utility'],
      category: 'text',
      author: 'AI Creator',
      authorId: 'system',
      visibility: 'public',
      rating: 4.7,
      ratingCount: 189,
      favorites: 423,
      views: 2800,
      coverGradient: 'linear-gradient(135deg, #5ee7df, #b490ca)',
      icon: '📝',
      createdAt: '2026-05-02T11:00:00Z',
      updatedAt: '2026-05-15T10:30:00Z',
      workflowData: null
    }
  ];

  // Load marketplace workflows
  function loadMarketWorkflows() {
    try {
      const data = localStorage.getItem(MARKET_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load marketplace workflows:', e);
    }
    return [...DEFAULT_MARKET_WORKFLOWS];
  }

  // Save marketplace workflows
  function saveMarketWorkflows(workflows) {
    try {
      localStorage.setItem(MARKET_KEY, JSON.stringify(workflows));
    } catch (e) {
      console.error('Failed to save marketplace workflows:', e);
    }
  }

  // Load comments
  function loadComments() {
    try {
      const data = localStorage.getItem(COMMENTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // Save comments
  function saveComments(comments) {
    try {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    } catch (e) {
      console.error('Failed to save comments:', e);
    }
  }

  // Load ratings
  function loadRatings() {
    try {
      const data = localStorage.getItem(RATINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // Save ratings
  function saveRatings(ratings) {
    try {
      localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
    } catch (e) {
      console.error('Failed to save ratings:', e);
    }
  }

  // Generate unique ID
  function generateId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  // Public API
  window.WorkflowMarketService = {
    /**
     * Get all marketplace workflows with optional filters
     * @param {Object} filter - { category, search, sort, page, pageSize }
     * @returns {Object} { workflows, total, page, pageSize, totalPages }
     */
    getWorkflows: function(filter) {
      filter = filter || {};
      let workflows = loadMarketWorkflows();
      
      // Filter by visibility (only public)
      workflows = workflows.filter(function(w) { return w.visibility === 'public'; });

      // Category filter
      if (filter.category && filter.category !== 'all') {
        workflows = workflows.filter(function(w) { return w.category === filter.category; });
      }

      // Tag filter
      if (filter.tag) {
        workflows = workflows.filter(function(w) { 
          return w.tags && w.tags.includes(filter.tag); 
        });
      }

      // Search filter
      if (filter.search) {
        var searchLower = filter.search.toLowerCase();
        workflows = workflows.filter(function(w) {
          return w.name.toLowerCase().includes(searchLower) ||
            (w.description && w.description.toLowerCase().includes(searchLower)) ||
            w.author.toLowerCase().includes(searchLower) ||
            (w.tags && w.tags.some(function(t) { return t.toLowerCase().includes(searchLower); }));
        });
      }

      // Sort
      var sort = filter.sort || 'latest';
      switch (sort) {
        case 'latest':
          workflows.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
          break;
        case 'popular':
          workflows.sort(function(a, b) { return (b.favorites + b.views) - (a.favorites + a.views); });
          break;
        case 'rating':
          workflows.sort(function(a, b) { return b.rating - a.rating; });
          break;
        case 'editor':
          // Editor's choice - highest rating with enough reviews
          workflows.sort(function(a, b) {
            var scoreA = a.rating * Math.min(a.ratingCount, 100) / 100;
            var scoreB = b.rating * Math.min(b.ratingCount, 100) / 100;
            return scoreB - scoreA;
          });
          break;
        default:
          workflows.sort(function(a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); });
      }

      // Pagination
      var page = filter.page || 1;
      var pageSize = filter.pageSize || 12;
      var total = workflows.length;
      var totalPages = Math.ceil(total / pageSize);
      var start = (page - 1) * pageSize;
      var pagedWorkflows = workflows.slice(start, start + pageSize);

      return {
        workflows: pagedWorkflows,
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: totalPages
      };
    },

    /**
     * Get workflow by ID
     * @param {string} id - workflow ID
     * @returns {Object|null}
     */
    getWorkflowById: function(id) {
      var workflows = loadMarketWorkflows();
      for (var i = 0; i < workflows.length; i++) {
        if (workflows[i].id === id) {
          return workflows[i];
        }
      }
      return null;
    },

    /**
     * Publish a workflow to marketplace
     * @param {Object} workflow - { name, description, tags, category, visibility, coverGradient, icon }
     * @param {Object} workflowData - the actual workflow data
     * @returns {Object} { success, workflow }
     */
    publishWorkflow: function(workflow, workflowData) {
      var workflows = loadMarketWorkflows();
      
      var newWorkflow = {
        id: generateId('mkt'),
        name: workflow.name || '未命名工作流',
        description: workflow.description || '',
        tags: workflow.tags || [],
        category: workflow.category || 'utility',
        author: workflow.author || '我',
        authorId: 'user',
        visibility: workflow.visibility || 'public',
        rating: 0,
        ratingCount: 0,
        favorites: 0,
        views: 0,
        coverGradient: workflow.coverGradient || 'linear-gradient(135deg, #667eea, #764ba2)',
        icon: workflow.icon || '⚡',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workflowData: workflowData
      };

      workflows.unshift(newWorkflow);
      saveMarketWorkflows(workflows);

      return { success: true, workflow: newWorkflow };
    },

    /**
     * Update a published workflow
     * @param {string} id - workflow ID
     * @param {Object} updates - fields to update
     * @returns {Object} { success, workflow }
     */
    updateWorkflow: function(id, updates) {
      var workflows = loadMarketWorkflows();
      var workflow = null;
      var index = -1;
      
      for (var i = 0; i < workflows.length; i++) {
        if (workflows[i].id === id) {
          workflow = workflows[i];
          index = i;
          break;
        }
      }

      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      // Only allow updating own workflows
      if (workflow.authorId !== 'user') {
        return { success: false, error: 'Cannot update others\' workflows' };
      }

      // Apply updates
      if (updates.name !== undefined) workflow.name = updates.name;
      if (updates.description !== undefined) workflow.description = updates.description;
      if (updates.tags !== undefined) workflow.tags = updates.tags;
      if (updates.category !== undefined) workflow.category = updates.category;
      if (updates.visibility !== undefined) workflow.visibility = updates.visibility;
      if (updates.coverGradient !== undefined) workflow.coverGradient = updates.coverGradient;
      if (updates.icon !== undefined) workflow.icon = updates.icon;
      if (updates.workflowData !== undefined) workflow.workflowData = updates.workflowData;
      workflow.updatedAt = new Date().toISOString();

      workflows[index] = workflow;
      saveMarketWorkflows(workflows);

      return { success: true, workflow: workflow };
    },

    /**
     * Delete a published workflow
     * @param {string} id - workflow ID
     * @returns {Object} { success }
     */
    deleteWorkflow: function(id) {
      var workflows = loadMarketWorkflows();
      var workflow = null;
      
      for (var i = 0; i < workflows.length; i++) {
        if (workflows[i].id === id) {
          workflow = workflows[i];
          break;
        }
      }

      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      if (workflow.authorId !== 'user') {
        return { success: false, error: 'Cannot delete others\' workflows' };
      }

      workflows = workflows.filter(function(w) { return w.id !== id; });
      saveMarketWorkflows(workflows);

      // Also delete comments and ratings
      var comments = loadComments();
      delete comments[id];
      saveComments(comments);

      var ratings = loadRatings();
      delete ratings[id];
      saveRatings(ratings);

      return { success: true };
    },

    /**
     * Rate a workflow (1-5 stars)
     * @param {string} id - workflow ID
     * @param {number} rating - rating value 1-5
     * @returns {Object} { success, newRating, newRatingCount }
     */
    rateWorkflow: function(id, rating) {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be 1-5' };
      }

      var workflows = loadMarketWorkflows();
      var workflow = null;
      var index = -1;
      
      for (var i = 0; i < workflows.length; i++) {
        if (workflows[i].id === id) {
          workflow = workflows[i];
          index = i;
          break;
        }
      }

      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      // Get user ratings
      var ratings = loadRatings();
      if (!ratings[id]) {
        ratings[id] = {};
      }

      // Check if user already rated
      var userId = 'user_' + Date.now(); // In real app, use actual user ID
      var previousRating = ratings[id][userId];

      if (previousRating) {
        // Update existing rating
        var totalRating = workflow.rating * workflow.ratingCount - previousRating + rating;
        workflow.rating = Math.round((totalRating / workflow.ratingCount) * 10) / 10;
      } else {
        // New rating
        var totalRating = workflow.rating * workflow.ratingCount + rating;
        workflow.ratingCount += 1;
        workflow.rating = Math.round((totalRating / workflow.ratingCount) * 10) / 10;
      }

      ratings[id][userId] = rating;
      saveRatings(ratings);

      workflows[index] = workflow;
      saveMarketWorkflows(workflows);

      return { success: true, newRating: workflow.rating, newRatingCount: workflow.ratingCount };
    },

    /**
     * Toggle favorite status
     * @param {string} id - workflow ID
     * @returns {Object} { success, isFavorited, favorites }
     */
    toggleFavorite: function(id) {
      var workflows = loadMarketWorkflows();
      var workflow = null;
      var index = -1;
      
      for (var i = 0; i < workflows.length; i++) {
        if (workflows[i].id === id) {
          workflow = workflows[i];
          index = i;
          break;
        }
      }

      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      // Track user favorites in localStorage
      var favKey = 'workflow_market_favorites';
      var userFavorites = {};
      try {
        userFavorites = JSON.parse(localStorage.getItem(favKey) || '{}');
      } catch (e) {}

      workflow.isFavorited = !workflow.isFavorited;
      if (workflow.isFavorited) {
        userFavorites[id] = true;
        workflow.favorites += 1;
      } else {
        delete userFavorites[id];
        workflow.favorites = Math.max(0, workflow.favorites - 1);
      }

      localStorage.setItem(favKey, JSON.stringify(userFavorites));
      workflows[index] = workflow;
      saveMarketWorkflows(workflows);

      return { 
        success: true, 
        isFavorited: workflow.isFavorited, 
        favorites: workflow.favorites 
      };
    },

    /**
     * Get user's favorited workflow IDs
     * @returns {Array} array of workflow IDs
     */
    getUserFavorites: function() {
      var favKey = 'workflow_market_favorites';
      try {
        return JSON.parse(localStorage.getItem(favKey) || '{}');
      } catch (e) {
        return {};
      }
    },

    /**
     * Check if workflow is favorited by user
     * @param {string} id - workflow ID
     * @returns {boolean}
     */
    isFavorited: function(id) {
      var favorites = this.getUserFavorites();
      return !!favorites[id];
    },

    /**
     * Increment view count
     * @param {string} id - workflow ID
     */
    incrementViews: function(id) {
      var workflows = loadMarketWorkflows();
      var workflow = null;
      var index = -1;
      
      for (var i = 0; i < workflows.length; i++) {
        if (workflows[i].id === id) {
          workflow = workflows[i];
          index = i;
          break;
        }
      }

      if (workflow) {
        workflow.views = (workflow.views || 0) + 1;
        workflows[index] = workflow;
        saveMarketWorkflows(workflows);
      }
    },

    // ========== COMMENTS ==========

    /**
     * Get comments for a workflow
     * @param {string} workflowId - workflow ID
     * @returns {Array} comments array
     */
    getComments: function(workflowId) {
      var allComments = loadComments();
      var comments = allComments[workflowId] || [];
      // Sort by timestamp, newest first
      comments.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
      return comments;
    },

    /**
     * Get comment count for a workflow
     * @param {string} workflowId - workflow ID
     * @returns {number}
     */
    getCommentCount: function(workflowId) {
      var comments = this.getComments(workflowId);
      return comments.length;
    },

    /**
     * Add a comment to a workflow
     * @param {string} workflowId - workflow ID
     * @param {string} content - comment content
     * @param {string} parentId - optional parent comment ID for replies
     * @returns {Object} { success, comment }
     */
    addComment: function(workflowId, content, parentId) {
      if (!content || !content.trim()) {
        return { success: false, error: 'Comment cannot be empty' };
      }

      var allComments = loadComments();
      if (!allComments[workflowId]) {
        allComments[workflowId] = [];
      }

      var comment = {
        id: generateId('cmt'),
        workflowId: workflowId,
        parentId: parentId || null,
        author: '我',
        authorId: 'user',
        content: content.trim(),
        likes: 0,
        likedBy: {},
        timestamp: new Date().toISOString()
      };

      allComments[workflowId].push(comment);
      saveComments(allComments);

      return { success: true, comment: comment };
    },

    /**
     * Reply to a comment
     * @param {string} workflowId - workflow ID
     * @param {string} commentId - parent comment ID
     * @param {string} content - reply content
     * @returns {Object} { success, comment }
     */
    replyToComment: function(workflowId, commentId, content) {
      return this.addComment(workflowId, content, commentId);
    },

    /**
     * Toggle like on a comment
     * @param {string} workflowId - workflow ID
     * @param {string} commentId - comment ID
     * @returns {Object} { success, likes, isLiked }
     */
    toggleCommentLike: function(workflowId, commentId) {
      var allComments = loadComments();
      var comments = allComments[workflowId] || [];
      var comment = null;
      var commentIndex = -1;

      for (var i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
          comment = comments[i];
          commentIndex = i;
          break;
        }
      }

      if (!comment) {
        return { success: false, error: 'Comment not found' };
      }

      var userId = 'user';
      if (!comment.likedBy) {
        comment.likedBy = {};
      }

      if (comment.likedBy[userId]) {
        comment.likes = Math.max(0, comment.likes - 1);
        delete comment.likedBy[userId];
      } else {
        comment.likes = (comment.likes || 0) + 1;
        comment.likedBy[userId] = true;
      }

      comments[commentIndex] = comment;
      allComments[workflowId] = comments;
      saveComments(allComments);

      return { success: true, likes: comment.likes, isLiked: !!comment.likedBy[userId] };
    },

    /**
     * Delete a comment
     * @param {string} workflowId - workflow ID
     * @param {string} commentId - comment ID
     * @returns {Object} { success }
     */
    deleteComment: function(workflowId, commentId) {
      var allComments = loadComments();
      var comments = allComments[workflowId] || [];
      
      // Find and verify ownership
      var comment = null;
      for (var i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
          comment = comments[i];
          break;
        }
      }

      if (!comment) {
        return { success: false, error: 'Comment not found' };
      }

      if (comment.authorId !== 'user') {
        return { success: false, error: 'Cannot delete others\' comments' };
      }

      // Remove comment and its replies
      allComments[workflowId] = comments.filter(function(c) {
        return c.id !== commentId && c.parentId !== commentId;
      });
      saveComments(allComments);

      return { success: true };
    },

    /**
     * Format timestamp to relative time
     * @param {string} timestamp - ISO timestamp
     * @returns {string} relative time string
     */
    formatRelativeTime: function(timestamp) {
      if (!timestamp) return '';
      var now = new Date();
      var date = new Date(timestamp);
      var diff = now - date;
      var minutes = Math.floor(diff / 60000);
      var hours = Math.floor(diff / 3600000);
      var days = Math.floor(diff / 86400000);

      if (minutes < 1) return '刚刚';
      if (minutes < 60) return minutes + '分钟前';
      if (hours < 24) return hours + '小时前';
      if (days < 7) return days + '天前';
      if (days < 30) return Math.floor(days / 7) + '周前';
      if (days < 365) return Math.floor(days / 30) + '个月前';
      return Math.floor(days / 365) + '年前';
    },

    /**
     * Get categories with counts
     * @returns {Array} categories with workflow counts
     */
    getCategories: function() {
      var workflows = loadMarketWorkflows().filter(function(w) { return w.visibility === 'public'; });
      var categories = [
        { id: 'all', name: '全部', count: 0 },
        { id: 'image', name: '图像', count: 0 },
        { id: 'video', name: '视频', count: 0 },
        { id: 'music', name: '音乐', count: 0 },
        { id: 'chat', name: '对话', count: 0 },
        { id: 'data', name: '数据', count: 0 },
        { id: 'text', name: '文本', count: 0 },
        { id: 'utility', name: '工具', count: 0 }
      ];

      for (var i = 0; i < workflows.length; i++) {
        var w = workflows[i];
        for (var j = 0; j < categories.length; j++) {
          if (categories[j].id === 'all') {
            categories[j].count++;
          } else if (categories[j].id === w.category) {
            categories[j].count++;
          }
        }
      }

      return categories;
    },

    /**
     * Get user's published workflows
     * @returns {Array}
     */
    getMyPublishedWorkflows: function() {
      var workflows = loadMarketWorkflows();
      return workflows.filter(function(w) { return w.authorId === 'user'; });
    },

    /**
     * Get top featured workflows
     * @param {number} limit - max number to return
     * @returns {Array}
     */
    getFeaturedWorkflows: function(limit) {
      var workflows = loadMarketWorkflows()
        .filter(function(w) { return w.visibility === 'public'; })
        .sort(function(a, b) {
          var scoreA = a.rating * Math.min(a.ratingCount, 100) / 100 + a.favorites * 0.1;
          var scoreB = b.rating * Math.min(b.ratingCount, 100) / 100 + b.favorites * 0.1;
          return scoreB - scoreA;
        });
      return workflows.slice(0, limit);
    }
  };
})();

/**
 * marketService.js - Template Market Service
 * Template listing, rating, and favorites
 */

window.MarketService = (function() {
  const MARKET_KEY = 'market_templates';

  // Default templates
  const DEFAULT_TEMPLATES = [
    {
      id: 'tpl_001',
      name: '清新风景画',
      description: '生成唯美的自然风景图片，适合壁纸和社交媒体',
      category: 'image',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.8,
      ratingCount: 156,
      favorites: 342,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
      icon: '🏞️',
      prompt: 'A serene landscape with mountains, rivers and sunset, ethereal atmosphere, highly detailed, 8k quality',
      params: { style: 'natural', quality: 'high' }
    },
    {
      id: 'tpl_002',
      name: '赛博朋克风格',
      description: '未来科技感的赛博朋克风格图片',
      category: 'image',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.5,
      ratingCount: 89,
      favorites: 178,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
      icon: '🌃',
      prompt: 'Cyberpunk city at night, neon lights, rain-soaked streets, futuristic technology, cinematic lighting',
      params: { style: 'cyberpunk', quality: 'high' }
    },
    {
      id: 'tpl_003',
      name: '治愈系音乐',
      description: '轻松舒缓的背景音乐，适合放松和冥想',
      category: 'music',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.9,
      ratingCount: 234,
      favorites: 567,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      icon: '🎵',
      prompt: 'Relaxing ambient music with soft piano and nature sounds, peaceful and healing atmosphere',
      params: { genre: 'ambient', tempo: 'slow' }
    },
    {
      id: 'tpl_004',
      name: '电子舞曲',
      description: '动感的电子音乐，适合视频背景',
      category: 'music',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.3,
      ratingCount: 67,
      favorites: 123,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #fa709a, #fee140)',
      icon: '🎧',
      prompt: 'Upbeat electronic dance music with strong bass and synth, energetic mood',
      params: { genre: 'electronic', tempo: 'fast' }
    },
    {
      id: 'tpl_005',
      name: '温暖女声配音',
      description: '温柔甜美的女性声音，适合旁白和故事',
      category: 'tts',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.7,
      ratingCount: 145,
      favorites: 289,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #a8edea, #fed6e3)',
      icon: '🎤',
      prompt: '',
      params: { voice: 'female_warm', speed: 1.0, pitch: 1.0 }
    },
    {
      id: 'tpl_006',
      name: '磁性男声配音',
      description: '低沉磁性的男性声音，适合解说和配音',
      category: 'tts',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.6,
      ratingCount: 98,
      favorites: 201,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #5ee7df, #b490ca)',
      icon: '🎙️',
      prompt: '',
      params: { voice: 'male_deep', speed: 1.0, pitch: 1.0 }
    },
    {
      id: 'tpl_007',
      name: '水彩艺术',
      description: '梦幻水彩风格插画',
      category: 'image',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.4,
      ratingCount: 76,
      favorites: 156,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)',
      icon: '🎨',
      prompt: 'Dreamy watercolor illustration with soft colors, ethereal atmosphere, delicate brushstrokes',
      params: { style: 'watercolor', quality: 'medium' }
    },
    {
      id: 'tpl_008',
      name: '古典钢琴曲',
      description: '优雅的古典钢琴音乐',
      category: 'music',
      author: 'AI Creator',
      authorId: 'system',
      rating: 4.8,
      ratingCount: 189,
      favorites: 423,
      isFavorited: false,
      coverGradient: 'linear-gradient(135deg, #f5af19, #f12711)',
      icon: '🎹',
      prompt: 'Elegant classical piano piece, graceful and refined, concert hall atmosphere',
      params: { genre: 'classical', tempo: 'medium' }
    }
  ];

  // Internal functions
  function loadMarketTemplates() {
    try {
      const data = localStorage.getItem(MARKET_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load market templates:', e);
    }
    return [...DEFAULT_TEMPLATES];
  }

  function saveMarketTemplates(templates) {
    try {
      localStorage.setItem(MARKET_KEY, JSON.stringify(templates));
    } catch (e) {
      console.error('Failed to save market templates:', e);
    }
  }

  return {
    /**
     * Get all templates with optional filter
     * @param {Object} filter - { category, search, sort }
     * @returns {Array} filtered templates
     */
    getTemplates: function(filter) {
      filter = filter || {};
      let templates = loadMarketTemplates();
      
      // Category filter
      if (filter.category && filter.category !== 'all') {
        templates = templates.filter(function(t) { return t.category === filter.category; });
      }
      
      // Search filter
      if (filter.search) {
        var searchLower = filter.search.toLowerCase();
        templates = templates.filter(function(t) { 
          return t.name.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower) ||
            t.author.toLowerCase().includes(searchLower);
        });
      }
      
      // Sort
      switch (filter.sort) {
        case 'latest':
          templates.sort(function(a, b) { return (b.id > a.id) ? 1 : -1; });
          break;
        case 'hottest':
          templates.sort(function(a, b) { return (b.favorites + b.ratingCount) - (a.favorites + a.ratingCount); });
          break;
        case 'rating':
          templates.sort(function(a, b) { return b.rating - a.rating; });
          break;
        default:
          templates.sort(function(a, b) { return (b.id > a.id) ? 1 : -1; });
      }
      
      return templates;
    },

    /**
     * Get template by ID
     * @param {string} id - template ID
     * @returns {Object|null} template object
     */
    getTemplateById: function(id) {
      var templates = loadMarketTemplates();
      var result = null;
      templates.forEach(function(t) { if (t.id === id) result = t; });
      return result;
    },

    /**
     * Rate a template (1-5 stars)
     * @param {string} id - template ID
     * @param {number} rating - rating value 1-5
     * @returns {Object} { success, newRating }
     */
    rateTemplate: function(id, rating) {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be 1-5' };
      }
      
      var templates = loadMarketTemplates();
      var template = null;
      templates.forEach(function(t) { if (t.id === id) template = t; });
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }
      
      // Calculate new average rating
      var totalRating = template.rating * template.ratingCount + rating;
      template.ratingCount += 1;
      template.rating = Math.round((totalRating / template.ratingCount) * 10) / 10;
      
      saveMarketTemplates(templates);
      return { success: true, newRating: template.rating };
    },

    /**
     * Toggle favorite status of a template
     * @param {string} id - template ID
     * @returns {Object} { success, isFavorited, favorites }
     */
    favoriteTemplate: function(id) {
      var templates = loadMarketTemplates();
      var template = null;
      templates.forEach(function(t) { if (t.id === id) template = t; });
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }
      
      template.isFavorited = !template.isFavorited;
      template.favorites += template.isFavorited ? 1 : -1;
      
      saveMarketTemplates(templates);
      return { 
        success: true, 
        isFavorited: template.isFavorited, 
        favorites: template.favorites 
      };
    },

    /**
     * Get templates created by current user
     * @returns {Array} user templates
     */
    getMyTemplates: function() {
      var templates = loadMarketTemplates();
      return templates.filter(function(t) { return t.authorId === 'user'; });
    },

    /**
     * Upload a new template
     * @param {Object} template - template data
     * @returns {Object} { success, template }
     */
    uploadTemplate: function(template) {
      var templates = loadMarketTemplates();
      
      var newTemplate = {
        id: 'tpl_' + Date.now(),
        name: template.name || '未命名模板',
        description: template.description || '',
        category: template.category || 'image',
        author: template.author || '我',
        authorId: 'user',
        rating: 0,
        ratingCount: 0,
        favorites: 0,
        isFavorited: false,
        coverGradient: template.coverGradient || 'linear-gradient(135deg, #667eea, #764ba2)',
        icon: template.icon || '📄',
        prompt: template.prompt || '',
        params: template.params || {}
      };
      
      templates.unshift(newTemplate);
      saveMarketTemplates(templates);
      
      return { success: true, template: newTemplate };
    },

    /**
     * Get favorite templates
     * @returns {Array} favorited templates
     */
    getFavorites: function() {
      var templates = loadMarketTemplates();
      return templates.filter(function(t) { return t.isFavorited; });
    },

    /**
     * Get categories with counts
     * @returns {Array} categories with template counts
     */
    getCategories: function() {
      var templates = loadMarketTemplates();
      var categories = [
        { id: 'all', name: '全部', count: templates.length },
        { id: 'image', name: '图片', count: 0 },
        { id: 'music', name: '音乐', count: 0 },
        { id: 'tts', name: '语音', count: 0 },
        { id: 'other', name: '其他', count: 0 }
      ];
      
      templates.forEach(function(t) {
        var cat = null;
        categories.forEach(function(c) { if (c.id === t.category) cat = c; });
        if (cat) cat.count++;
      });
      
      return categories;
    }
  };
})();
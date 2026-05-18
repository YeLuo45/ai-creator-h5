/**
 * shareService.js - 分享服务
 * 分享卡片数据生成、短链管理、分享统计
 */

const ShareService = {
  // 短链存储键
  SHORT_URL_KEY: 'share_short_urls',
  
  // 统计数据存储键
  STATS_KEY: 'share_stats',
  
  // 基础URL（GitHub Pages部署地址）
  BASE_URL: 'https://yeluo45.github.io/ai-creator-h5/',
  
  // 短链前缀
  SHORT_PREFIX: 's/',
  
  /**
   * 生成分享卡片数据
   * @param {Object} params - 分享参数
   * @param {string} params.type - 类型：image/music/tts
   * @param {string} params.prompt - 创作描述
   * @param {string} params.url - 资源URL（图片/音频）
   * @param {string} params.title - 标题
   * @param {Object} params.extra - 额外信息
   * @returns {Object} 分享卡片数据
   */
  generateShareCard(type, prompt, url, title, extra = {}) {
    const cardData = {
      type,
      prompt: prompt || '',
      url: url || '',
      title: title || this.getDefaultTitle(type),
      coverUrl: extra.coverUrl || '',
      duration: extra.duration || 0,
      style: extra.style || '',
      size: extra.size || '',
      timestamp: Date.now(),
      id: this.generateId()
    };
    
    // 编码保存
    const encoded = btoa(encodeURIComponent(JSON.stringify(cardData)));
    cardData.encoded = encoded;
    
    return cardData;
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
   * 生成短链ID
   */
  generateId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  },
  
  /**
   * 创建短链
   * @param {Object} cardData - 分享卡片数据
   * @returns {string} 短链
   */
  createShortUrl(cardData) {
    const id = cardData.id;
    const shortUrls = this.getShortUrls();
    
    // 保存映射
    shortUrls[id] = {
      data: cardData,
      createdAt: Date.now(),
      hits: 0
    };
    
    localStorage.setItem(this.SHORT_URL_KEY, JSON.stringify(shortUrls));
    
    // 返回短链URL（实际使用时解析到 share.html）
    return `${this.BASE_URL}pages/share.html?${this.SHORT_PREFIX}${id}`;
  },
  
  /**
   * 解析短链ID
   * @param {string} shortCode - 短链码
   * @returns {Object|null} 卡片数据或null
   */
  resolveShortUrl(shortCode) {
    const shortUrls = this.getShortUrls();
    const entry = shortUrls[shortCode];
    
    if (entry) {
      // 增加点击统计
      entry.hits++;
      localStorage.setItem(this.SHORT_URL_KEY, JSON.stringify(shortUrls));
      this.recordStat('click', entry.data.type);
      return entry.data;
    }
    
    return null;
  },
  
  /**
   * 获取所有短链映射
   */
  getShortUrls() {
    try {
      return JSON.parse(localStorage.getItem(this.SHORT_URL_KEY) || '{}');
    } catch {
      return {};
    }
  },
  
  /**
   * 获取分享统计数据
   */
  getStats() {
    try {
      return JSON.parse(localStorage.getItem(this.STATS_KEY) || '{}');
    } catch {
      return {};
    }
  },
  
  /**
   * 记录分享统计
   * @param {string} action - 操作：share/click
   * @param {string} type - 内容类型
   */
  recordStat(action, type) {
    const stats = this.getStats();
    const key = `${action}_${type}`;
    
    stats[key] = (stats[key] || 0) + 1;
    stats.total = (stats.total || 0) + 1;
    stats.lastUpdated = Date.now();
    
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  },
  
  /**
   * 构建分享文本
   * @param {Object} cardData - 卡片数据
   * @returns {Object} 各平台分享文本
   */
  buildShareText(cardData) {
    const prefix = '✨ 用 AI Creator 创作了';
    
    const texts = {
      default: `${prefix}${cardData.title}\n\n"${cardData.prompt}"\n\n🔗 ${window.location.origin}/pages/share.html?${this.SHORT_PREFIX}${cardData.id}`,
      
      wechat: `${prefix}${cardData.title}\n\n"${cardData.prompt}"\n\n点击链接查看 → ${window.location.origin}/pages/share.html?${this.SHORT_PREFIX}${cardData.id}`,
      
      twitter: `Check out my AI creation! ${cardData.prompt ? `"${cardData.prompt}"` : ''}\n\n${window.location.origin}/pages/share.html?${this.SHORT_PREFIX}${cardData.id}`,
      
      telegram: `${prefix}${cardData.title}\n\n"${cardData.prompt}"\n\n🔗 ${window.location.origin}/pages/share.html?${this.SHORT_PREFIX}${cardData.id}`
    };
    
    return texts;
  },
  
  /**
   * 获取微信分享引导链接
   * 由于微信限制，提供备用引导
   */
  getWechatShareGuide() {
    return {
      title: 'AI Creator 分享',
      desc: '我用 AI Creator 创作了精彩内容，快来看看吧！',
      link: window.location.href
    };
  },
  
  /**
   * 分享到微信（引导）
   */
  shareToWechat(cardData) {
    this.recordStat('share', cardData.type);
    
    // 复制分享信息到剪贴板
    const text = this.buildShareText(cardData).wechat;
    this.copyToClipboard(text);
    
    return {
      success: true,
      message: '分享内容已复制，请打开微信粘贴分享'
    };
  },
  
  /**
   * 分享到 Twitter
   */
  shareToTwitter(cardData) {
    this.recordStat('share', cardData.type);
    
    const text = this.buildShareText(cardData).twitter;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  },
  
  /**
   * 分享到 Telegram
   */
  shareToTelegram(cardData) {
    this.recordStat('share', cardData.type);
    
    const text = this.buildShareText(cardData).telegram;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/pages/share.html?' + this.SHORT_PREFIX + cardData.id)}&text=${encodeURIComponent(text)}`;
    
    window.open(telegramUrl, '_blank', 'width=550,height=420');
  },
  
  /**
   * 复制分享链接
   */
  async copyShareLink(cardData) {
    this.recordStat('share', cardData.type);
    
    const shareUrl = `${window.location.origin}/pages/share.html?${this.SHORT_PREFIX}${cardData.id}`;
    const success = await this.copyToClipboard(shareUrl);
    
    return { success, message: success ? '链接已复制' : '复制失败' };
  },
  
  /**
   * 复制到剪贴板
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // 降级处理
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  },
  
  /**
   * 分享面板数据
   */
  getSharePanelData(cardData) {
    return {
      card: cardData,
      shortUrl: `${window.location.origin}/pages/share.html?${this.SHORT_PREFIX}${cardData.id}`,
      text: this.buildShareText(cardData),
      stats: this.getStats()
    };
  }
};

// 导出为全局对象
window.ShareService = ShareService;
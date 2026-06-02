/**
 * creatorService.js - 创作者中心服务
 */

// ========== Storage Keys ==========
const CREATOR_KEYS = {
  PROFILE: 'creator_profile',
  VISIBILITY: 'creator_visibility', // 'public' | 'private'
};

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ========== Creator Profile ==========

/**
 * 获取创作者资料
 */
function getCreatorProfile() {
  const data = localStorage.getItem(CREATOR_KEYS.PROFILE);
  if (data) {
    return JSON.parse(data);
  }
  // 返回默认资料
  const app = window.getApp ? window.getApp() : null;
  const userInfo = app?.globalData?.userInfo || {};
  return {
    nickname: userInfo.nickname || '创作者',
    avatar: userInfo.avatarUrl || '',
    bio: '',
    tags: [],
  };
}

/**
 * 设置创作者资料
 */
function setCreatorProfile(profile) {
  const current = getCreatorProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(CREATOR_KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

/**
 * 获取作品集公开/私密状态
 */
function getProfileVisibility() {
  return localStorage.getItem(CREATOR_KEYS.VISIBILITY) || 'public';
}

/**
 * 设置作品集公开/私密
 */
function setProfileVisibility(isPublic) {
  localStorage.setItem(CREATOR_KEYS.VISIBILITY, isPublic ? 'public' : 'private');
}

// ========== Works Management ==========

/**
 * 获取所有收藏的作品（作为创作者的作品集）
 */
function getAllWorks() {
  const works = [];
  
  // 从所有收藏夹获取作品
  try {
    const folders = JSON.parse(localStorage.getItem('folders') || '[]');
    folders.forEach(folder => {
      const items = folder.items || [];
      items.forEach(item => {
        works.push({
          ...item,
          folderName: folder.name,
        });
      });
    });
  } catch (e) {
    console.error('Failed to get works from folders:', e);
  }

  // 按时间倒序
  works.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  
  return works;
}

/**
 * 获取精选作品（支持按类型筛选）
 * @param {string} type - 'all' | 'image' | 'music' | 'tts'
 */
function getFeaturedWorks(type = 'all') {
  const allWorks = getAllWorks();
  
  if (type === 'all') {
    return allWorks;
  }
  
  // 类型映射
  const typeMap = {
    'image': ['image', 'img', '图片'],
    'music': ['music', 'mus', '音乐'],
    'tts': ['tts', 'audio', '语音'],
  };
  
  const allowedTypes = typeMap[type] || [];
  return allWorks.filter(work => {
    const workType = (work.type || '').toLowerCase();
    return allowedTypes.some(t => workType.includes(t));
  });
}

/**
 * 获取作品统计
 */
function getWorksStats() {
  const allWorks = getAllWorks();
  const stats = {
    total: allWorks.length,
    image: 0,
    music: 0,
    tts: 0,
  };
  
  allWorks.forEach(work => {
    const type = (work.type || '').toLowerCase();
    if (type.includes('image') || type.includes('img') || type.includes('图片')) {
      stats.image++;
    } else if (type.includes('music') || type.includes('mus') || type.includes('音乐')) {
      stats.music++;
    } else if (type.includes('tts') || type.includes('audio') || type.includes('语音')) {
      stats.tts++;
    }
  });
  
  return stats;
}

/**
 * 获取单个作品详情
 */
function getWorkById(itemId) {
  const works = getAllWorks();
  return works.find(w => w.itemId === itemId) || null;
}

// ========== Share Card ==========

/**
 * 生成分享卡片数据
 * @param {Object} work - 作品对象
 */
function generateShareCard(work) {
  const profile = getCreatorProfile();
  
  // 截断prompt显示
  let promptSummary = work.prompt || work.title || '';
  if (promptSummary.length > 50) {
    promptSummary = promptSummary.substring(0, 50) + '...';
  }
  
  // 格式化时间
  const date = new Date(work.addedAt || Date.now());
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
  
  return {
    title: work.title || 'AI创作',
    prompt: promptSummary,
    creator: profile.nickname,
    creatorAvatar: profile.avatar,
    date: dateStr,
    cover: work.cover || work.url || '',
    type: work.type || 'unknown',
    // 跳转链接（当前页面）
    shareUrl: `${window.location.origin}${window.location.pathname}#!/creator`,
  };
}

/**
 * 生成Canvas分享卡片图片
 * @param {Object} work - 作品对象
 * @returns {Promise<string>} - 返回图片的blob URL
 */
async function createShareCardImage(work) {
  return new Promise((resolve, reject) => {
    const cardData = generateShareCard(work);
    
    // 卡片尺寸
    const cardWidth = 375;
    const cardHeight = 520;
    
    // 创建canvas
    const canvas = document.createElement('canvas');
    canvas.width = cardWidth * 2; // 2x for retina
    canvas.height = cardHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
    gradient.addColorStop(0, '#1A73E8');
    gradient.addColorStop(1, '#4facfe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    
    // 顶部留白（给状态栏等）
    const topMargin = 20;
    
    // 作品封面区域
    const coverHeight = 280;
    const coverY = topMargin + 10;
    const coverX = 30;
    const coverW = cardWidth - 60;
    
    // 封面圆角背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(coverX, coverY, coverW, coverHeight, 12);
    ctx.fill();
    
    // 加载封面图片
    const coverImg = new Image();
    coverImg.crossOrigin = 'anonymous';
    
    const loadCover = () => {
      // 绘制封面
      if (coverImg.complete && coverImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(coverX, coverY, coverW, coverHeight, 12);
        ctx.clip();
        
        // 计算缩放
        const imgRatio = coverImg.naturalWidth / coverImg.naturalHeight;
        const coverRatio = coverW / coverHeight;
        let drawX = coverX, drawY = coverY, drawW = coverW, drawH = coverHeight;
        
        if (imgRatio > coverRatio) {
          drawH = coverW / imgRatio;
          drawY = coverY + (coverHeight - drawH) / 2;
        } else {
          drawW = coverHeight * imgRatio;
          drawX = coverX + (coverW - drawW) / 2;
        }
        
        ctx.drawImage(coverImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        // 没有封面时显示占位
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(coverX, coverY, coverW, coverHeight, 12);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cardData.title, coverX + coverW / 2, coverY + coverHeight / 2);
      }
      
      // 类型标签
      const typeLabel = getTypeLabel(cardData.type);
      const labelW = 60;
      const labelH = 24;
      const labelX = coverX + 10;
      const labelY = coverY + 10;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelW, labelH, 6);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(typeLabel, labelX + labelW / 2, labelY + 16);
      
      // 底部内容区
      const contentY = coverY + coverHeight + 20;
      
      // Prompt摘要
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('"' + cardData.prompt + '"', 30, contentY);
      
      // 分隔线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, contentY + 25);
      ctx.lineTo(cardWidth - 30, contentY + 25);
      ctx.stroke();
      
      // 创作者信息
      const avatarSize = 40;
      const avatarX = 30;
      const avatarY = contentY + 45;
      
      // 头像圆形背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 加载头像
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      
      const loadAvatar = () => {
        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
        } else {
          // 默认头像
          ctx.fillStyle = '#fff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👤', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 7);
        }
        
        // 创作者名称
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(cardData.creator, avatarX + avatarSize + 12, avatarY + 16);
        
        // 日期
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px sans-serif';
        ctx.fillText(cardData.date, avatarX + avatarSize + 12, avatarY + 32);
        
        // 水印
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('AI Creator', cardWidth - 30, cardHeight - 20);
        
        // 转换为blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };
      
      if (cardData.creatorAvatar) {
        avatarImg.src = cardData.creatorAvatar;
        avatarImg.onload = loadAvatar;
        avatarImg.onerror = loadAvatar;
      } else {
        loadAvatar();
      }
    };
    
    if (cardData.cover) {
      coverImg.src = cardData.cover;
      coverImg.onload = loadCover;
      coverImg.onerror = loadCover;
    } else {
      loadCover();
    }
  });
}

/**
 * 获取类型标签文字
 */
function getTypeLabel(type) {
  const typeMap = {
    'image': '🖼️ 图片',
    'img': '🖼️ 图片',
    'music': '🎵 音乐',
    'mus': '🎵 音乐',
    'tts': '🎤 语音',
    'audio': '🎤 语音',
  };
  const t = (type || '').toLowerCase();
  for (const [key, label] of Object.entries(typeMap)) {
    if (t.includes(key)) return label;
  }
  return '✨ 创作';
}

// ========== Export ==========
window.CreatorService = {
  getCreatorProfile,
  setCreatorProfile,
  getProfileVisibility,
  setProfileVisibility,
  getAllWorks,
  getFeaturedWorks,
  getWorksStats,
  getWorkById,
  generateShareCard,
  createShareCardImage,
};

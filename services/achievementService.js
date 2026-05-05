/**
 * achievementService.js - 成就系统
 */

// ========== 成就定义 ==========

export const ACHIEVEMENTS = {
  // 首次创作类
  FIRST_IMAGE: {
    id: 'first_image',
    title: '初次见面',
    desc: '生成你的第一张AI图片',
    icon: '🖼️',
    condition: (stats) => stats.totalImages >= 1,
  },
  FIRST_MUSIC: {
    id: 'first_music',
    title: '音乐新星',
    desc: '创作你的第一首AI音乐',
    icon: '🎵',
    condition: (stats) => stats.totalMusic >= 1,
  },
  FIRST_AUDIO: {
    id: 'first_audio',
    title: '声音之旅',
    desc: '合成你的第一条AI语音',
    icon: '🎤',
    condition: (stats) => stats.totalAudio >= 1,
  },

  // 数量成就类
  IMAGE_COLLECTOR_10: {
    id: 'image_collector_10',
    title: '图片收藏家',
    desc: '累计生成10张图片',
    icon: '📸',
    condition: (stats) => stats.totalImages >= 10,
  },
  IMAGE_COLLECTOR_50: {
    id: 'image_collector_50',
    title: '影像大师',
    desc: '累计生成50张图片',
    icon: '🏆',
    condition: (stats) => stats.totalImages >= 50,
  },
  IMAGE_COLLECTOR_100: {
    id: 'image_collector_100',
    title: '图片狂人',
    desc: '累计生成100张图片',
    icon: '💯',
    condition: (stats) => stats.totalImages >= 100,
  },

  MUSIC_CREATOR_10: {
    id: 'music_creator_10',
    title: '音乐匠人',
    desc: '累计创作10首音乐',
    icon: '🎹',
    condition: (stats) => stats.totalMusic >= 10,
  },
  MUSIC_CREATOR_50: {
    id: 'music_creator_50',
    title: '音乐大师',
    desc: '累计创作50首音乐',
    icon: '🎼',
    condition: (stats) => stats.totalMusic >= 50,
  },

  AUDIO_MASTER_10: {
    id: 'audio_master_10',
    title: '语音达人',
    desc: '累计合成10条语音',
    icon: '🔊',
    condition: (stats) => stats.totalAudio >= 10,
  },
  AUDIO_MASTER_50: {
    id: 'audio_master_50',
    title: '声音大师',
    desc: '累计合成50条语音',
    icon: '🎧',
    condition: (stats) => stats.totalAudio >= 50,
  },

  // 多样性成就
  THREE_ARTIST: {
    id: 'three_artist',
    title: '全能艺术家',
    desc: '同时使用过图片、音乐、语音三种创作',
    icon: '🎨',
    condition: (stats) => stats.totalImages >= 1 && stats.totalMusic >= 1 && stats.totalAudio >= 1,
  },
  PRODUCER_20: {
    id: 'producer_20',
    title: '创意生产者',
    desc: '累计创作20个作品',
    icon: '💡',
    condition: (stats) => stats.totalWorks >= 20,
  },
  PRODUCER_50: {
    id: 'producer_50',
    title: '创意大师',
    desc: '累计创作50个作品',
    icon: '🌟',
    condition: (stats) => stats.totalWorks >= 50,
  },
  PRODUCER_100: {
    id: 'producer_100',
    title: '创意传奇',
    desc: '累计创作100个作品',
    icon: '👑',
    condition: (stats) => stats.totalWorks >= 100,
  },

  // 风格成就（图片）
  STYLE_EXPLORER: {
    id: 'style_explorer',
    title: '风格探索者',
    desc: '尝试过至少3种不同的图片风格或尺寸',
    icon: '🔮',
    condition: (stats) => stats.uniqueStyles >= 3,
  },

  // 音乐时长成就
  MARATHON_LISTENER: {
    id: 'marathon_listener',
    title: '马拉松听众',
    desc: '累计创作的音乐总时长超过10分钟',
    icon: '⏱️',
    condition: (stats) => stats.totalMusicDuration >= 600,
  },
};

// ========== Storage Keys ==========

const STORAGE_KEYS = {
  ACHIEVEMENTS: 'achievements',
  STATS: 'achievement_stats',
};

// ========== 类型定义 ==========

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlockedAt?: string;  // 解锁时间
}

export interface AchievementStats {
  totalImages: number;
  totalMusic: number;
  totalAudio: number;
  totalWorks: number;
  totalMusicDuration: number;  // 秒
  uniqueStyles: number;
  unlockedIds: string[];
}

// ========== 工具函数 ==========

function getFromStorage<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDefaultStats(): AchievementStats {
  return {
    totalImages: 0,
    totalMusic: 0,
    totalAudio: 0,
    totalWorks: 0,
    totalMusicDuration: 0,
    uniqueStyles: 0,
    unlockedIds: [],
  };
}

// ========== 核心 API ==========

/**
 * 获取当前统计
 */
export function getStats(): AchievementStats {
  return getFromStorage<AchievementStats>(STORAGE_KEYS.STATS, getDefaultStats());
}

/**
 * 获取已解锁的成就列表
 */
export function getUnlockedAchievements(): Achievement[] {
  const stats = getStats();
  return stats.unlockedIds.map(id => {
    const achievement = ACHIEVEMENTS[id];
    return achievement ? { ...achievement } : null;
  }).filter(Boolean);
}

/**
 * 获取所有成就（包含解锁状态）
 */
export function getAllAchievements(): Achievement[] {
  const stats = getStats();
  return Object.values(ACHIEVEMENTS).map(ach => ({
    ...ach,
    unlockedAt: stats.unlockedIds.includes(ach.id) ? stats.unlockedIds[ach.id] : undefined,
  }));
}

/**
 * 解锁一个成就
 */
export function unlockAchievement(achievementId: string): Achievement | null {
  const stats = getStats();
  if (stats.unlockedIds.includes(achievementId)) {
    return null; // 已经解锁
  }

  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return null;

  stats.unlockedIds.push(achievementId);
  saveToStorage(STORAGE_KEYS.STATS, stats);

  return {
    ...achievement,
    unlockedAt: new Date().toISOString(),
  };
}

/**
 * 检查并解锁可达成就，返回新解锁的成就列表
 */
export function checkAndUnlockAchievements(): Achievement[] {
  const stats = getStats();
  const newlyUnlocked: Achievement[] = [];

  Object.values(ACHIEVEMENTS).forEach(ach => {
    if (!stats.unlockedIds.includes(ach.id) && ach.condition(stats)) {
      const unlocked = unlockAchievement(ach.id);
      if (unlocked) {
        newlyUnlocked.push(unlocked);
      }
    }
  });

  return newlyUnlocked;
}

// ========== 统计更新 API ==========

/**
 * 记录图片生成
 */
export function recordImageGenerated(style?: string, size?: string): void {
  const stats = getStats();
  stats.totalImages++;
  stats.totalWorks++;

  // 记录唯一风格组合
  if (style && size) {
    const styleKey = `${style}_${size}`;
    const existingStyles = getFromStorage<string[]>('unique_style_keys', []);
    if (!existingStyles.includes(styleKey)) {
      existingStyles.push(styleKey);
      saveToStorage('unique_style_keys', existingStyles);
      stats.uniqueStyles = existingStyles.length;
    }
  }

  saveToStorage(STORAGE_KEYS.STATS, stats);
  checkAndUnlockAchievements();
}

/**
 * 记录音乐生成
 */
export function recordMusicGenerated(duration: number = 0): void {
  const stats = getStats();
  stats.totalMusic++;
  stats.totalWorks++;
  stats.totalMusicDuration += duration;
  saveToStorage(STORAGE_KEYS.STATS, stats);
  checkAndUnlockAchievements();
}

/**
 * 记录语音合成
 */
export function recordAudioGenerated(): void {
  const stats = getStats();
  stats.totalAudio++;
  stats.totalWorks++;
  saveToStorage(STORAGE_KEYS.STATS, stats);
  checkAndUnlockAchievements();
}

/**
 * 获取成就进度
 */
export function getAchievementProgress(): { unlocked: number; total: number } {
  const stats = getStats();
  return {
    unlocked: stats.unlockedIds.length,
    total: Object.keys(ACHIEVEMENTS).length,
  };
}

/**
 * 重置成就数据（谨慎使用）
 */
export function resetAchievements(): void {
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem('unique_style_keys');
}

/**
 * 从历史记录重新计算统计数据（用于数据恢复）
 */
export function recalculateStatsFromHistory(): AchievementStats {
  const images = JSON.parse(localStorage.getItem('history_images') || '[]');
  const music = JSON.parse(localStorage.getItem('history_music') || '[]');
  const audio = JSON.parse(localStorage.getItem('history_tts') || '[]');

  // 计算唯一风格
  const styleKeys = new Set<string>();
  images.forEach((item: any) => {
    if (item.style && item.size) {
      styleKeys.add(`${item.style}_${item.size}`);
    }
  });

  // 计算音乐总时长
  const totalMusicDuration = music.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);

  const stats: AchievementStats = {
    totalImages: images.length,
    totalMusic: music.length,
    totalAudio: audio.length,
    totalWorks: images.length + music.length + audio.length,
    totalMusicDuration,
    uniqueStyles: styleKeys.size,
    unlockedIds: [], // 解锁状态不重新计算
  };

  // 保留已解锁的成就
  const existingStats = getFromStorage<AchievementStats>(STORAGE_KEYS.STATS, getDefaultStats());
  stats.unlockedIds = existingStats.unlockedIds;

  saveToStorage(STORAGE_KEYS.STATS, stats);
  return stats;
}

// ========== 成就弹窗显示 ==========

let notificationQueue: Achievement[] = [];
let isShowingNotification = false;

/**
 * 显示成就解锁通知（异步队列）
 */
export function showAchievementNotification(achievement: Achievement): void {
  notificationQueue.push(achievement);
  processNotificationQueue();
}

function processNotificationQueue(): void {
  if (isShowingNotification || notificationQueue.length === 0) return;

  isShowingNotification = true;
  const achievement = notificationQueue.shift()!;
  showAchievementToast(achievement, () => {
    isShowingNotification = false;
    setTimeout(processNotificationQueue, 300);
  });
}

function showAchievementToast(achievement: Achievement, onClose: () => void): void {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.id = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-popup">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">🎉 成就解锁</div>
        <div class="achievement-name">${achievement.title}</div>
        <div class="achievement-desc">${achievement.desc}</div>
      </div>
    </div>
  `;

  // 添加样式
  const style = document.createElement('style');
  style.id = 'achievement-style';
  style.textContent = `
    #achievement-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      animation: achievementSlideIn 0.4s ease;
    }
    @keyframes achievementSlideIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes achievementSlideOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    .achievement-popup {
      background: linear-gradient(135deg, #1A73E8, #4facfe);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(26, 115, 232, 0.4);
      max-width: 300px;
    }
    .achievement-icon {
      font-size: 36px;
      flex-shrink: 0;
    }
    .achievement-content {
      flex: 1;
    }
    .achievement-title {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2px;
    }
    .achievement-name {
      font-size: 15px;
      color: #fff;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .achievement-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.85);
    }
  `;

  // 移除旧样式（如果存在）
  const oldStyle = document.getElementById('achievement-style');
  if (oldStyle) oldStyle.remove();

  // 移除旧通知（如果存在）
  const oldNotification = document.getElementById('achievement-notification');
  if (oldNotification) oldNotification.remove();

  document.body.appendChild(style);
  document.body.appendChild(notification);

  // 自动关闭
  setTimeout(() => {
    notification.style.animation = 'achievementSlideOut 0.3s ease forwards';
    setTimeout(() => {
      notification.remove();
      style.remove();
      onClose();
    }, 300);
  }, 3000);
}

/**
 * 批量显示新解锁的成就
 */
export function showNewAchievements(achievements: Achievement[]): void {
  achievements.forEach((ach, index) => {
    setTimeout(() => {
      showAchievementNotification(ach);
    }, index * 3500); // 每个成就间隔3.5秒
  });
}

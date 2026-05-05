/**
 * store.ts - 统一状态管理（历史记录、设置等）
 */

// ========== 类型定义 ==========

export type HistoryType = 'image' | 'music' | 'audio';

export interface BaseHistoryItem {
  id: string;
  type: HistoryType;
  createdAt: string;
  prompt?: string;
}

export interface ImageHistoryItem extends BaseHistoryItem {
  type: 'image';
  imageUrl: string;
  style?: string;
  size?: string;
}

export interface MusicHistoryItem extends BaseHistoryItem {
  type: 'music';
  musicUrl: string;
  lyrics?: string;
  title?: string;
  coverUrl?: string;
  duration?: number;
}

export interface TTSHistoryItem extends BaseHistoryItem {
  type: 'audio';
  audioUrl: string;
  text: string;
  voice?: string;
}

export type HistoryItem = ImageHistoryItem | MusicHistoryItem | TTSHistoryItem;

export interface StoreState {
  historyImages: ImageHistoryItem[];
  historyMusic: MusicHistoryItem[];
  historyTTS: TTSHistoryItem[];
}

// ========== Storage Keys ==========

const STORAGE_KEYS = {
  HISTORY_IMAGES: 'history_images',
  HISTORY_MUSIC: 'history_music',
  HISTORY_TTS: 'history_tts',
};

// ========== 通用存储操作 ==========

function getFromStorage<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ========== 图片历史 ==========

export function getImageHistory(): ImageHistoryItem[] {
  return getFromStorage<ImageHistoryItem[]>(STORAGE_KEYS.HISTORY_IMAGES, []);
}

export function saveImageHistory(record: Omit<ImageHistoryItem, 'id' | 'createdAt'>): void {
  const history = getImageHistory();
  history.unshift({
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  if (history.length > 100) history.splice(100);
  saveToStorage(STORAGE_KEYS.HISTORY_IMAGES, history);
}

export function deleteImageHistory(id: string): void {
  const history = getImageHistory().filter(item => item.id !== id);
  saveToStorage(STORAGE_KEYS.HISTORY_IMAGES, history);
}

export function clearImageHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY_IMAGES);
}

// ========== 音乐历史 ==========

export function getMusicHistory(): MusicHistoryItem[] {
  return getFromStorage<MusicHistoryItem[]>(STORAGE_KEYS.HISTORY_MUSIC, []);
}

export function saveMusicHistory(record: Omit<MusicHistoryItem, 'id' | 'createdAt'>): void {
  const history = getMusicHistory();
  history.unshift({
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  if (history.length > 100) history.splice(100);
  saveToStorage(STORAGE_KEYS.HISTORY_MUSIC, history);
}

export function deleteMusicHistory(id: string): void {
  const history = getMusicHistory().filter(item => item.id !== id);
  saveToStorage(STORAGE_KEYS.HISTORY_MUSIC, history);
}

export function clearMusicHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY_MUSIC);
}

// ========== TTS 历史 ==========

export function getTTSHistory(): TTSHistoryItem[] {
  return getFromStorage<TTSHistoryItem[]>(STORAGE_KEYS.HISTORY_TTS, []);
}

export function saveTTSHistory(record: Omit<TTSHistoryItem, 'id' | 'createdAt'>): void {
  const history = getTTSHistory();
  history.unshift({
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  if (history.length > 100) history.splice(100);
  saveToStorage(STORAGE_KEYS.HISTORY_TTS, history);
}

export function deleteTTSHistory(id: string): void {
  const history = getTTSHistory().filter(item => item.id !== id);
  saveToStorage(STORAGE_KEYS.HISTORY_TTS, history);
}

export function clearTTSHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY_TTS);
}

// ========== 全部历史 ==========

export function getAllHistory(): HistoryItem[] {
  const images = getImageHistory();
  const music = getMusicHistory();
  const tts = getTTSHistory();
  
  return [...images, ...music, ...tts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteHistory(id: string): void {
  // 尝试从所有类型中删除
  const images = getImageHistory();
  const music = getMusicHistory();
  const tts = getTTSHistory();

  if (images.some(item => item.id === id)) {
    deleteImageHistory(id);
    return;
  }
  if (music.some(item => item.id === id)) {
    deleteMusicHistory(id);
    return;
  }
  if (tts.some(item => item.id === id)) {
    deleteTTSHistory(id);
    return;
  }
}

export function clearAllHistory(): void {
  clearImageHistory();
  clearMusicHistory();
  clearTTSHistory();
}

// ========== Store 工具类 ==========

export class Store {
  private static instance: Store;

  private constructor() {}

  static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  // 获取完整状态
  getState(): StoreState {
    return {
      historyImages: getImageHistory(),
      historyMusic: getMusicHistory(),
      historyTTS: getTTSHistory(),
    };
  }

  // 清除所有数据
  clearAll(): void {
    clearAllHistory();
  }
}

export function getStore(): Store {
  return Store.getInstance();
}

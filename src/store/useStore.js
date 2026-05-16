/**
 * Zustand Store - 统一状态管理 + localStorage persist
 * 替代散装的 localStorage 调用
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // ============ State ============
      apiKey: '',
      groupId: '',
      theme: 'dark', // 'dark' | 'light'
      isOffline: false,

      // 历史记录统一存储（type: 'image' | 'music' | 'tts'）
      history: {
        images: [],
        music: [],
        tts: [],
      },

      // ============ Actions ============

      setApiKey: (apiKey) => set({ apiKey }),

      setGroupId: (groupId) => set({ groupId }),

      setTheme: (theme) => set({ theme }),

      setOffline: (isOffline) => set({ isOffline }),

      // 添加历史记录（type: 'image' | 'music' | 'tts'）
      addHistoryItem: (type, item) => {
        const keyMap = {
          image: 'images',
          music: 'music',
          tts: 'tts',
        };
        const storageKey = keyMap[type];
        if (!storageKey) return;

        const history = get().history;
        const items = history[storageKey] || [];
        const updated = [
          {
            ...item,
            id: Date.now(),
            createdAt: new Date().toISOString(),
          },
          ...items,
        ].slice(0, 50); // 最多 50 条

        set({
          history: {
            ...history,
            [storageKey]: updated,
          },
        });
      },

      // 获取某类型历史记录
      getHistory: (type) => {
        const keyMap = {
          image: 'images',
          music: 'music',
          tts: 'tts',
        };
        const storageKey = keyMap[type];
        if (!storageKey) return [];
        return get().history[storageKey] || [];
      },

      // 清空历史记录
      clearHistory: (type) => {
        if (!type || type === 'all') {
          set({ history: { images: [], music: [], tts: [] } });
          return;
        }
        const keyMap = {
          image: 'images',
          music: 'music',
          tts: 'tts',
        };
        const storageKey = keyMap[type];
        if (!storageKey) return;

        const history = get().history;
        set({
          history: {
            ...history,
            [storageKey]: [],
          },
        });
      },

      // 清空所有历史（兼容旧接口）
      clearAllHistory: () => {
        set({ history: { images: [], music: [], tts: [] } });
      },
    }),
    {
      name: 'ai-creator-h5-store', // localStorage key
    }
  )
);

export default useStore;
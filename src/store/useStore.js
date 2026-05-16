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

      // 用户上次选择的模型
      lastSelectedModel: {
        image: 'image-01',
        music: 'music-2.6',
        tts: 'speech-01',
      },

      // 模型使用统计
      modelUsage: {
        'image-01': 0,
        'image-02': 0,
        'music-2.6': 0,
        'music-02': 0,
        'speech-01': 0,
        'speech-02': 0,
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

      // ============ V5: 用户偏好记忆 + 模型使用统计 ============

      // 更新某类型上次选中的模型
      setLastSelectedModel: (type, model) => {
        set({
          lastSelectedModel: {
            ...get().lastSelectedModel,
            [type]: model,
          },
        });
      },

      // 某模型使用次数+1
      incrementModelUsage: (model) => {
        const usage = get().modelUsage;
        set({
          modelUsage: {
            ...usage,
            [model]: (usage[model] || 0) + 1,
          },
        });
      },

      // 获取某类型使用最多的模型
      getMostUsedModel: (type) => {
        const { lastSelectedModel, modelUsage } = get();
        const typeModels = {
          image: ['image-01', 'image-02'],
          music: ['music-2.6', 'music-02'],
          tts: ['speech-01', 'speech-02'],
        };
        const models = typeModels[type] || [];
        if (models.length === 0) return lastSelectedModel[type] || 'image-01';

        let mostUsed = models[0];
        let maxCount = modelUsage[mostUsed] || 0;
        for (const m of models) {
          const count = modelUsage[m] || 0;
          if (count > maxCount) {
            maxCount = count;
            mostUsed = m;
          }
        }
        return mostUsed;
      },
    }),
    {
      name: 'ai-creator-h5-store', // localStorage key
    }
  )
);

export default useStore;
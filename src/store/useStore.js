/**
 * Zustand Store - 统一状态管理 + localStorage persist
 * 替代散装的 localStorage 调用
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ V6: 模型成本配置 ============
export const MODEL_COST = {
  'image-01': { tokens: 100 },
  'image-02': { tokens: 50 },
  'music-2.6': { tokens: 200 },
  'music-02': { tokens: 150 },
  'speech-01': { tokens: 80 },
  'speech-02': { tokens: 120 },
};

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

      // ============ V7: 专辑 & 收藏 ============
      albums: [], // { id, name, createdAt }
      favorites: [], // { id, type, data, name, albumId, rating, createdAt }

      createAlbum: (name) => {
        const id = Date.now().toString();
        set({ albums: [...get().albums, { id, name, createdAt: new Date().toISOString() }] });
        return id;
      },

      deleteAlbum: (albumId) => {
        set({
          albums: get().albums.filter(a => a.id !== albumId),
          favorites: get().favorites.filter(f => f.albumId !== albumId),
        });
      },

      addFavorite: (item, albumId, name, rating) => {
        set({
          favorites: [...get().favorites, {
            id: Date.now().toString(),
            type: item.type,
            data: item.data || item,
            name: name || '',
            albumId: albumId || null,
            rating: rating || 0,
            createdAt: new Date().toISOString(),
          }],
        });
      },

      removeFavorite: (favoriteId) => {
        set({ favorites: get().favorites.filter(f => f.id !== favoriteId) });
      },

      getFavoritesByAlbum: (albumId) => {
        if (!albumId) return get().favorites;
        return get().favorites.filter(f => f.albumId === albumId);
      },

      moveFavorite: (favoriteId, newAlbumId) => {
        set({
          favorites: get().favorites.map(f =>
            f.id === favoriteId ? { ...f, albumId: newAlbumId } : f
          ),
        });
      },

      // ============ V6: 成本统计 ============

      // 所有模型调用次数之和
      getTotalUsage: () => {
        const { modelUsage } = get();
        return Object.values(modelUsage).reduce((sum, v) => sum + (v || 0), 0);
      },

      // 所有模型调用消耗 tokens 之和
      getTotalCost: () => {
        const { modelUsage } = get();
        let total = 0;
        for (const [model, count] of Object.entries(modelUsage)) {
          const cost = MODEL_COST[model];
          if (cost) total += (count || 0) * cost.tokens;
        }
        return total;
      },
    }),
    {
      name: 'ai-creator-h5-store', // localStorage key
    }
  )
);

export default useStore;
const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./PluginSharePanel-CrAbfnJL.js","./PluginShare-CphKts8Q.js","./TemplateMarketPanel-bvJ3h1tn.js","./TemplateMarket-BFmIOwYb.js","./BatchWorkflowPanel-BmLGxQTA.js","./BatchWorkflow-B5ou5SBm.js","./TaskQueue-DOQ0hbkZ.js","./CloudSyncPanel-C5bNJ9PT.js","./OfflineStorage--KIH4Fbv.js","./PerformanceOptimizerPanel-rLTuVx5s.js","./PerformanceOptimizer-CAwo3Qe8.js","./AnalyticsDashboardPanel-DnBPIyn3.js","./StorageStatsPanel-BDx6Pm1D.js","./TaskQueuePanel-jcJPAfbG.js","./imageService-BA_6x2Dp.js","./MiniMaxAdapter-DyumB4ZE.js","./musicService-9Lx0WHyP.js","./ttsService-eUW506fF.js","./VersionHistoryPanel-nBLvG65t.js"])))=>i.map(i=>d[i]);
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i = links.length - 1; i >= 0; i--) {
            const link2 = links[i];
            if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
let toastTimer = null;
function showToast({ title, icon = "none", duration = 2e3 }) {
  removeToast();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = title;
  document.body.appendChild(el);
  toastTimer = setTimeout(removeToast, duration);
}
function removeToast() {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  if (toastTimer) clearTimeout(toastTimer);
}
let loadingEl = null;
function showLoading({ title = "加载中...", mask = true } = {}) {
  hideLoading();
  loadingEl = document.createElement("div");
  loadingEl.className = "loading-mask";
  loadingEl.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">${title}</div>
  `;
  document.body.appendChild(loadingEl);
}
function hideLoading() {
  if (loadingEl) {
    loadingEl.remove();
    loadingEl = null;
  }
}
function showModal({
  title = "提示",
  content = "",
  showCancel = true,
  cancelText = "取消",
  confirmText = "确定"
}) {
  return new Promise((resolve) => {
    var _a, _b;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-content">${content}</div>
        <div class="modal-btns">
          ${showCancel ? `<button class="btn" id="modal-cancel">${cancelText}</button>` : ""}
          <button class="btn btn-primary" id="modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };
    (_a = overlay.querySelector("#modal-confirm")) == null ? void 0 : _a.addEventListener("click", () => cleanup({ confirm: true }));
    (_b = overlay.querySelector("#modal-cancel")) == null ? void 0 : _b.addEventListener("click", () => cleanup({ confirm: false, cancel: true }));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup({ confirm: false, cancel: true });
    });
  });
}
function createInnerAudioContext() {
  const audio = new Audio();
  const ctx = {
    audio,
    play() {
      return audio.play();
    },
    pause() {
      audio.pause();
    },
    stop() {
      audio.pause();
      audio.currentTime = 0;
    },
    destroy() {
      audio.pause();
      audio.src = "";
    },
    get src() {
      return audio.src;
    },
    set src(v) {
      audio.src = v;
    },
    get currentTime() {
      return audio.currentTime;
    },
    set currentTime(v) {
      audio.currentTime = v;
    },
    get duration() {
      return audio.duration;
    },
    get paused() {
      return audio.paused;
    },
    get volume() {
      return audio.volume;
    },
    set volume(v) {
      audio.volume = v;
    },
    onPlay(callback) {
      audio.addEventListener("play", callback);
    },
    onPause(callback) {
      audio.addEventListener("pause", callback);
    },
    onEnded(callback) {
      audio.addEventListener("ended", callback);
    },
    onError(callback) {
      audio.addEventListener("error", callback);
    },
    onTimeUpdate(callback) {
      audio.addEventListener("timeupdate", callback);
    },
    offPlay(callback) {
      audio.removeEventListener("play", callback);
    },
    offPause(callback) {
      audio.removeEventListener("pause", callback);
    },
    offEnded(callback) {
      audio.removeEventListener("ended", callback);
    },
    offError(callback) {
      audio.removeEventListener("error", callback);
    },
    offTimeUpdate(callback) {
      audio.removeEventListener("timeupdate", callback);
    }
  };
  return ctx;
}
function renderIndexPage() {
  return `
    <div class="page">
      <div class="card" style="margin-bottom:16px;">
        <h2 style="font-size:18px;margin-bottom:8px;">欢迎使用 AI Creator</h2>
        <p style="color:var(--text-secondary);font-size:14px;">选择下方功能开始创作</p>
      </div>

      <div class="feature-grid">
        <div class="feature-card" data-type="image">
          <div class="icon">🎨</div>
          <div class="name">图片生成</div>
        </div>
        <div class="feature-card" data-type="music">
          <div class="icon">🎵</div>
          <div class="name">音乐生成</div>
        </div>
        <div class="feature-card" data-type="tts">
          <div class="icon">🔊</div>
          <div class="name">语音合成</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3 style="font-size:16px;margin-bottom:12px;">使用说明</h3>
        <ol style="padding-left:20px;font-size:14px;color:var(--text-secondary);line-height:1.8;">
          <li>点击右上角「我的」配置 MiniMax API Key</li>
          <li>返回首页选择要使用的功能</li>
          <li>输入描述文字，点击生成</li>
          <li>生成完成后可预览、下载或分享</li>
        </ol>
      </div>

      <div class="card" style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#888;font-size:13px;">💾 本地存储: <span id="storage-count">-</span> 条记录</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" id="btn-storage-stats" style="padding:6px 12px;font-size:12px;">管理存储</button>
          <button class="btn btn-secondary" id="btn-task-queue" style="padding:6px 12px;font-size:12px;">⚡ 任务队列</button>
        </div>
      </div>
    </div>
  `;
}
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
const React = {};
const identity = (arg) => arg;
function useStore$1(api, selector = identity) {
  const slice = React.useSyncExternalStore(
    api.subscribe,
    React.useCallback(() => selector(api.getState()), [api, selector]),
    React.useCallback(() => selector(api.getInitialState()), [api, selector])
  );
  React.useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore$1(api, selector);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create = (createState) => createState ? createImpl(createState) : createImpl;
function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (e) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, void 0);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, void 0)),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      }
    };
  }
};
const persistImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    storage: createJSONStorage(() => window.localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  let hydrationVersion = 0;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    return setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      return setItem();
    },
    get,
    api
  );
  api.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage) return;
    const currentVersion = ++hydrationVersion;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => {
      var _a2;
      return cb((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            const migration = options.migrate(
              deserializedStorageValue.state,
              deserializedStorageValue.version
            );
            if (migration instanceof Promise) {
              return migration.then((result) => [true, result]);
            }
            return [true, migration];
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      if (currentVersion !== hydrationVersion) {
        return;
      }
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(get(), void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e) => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
const persist = persistImpl;
const MODEL_COST = {
  "image-01": { tokens: 100 },
  "image-02": { tokens: 50 },
  "music-2.6": { tokens: 200 },
  "music-02": { tokens: 150 },
  "speech-01": { tokens: 80 },
  "speech-02": { tokens: 120 }
};
const useStore = create(
  persist(
    (set, get) => ({
      // ============ State ============
      apiKey: "",
      groupId: "",
      theme: "dark",
      // 'dark' | 'light'
      isOffline: false,
      // 历史记录统一存储（type: 'image' | 'music' | 'tts'）
      history: {
        images: [],
        music: [],
        tts: []
      },
      // 用户上次选择的模型
      lastSelectedModel: {
        image: "image-01",
        music: "music-2.6",
        tts: "speech-01"
      },
      // 模型使用统计
      modelUsage: {
        "image-01": 0,
        "image-02": 0,
        "music-2.6": 0,
        "music-02": 0,
        "speech-01": 0,
        "speech-02": 0
      },
      // ============ Actions ============
      setApiKey: (apiKey) => set({ apiKey }),
      setGroupId: (groupId) => set({ groupId }),
      setTheme: (theme) => set({ theme }),
      setOffline: (isOffline) => set({ isOffline }),
      // 添加历史记录（type: 'image' | 'music' | 'tts'）
      // V9: item 可包含 rating, tags, note
      addHistoryItem: (type, item) => {
        const keyMap = {
          image: "images",
          music: "music",
          tts: "tts"
        };
        const storageKey = keyMap[type];
        if (!storageKey) return;
        const history = get().history;
        const items = history[storageKey] || [];
        const updated = [
          {
            ...item,
            id: Date.now(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            rating: item.rating || 0,
            tags: item.tags || [],
            note: item.note || ""
          },
          ...items
        ].slice(0, 50);
        set({
          history: {
            ...history,
            [storageKey]: updated
          }
        });
      },
      // 获取某类型历史记录
      getHistory: (type) => {
        const keyMap = {
          image: "images",
          music: "music",
          tts: "tts"
        };
        const storageKey = keyMap[type];
        if (!storageKey) return [];
        return get().history[storageKey] || [];
      },
      // 清空历史记录
      clearHistory: (type) => {
        if (!type || type === "all") {
          set({ history: { images: [], music: [], tts: [] } });
          return;
        }
        const keyMap = {
          image: "images",
          music: "music",
          tts: "tts"
        };
        const storageKey = keyMap[type];
        if (!storageKey) return;
        const history = get().history;
        set({
          history: {
            ...history,
            [storageKey]: []
          }
        });
      },
      // 删除单条历史记录（V8 批量操作）
      removeHistoryItem: (type, id) => {
        const keyMap = {
          image: "images",
          music: "music",
          tts: "tts"
        };
        const storageKey = keyMap[type];
        if (!storageKey) return;
        const history = get().history;
        set({
          history: {
            ...history,
            [storageKey]: (history[storageKey] || []).filter((item) => item.id !== id)
          }
        });
      },
      // 批量删除历史记录（V8 批量操作）
      removeHistoryItems: (items) => {
        const history = get().history;
        const keyMap = { image: "images", music: "music", tts: "tts" };
        const newHistory = { ...history };
        for (const { type, id } of items) {
          const storageKey = keyMap[type];
          if (!storageKey) continue;
          newHistory[storageKey] = (newHistory[storageKey] || []).filter((item) => item.id !== id);
        }
        set({ history: newHistory });
      },
      // V9: 更新单条历史记录的 rating/tags/note
      updateHistoryItem: (type, id, patch) => {
        const keyMap = {
          image: "images",
          music: "music",
          tts: "tts"
        };
        const storageKey = keyMap[type];
        if (!storageKey) return;
        const history = get().history;
        const items = history[storageKey] || [];
        const updated = items.map((item) => {
          if (item.id === id) {
            return { ...item, ...patch };
          }
          return item;
        });
        set({
          history: {
            ...history,
            [storageKey]: updated
          }
        });
      },
      // V9: 根据 type 和 id 数组获取条目
      getItemsByIds: (type, ids) => {
        const keyMap = {
          image: "images",
          music: "music",
          tts: "tts"
        };
        const storageKey = keyMap[type];
        if (!storageKey) return [];
        const items = get().history[storageKey] || [];
        return items.filter((item) => ids.includes(item.id));
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
            [type]: model
          }
        });
      },
      // 某模型使用次数+1
      incrementModelUsage: (model) => {
        const usage = get().modelUsage;
        set({
          modelUsage: {
            ...usage,
            [model]: (usage[model] || 0) + 1
          }
        });
      },
      // 获取某类型使用最多的模型
      getMostUsedModel: (type) => {
        const { lastSelectedModel, modelUsage } = get();
        const typeModels = {
          image: ["image-01", "image-02"],
          music: ["music-2.6", "music-02"],
          tts: ["speech-01", "speech-02"]
        };
        const models = typeModels[type] || [];
        if (models.length === 0) return lastSelectedModel[type] || "image-01";
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
      albums: [],
      // { id, name, createdAt }
      favorites: [],
      // { id, type, data, name, albumId, rating, createdAt }
      createAlbum: (name) => {
        const id = Date.now().toString();
        set({ albums: [...get().albums, { id, name, createdAt: (/* @__PURE__ */ new Date()).toISOString() }] });
        return id;
      },
      deleteAlbum: (albumId) => {
        set({
          albums: get().albums.filter((a) => a.id !== albumId),
          favorites: get().favorites.filter((f) => f.albumId !== albumId)
        });
      },
      addFavorite: (item, albumId, name, rating) => {
        set({
          favorites: [...get().favorites, {
            id: Date.now().toString(),
            type: item.type,
            data: item.data || item,
            name: name || "",
            albumId: albumId || null,
            rating: rating || 0,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }]
        });
      },
      removeFavorite: (favoriteId) => {
        set({ favorites: get().favorites.filter((f) => f.id !== favoriteId) });
      },
      getFavoritesByAlbum: (albumId) => {
        if (!albumId) return get().favorites;
        return get().favorites.filter((f) => f.albumId === albumId);
      },
      moveFavorite: (favoriteId, newAlbumId) => {
        set({
          favorites: get().favorites.map(
            (f) => f.id === favoriteId ? { ...f, albumId: newAlbumId } : f
          )
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
      }
    }),
    {
      name: "ai-creator-h5-store"
      // localStorage key
    }
  )
);
const TEMPLATES = {
  image: [
    { label: "写实摄影", template: "{prompt}, photorealistic, 8K, detailed lighting" },
    { label: "动漫风格", template: "{prompt}, anime style, vibrant colors" },
    { label: "插画风", template: "{prompt}, digital illustration, detailed" }
  ],
  music: [
    { label: "舒缓钢琴", template: "Soft piano melody, peaceful, ambient" },
    { label: "电子舞曲", template: "Electronic dance music, upbeat, energetic" },
    { label: "古典弦乐", template: "Classical orchestral, emotional, cinematic" }
  ],
  tts: [
    { label: "新闻播报", template: "Professional news broadcast tone" },
    { label: "故事讲述", template: "Warm storytelling voice, engaging" }
  ]
};
const MODEL_OPTIONS = {
  image: [
    { value: "image-01", label: "image-01 (默认)" },
    { value: "image-02", label: "image-02 (快速)" }
  ],
  music: [
    { value: "music-2.6", label: "music-2.6 (默认)" },
    { value: "music-02", label: "music-02 (编辑/续写)" }
  ],
  tts: [
    { value: "speech-01", label: "speech-01 (TTS HD，默认)" },
    { value: "speech-02", label: "speech-02 (情感语音)" }
  ]
};
let currentModel = {
  image: "image-01",
  music: "music-2.6",
  tts: "speech-01"
};
function renderGeneratePage() {
  return `
    <div class="page-header">
      <h1>✨ AI 生成</h1>
    </div>
    <div class="page">
      <div class="type-selector">
        <div class="type-tag active" data-type="image">🎨 图片</div>
        <div class="type-tag" data-type="music">🎵 音乐</div>
        <div class="type-tag" data-type="tts">🔊 语音</div>
      </div>

      <div class="card">
        <div id="generate-form">
          <!-- 模型选择器 -->
          <div class="form-label">模型</div>
          <select class="input" id="model-select">
            <option value="image-01">image-01 (默认)</option>
            <option value="image-02">image-02 (快速)</option>
          </select>

          <div id="form-dynamic-area">
            <!-- 提示词输入框 -->
            <div class="form-label" style="margin-top:12px;">图片描述 (Prompt)</div>
            <textarea class="input" id="prompt-input" placeholder="描述你想要生成的图片，例如：一只穿着汉服的猫咪"></textarea>

            <!-- 图片专用选项 -->
            <div id="image-options">
              <div style="margin-top:12px;">
                <div class="form-label">风格</div>
                <select class="input" id="style-select">
                  <option value="vivid">写实</option>
                  <option value="natural">自然</option>
                </select>
              </div>
              <div style="margin-top:12px;">
                <div class="form-label">尺寸</div>
                <select class="input" id="size-select">
                  <option value="1024x1024">1:1 (1024x1024)</option>
                  <option value="1792x1024">16:9 (1792x1024)</option>
                  <option value="1024x1792">9:16 (1024x1792)</option>
                </select>
              </div>
            </div>

            <!-- 语音专用选项 -->
            <div id="tts-options" style="display:none;">
              <div style="margin-top:12px;">
                <div class="form-label">音色</div>
                <select class="input" id="voice-select">
                  <option value="female-shaonv">少女声音</option>
                  <option value="male-qn-qingse">青年男声</option>
                  <option value="female-yujie">御姐声音</option>
                  <option value="female-tianmei">甜妹声音</option>
                  <option value="male-yunyang">云扬声音</option>
                  <option value="male-qn-jingxing">激情男声</option>
                </select>
              </div>
              <div style="margin-top:12px;">
                <div class="form-label">语速 (0.5 - 2.0)</div>
                <input type="range" id="tts-speed" min="0.5" max="2.0" step="0.1" value="1.0" style="width:100%;">
                <div style="text-align:center; font-size:12px; color:#888;" id="tts-speed-display">1.0x</div>
              </div>
            </div>
          </div>

          <!-- 模板区域 -->
          <div style="margin-top:12px;">
            <button class="btn btn-secondary btn-full" id="toggle-templates" type="button">
              📋 Templates
            </button>
            <div id="templates-container" style="display:none; margin-top:8px;"></div>
          </div>

          <!-- 工具箱按钮 -->
          <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="btn btn-secondary" id="open-tool-panel" type="button" style="flex:1;">
              🛠️ 工具箱
            </button>
            <button class="btn btn-secondary" id="open-ai-recommend" type="button" style="flex:1;">
              🤖 AI推荐
            </button>
          </div>
        </div>

        <button class="btn btn-primary btn-full" id="generate-btn" style="margin-top:16px;">
          开始生成
        </button>
      </div>

      <div id="result-container" class="card" style="display:none;"></div>
    </div>
  `;
}
function initGeneratePage() {
  var _a, _b, _c;
  const store = useStore.getState();
  currentModel = {
    image: ((_a = store.lastSelectedModel) == null ? void 0 : _a.image) || "image-01",
    music: ((_b = store.lastSelectedModel) == null ? void 0 : _b.music) || "music-2.6",
    tts: ((_c = store.lastSelectedModel) == null ? void 0 : _c.tts) || "speech-01"
  };
  document.querySelectorAll(".type-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      document.querySelectorAll(".type-tag").forEach((t) => t.classList.remove("active"));
      tag.classList.add("active");
      updateGenerateForm(tag.dataset.type);
    });
  });
  document.getElementById("model-select").addEventListener("change", (e) => {
    const activeTab = document.querySelector(".type-tag.active");
    if (activeTab) {
      const type = activeTab.dataset.type;
      currentModel[type] = e.target.value;
      useStore.getState().setLastSelectedModel(type, e.target.value);
    }
  });
  document.getElementById("toggle-templates").addEventListener("click", () => {
    const container = document.getElementById("templates-container");
    const isVisible = container.style.display !== "none";
    container.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      const activeTab = document.querySelector(".type-tag.active");
      renderTemplates((activeTab == null ? void 0 : activeTab.dataset.type) || "image");
    }
  });
  document.getElementById("tts-speed").addEventListener("input", (e) => {
    const display = document.getElementById("tts-speed-display");
    if (display) display.textContent = e.target.value + "x";
  });
}
function updateGenerateForm(type) {
  const modelSelect = document.getElementById("model-select");
  const opts = MODEL_OPTIONS[type] || MODEL_OPTIONS.image;
  modelSelect.innerHTML = opts.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
  if (currentModel[type]) {
    modelSelect.value = currentModel[type];
  }
  const promptInput = document.getElementById("prompt-input");
  if (type === "image") {
    promptInput.placeholder = "描述你想要生成的图片，例如：一只穿着汉服的猫咪";
  } else if (type === "music") {
    promptInput.placeholder = "描述你想要生成的音乐，例如：欢快的夏日海滩派对";
  } else if (type === "tts") {
    promptInput.placeholder = "输入要转换为语音的文本";
  }
  document.getElementById("image-options").style.display = type === "image" ? "block" : "none";
  document.getElementById("tts-options").style.display = type === "tts" ? "block" : "none";
  const container = document.getElementById("templates-container");
  if (container.style.display !== "none") {
    renderTemplates(type);
  }
}
function renderTemplates(type) {
  const container = document.getElementById("templates-container");
  const templates = TEMPLATES[type] || [];
  container.innerHTML = templates.map((t) => `
    <button class="btn btn-secondary" style="margin:4px;" data-template="${encodeURIComponent(t.template)}">
      ${t.label}
    </button>
  `).join("");
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const template = decodeURIComponent(btn.dataset.template);
      const input = document.getElementById("prompt-input");
      const currentValue = input.value.trim();
      let newValue = template;
      if (template.includes("{prompt}")) {
        newValue = template.replace("{prompt}", currentValue);
      } else if (currentValue) {
        newValue = currentValue + ", " + template;
      }
      input.value = newValue;
    });
  });
}
let batchSelectedItems = /* @__PURE__ */ new Set();
function renderHistoryPage() {
  batchSelectedItems.clear();
  return `
    <div class="page-header">
      <h1>📜 历史记录</h1>
    </div>
    <div class="page">
      <div id="batch-bar" style="display:none" class="batch-bar">
        <input type="checkbox" id="select-all">
        <span>已选 <span id="selected-count">0</span> 项</span>
        <button id="batch-fav" class="batch-btn">⭐ 批量收藏</button>
        <button id="batch-download" class="batch-btn">📥 批量下载</button>
        <button id="batch-delete" class="batch-btn">🗑 批量删除</button>
        <button id="batch-cancel" class="batch-btn batch-cancel">取消</button>
      </div>

      <div class="history-controls">
        <input type="text" id="search-input" class="input" placeholder="🔍 搜索 prompt / 备注" style="margin-bottom:8px;">

        <div class="filter-row">
          <div class="type-selector" style="margin-bottom:0;flex:1;">
            <div class="type-tag active" data-filter="all">全部</div>
            <div class="type-tag" data-filter="image">图片</div>
            <div class="type-tag" data-filter="music">音乐</div>
            <div class="type-tag" data-filter="tts">语音</div>
          </div>
        </div>

        <div class="filter-row">
          <select id="time-filter" class="filter-select">
            <option value="all">📅 全部时间</option>
            <option value="today">📆 今天</option>
            <option value="week">📆 本周</option>
            <option value="month">📆 本月</option>
          </select>
          <select id="rating-filter" class="filter-select">
            <option value="0">⭐ 全部评分</option>
            <option value="5">⭐ 5星</option>
            <option value="4">⭐ 4星+</option>
            <option value="3">⭐ 3星+</option>
            <option value="2">⭐ 2星+</option>
            <option value="1">⭐ 1星+</option>
          </select>
        </div>
      </div>

      <div id="history-list">
        <div class="empty-state">
          <div class="icon">📭</div>
          <p>加载中...</p>
        </div>
      </div>
    </div>

    <div id="favorite-modal" class="modal" style="display:none">
      <div class="modal-content">
        <h3>收藏到专辑</h3>
        <select id="album-select">
          <option value="">-- 选择专辑 --</option>
          <option value="__new__">+ 新建专辑</option>
        </select>
        <input id="new-album-name" placeholder="新专辑名称" style="display:none">
        <input id="favorite-name" placeholder="作品名称（可选）">
        <div class="modal-actions">
          <button id="fav-cancel">取消</button>
          <button id="fav-confirm">确认</button>
        </div>
      </div>
    </div>

    <div id="batch-fav-modal" class="modal" style="display:none">
      <div class="modal-content">
        <h3>批量收藏到专辑</h3>
        <p id="batch-fav-count" style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;"></p>
        <select id="batch-album-select">
          <option value="">-- 选择专辑 --</option>
          <option value="__new__">+ 新建专辑</option>
        </select>
        <input id="batch-new-album-name" placeholder="新专辑名称" style="display:none">
        <div class="modal-actions">
          <button id="batch-fav-cancel">取消</button>
          <button id="batch-fav-confirm">确认</button>
        </div>
      </div>
    </div>
  `;
}
function renderMyPage() {
  const { modelUsage, getTotalUsage, getTotalCost } = useStore.getState();
  const statsRows = Object.entries({
    "image-01": "Image-01",
    "image-02": "Image-02",
    "music-2.6": "Music-2.6",
    "music-02": "Music-02",
    "speech-01": "Speech-01",
    "speech-02": "Speech-02"
  }).map(([key, label]) => {
    const count = modelUsage[key] || 0;
    return `<div class="stat-row">
      <span class="model-name">${label}</span>
      <span class="model-count">${count}次</span>
    </div>`;
  }).join("");
  return `
    <div class="page-header">
      <h1>👤 我的</h1>
    </div>
    <div class="page">
      <div class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">⚙️ API 配置</h3>
        <div style="margin-bottom:12px;">
          <div class="form-label">MiniMax API Key (Token Plan)</div>
          <input type="text" class="input" id="api-key-input" placeholder="请输入 Token Plan API Key">
        </div>
        <button class="btn btn-primary btn-full" id="save-config-btn">
          保存配置
        </button>
        <p style="font-size:12px;color:var(--text-secondary);margin-top:8px;">
          获取地址：<a href="https://platform.minimaxi.com/user-center/basic-information/interface-key" target="_blank" style="color:var(--primary);">MiniMax 开放平台 - 接口密钥</a>
        </p>
        <p style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
          注意：Token Plan API Key 与按量计费 Key 不互通
        </p>
      </div>

      <div class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">📊 Token Plan 额度参考</h3>
        <table style="width:100%;font-size:12px;color:var(--text-secondary);border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:6px 0;">image-01</td>
            <td style="text-align:right;">Plus: 50张/日，Max: 120张/日</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:6px 0;">Music-2.6</td>
            <td style="text-align:right;">每日100首（每首≤5分钟）</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:6px 0;">Speech 2.8</td>
            <td style="text-align:right;">Plus: 4000字符/日，Max: 11000字符/日</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">M2.7</td>
            <td style="text-align:right;">按请求数计，每5小时滚动重置</td>
          </tr>
        </table>
      </div>

      <div class="card stats-section">
        <h3 style="font-size:16px;margin-bottom:16px;">📈 模型使用统计</h3>
        <div class="model-stats">
          ${statsRows}
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">📊 API 使用概览</h3>
        <div class="model-bars">
          ${(() => {
    const usageData = Object.entries({
      "image-01": "Image-01",
      "image-02": "Image-02",
      "music-2.6": "Music-2.6",
      "music-02": "Music-02",
      "speech-01": "Speech-01",
      "speech-02": "Speech-02"
    }).map(([key, label]) => {
      var _a;
      return {
        key,
        label,
        count: modelUsage[key] || 0,
        tokens: ((_a = MODEL_COST[key]) == null ? void 0 : _a.tokens) || 0
      };
    });
    const maxUsage = Math.max(...usageData.map((d) => d.count), 1);
    return usageData.map((d) => {
      const barPct = d.count > 0 ? Math.round(d.count / maxUsage * 100) : 0;
      return `<div class="bar-row">
                <span class="bar-label">${d.label}</span>
                <div class="bar-container"><div class="bar-fill" style="width:${barPct}%"></div></div>
                <span class="bar-count">${d.count}次 / ${d.tokens}tokens</span>
              </div>`;
    }).join("");
  })()}
        </div>
        <div class="total-cost">累计消耗: ${getTotalCost().toLocaleString()} tokens</div>
      </div>

      <div id="albums-section" class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">📁 我的专辑</h3>
        <button class="btn btn-primary btn-full" id="create-album-btn" style="margin-bottom:12px;">+ 新建专辑</button>
        <input type="text" class="input" id="new-album-name" placeholder="专辑名称" style="display:none;margin-bottom:12px;">
        <div id="album-list"></div>
      </div>

      <div class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">🗑️ 数据管理</h3>
        <button class="btn btn-full" id="clear-history-btn" style="background:#EA4335;color:#fff;">
          清空所有历史记录
        </button>
      </div>

      <div class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">ℹ️ 关于</h3>
        <p style="font-size:14px;color:var(--text-secondary);">
          AI Creator v1.1.0<br>
          支持 MiniMax Token Plan：图片生成、音乐生成、语音合成<br><br>
          本应用为 H5 版本，数据存储在本地浏览器中。
        </p>
      </div>
    </div>
  `;
}
class Tool {
  constructor({ id, name, description, icon, execute, validate }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.icon = icon || "🔧";
    this.execute = execute;
    this.validate = validate || (() => ({ valid: true }));
  }
}
const toolModules = [
  __vitePreload(() => import("./wordCount-C4F7bort.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./styleTag-CNCjNrLG.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./qualityCheck-DQvTrkn_.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./formatConvert-DBZp3hwT.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./rhymeSearch-C1fiFx2o.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./synonymSearch-DX3WqLBh.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./punctuationCheck-Bfc92V41.js"), true ? [] : void 0, import.meta.url),
  __vitePreload(() => import("./charCount-Cp_IF1rO.js"), true ? [] : void 0, import.meta.url)
];
class ToolRegistry {
  constructor() {
    this.tools = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    this._initialized = false;
  }
  register(tool) {
    if (!(tool instanceof Tool)) {
      tool = new Tool(tool);
    }
    this.tools.set(tool.id, tool);
    this.notify("register", tool);
    return this;
  }
  unregister(toolId) {
    const tool = this.tools.get(toolId);
    if (tool) {
      this.tools.delete(toolId);
      this.notify("unregister", tool);
    }
    return this;
  }
  get(toolId) {
    return this.tools.get(toolId);
  }
  list() {
    return Array.from(this.tools.values());
  }
  execute(toolId, context) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return { success: false, error: `Tool ${toolId} not found` };
    }
    const validation = tool.validate(context);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    try {
      const result = tool.execute(context);
      return { success: true, result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify(event, tool) {
    this.listeners.forEach((l) => l(event, tool));
  }
  // 异步初始化所有工具
  async init() {
    if (this._initialized) return;
    this._initialized = true;
    const results = await Promise.all(toolModules);
    for (const mod of results) {
      const toolExport = Object.values(mod)[0];
      if (toolExport) {
        this.register(toolExport);
      }
    }
    console.log("[ToolRegistry] Initialized with", this.tools.size, "tools");
  }
}
const toolRegistry = new ToolRegistry();
toolRegistry.init();
const RATING_KEY = "ai-creator-tool-ratings";
const FAVORITES_KEY = "ai-creator-tool-favorites";
function getRatings() {
  return JSON.parse(localStorage.getItem(RATING_KEY) || "{}");
}
function saveRatings(ratings) {
  localStorage.setItem(RATING_KEY, JSON.stringify(ratings));
}
function getFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
}
function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}
function toggleFavorite(toolId) {
  const favorites = getFavorites();
  const idx = favorites.indexOf(toolId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(toolId);
  }
  saveFavorites(favorites);
  return favorites.includes(toolId);
}
function isFavorite(toolId) {
  return getFavorites().includes(toolId);
}
function submitRating(toolId, score, comment) {
  const ratings = getRatings();
  if (!ratings[toolId]) {
    ratings[toolId] = { total: 0, count: 0, comments: [] };
  }
  ratings[toolId].total += score;
  ratings[toolId].count += 1;
  if (comment) {
    ratings[toolId].comments.push({
      score,
      comment,
      date: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  saveRatings(ratings);
  return getToolRating(toolId);
}
function getToolRating(toolId) {
  const ratings = getRatings();
  const data = ratings[toolId] || { total: 0, count: 0, comments: [] };
  return {
    average: data.count > 0 ? (data.total / data.count).toFixed(1) : "0.0",
    count: data.count,
    comments: data.comments.slice(-5).reverse()
  };
}
function getAllRatings() {
  getRatings();
  const result = {};
  for (const tool of toolRegistry.list()) {
    result[tool.id] = getToolRating(tool.id);
  }
  return result;
}
let panelCreators = {};
function loadPanelCreators() {
  return Promise.all([
    __vitePreload(() => import("./CustomToolEditor-CIwzE_EI.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.customEditor = m.createCustomToolEditor;
    }),
    __vitePreload(() => import("./ToolImportExport-DxOUAq_8.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.importExport = m.createToolImportExport;
    }),
    __vitePreload(() => import("./ToolRatingPanel-DzcgokNp.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.rating = m.createToolRatingPanel;
    }),
    __vitePreload(() => import("./ToolLeaderboard-Zr1tkOr2.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.leaderboard = m.createToolLeaderboard;
    }),
    __vitePreload(() => import("./ToolMarketplacePanel-CF8oQ-eX.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.marketplace = m.createToolMarketplacePanel;
    }),
    __vitePreload(() => import("./PluginSharePanel-CrAbfnJL.js"), true ? __vite__mapDeps([0,1]) : void 0, import.meta.url).then((m) => {
      panelCreators.share = m.createPluginSharePanel;
    }),
    __vitePreload(() => import("./TemplateMarketPanel-bvJ3h1tn.js"), true ? __vite__mapDeps([2,3]) : void 0, import.meta.url).then((m) => {
      panelCreators.template = m.createTemplateMarketPanel;
    }),
    __vitePreload(() => import("./BatchWorkflowPanel-BmLGxQTA.js"), true ? __vite__mapDeps([4,5,6,3,1]) : void 0, import.meta.url).then((m) => {
      panelCreators.batch = m.createBatchWorkflowPanel;
    }),
    __vitePreload(() => import("./CloudSyncPanel-C5bNJ9PT.js"), true ? __vite__mapDeps([7,3,5,6,8,1]) : void 0, import.meta.url).then((m) => {
      panelCreators.cloudSync = m.createCloudSyncPanel;
    }),
    __vitePreload(() => import("./NativeAPIPanel-dFHTXqXa.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.nativeAPI = m.createNativeAPIPanel;
    }),
    __vitePreload(() => import("./AISmartRecommenderPanel-DczOsRZb.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.smartRec = m.createAISmartRecommenderPanel;
    }),
    __vitePreload(() => import("./CommunitySystemPanel-vEEvaN1r.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.community = m.createCommunitySystemPanel;
    }),
    __vitePreload(() => import("./FlowEditorPanel-DHXMuThZ.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.flow = m.createFlowEditorPanel;
    }),
    __vitePreload(() => import("./PerformanceOptimizerPanel-rLTuVx5s.js"), true ? __vite__mapDeps([9,10]) : void 0, import.meta.url).then((m) => {
      panelCreators.perf = m.createPerformanceOptimizerPanel;
    }),
    __vitePreload(() => import("./AnalyticsDashboardPanel-DnBPIyn3.js"), true ? __vite__mapDeps([11,10]) : void 0, import.meta.url).then((m) => {
      panelCreators.analytics = m.createAnalyticsDashboardPanel;
    }),
    __vitePreload(() => import("./AdvancedSettingsPanel-BEg6XeTR.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.settings = m.createAdvancedSettingsPanel;
    }),
    __vitePreload(() => import("./PluginSDKPanel-BcQDTW91.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.sdk = m.createPluginSDKPanel;
    }),
    __vitePreload(() => import("./ARExplorerPanel-Bfy-9_fj.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.ar = m.createARExplorerPanel;
    }),
    __vitePreload(() => import("./VoiceAssistantPanel-CPVL4OHW.js"), true ? [] : void 0, import.meta.url).then((m) => {
      panelCreators.voice = m.createVoiceAssistantPanel;
    })
  ]);
}
function createToolPanel() {
  loadPanelCreators();
  const panel = document.createElement("div");
  panel.id = "tool-panel";
  panel.innerHTML = `
    <div class="tool-panel-header">
      <span class="tool-panel-title">🛠️ 工具箱</span>
      <button class="tool-panel-close" data-action="close">×</button>
    </div>
    <div class="tool-panel-search">
      <input type="text" placeholder="搜索工具..." id="tool-search-input" />
    </div>
    <div class="tool-panel-actions">
      <button class="btn-create-tool" id="btn-create-tool">➕ 创建工具</button>
      <button class="btn-import-export" id="btn-import-export">📦 导入/导出</button>
      <button class="btn-leaderboard" id="btn-leaderboard">🏆 排行</button>
      <button class="btn-marketplace" id="btn-marketplace">🛒 市场</button>
      <button class="btn-share" id="btn-share">🔗 分享</button>
      <button class="btn-template" id="btn-template">📋 模板</button>
      <button class="btn-batch" id="btn-batch">⚡ 批量</button>
      <button class="btn-cloud" id="btn-cloud">☁️ 同步</button>
      <button class="btn-desktop" id="btn-desktop">🖥️ 桌面</button>
      <button class="btn-ai" id="btn-ai">🧠 AI</button>
      <button class="btn-community" id="btn-community">👥 社区</button>
      <button class="btn-flow" id="btn-flow">🔀 流程</button>
      <button class="btn-perf" id="btn-perf">⚡ 性能</button>
      <button class="btn-analytics" id="btn-analytics">📊 分析</button>
      <button class="btn-settings" id="btn-settings">⚙️ 设置</button>
      <button class="btn-sdk" id="btn-sdk">🔌 SDK</button>
      <button class="btn-ar" id="btn-ar">🔮 AR</button>
      <button class="btn-voice" id="btn-voice">🎤 语音</button>
    </div>
    <div class="tool-list" id="tool-list"></div>
    <div class="tool-detail" id="tool-detail" style="display:none;">
      <div class="tool-detail-header">
        <span id="tool-detail-icon"></span>
        <span id="tool-detail-name"></span>
        <button class="btn-rating" id="btn-rating">⭐ 评分</button>
      </div>
      <p id="tool-detail-desc" class="tool-detail-desc"></p>
      <div id="tool-detail-form"></div>
      <div class="tool-detail-result" id="tool-detail-result"></div>
      <button class="tool-execute-btn" id="tool-execute-btn">▶️ 执行</button>
    </div>
  `;
  const style = document.createElement("style");
  style.textContent = `
    #tool-panel {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 420px; max-height: 80vh;
      background: #1a1a2e; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 1000; display: flex; flex-direction: column;
      font-family: system-ui, sans-serif;
    }
    .tool-panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #333;
      background: #16162a; border-radius: 12px 12px 0 0;
    }
    .tool-panel-title { font-size: 16px; font-weight: 600; color: #f97316; }
    .tool-panel-close {
      background: none; border: none; color: #888; font-size: 20px; cursor: pointer;
      padding: 0 4px; border-radius: 4px;
    }
    .tool-panel-close:hover { background: #333; color: #fff; }
    .tool-panel-search { padding: 10px 12px; border-bottom: 1px solid #222; }
    .tool-panel-search input {
      width: 100%; padding: 8px 12px; border: 1px solid #333;
      border-radius: 8px; background: #0d0d1a; color: #fff;
      font-size: 14px; box-sizing: border-box;
    }
    .tool-panel-search input:focus { outline: none; border-color: #f97316; }
    .tool-panel-actions { padding: 8px 12px; border-bottom: 1px solid #222; display: flex; gap: 6px; }
    .btn-create-tool, .btn-import-export {
      flex: 1; padding: 8px; border: none; border-radius: 6px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-create-tool { background: #4ade80; color: #000; }
    .btn-import-export { background: #60a5fa; color: #000; }
    .btn-leaderboard { background: #f59e0b; color: #000; }
    .btn-marketplace { background: #a855f7; color: #fff; }
    .btn-share { background: #34d399; color: #000; }
    .btn-template { background: #f472b6; color: #000; }
    .btn-batch { background: #fbbf24; color: #000; }
    .btn-cloud { background: #60a5fa; color: #fff; }
    .btn-desktop { background: #a78bfa; color: #fff; }
    .btn-ai { background: #ec4899; color: #fff; }
    .btn-community { background: #14b8a6; color: #fff; }
    .btn-flow { background: #f97316; color: #fff; }
    .btn-perf { background: #10b981; color: #fff; }
    .btn-analytics { background: #8b5cf6; color: #fff; }
    .btn-settings { background: #64748b; color: #fff; }
    .btn-sdk { background: #6366f1; color: #fff; }
    .btn-ar { background: #a78bfa; color: #fff; }
    .btn-voice { background: #10b981; color: #fff; }
    .btn-create-tool:hover, .btn-import-export:hover, .btn-leaderboard:hover, .btn-marketplace:hover, .btn-share:hover, .btn-template:hover, .btn-batch:hover, .btn-cloud:hover, .btn-desktop:hover, .btn-ai:hover, .btn-community:hover, .btn-flow:hover, .btn-perf:hover, .btn-analytics:hover, .btn-settings:hover, .btn-sdk:hover, .btn-ar:hover, .btn-voice:hover { opacity: 0.85; }
    .tool-list {
      flex: 1; overflow-y: auto; padding: 8px;
      max-height: 250px;
    }
    .tool-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px; cursor: pointer;
      transition: background 0.15s;
    }
    .tool-item:hover { background: #252540; }
    .tool-item.selected { background: #2a2a4a; border: 1px solid #f9731666; }
    .tool-item-icon { font-size: 20px; }
    .tool-item-name { color: #e0e0e0; font-size: 14px; flex: 1; }
    .tool-item-rating { font-size: 11px; color: #fbbf24; margin-left: 4px; }
    .tool-fav { font-size: 11px; margin-left: 2px; }
    .tool-detail {
      border-top: 1px solid #333; padding: 14px;
      background: #12122a;
    }
    .tool-detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    #tool-detail-icon { font-size: 24px; }
    #tool-detail-name { font-size: 16px; font-weight: 600; color: #fff; flex: 1; }
    .btn-rating {
      background: #fbbf24; border: none; border-radius: 4px;
      padding: 4px 8px; font-size: 12px; color: #000; cursor: pointer;
    }
    .btn-rating:hover { opacity: 0.85; }
    .tool-detail-desc { color: #888; font-size: 13px; margin: 8px 0; }
    #tool-detail-form { display: flex; flex-direction: column; gap: 8px; }
    #tool-detail-form input, #tool-detail-form textarea, #tool-detail-form select {
      padding: 8px 10px; border: 1px solid #333; border-radius: 6px;
      background: #0d0d1a; color: #fff; font-size: 13px;
    }
    #tool-detail-form input:focus, #tool-detail-form textarea:focus {
      outline: none; border-color: #f97316;
    }
    .tool-detail-result {
      margin-top: 10px; padding: 10px; background: #0d0d1a;
      border-radius: 6px; min-height: 60px; font-size: 13px;
      color: #4ade80; white-space: pre-wrap; max-height: 150px; overflow-y: auto;
    }
    .tool-execute-btn {
      margin-top: 10px; width: 100%; padding: 10px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none; border-radius: 8px; color: #fff;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    .tool-execute-btn:hover { opacity: 0.9; }
    .tool-execute-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);
  const toolList = panel.querySelector("#tool-list");
  let selectedToolId = null;
  const renderToolList = (filter = "") => {
    const tools = toolRegistry.list();
    const favorites = getFavorites();
    const filtered = tools.filter(
      (t) => t.name.includes(filter) || t.description.includes(filter)
    );
    toolList.innerHTML = filtered.map((t) => {
      const rating = getToolRating(t.id);
      const faved = favorites.includes(t.id);
      return `
      <div class="tool-item${t.id === selectedToolId ? " selected" : ""}" data-id="${t.id}">
        <span class="tool-item-icon">${t.icon}</span>
        <span class="tool-item-name">${t.name}</span>
        ${rating.average > 0 ? `<span class="tool-item-rating">★${rating.average}</span>` : ""}
        ${faved ? '<span class="tool-fav">❤️</span>' : ""}
      </div>
    `;
    }).join("");
    toolList.querySelectorAll(".tool-item").forEach((item) => {
      item.addEventListener("click", () => {
        selectedToolId = item.dataset.id;
        renderToolList(filter);
        showToolDetail(selectedToolId);
      });
    });
  };
  const showToolDetail = (toolId) => {
    const tool = toolRegistry.get(toolId);
    if (!tool) return;
    const detail = panel.querySelector("#tool-detail");
    detail.style.display = "block";
    panel.querySelector("#tool-detail-icon").textContent = tool.icon;
    panel.querySelector("#tool-detail-name").textContent = tool.name;
    panel.querySelector("#tool-detail-desc").textContent = tool.description;
    panel.querySelector("#tool-detail-result").textContent = "";
    let formHTML = "";
    if (tool.id === "word-count" || tool.id === "rhyme-search" || tool.id === "style-tag" || tool.id === "synonym-search" || tool.id === "punctuation-check" || tool.id === "char-count") {
      formHTML = `<textarea id="tool-input-text" rows="3" placeholder="输入文本..."></textarea>`;
    } else if (tool.id === "quality-check") {
      formHTML = `
        <input type="text" id="tool-input-prompt" placeholder="输入 prompt..." />
        <select id="tool-input-type">
          <option value="image">图片生成</option>
          <option value="music">音乐生成</option>
          <option value="tts">语音合成</option>
        </select>
      `;
    } else if (tool.id === "format-convert") {
      formHTML = `
        <textarea id="tool-input-data" rows="3" placeholder="输入数据..."></textarea>
        <select id="tool-input-from">
          <option value="json">JSON</option>
          <option value="text">文本</option>
          <option value="list">列表</option>
        </select>
        <select id="tool-input-to">
          <option value="text">文本</option>
          <option value="list">列表</option>
          <option value="json">JSON</option>
        </select>
      `;
    }
    panel.querySelector("#tool-detail-form").innerHTML = formHTML;
    panel.querySelector("#btn-rating").onclick = () => {
      const ratingPanel = createToolRatingPanel(toolId);
      if (ratingPanel) document.body.appendChild(ratingPanel);
    };
  };
  panel.querySelector("#tool-execute-btn").addEventListener("click", async () => {
    var _a, _b, _c, _d, _e, _f;
    if (!selectedToolId) return;
    const tool = toolRegistry.get(selectedToolId);
    const resultEl = panel.querySelector("#tool-detail-result");
    resultEl.textContent = "⏳ 执行中...";
    let context = {};
    if (tool.id === "word-count" || tool.id === "rhyme-search" || tool.id === "style-tag" || tool.id === "synonym-search" || tool.id === "punctuation-check" || tool.id === "char-count") {
      context.text = ((_a = panel.querySelector("#tool-input-text")) == null ? void 0 : _a.value) || "";
    } else if (tool.id === "quality-check") {
      context.prompt = ((_b = panel.querySelector("#tool-input-prompt")) == null ? void 0 : _b.value) || "";
      context.type = ((_c = panel.querySelector("#tool-input-type")) == null ? void 0 : _c.value) || "image";
    } else if (tool.id === "format-convert") {
      context.data = ((_d = panel.querySelector("#tool-input-data")) == null ? void 0 : _d.value) || "";
      context.from = ((_e = panel.querySelector("#tool-input-from")) == null ? void 0 : _e.value) || "text";
      context.to = ((_f = panel.querySelector("#tool-input-to")) == null ? void 0 : _f.value) || "list";
    }
    const result = await toolRegistry.execute(selectedToolId, context);
    resultEl.textContent = JSON.stringify(result, null, 2);
  });
  panel.querySelector("#tool-search-input").addEventListener("input", (e) => {
    renderToolList(e.target.value);
  });
  panel.querySelector("#btn-create-tool").addEventListener("click", () => {
    const editor = panelCreators.customEditor && panelCreators.customEditor();
    editor && document.body.appendChild(editor);
  });
  panel.querySelector("#btn-import-export").addEventListener("click", () => {
    const ie = panelCreators.importExport && panelCreators.importExport();
    ie && document.body.appendChild(ie);
  });
  panel.querySelector("#btn-leaderboard").addEventListener("click", () => {
    const lb = panelCreators.leaderboard && panelCreators.leaderboard();
    lb && document.body.appendChild(lb);
  });
  panel.querySelector("#btn-marketplace").addEventListener("click", () => {
    const mp = panelCreators.marketplace && panelCreators.marketplace();
    mp && document.body.appendChild(mp);
  });
  panel.querySelector("#btn-share").addEventListener("click", () => {
    const sp = panelCreators.share && panelCreators.share();
    sp && document.body.appendChild(sp);
  });
  panel.querySelector("#btn-template").addEventListener("click", () => {
    const tp = panelCreators.template && panelCreators.template();
    tp && document.body.appendChild(tp);
  });
  panel.querySelector("#btn-batch").addEventListener("click", () => {
    const bw = panelCreators.batch && panelCreators.batch();
    bw && document.body.appendChild(bw);
  });
  panel.querySelector("#btn-cloud").addEventListener("click", () => {
    const cs = panelCreators.cloudSync && panelCreators.cloudSync();
    cs && document.body.appendChild(cs);
  });
  panel.querySelector("#btn-desktop").addEventListener("click", () => {
    const na = panelCreators.nativeAPI && panelCreators.nativeAPI();
    na && document.body.appendChild(na);
  });
  panel.querySelector("#btn-ai").addEventListener("click", () => {
    const ai = panelCreators.smartRec && panelCreators.smartRec();
    ai && document.body.appendChild(ai);
  });
  panel.querySelector("#btn-community").addEventListener("click", () => {
    const cs = panelCreators.community && panelCreators.community();
    cs && document.body.appendChild(cs);
  });
  panel.querySelector("#btn-flow").addEventListener("click", () => {
    const fe = panelCreators.flow && panelCreators.flow();
    fe && document.body.appendChild(fe);
  });
  panel.querySelector("#btn-perf").addEventListener("click", () => {
    const po = panelCreators.perf && panelCreators.perf();
    po && document.body.appendChild(po);
  });
  panel.querySelector("#btn-analytics").addEventListener("click", () => {
    const ad = panelCreators.analytics && panelCreators.analytics();
    ad && document.body.appendChild(ad);
  });
  panel.querySelector("#btn-settings").addEventListener("click", () => {
    const as = panelCreators.settings && panelCreators.settings();
    as && document.body.appendChild(as);
  });
  panel.querySelector("#btn-sdk").addEventListener("click", () => {
    const sdk = panelCreators.sdk && panelCreators.sdk();
    sdk && document.body.appendChild(sdk);
  });
  panel.querySelector("#btn-ar").addEventListener("click", () => {
    const ar = panelCreators.ar && panelCreators.ar();
    ar && document.body.appendChild(ar);
  });
  panel.querySelector("#btn-voice").addEventListener("click", () => {
    const voice = panelCreators.voice && panelCreators.voice();
    voice && document.body.appendChild(voice);
  });
  panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (e) => e.stopPropagation());
  renderToolList();
  return panel;
}
const routes = {
  "": renderIndexPage,
  "index": renderIndexPage,
  "generate": renderGeneratePage,
  "history": renderHistoryPage,
  "my": renderMyPage
};
function render(page) {
  const app = document.getElementById("app");
  let content = "";
  if (routes[page]) {
    content = routes[page]();
  } else {
    content = renderIndexPage();
  }
  const tabBar = `
    <nav class="tab-nav">
      <div class="tab-item ${page === "index" || page === "" ? "active" : ""}" data-page="index">
        <span class="icon">🏠</span>
        <span>首页</span>
      </div>
      <div class="tab-item ${page === "generate" ? "active" : ""}" data-page="generate">
        <span class="icon">✨</span>
        <span>生成</span>
      </div>
      <div class="tab-item ${page === "history" ? "active" : ""}" data-page="history">
        <span class="icon">📜</span>
        <span>历史</span>
      </div>
      <div class="tab-item ${page === "my" ? "active" : ""}" data-page="my">
        <span class="icon">👤</span>
        <span>我的</span>
      </div>
    </nav>
  `;
  app.innerHTML = content + tabBar;
  app.style.animation = "fadeIn 0.3s ease";
  document.querySelectorAll(".tab-item").forEach((tab) => {
    tab.addEventListener("click", () => {
      const page2 = tab.dataset.page;
      navigate(page2);
    });
  });
  bindPageEvents(page);
}
function bindPageEvents(page) {
  if (page === "index") {
    bindIndexEvents();
  } else if (page === "generate") {
    bindGenerateEvents();
  } else if (page === "history") {
    bindHistoryEvents();
  } else if (page === "my") {
    bindMyEvents();
  }
}
function navigate(page) {
  window.location.hash = page;
  render(page);
}
function handleRoute() {
  const hash = window.location.hash.slice(1) || "index";
  render(hash);
}
function bindIndexEvents() {
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.type;
      navigate("generate");
      setTimeout(() => {
        const typeTag = document.querySelector(`.type-tag[data-type="${type}"]`);
        if (typeTag) typeTag.click();
      }, 100);
    });
  });
  const storageBtn = document.getElementById("btn-storage-stats");
  if (storageBtn) {
    storageBtn.addEventListener("click", () => {
      __vitePreload(() => import("./StorageStatsPanel-BDx6Pm1D.js"), true ? __vite__mapDeps([12,8]) : void 0, import.meta.url).then((m) => {
        const panel = m.createStorageStatsPanel();
        document.body.appendChild(panel);
      });
    });
  }
  const taskQueueBtn = document.getElementById("btn-task-queue");
  if (taskQueueBtn) {
    taskQueueBtn.addEventListener("click", () => {
      __vitePreload(() => import("./TaskQueuePanel-jcJPAfbG.js"), true ? __vite__mapDeps([13,6]) : void 0, import.meta.url).then((m) => {
        const panel = m.createTaskQueuePanel();
        document.body.appendChild(panel);
      });
    });
  }
  updateStorageCount();
}
function updateStorageCount() {
  const countEl = document.getElementById("storage-count");
  if (countEl) {
    __vitePreload(() => import("./OfflineStorage--KIH4Fbv.js"), true ? [] : void 0, import.meta.url).then((m) => {
      const stats = m.getStorageStats();
      countEl.textContent = stats.historyCount;
    });
  }
}
function bindGenerateEvents() {
  initGeneratePage();
  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", handleGenerate);
  }
  const toolBtn = document.getElementById("open-tool-panel");
  if (toolBtn) {
    toolBtn.addEventListener("click", () => {
      const existing = document.getElementById("tool-panel");
      if (existing) existing.remove();
      const panel = createToolPanel();
      document.body.appendChild(panel);
    });
  }
  const aiBtn = document.getElementById("open-ai-recommend");
  if (aiBtn) {
    aiBtn.addEventListener("click", () => {
      const promptInput = document.getElementById("prompt-input");
      const inputText = (promptInput == null ? void 0 : promptInput.value) || "";
      __vitePreload(() => import("./AIRecommendationPanel-DMHDfy73.js"), true ? [] : void 0, import.meta.url).then((m) => {
        const panel = m.createAIRecommendationPanel(inputText);
        document.body.appendChild(panel);
      });
    });
  }
}
async function handleGenerate() {
  var _a, _b, _c, _d, _e, _f;
  const typeTags = document.querySelectorAll(".type-tag.active");
  if (!typeTags.length) return;
  const type = typeTags[0].dataset.type;
  const promptInput = document.getElementById("prompt-input");
  if (!promptInput || !promptInput.value.trim()) {
    showToast({ title: "请输入内容" });
    return;
  }
  const modelSelect = document.getElementById("model-select");
  const selectedModel = (modelSelect == null ? void 0 : modelSelect.value) || (type === "image" ? "image-01" : type === "music" ? "music-2.6" : "speech-01");
  const btn = document.getElementById("generate-btn");
  btn.disabled = true;
  btn.textContent = "生成中...";
  try {
    let result;
    if (type === "image") {
      const { generateImage } = await __vitePreload(async () => {
        const { generateImage: generateImage2 } = await import("./imageService-BA_6x2Dp.js");
        return { generateImage: generateImage2 };
      }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
      const style = ((_a = document.getElementById("style-select")) == null ? void 0 : _a.value) || "vivid";
      const size = ((_b = document.getElementById("size-select")) == null ? void 0 : _b.value) || "1024x1024";
      result = await generateImage({ prompt: promptInput.value, model: selectedModel, style, size });
      showResult("image", result);
      useStore.getState().incrementModelUsage(selectedModel);
    } else if (type === "music") {
      const { generateMusic } = await __vitePreload(async () => {
        const { generateMusic: generateMusic2 } = await import("./musicService-9Lx0WHyP.js");
        return { generateMusic: generateMusic2 };
      }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
      const duration = parseInt(((_c = document.getElementById("duration-input")) == null ? void 0 : _c.value) || "180");
      const lyrics = ((_d = document.getElementById("lyrics-input")) == null ? void 0 : _d.value) || "";
      result = await generateMusic({ prompt: promptInput.value, model: selectedModel, lyrics, duration });
      showResult("music", result);
      useStore.getState().incrementModelUsage(selectedModel);
    } else if (type === "tts") {
      const { generateTTS } = await __vitePreload(async () => {
        const { generateTTS: generateTTS2 } = await import("./ttsService-eUW506fF.js");
        return { generateTTS: generateTTS2 };
      }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
      const voice = ((_e = document.getElementById("voice-select")) == null ? void 0 : _e.value) || "female-shaonv";
      const speed = parseFloat(((_f = document.getElementById("tts-speed")) == null ? void 0 : _f.value) || "1.0");
      result = await generateTTS({ input: promptInput.value, model: selectedModel, voice, speed });
      showResult("tts", result);
      useStore.getState().incrementModelUsage(selectedModel);
    }
  } catch (err) {
    showToast({ title: err.message || "生成失败" });
  } finally {
    btn.disabled = false;
    btn.textContent = "生成";
  }
}
function showResult(type, result) {
  var _a, _b;
  const resultContainer = document.getElementById("result-container");
  if (!resultContainer) return;
  let html = '<div class="card"><div class="form-label">生成结果</div>';
  if (type === "image" && ((_b = (_a = result.data) == null ? void 0 : _a.image_urls) == null ? void 0 : _b[0])) {
    const imgUrl = result.data.image_urls[0];
    html += `<img src="${imgUrl}" class="preview-image" alt="生成图片">`;
    html += `<div style="margin-top:12px;display:flex;gap:8px;">`;
    html += `<button class="btn" onclick="window.open('${imgUrl}', '_blank')">在新窗口打开</button>`;
    html += `</div>`;
  } else if (type === "music" && result.url) {
    html += `<audio src="${result.url}" controls class="audio-player"></audio>`;
    html += `<div style="margin-top:12px;">`;
    html += `<button class="btn" onclick="window.open('${result.url}', '_blank')">下载音乐</button>`;
    html += `</div>`;
  } else if (type === "tts" && result.url) {
    html += `<audio src="${result.url}" controls class="audio-player"></audio>`;
    html += `<div style="margin-top:12px;">`;
    html += `<button class="btn" onclick="window.open('${result.url}', '_blank')">下载音频</button>`;
    html += `</div>`;
  } else {
    html += "<p>生成完成，但未返回有效数据</p>";
    html += `<pre style="font-size:10px;overflow:auto;max-height:100px;">${JSON.stringify(result, null, 2)}</pre>`;
  }
  html += "</div>";
  resultContainer.innerHTML = html;
  resultContainer.style.display = "block";
}
function bindHistoryEvents() {
  document.querySelectorAll(".type-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      document.querySelectorAll(".type-tag").forEach((t) => t.classList.remove("active"));
      tag.classList.add("active");
      loadHistory(getCurrentFilters());
    });
  });
  const timeFilter = document.getElementById("time-filter");
  if (timeFilter) {
    timeFilter.addEventListener("change", () => {
      loadHistory(getCurrentFilters());
    });
  }
  const ratingFilter = document.getElementById("rating-filter");
  if (ratingFilter) {
    ratingFilter.addEventListener("change", () => {
      loadHistory(getCurrentFilters());
    });
  }
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadHistory(getCurrentFilters());
      }, 300);
    });
  }
  const batchDownloadBtn = document.getElementById("batch-download");
  if (batchDownloadBtn) {
    batchDownloadBtn.addEventListener("click", handleBatchDownload);
  }
  loadHistory(getCurrentFilters());
}
function getCurrentFilters() {
  var _a, _b, _c, _d;
  const activeFilter = ((_a = document.querySelector(".type-tag.active")) == null ? void 0 : _a.dataset.filter) || "all";
  const timeFilter = ((_b = document.getElementById("time-filter")) == null ? void 0 : _b.value) || "all";
  const ratingFilter = parseInt(((_c = document.getElementById("rating-filter")) == null ? void 0 : _c.value) || "0");
  const searchKeyword = ((_d = document.getElementById("search-input")) == null ? void 0 : _d.value.trim().toLowerCase()) || "";
  return { filter: activeFilter, timeFilter, ratingFilter, searchKeyword };
}
function updateBatchBar() {
  var _a;
  const batchBar = document.getElementById("batch-bar");
  const selectedCount = document.getElementById("selected-count");
  if (!batchBar || !selectedCount) return;
  const count = ((_a = window.__batchSelectedItems) == null ? void 0 : _a.size) || 0;
  selectedCount.textContent = count;
  batchBar.style.display = count > 0 ? "flex" : "none";
}
function isWithinTimeRange(dateStr, timeFilter) {
  if (timeFilter === "all") return true;
  const date = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  if (timeFilter === "today") {
    return date.toDateString() === now.toDateString();
  } else if (timeFilter === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  } else if (timeFilter === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }
  return true;
}
function matchesSearch(item, keyword) {
  if (!keyword) return true;
  const prompt = (item.prompt || item.input || "").toLowerCase();
  const note = (item.note || "").toLowerCase();
  return prompt.includes(keyword) || note.includes(keyword);
}
function matchesRating(item, minRating) {
  if (minRating === 0) return true;
  return (item.rating || 0) >= minRating;
}
async function loadHistory(filters) {
  let filter, timeFilter, ratingFilter, searchKeyword;
  if (typeof filters === "object") {
    ({ filter = "all", timeFilter = "all", ratingFilter = 0, searchKeyword = "" } = filters);
  } else {
    filter = filters;
    timeFilter = "all";
    ratingFilter = 0;
    searchKeyword = "";
  }
  const listContainer = document.getElementById("history-list");
  if (!listContainer) return;
  window.__batchSelectedItems = /* @__PURE__ */ new Set();
  updateBatchBar();
  let images = [], music = [], tts = [];
  if (filter === "all" || filter === "image") {
    const { getHistory: getImageHistory } = await __vitePreload(async () => {
      const { getHistory: getImageHistory2 } = await import("./imageService-BA_6x2Dp.js");
      return { getHistory: getImageHistory2 };
    }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
    images = getImageHistory();
  }
  if (filter === "all" || filter === "music") {
    const { getHistory: getMusicHistory } = await __vitePreload(async () => {
      const { getHistory: getMusicHistory2 } = await import("./musicService-9Lx0WHyP.js");
      return { getHistory: getMusicHistory2 };
    }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
    music = getMusicHistory();
  }
  if (filter === "all" || filter === "tts") {
    const { getHistory: getTTSHistory } = await __vitePreload(async () => {
      const { getHistory: getTTSHistory2 } = await import("./ttsService-eUW506fF.js");
      return { getHistory: getTTSHistory2 };
    }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
    tts = getTTSHistory();
  }
  const all = [
    ...images.map((i) => ({ ...i, type: "image" })),
    ...music.map((m) => ({ ...m, type: "music" })),
    ...tts.map((t) => ({ ...t, type: "tts" }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = all.filter((item) => {
    if (!isWithinTimeRange(item.createdAt, timeFilter)) return false;
    if (!matchesRating(item, ratingFilter)) return false;
    if (!matchesSearch(item, searchKeyword)) return false;
    return true;
  });
  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>暂无历史记录</p>
      </div>
    `;
    return;
  }
  listContainer.innerHTML = filtered.map((item) => `
    <div class="history-item" data-id="${item.id}" data-type="${item.type}">
      <input type="checkbox" class="item-checkbox" data-id="${item.id}" data-type="${item.type}">
      ${item.type === "image" ? `<img class="history-thumb" src="${item.url}" alt="图片">` : '<div class="history-thumb" style="display:flex;align-items:center;justify-content:center;font-size:32px;">' + (item.type === "music" ? "🎵" : "🔊") + "</div>"}
      <div class="history-info">
        <div class="history-title">${item.prompt || item.input || "生成作品"}</div>
        <div class="history-meta">
          ${new Date(item.createdAt).toLocaleString()}
          ${item.tags && item.tags.length > 0 ? `<span class="item-tags">${item.tags.map((t) => `<span class="tag-dot" style="background:${t}"></span>`).join("")}</span>` : ""}
        </div>
        <div class="history-note-preview" id="note-preview-${item.id}" style="font-size:11px;color:var(--text-secondary);margin-top:2px;${item.note ? "" : "display:none"}">
          📝 ${item.note.length > 30 ? item.note.slice(0, 30) + "..." : item.note}
        </div>
      </div>

      <!-- V9: 评分星星 -->
      <div class="item-rating" data-id="${item.id}" data-type="${item.type}" onclick="event.stopPropagation()">
        ${[1, 2, 3, 4, 5].map((n) => `<span class="star ${n <= (item.rating || 0) ? "filled" : ""}" data-value="${n}">★</span>`).join("")}
      </div>

      <!-- V9: 标签按钮 -->
      <button class="tag-btn" data-id="${item.id}" data-type="${item.type}" onclick="event.stopPropagation()">🏷️</button>

      <!-- V9: 备注按钮 -->
      <button class="note-btn" data-id="${item.id}" data-type="${item.type}" onclick="event.stopPropagation()">📝</button>

      <button class="share-btn" data-id="${item.id}" data-type="${item.type}" data-url="${item.url || ""}">📤</button>
      <button class="fav-btn" data-id="${item.id}" data-type="${item.type}">⭐</button>
      <button class="version-btn" data-id="${item.id}" data-type="${item.type}" data-title="${(item.prompt || item.input || "生成作品").slice(0, 20)}">📜</button>
    </div>
  `).join("");
  document.querySelectorAll(".item-rating .star").forEach((star) => {
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = star.closest(".item-rating").dataset.type;
      const id = parseInt(star.closest(".item-rating").dataset.id);
      const value = parseInt(star.dataset.value);
      handleUpdateRating(type, id, value);
    });
  });
  document.querySelectorAll(".tag-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = parseInt(btn.dataset.id);
      openTagModal(type, id);
    });
  });
  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = parseInt(btn.dataset.id);
      openNoteModal(type, id);
    });
  });
  document.querySelectorAll(".item-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      const key = `${cb.dataset.type}-${cb.dataset.id}`;
      if (!window.__batchSelectedItems) window.__batchSelectedItems = /* @__PURE__ */ new Set();
      if (cb.checked) {
        window.__batchSelectedItems.add(key);
      } else {
        window.__batchSelectedItems.delete(key);
      }
      updateBatchBar();
      updateSelectAllState();
    });
  });
  const selectAll = document.getElementById("select-all");
  if (selectAll) {
    selectAll.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.querySelectorAll(".item-checkbox").forEach((cb) => {
        cb.checked = checked;
        const key = `${cb.dataset.type}-${cb.dataset.id}`;
        if (checked) {
          window.__batchSelectedItems.add(key);
        } else {
          window.__batchSelectedItems.delete(key);
        }
      });
      updateBatchBar();
    });
  }
  const batchDeleteBtn = document.getElementById("batch-delete");
  if (batchDeleteBtn) {
    batchDeleteBtn.onclick = () => {
      const items = Array.from(window.__batchSelectedItems || []);
      if (items.length === 0) return;
      if (confirm(`确认删除 ${items.length} 项？`)) {
        const toRemove = items.map((key) => {
          const [type, id] = key.split("-");
          return { type, id: parseInt(id) };
        });
        useStore.getState().removeHistoryItems(toRemove);
        showToast({ title: `已删除 ${items.length} 项` });
        loadHistory(getCurrentFilters());
      }
    };
  }
  const batchFavBtn = document.getElementById("batch-fav");
  if (batchFavBtn) {
    batchFavBtn.onclick = () => {
      const items = Array.from(window.__batchSelectedItems || []);
      if (items.length === 0) return;
      openBatchFavoriteModal(items);
    };
  }
  const batchCancelBtn = document.getElementById("batch-cancel");
  if (batchCancelBtn) {
    batchCancelBtn.onclick = () => {
      window.__batchSelectedItems = /* @__PURE__ */ new Set();
      document.querySelectorAll(".item-checkbox").forEach((cb) => cb.checked = false);
      const selectAllEl = document.getElementById("select-all");
      if (selectAllEl) selectAllEl.checked = false;
      updateBatchBar();
    };
  }
  document.querySelectorAll(".share-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const url = btn.dataset.url;
      handleShare(type, url);
    });
  });
  document.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = parseInt(btn.dataset.id);
      openFavoriteModal(type, id);
    });
  });
  document.querySelectorAll(".version-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      __vitePreload(() => import("./VersionHistoryPanel-nBLvG65t.js"), true ? __vite__mapDeps([18,8]) : void 0, import.meta.url).then((m) => {
        const panel = m.createVersionHistoryPanel(btn.dataset.id, btn.dataset.title);
        document.body.appendChild(panel);
      });
    });
  });
  document.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
      const type = item.dataset.type;
      const id = parseInt(item.dataset.id);
      showHistoryDetail(type, id);
    });
  });
}
async function handleUpdateRating(type, id, value) {
  useStore.getState().updateHistoryItem(type, id, { rating: value });
  const ratingEl = document.querySelector(`.item-rating[data-id="${id}"][data-type="${type}"]`);
  if (ratingEl) {
    ratingEl.querySelectorAll(".star").forEach((star) => {
      const starVal = parseInt(star.dataset.value);
      star.classList.toggle("filled", starVal <= value);
    });
  }
  showToast({ title: `已设为 ${value} 星` });
}
async function openTagModal(type, id) {
  let currentTags = [];
  if (type === "image") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./imageService-BA_6x2Dp.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
    const item = getHistory().find((i) => i.id === id);
    currentTags = (item == null ? void 0 : item.tags) || [];
  } else if (type === "music") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./musicService-9Lx0WHyP.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
    const item = getHistory().find((i) => i.id === id);
    currentTags = (item == null ? void 0 : item.tags) || [];
  } else if (type === "tts") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./ttsService-eUW506fF.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
    const item = getHistory().find((i) => i.id === id);
    currentTags = (item == null ? void 0 : item.tags) || [];
  }
  const tagColors = [
    { name: "红", value: "#ef4444" },
    { name: "橙", value: "#f97316" },
    { name: "黄", value: "#eab308" },
    { name: "绿", value: "#22c55e" },
    { name: "青", value: "#06b6d4" },
    { name: "蓝", value: "#3b82f6" },
    { name: "紫", value: "#a855f7" },
    { name: "粉", value: "#ec4899" }
  ];
  const content = `
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
      ${tagColors.map((t) => `
        <div class="tag-option ${currentTags.includes(t.value) ? "selected" : ""}"
             data-color="${t.value}"
             style="width:40px;height:40px;border-radius:50%;background:${t.value};cursor:pointer;opacity:${currentTags.includes(t.value) ? 1 : 0.4};border:3px solid ${currentTags.includes(t.value) ? "#fff" : "transparent"};">
        </div>
      `).join("")}
    </div>
  `;
  await showModal({
    title: "选择标签",
    content,
    confirmText: "保存",
    cancelText: "取消"
  }).then(async ({ confirm: confirm2 }) => {
    if (!confirm2) return;
    const selected = [];
    document.querySelectorAll(".tag-option.selected").forEach((el) => {
      selected.push(el.dataset.color);
    });
    useStore.getState().updateHistoryItem(type, id, { tags: selected });
    showToast({ title: "标签已更新" });
    loadHistory(getCurrentFilters());
  });
  setTimeout(() => {
    document.querySelectorAll(".tag-option").forEach((el) => {
      el.addEventListener("click", () => {
        el.classList.toggle("selected");
        el.style.opacity = el.classList.contains("selected") ? 1 : 0.4;
        el.style.borderColor = el.classList.contains("selected") ? "#fff" : "transparent";
      });
    });
  }, 100);
}
async function openNoteModal(type, id) {
  let currentNote = "";
  if (type === "image") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./imageService-BA_6x2Dp.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
    const item = getHistory().find((i) => i.id === id);
    currentNote = (item == null ? void 0 : item.note) || "";
  } else if (type === "music") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./musicService-9Lx0WHyP.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
    const item = getHistory().find((i) => i.id === id);
    currentNote = (item == null ? void 0 : item.note) || "";
  } else if (type === "tts") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./ttsService-eUW506fF.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
    const item = getHistory().find((i) => i.id === id);
    currentNote = (item == null ? void 0 : item.note) || "";
  }
  await showModal({
    title: "编辑备注",
    content: `<textarea id="note-input" class="input" rows="3" placeholder="输入备注信息...">${currentNote}</textarea>`,
    confirmText: "保存",
    cancelText: "取消"
  }).then(({ confirm: confirm2 }) => {
    var _a;
    if (!confirm2) return;
    const note = ((_a = document.getElementById("note-input")) == null ? void 0 : _a.value) || "";
    useStore.getState().updateHistoryItem(type, id, { note });
    showToast({ title: "备注已保存" });
    const preview = document.getElementById(`note-preview-${id}`);
    if (preview) {
      if (note) {
        preview.textContent = "📝 " + (note.length > 30 ? note.slice(0, 30) + "..." : note);
        preview.style.display = "block";
      } else {
        preview.style.display = "none";
      }
    }
  });
}
async function handleBatchDownload() {
  var _a;
  const items = Array.from(window.__batchSelectedItems || []);
  if (items.length === 0) {
    showToast({ title: "请先选择要下载的项目" });
    return;
  }
  showToast({ title: `正在准备 ${items.length} 个文件...` });
  try {
    const zip = new JSZip();
    let addedCount = 0;
    for (const key of items) {
      const [type, idStr] = key.split("-");
      const id = parseInt(idStr);
      let item = null;
      let folderName = "";
      if (type === "image") {
        const { getHistory } = await __vitePreload(async () => {
          const { getHistory: getHistory2 } = await import("./imageService-BA_6x2Dp.js");
          return { getHistory: getHistory2 };
        }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
        item = getHistory().find((i) => i.id === id);
        folderName = "images";
      } else if (type === "music") {
        const { getHistory } = await __vitePreload(async () => {
          const { getHistory: getHistory2 } = await import("./musicService-9Lx0WHyP.js");
          return { getHistory: getHistory2 };
        }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
        item = getHistory().find((i) => i.id === id);
        folderName = "music";
      } else if (type === "tts") {
        const { getHistory } = await __vitePreload(async () => {
          const { getHistory: getHistory2 } = await import("./ttsService-eUW506fF.js");
          return { getHistory: getHistory2 };
        }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
        item = getHistory().find((i) => i.id === id);
        folderName = "audio";
      }
      if (item && item.url) {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          const ext = getFileExtension(item.url, type);
          const filename = `${folderName}/${item.id}_${((_a = item.prompt) == null ? void 0 : _a.slice(0, 20)) || "untitled"}${ext}`;
          zip.file(filename.replace(/[\/\\:*?"<>|]/g, "_"), blob);
          addedCount++;
        } catch (e) {
          console.warn(`下载失败: ${item.url}`, e);
        }
      }
    }
    if (addedCount === 0) {
      showToast({ title: "没有可下载的文件" });
      return;
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:-]/g, "");
    saveAs(zipBlob, `ai-creator-${timestamp}.zip`);
    showToast({ title: `已生成 ${addedCount} 个文件的 ZIP 包` });
  } catch (e) {
    console.error("批量下载失败", e);
    showToast({ title: "批量下载失败: " + (e.message || "未知错误") });
  }
}
function getFileExtension(url, type) {
  if (!url) {
    return type === "image" ? ".png" : type === "music" ? ".mp3" : ".wav";
  }
  const match = url.match(/\.[^.]+$/);
  if (match) return match[0];
  return type === "image" ? ".png" : type === "music" ? ".mp3" : ".wav";
}
function updateSelectAllState() {
  const selectAll = document.getElementById("select-all");
  const checkboxes = document.querySelectorAll(".item-checkbox");
  if (!selectAll || checkboxes.length === 0) return;
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  const someChecked = Array.from(checkboxes).some((cb) => cb.checked);
  selectAll.checked = allChecked;
  selectAll.indeterminate = someChecked && !allChecked;
}
function handleShare(type, url) {
  if (type === "image" && url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast({ title: "已复制到剪贴板" });
      }).catch(() => {
        showToast({ title: "复制失败" });
      });
    } else {
      alert("复制功能在非安全环境下不可用");
    }
  } else if ((type === "music" || type === "tts") && url) {
    try {
      const audio = new Audio(url);
      audio.play();
      showToast({ title: "正在播放" });
    } catch (e) {
      showToast({ title: "播放失败" });
    }
  } else {
    showToast({ title: "分享内容不可用" });
  }
}
async function openBatchFavoriteModal(items) {
  const { albums, addFavorite, createAlbum } = useStore.getState();
  const modal = document.getElementById("batch-fav-modal");
  const albumSelect = document.getElementById("batch-album-select");
  const newAlbumInput = document.getElementById("batch-new-album-name");
  const countEl = document.getElementById("batch-fav-count");
  countEl.textContent = `已选 ${items.length} 项`;
  albumSelect.innerHTML = '<option value="">-- 选择专辑 --</option>' + albums.map((a) => `<option value="${a.id}">${a.name}</option>`).join("") + '<option value="__new__">+ 新建专辑</option>';
  newAlbumInput.style.display = "none";
  newAlbumInput.value = "";
  modal.style.display = "flex";
  albumSelect.onchange = () => {
    newAlbumInput.style.display = albumSelect.value === "__new__" ? "block" : "none";
  };
  document.getElementById("batch-fav-cancel").onclick = () => {
    modal.style.display = "none";
  };
  document.getElementById("batch-fav-confirm").onclick = async () => {
    var _a;
    let albumId = albumSelect.value;
    if (albumId === "__new__") {
      const name = newAlbumInput.value.trim();
      if (!name) {
        showToast({ title: "请输入专辑名称" });
        return;
      }
      albumId = createAlbum(name);
    }
    for (const key of items) {
      const [type, id] = key.split("-");
      let item = null;
      if (type === "image") {
        const { getHistory } = await __vitePreload(async () => {
          const { getHistory: getHistory2 } = await import("./imageService-BA_6x2Dp.js");
          return { getHistory: getHistory2 };
        }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
        item = getHistory().find((i) => i.id === parseInt(id));
      } else if (type === "music") {
        const { getHistory } = await __vitePreload(async () => {
          const { getHistory: getHistory2 } = await import("./musicService-9Lx0WHyP.js");
          return { getHistory: getHistory2 };
        }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
        item = getHistory().find((i) => i.id === parseInt(id));
      } else if (type === "tts") {
        const { getHistory } = await __vitePreload(async () => {
          const { getHistory: getHistory2 } = await import("./ttsService-eUW506fF.js");
          return { getHistory: getHistory2 };
        }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
        item = getHistory().find((i) => i.id === parseInt(id));
      }
      if (item) {
        addFavorite({ type, data: item }, albumId, "");
      }
    }
    showToast({ title: `已收藏 ${items.length} 项到专辑` });
    modal.style.display = "none";
    window.__batchSelectedItems = /* @__PURE__ */ new Set();
    loadHistory(((_a = document.querySelector(".type-tag.active")) == null ? void 0 : _a.dataset.filter) || "all");
  };
}
async function showHistoryDetail(type, id) {
  let item = null;
  if (type === "image") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./imageService-BA_6x2Dp.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
    item = getHistory().find((i) => i.id === id);
  } else if (type === "music") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./musicService-9Lx0WHyP.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
    item = getHistory().find((i) => i.id === id);
  } else if (type === "tts") {
    const { getHistory } = await __vitePreload(async () => {
      const { getHistory: getHistory2 } = await import("./ttsService-eUW506fF.js");
      return { getHistory: getHistory2 };
    }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
    item = getHistory().find((i) => i.id === id);
  }
  if (!item) {
    showToast({ title: "未找到该记录" });
    return;
  }
  let content = `<p>${item.prompt || item.input || ""}</p>`;
  if (type === "image") {
    content += `<img src="${item.url}" style="max-width:100%;margin-top:12px;border-radius:8px;">`;
    content += `<div style="margin-top:12px;"><button class="btn" onclick="window.open('${item.url}', '_blank')">打开图片</button></div>`;
  } else {
    content += `<audio src="${item.url}" controls style="width:100%;margin-top:12px;"></audio>`;
    content += `<div style="margin-top:12px;"><button class="btn" onclick="window.open('${item.url}', '_blank')">下载</button></div>`;
  }
  await showModal({
    title: "历史详情",
    content,
    showCancel: false,
    confirmText: "关闭"
  });
}
async function openFavoriteModal(type, id) {
  const { albums, addFavorite, createAlbum } = useStore.getState();
  const modal = document.getElementById("favorite-modal");
  const albumSelect = document.getElementById("album-select");
  const newAlbumInput = document.getElementById("new-album-name");
  const favNameInput = document.getElementById("favorite-name");
  albumSelect.innerHTML = '<option value="">-- 选择专辑 --</option>' + albums.map((a) => `<option value="${a.id}">${a.name}</option>`).join("") + '<option value="__new__">+ 新建专辑</option>';
  newAlbumInput.style.display = "none";
  newAlbumInput.value = "";
  favNameInput.value = "";
  modal.style.display = "flex";
  albumSelect.onchange = () => {
    newAlbumInput.style.display = albumSelect.value === "__new__" ? "block" : "none";
  };
  document.getElementById("fav-cancel").onclick = () => {
    modal.style.display = "none";
  };
  document.getElementById("fav-confirm").onclick = async () => {
    let albumId = albumSelect.value;
    if (albumId === "__new__") {
      const name = newAlbumInput.value.trim();
      if (!name) {
        showToast({ title: "请输入专辑名称" });
        return;
      }
      albumId = createAlbum(name);
    }
    let item = null;
    if (type === "image") {
      const { getHistory } = await __vitePreload(async () => {
        const { getHistory: getHistory2 } = await import("./imageService-BA_6x2Dp.js");
        return { getHistory: getHistory2 };
      }, true ? __vite__mapDeps([14,15]) : void 0, import.meta.url);
      item = getHistory().find((i) => i.id === id);
    } else if (type === "music") {
      const { getHistory } = await __vitePreload(async () => {
        const { getHistory: getHistory2 } = await import("./musicService-9Lx0WHyP.js");
        return { getHistory: getHistory2 };
      }, true ? __vite__mapDeps([16,15]) : void 0, import.meta.url);
      item = getHistory().find((i) => i.id === id);
    } else if (type === "tts") {
      const { getHistory } = await __vitePreload(async () => {
        const { getHistory: getHistory2 } = await import("./ttsService-eUW506fF.js");
        return { getHistory: getHistory2 };
      }, true ? __vite__mapDeps([17,15]) : void 0, import.meta.url);
      item = getHistory().find((i) => i.id === id);
    }
    if (item) {
      addFavorite({ type, data: item }, albumId, favNameInput.value.trim());
      showToast({ title: "已收藏到专辑" });
    }
    modal.style.display = "none";
  };
}
function bindMyEvents() {
  const apiKey = useStore.getState().apiKey;
  const apiKeyInput = document.getElementById("api-key-input");
  if (apiKeyInput) apiKeyInput.value = apiKey;
  const saveBtn = document.getElementById("save-config-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      var _a;
      const newApiKey = ((_a = document.getElementById("api-key-input")) == null ? void 0 : _a.value) || "";
      useStore.getState().setApiKey(newApiKey);
      useStore.getState().setGroupId("");
      showToast({ title: "配置已保存" });
    });
  }
  const clearBtn = document.getElementById("clear-history-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      const { confirm: confirm2 } = await showModal({
        title: "确认清空",
        content: "确定要清空所有历史记录吗？此操作不可恢复。"
      });
      if (confirm2) {
        useStore.getState().clearAllHistory();
        showToast({ title: "历史已清空" });
      }
    });
  }
  renderAlbumList();
  const createAlbumBtn = document.getElementById("create-album-btn");
  const newAlbumInput = document.getElementById("new-album-name");
  if (createAlbumBtn) {
    createAlbumBtn.addEventListener("click", () => {
      if (newAlbumInput.style.display === "none") {
        newAlbumInput.style.display = "block";
        newAlbumInput.focus();
      } else {
        const name = newAlbumInput.value.trim();
        if (!name) {
          showToast({ title: "请输入专辑名称" });
          return;
        }
        useStore.getState().createAlbum(name);
        newAlbumInput.value = "";
        newAlbumInput.style.display = "none";
        renderAlbumList();
        showToast({ title: "专辑已创建" });
      }
    });
  }
}
function renderAlbumList() {
  const list = document.getElementById("album-list");
  if (!list) return;
  const { albums, getFavoritesByAlbum, deleteAlbum } = useStore.getState();
  if (albums.length === 0) {
    list.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">暂无专辑</p>';
    return;
  }
  list.innerHTML = albums.map((album) => {
    const favs = getFavoritesByAlbum(album.id);
    return `<div class="album-item" data-id="${album.id}">
      <div class="album-header">
        <span class="album-name">${album.name}</span>
        <span class="album-count">${favs.length}个作品</span>
        <button class="album-delete-btn" data-id="${album.id}">🗑️</button>
      </div>
      <div class="album-favs" id="album-favs-${album.id}" style="display:none;">
        ${favs.length === 0 ? '<p style="font-size:12px;color:var(--text-secondary);">专辑为空</p>' : favs.map((f) => {
      var _a, _b;
      return `<div class="fav-item">
            <span>${f.type === "image" ? "🖼️" : f.type === "music" ? "🎵" : "🔊"}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name || ((_a = f.data) == null ? void 0 : _a.prompt) || ((_b = f.data) == null ? void 0 : _b.input) || "作品"}</span>
            <button class="fav-remove-btn" data-id="${f.id}">✕</button>
          </div>`;
    }).join("")}
      </div>
    </div>`;
  }).join("");
  document.querySelectorAll(".album-name").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.closest(".album-item").dataset.id;
      const favs = document.getElementById(`album-favs-${id}`);
      if (favs) favs.style.display = favs.style.display === "none" ? "block" : "none";
    });
  });
  document.querySelectorAll(".album-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const { confirm: confirm2 } = await showModal({
        title: "确认删除",
        content: "删除专辑将同时删除其内所有收藏，确定删除？"
      });
      if (confirm2) {
        deleteAlbum(id);
        renderAlbumList();
        showToast({ title: "专辑已删除" });
      }
    });
  });
  document.querySelectorAll(".fav-remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      useStore.getState().removeFavorite(id);
      renderAlbumList();
      showToast({ title: "已移除收藏" });
    });
  });
}
function renderOfflineBar() {
  const isOffline = useStore.getState().isOffline;
  let bar = document.getElementById("offline-bar");
  if (isOffline) {
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "offline-bar";
      bar.innerHTML = "⚠️ 当前处于离线模式";
      document.body.prepend(bar);
    }
  } else {
    if (bar) bar.remove();
  }
}
window.addEventListener("hashchange", handleRoute);
window.addEventListener("DOMContentLoaded", () => {
  useStore.getState().setOffline(!navigator.onLine);
  window.addEventListener("online", () => {
    useStore.getState().setOffline(false);
    renderOfflineBar();
  });
  window.addEventListener("offline", () => {
    useStore.getState().setOffline(true);
    renderOfflineBar();
  });
  renderOfflineBar();
  handleRoute();
});
export {
  Tool as T,
  getFavorites as a,
  getToolRating as b,
  createInnerAudioContext as c,
  submitRating as d,
  toolRegistry as e,
  getAllRatings as g,
  hideLoading as h,
  isFavorite as i,
  showLoading as s,
  toggleFavorite as t,
  useStore as u
};
//# sourceMappingURL=index-zZBXRajj.js.map

import "./index-zZBXRajj.js";
const CACHE_CONFIG = {
  maxSize: 50 * 1024 * 1024,
  // 50MB
  checkInterval: 3e4
  // 30秒检查一次
};
const CACHE_KEY = "ai-creator-perf-cache";
const USAGE_STATS_KEY = "ai-creator-usage-stats";
const memoryCache = /* @__PURE__ */ new Map();
let cacheSize = 0;
function initPerformanceOptimizer() {
  setInterval(cleanExpiredCache, CACHE_CONFIG.checkInterval);
  restoreCacheFromStorage();
  console.log("[PerfOptimizer] Initialized");
}
function clearCache() {
  memoryCache.clear();
  cacheSize = 0;
  persistCacheToStorage();
}
function getCacheStats() {
  return {
    entries: memoryCache.size,
    size: cacheSize,
    maxSize: CACHE_CONFIG.maxSize,
    usagePercent: (cacheSize / CACHE_CONFIG.maxSize * 100).toFixed(1)
  };
}
function cleanExpiredCache() {
  const now = Date.now();
  let cleaned = 0;
  let cleanedSize = 0;
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cleanedSize += entry.size;
      memoryCache.delete(key);
      cleaned++;
    }
  }
  cacheSize -= cleanedSize;
  if (cleaned > 0) {
    persistCacheToStorage();
    console.log(`[PerfOptimizer] Cleaned ${cleaned} expired entries, ${cleanedSize} bytes`);
  }
}
function persistCacheToStorage() {
  try {
    const data = {};
    for (const [key, entry] of memoryCache.entries()) {
      if (Date.now() - entry.timestamp <= entry.ttl) {
        data[key] = entry;
      }
    }
    const json = JSON.stringify(data);
    if (json.length < 5 * 1024 * 1024) {
      localStorage.setItem(CACHE_KEY, json);
    }
  } catch (e) {
    clearCache();
    try {
      localStorage.setItem(CACHE_KEY, "{}");
    } catch {
    }
  }
}
function restoreCacheFromStorage() {
  try {
    const json = localStorage.getItem(CACHE_KEY);
    if (!json) return;
    const data = JSON.parse(json);
    let restored = 0;
    for (const [key, entry] of Object.entries(data)) {
      if (Date.now() - entry.timestamp <= entry.ttl) {
        memoryCache.set(key, entry);
        cacheSize += entry.size;
        restored++;
      }
    }
    if (restored > 0) {
      console.log(`[PerfOptimizer] Restored ${restored} cache entries`);
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
}
function getUsageStats() {
  try {
    return JSON.parse(localStorage.getItem(USAGE_STATS_KEY) || "{}");
  } catch {
    return {};
  }
}
function getHotTools(limit = 10) {
  const stats = getUsageStats();
  return Object.entries(stats).map(([toolId, data]) => ({ toolId, ...data })).sort((a, b) => b.count - a.count).slice(0, limit);
}
const lazyImageObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute("data-src");
        img.classList.remove("lazy-loading");
        lazyImageObserver.unobserve(img);
      }
    }
  }
}, {
  rootMargin: "100px 0px",
  threshold: 0.01
});
function getMemoryUsage() {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
}
export {
  getHotTools as a,
  getMemoryUsage as b,
  clearCache as c,
  getUsageStats as d,
  getCacheStats as g,
  initPerformanceOptimizer as i
};
//# sourceMappingURL=PerformanceOptimizer-CAwo3Qe8.js.map

/**
 * usageService.js - API Quota Management Service
 * Tracks API usage, cost estimation, and budget warnings
 */

// Cost constants (per PRD)
const COST_CONFIG = {
  image: {
    'image-01': 0.05, // ¥0.05 per image (1024x1024)
  },
  music: {
    'music-2.6': 2.00, // ¥2.00 per song
  },
  tts: {
    'TTS-HD': 0.2, // ¥0.2 per 1000 characters
  },
};

const STORAGE_KEY = 'api_usage';
const BUDGET_KEY = 'api_budget';
const THRESHOLD_KEY = 'api_threshold';
const WARNING_SHOWN_KEY = 'api_warning_shown';

// Default settings
const DEFAULT_BUDGET = 0; // 0 = no limit
const DEFAULT_THRESHOLD = 80; // 80%

/**
 * Get current cycle start date (first day of current month)
 */
function getCycleStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Check and reset cycle if needed (monthly reset)
 */
function checkCycleReset() {
  const data = getUsageData();
  const cycleStart = getCycleStart();
  
  if (data.cycleStart !== cycleStart) {
    // New month, reset cycle
    const newData = {
      cycleStart,
      totalSpent: 0,
      items: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    localStorage.setItem(WARNING_SHOWN_KEY, 'false');
    return true;
  }
  return false;
}

/**
 * Get current usage data
 */
function getUsageData() {
  checkCycleReset();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      cycleStart: getCycleStart(),
      totalSpent: 0,
      items: [],
    };
  }
  return JSON.parse(stored);
}

/**
 * Record a usage event
 * @param {string} type - 'image', 'music', or 'tts'
 * @param {object} params - { model, size, duration, charCount, ... }
 */
function recordUsage(type, params = {}) {
  checkCycleReset();
  
  const data = getUsageData();
  let cost = 0;
  let item = {
    type,
    timestamp: new Date().toISOString(),
  };
  
  if (type === 'image') {
    const model = params.model || 'image-01';
    const size = params.size || '1024x1024';
    cost = COST_CONFIG.image[model] || 0.05;
    item.model = model;
    item.size = size;
  } else if (type === 'music') {
    const model = params.model || 'music-2.6';
    cost = COST_CONFIG.music[model] || 2.00;
    item.model = model;
    item.duration = params.duration || 0;
  } else if (type === 'tts') {
    const model = params.model || 'TTS-HD';
    const charCount = params.charCount || 0;
    cost = (COST_CONFIG.tts[model] || 0.2) * (charCount / 1000);
    item.model = model;
    item.charCount = charCount;
  }
  
  item.cost = parseFloat(cost.toFixed(4));
  data.items.push(item);
  data.totalSpent = parseFloat((data.totalSpent + cost).toFixed(4));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  // Check if warning should be shown
  if (checkWarning()) {
    const warningShown = localStorage.getItem(WARNING_SHOWN_KEY);
    if (warningShown !== 'true') {
      localStorage.setItem(WARNING_SHOWN_KEY, 'true');
      return { warning: true, spent: data.totalSpent };
    }
  }
  
  return { warning: false, spent: data.totalSpent };
}

/**
 * Get user's budget setting
 */
function getBudget() {
  const budget = localStorage.getItem(BUDGET_KEY);
  return budget ? parseFloat(budget) : DEFAULT_BUDGET;
}

/**
 * Set monthly budget
 * @param {number} amount - Budget amount in ¥, 0 means no limit
 */
function setBudget(amount) {
  amount = parseFloat(amount) || 0;
  if (amount < 0) amount = 0;
  localStorage.setItem(BUDGET_KEY, amount.toString());
}

/**
 * Get warning threshold percentage
 */
function getThreshold() {
  const threshold = localStorage.getItem(THRESHOLD_KEY);
  return threshold ? parseFloat(threshold) : DEFAULT_THRESHOLD;
}

/**
 * Set warning threshold
 * @param {number} percent - Threshold percentage (0-100)
 */
function setThreshold(percent) {
  percent = parseFloat(percent) || DEFAULT_THRESHOLD;
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  localStorage.setItem(THRESHOLD_KEY, percent.toString());
}

/**
 * Check if current usage exceeds warning threshold
 */
function checkWarning() {
  const data = getUsageData();
  const budget = getBudget();
  const threshold = getThreshold();
  
  if (budget <= 0) {
    // No budget set, no warning
    return false;
  }
  
  const percent = (data.totalSpent / budget) * 100;
  return percent >= threshold;
}

/**
 * Get warning status with details
 */
function getWarningStatus() {
  const data = getUsageData();
  const budget = getBudget();
  const threshold = getThreshold();
  const isWarning = checkWarning();
  
  let percent = 0;
  let remaining = 0;
  
  if (budget > 0) {
    percent = Math.min(100, (data.totalSpent / budget) * 100);
    remaining = Math.max(0, budget - data.totalSpent);
  }
  
  return {
    isWarning,
    percent: parseFloat(percent.toFixed(1)),
    spent: data.totalSpent,
    budget,
    remaining: parseFloat(remaining.toFixed(2)),
    threshold,
  };
}

/**
 * Get usage breakdown by type
 */
function getUsageBreakdown() {
  const data = getUsageData();
  const breakdown = {
    image: { count: 0, cost: 0 },
    music: { count: 0, cost: 0 },
    tts: { count: 0, cost: 0 },
  };
  
  data.items.forEach(item => {
    if (breakdown[item.type]) {
      breakdown[item.type].count++;
      breakdown[item.type].cost += item.cost;
    }
  });
  
  // Round costs
  Object.keys(breakdown).forEach(type => {
    breakdown[type].cost = parseFloat(breakdown[type].cost.toFixed(2));
  });
  
  return breakdown;
}

/**
 * Reset warning shown flag (for testing)
 */
function resetWarningShown() {
  localStorage.setItem(WARNING_SHOWN_KEY, 'false');
}

/**
 * Show warning modal if needed (call on page load)
 */
async function checkAndShowWarning() {
  const status = getWarningStatus();
  if (status.isWarning) {
    const warningShown = localStorage.getItem(WARNING_SHOWN_KEY);
    if (warningShown !== 'session') {
      localStorage.setItem(WARNING_SHOWN_KEY, 'session');
      return status;
    }
  }
  return null;
}

// Export for ES modules
export {
  recordUsage,
  getUsageData,
  setBudget,
  getBudget,
  setThreshold,
  getThreshold,
  checkWarning,
  getWarningStatus,
  getUsageBreakdown,
  resetWarningShown,
  COST_CONFIG,
};

/**
 * 历史页 V9: 批量下载、评分、标签、搜索、备注
 */

// 批量选择状态
let batchSelectedItems = new Set(); // Set of "type-id" strings

// V9: 预设 8 色标签
export const TAG_COLORS = [
  { name: '红', value: '#ef4444' },
  { name: '橙', value: '#f97316' },
  { name: '黄', value: '#eab308' },
  { name: '绿', value: '#22c55e' },
  { name: '青', value: '#06b6d4' },
  { name: '蓝', value: '#3b82f6' },
  { name: '紫', value: '#a855f7' },
  { name: '粉', value: '#ec4899' },
];

export function renderHistoryPage() {
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
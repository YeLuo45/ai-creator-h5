/**
 * 历史页
 */

// 批量选择状态（V8）
let batchSelectedItems = new Set(); // Set of "type-id" strings

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
        <button id="batch-delete" class="batch-btn">🗑 批量删除</button>
        <button id="batch-cancel" class="batch-btn batch-cancel">取消</button>
      </div>
      <div class="type-selector">
        <div class="type-tag active" data-filter="all">全部</div>
        <div class="type-tag" data-filter="image">图片</div>
        <div class="type-tag" data-filter="music">音乐</div>
        <div class="type-tag" data-filter="tts">语音</div>
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

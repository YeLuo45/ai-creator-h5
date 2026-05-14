/**
 * 历史页
 */

export function renderHistoryPage() {
  return `
    <div class="page-header">
      <h1>📜 历史记录</h1>
    </div>
    <div class="page">
      <div class="type-selector">
        <div class="type-tag active" data-filter="all">全部</div>
        <div class="type-tag" data-filter="image">图片</div>
        <div class="type-tag" data-filter="music">音乐</div>
        <div class="type-tag" data-filter="tts">语音</div>
        <div class="type-tag" data-filter="video">视频</div>
      </div>

      <div id="history-list">
        <div class="empty-state">
          <div class="icon">📭</div>
          <p>加载中...</p>
        </div>
      </div>
    </div>
  `;
}

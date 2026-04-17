/**
 * 我的页面
 */

export function renderMyPage() {
  return `
    <div class="page-header">
      <h1>👤 我的</h1>
    </div>
    <div class="page">
      <div class="card">
        <h3 style="font-size:16px;margin-bottom:16px;">⚙️ API 配置</h3>
        <div style="margin-bottom:12px;">
          <div class="form-label">MiniMax API Key</div>
          <input type="text" class="input" id="api-key-input" placeholder="请输入 API Key">
        </div>
        <div style="margin-bottom:12px;">
          <div class="form-label">Group ID</div>
          <input type="text" class="input" id="group-id-input" placeholder="请输入 Group ID">
        </div>
        <button class="btn btn-primary btn-full" id="save-config-btn">
          保存配置
        </button>
        <p style="font-size:12px;color:var(--text-secondary);margin-top:8px;">
          获取地址：<a href="https://api.minimax.chat" target="_blank" style="color:var(--primary);">https://api.minimax.chat</a>
        </p>
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
          AI Creator v1.0.0<br>
          支持 MiniMax 图片生成、音乐生成、语音合成<br><br>
          本应用为 H5 版本，数据存储在本地浏览器中。
        </p>
      </div>
    </div>
  `;
}

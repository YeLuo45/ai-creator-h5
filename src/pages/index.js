/**
 * 首页
 */

export function renderIndexPage() {
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
    </div>
  `;
}

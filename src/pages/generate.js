/**
 * 生成页
 */

export function renderGeneratePage() {
  return `
    <div id="api-key-alert" class="api-key-alert" style="display:none;">
      <span class="alert-icon">⚠️</span>
      <span class="alert-text">未配置 API Key，请在"我的"页面设置后再使用</span>
    </div>
    <div class="page-header">
      <h1>✨ AI 生成</h1>
    </div>
    <div class="page">
      <div class="type-selector">
        <div class="type-tag active" data-type="image">🎨 图片</div>
        <div class="type-tag" data-type="music">🎵 音乐</div>
        <div class="type-tag" data-type="tts">🔊 语音</div>
        <div class="type-tag" data-type="video">🎬 视频</div>
      </div>

      <div class="card">
        <div id="generate-form">
          <div class="form-label">图片描述 (Prompt)</div>
          <textarea class="input" id="prompt-input" placeholder="描述你想要生成的图片，例如：一只穿着汉服的猫咪"></textarea>
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

        <button class="btn btn-primary btn-full" id="generate-btn" style="margin-top:16px;">
          开始生成
        </button>
      </div>

      <div id="result-container" class="card" style="display:none;"></div>
      <div id="skeleton-container" class="card" style="display:none;">
        <div class="skeleton-header"></div>
        <div class="skeleton-blocks">
          <div class="skeleton-block"></div>
          <div class="skeleton-block"></div>
          <div class="skeleton-block"></div>
        </div>
        <div class="skeleton-progress">
          <div class="skeleton-progress-bar" id="skeleton-progress-bar"></div>
        </div>
        <div class="skeleton-time" id="skeleton-time">正在生成... 0秒</div>
      </div>
    </div>
  `;
}

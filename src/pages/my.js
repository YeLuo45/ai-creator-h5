/**
 * 我的页面
 * V6: API额度管理 + 成本统计
 * V7: 专辑管理
 */
import useStore, { MODEL_COST } from '../store/useStore.js';

export function renderMyPage() {
  // 获取模型使用统计
  const { modelUsage, getTotalUsage, getTotalCost } = useStore.getState();

  // 渲染统计行
  const statsRows = Object.entries({
    'image-01': 'Image-01',
    'image-02': 'Image-02',
    'music-2.6': 'Music-2.6',
    'music-02': 'Music-02',
    'speech-01': 'Speech-01',
    'speech-02': 'Speech-02',
  }).map(([key, label]) => {
    const count = modelUsage[key] || 0;
    return `<div class="stat-row">
      <span class="model-name">${label}</span>
      <span class="model-count">${count}次</span>
    </div>`;
  }).join('');

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
              'image-01': 'Image-01',
              'image-02': 'Image-02',
              'music-2.6': 'Music-2.6',
              'music-02': 'Music-02',
              'speech-01': 'Speech-01',
              'speech-02': 'Speech-02',
            }).map(([key, label]) => ({
              key,
              label,
              count: modelUsage[key] || 0,
              tokens: MODEL_COST[key]?.tokens || 0,
            }));
            const maxUsage = Math.max(...usageData.map(d => d.count), 1);
            return usageData.map(d => {
              const barPct = d.count > 0 ? Math.round((d.count / maxUsage) * 100) : 0;
              return `<div class="bar-row">
                <span class="bar-label">${d.label}</span>
                <div class="bar-container"><div class="bar-fill" style="width:${barPct}%"></div></div>
                <span class="bar-count">${d.count}次 / ${d.tokens}tokens</span>
              </div>`;
            }).join('');
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

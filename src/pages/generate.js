/**
 * 生成页
 * V4: 多模型选择 + 提示词模板库
 * V5: 用户偏好记忆 + 模型使用统计
 */
import useStore from '../store/useStore.js';

const TEMPLATES = {
  image: [
    { label: '写实摄影', template: '{prompt}, photorealistic, 8K, detailed lighting' },
    { label: '动漫风格', template: '{prompt}, anime style, vibrant colors' },
    { label: '插画风', template: '{prompt}, digital illustration, detailed' },
  ],
  music: [
    { label: '舒缓钢琴', template: 'Soft piano melody, peaceful, ambient' },
    { label: '电子舞曲', template: 'Electronic dance music, upbeat, energetic' },
    { label: '古典弦乐', template: 'Classical orchestral, emotional, cinematic' },
  ],
  tts: [
    { label: '新闻播报', template: 'Professional news broadcast tone' },
    { label: '故事讲述', template: 'Warm storytelling voice, engaging' },
  ],
};

const MODEL_OPTIONS = {
  image: [
    { value: 'image-01', label: 'image-01 (默认)' },
    { value: 'image-02', label: 'image-02 (快速)' },
  ],
  music: [
    { value: 'music-2.6', label: 'music-2.6 (默认)' },
    { value: 'music-02', label: 'music-02 (编辑/续写)' },
  ],
  tts: [
    { value: 'speech-01', label: 'speech-01 (TTS HD，默认)' },
    { value: 'speech-02', label: 'speech-02 (情感语音)' },
  ],
};

// 模型选择状态（用于 handleGenerate） - 现在从 store 读取
let currentModel = {
  image: 'image-01',
  music: 'music-2.6',
  tts: 'speech-01',
};

export function renderGeneratePage() {
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
        </div>

        <button class="btn btn-primary btn-full" id="generate-btn" style="margin-top:16px;">
          开始生成
        </button>
      </div>

      <div id="result-container" class="card" style="display:none;"></div>
    </div>
  `;
}

/**
 * 初始化生成页交互（由 app.js bindGenerateEvents 调用）
 */
export function initGeneratePage() {
  // 从 store 恢复上次选择的模型
  const store = useStore.getState();
  currentModel = {
    image: store.lastSelectedModel?.image || 'image-01',
    music: store.lastSelectedModel?.music || 'music-2.6',
    tts: store.lastSelectedModel?.tts || 'speech-01',
  };

  // Tab 切换
  document.querySelectorAll('.type-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.type-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      updateGenerateForm(tag.dataset.type);
    });
  });

  // 模型选择器变化时保存到 store
  document.getElementById('model-select').addEventListener('change', (e) => {
    const activeTab = document.querySelector('.type-tag.active');
    if (activeTab) {
      const type = activeTab.dataset.type;
      currentModel[type] = e.target.value;
      useStore.getState().setLastSelectedModel(type, e.target.value);
    }
  });

  // 模板切换
  document.getElementById('toggle-templates').addEventListener('click', () => {
    const container = document.getElementById('templates-container');
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      const activeTab = document.querySelector('.type-tag.active');
      renderTemplates(activeTab?.dataset.type || 'image');
    }
  });

  // TTS 语速滑块
  document.getElementById('tts-speed').addEventListener('input', (e) => {
    const display = document.getElementById('tts-speed-display');
    if (display) display.textContent = e.target.value + 'x';
  });
}

/**
 * 更新表单（Tab 切换时调用）
 */
function updateGenerateForm(type) {
  // 更新模型选择器
  const modelSelect = document.getElementById('model-select');
  const opts = MODEL_OPTIONS[type] || MODEL_OPTIONS.image;
  modelSelect.innerHTML = opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  
  // 恢复该 Tab 保存的模型选择
  if (currentModel[type]) {
    modelSelect.value = currentModel[type];
  }

  // 更新提示词 placeholder
  const promptInput = document.getElementById('prompt-input');
  if (type === 'image') {
    promptInput.placeholder = '描述你想要生成的图片，例如：一只穿着汉服的猫咪';
  } else if (type === 'music') {
    promptInput.placeholder = '描述你想要生成的音乐，例如：欢快的夏日海滩派对';
  } else if (type === 'tts') {
    promptInput.placeholder = '输入要转换为语音的文本';
  }

  // 显示/隐藏类型特定选项
  document.getElementById('image-options').style.display = type === 'image' ? 'block' : 'none';
  document.getElementById('tts-options').style.display = type === 'tts' ? 'block' : 'none';

  // 重新渲染模板（如果模板区域已展开）
  const container = document.getElementById('templates-container');
  if (container.style.display !== 'none') {
    renderTemplates(type);
  }
}

/**
 * 渲染模板列表
 */
function renderTemplates(type) {
  const container = document.getElementById('templates-container');
  const templates = TEMPLATES[type] || [];
  container.innerHTML = templates.map(t => `
    <button class="btn btn-secondary" style="margin:4px;" data-template="${encodeURIComponent(t.template)}">
      ${t.label}
    </button>
  `).join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const template = decodeURIComponent(btn.dataset.template);
      const input = document.getElementById('prompt-input');
      const currentValue = input.value.trim();
      let newValue = template;
      if (template.includes('{prompt}')) {
        newValue = template.replace('{prompt}', currentValue);
      } else if (currentValue) {
        newValue = currentValue + ', ' + template;
      }
      input.value = newValue;
    });
  });
}

/**
 * 获取当前选择的模型
 */
export function getCurrentModel() {
  const activeTab = document.querySelector('.type-tag.active');
  if (activeTab) {
    return currentModel[activeTab.dataset.type] || 'image-01';
  }
  return 'image-01';
}
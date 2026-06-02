/**
 * Workflow Export Service - v10
 * 导出服务：支持 JSON、PNG、HTML 格式导出
 */
class WorkflowExport {
  
  /**
   * 导出为 JSON
   * @param {Object} workflow - 工作流对象
   * @returns {Object} 导出的 JSON 对象
   */
  exportToJSON(workflow) {
    return {
      version: "1.0",
      name: workflow.name || '未命名工作流',
      description: workflow.description || '',
      nodes: workflow.nodes || [],
      connections: workflow.connections || [],
      metadata: {
        created: workflow.created || new Date().toISOString(),
        modified: new Date().toISOString(),
        exporter: 'ai-creator-h5 v10',
        nodeCount: workflow.nodes?.length || 0,
        connectionCount: workflow.connections?.length || 0
      }
    };
  }

  /**
   * 导出为 PNG
   * @param {Object} workflow - 工作流对象
   * @returns {Promise<string>} Base64 编码的 PNG 数据 URL
   */
  exportToPNG(workflow) {
    return new Promise((resolve, reject) => {
      try {
        // 获取画布区域
        const canvasContainer = document.getElementById('canvas-container');
        const workflowCanvas = document.getElementById('workflow-canvas');
        
        if (!canvasContainer || !workflowCanvas) {
          reject(new Error('Canvas not found'));
          return;
        }

        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        document.querySelectorAll('.workflow-node').forEach(node => {
          const x = parseFloat(node.style.left) || 0;
          const y = parseFloat(node.style.top) || 0;
          const w = node.offsetWidth;
          const h = node.offsetHeight;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
        });

        if (minX === Infinity) {
          reject(new Error('No nodes to export'));
          return;
        }

        // 添加边距
        const padding = 40;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        // 创建临时 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 填充背景
        ctx.fillStyle = '#0F0F1A';
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        ctx.strokeStyle = '#333355';
        ctx.lineWidth = 0.5;
        const gridSize = 24;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 应用画布变换
        ctx.save();
        ctx.translate(-minX + padding, -minY + padding);

        // 绘制连接线
        const svg = document.getElementById('connections-svg');
        if (svg) {
          const connections = svg.querySelectorAll('.connection-line:not([stroke-dasharray])');
          connections.forEach(line => {
            const path = line.getAttribute('d');
            ctx.strokeStyle = '#6366F1';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            const tempPath = new Path2D(path);
            ctx.stroke(tempPath);
            ctx.globalAlpha = 1;
          });
        }

        // 绘制节点
        document.querySelectorAll('.workflow-node').forEach(node => {
          const x = parseFloat(node.style.left) || 0;
          const y = parseFloat(node.style.top) || 0;
          const w = node.offsetWidth;
          const h = node.offsetHeight;

          // 节点背景
          ctx.fillStyle = '#252542';
          ctx.strokeStyle = '#333355';
          ctx.lineWidth = 2;
          this.roundRect(ctx, x, y, w, h, 8);
          ctx.fill();
          ctx.stroke();

          // 节点头部
          const header = node.querySelector('.node-header');
          if (header) {
            ctx.fillStyle = '#333355';
            ctx.fillRect(x, y, w, header.offsetHeight);
          }

          // 节点图标
          const icon = node.querySelector('.node-icon');
          if (icon) {
            const iconText = icon.textContent.trim();
            ctx.font = '14px serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconText, x + 16, y + 16);
          }

          // 节点名称
          const name = node.querySelector('.node-name');
          if (name) {
            ctx.font = '13px Inter, sans-serif';
            ctx.fillStyle = '#E0E0FF';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(name.textContent.trim(), x + 36, y + 16);
          }
        });

        ctx.restore();

        // 返回 PNG 数据
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 绘制圆角矩形辅助方法
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * 导出为独立 HTML 文件
   * @param {Object} workflow - 工作流对象
   * @returns {string} HTML 文件内容
   */
  exportToHTML(workflow) {
    const jsonData = JSON.stringify(this.exportToJSON(workflow), null, 2);
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${workflow.name || '工作流'} - AI Creator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Noto Sans SC', -apple-system, sans-serif;
      background: #0F0F1A;
      color: #E0E0FF;
      min-height: 100vh;
      padding: 40px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; }
    .title { font-size: 28px; color: #6366F1; margin-bottom: 8px; }
    .desc { color: #8888AA; font-size: 14px; }
    .canvas {
      background: #1A1A2E;
      border: 1px solid #333355;
      border-radius: 12px;
      min-height: 400px;
      padding: 20px;
      position: relative;
    }
    .node {
      position: absolute;
      min-width: 140px;
      background: #252542;
      border: 2px solid #333355;
      border-radius: 8px;
      padding: 12px;
    }
    .node:hover { border-color: #6366F1; }
    .node-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .node-icon { font-size: 16px; }
    .node-name { font-size: 13px; font-weight: 500; }
    .node-body { font-size: 12px; color: #8888AA; }
    .run-btn {
      display: block;
      margin: 30px auto 0;
      padding: 12px 32px;
      background: #6366F1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
    .run-btn:hover { background: #4F46E5; }
    .output { margin-top: 30px; padding: 20px; background: #1A1A2E; border-radius: 8px; }
    .output-title { font-size: 14px; color: #8888AA; margin-bottom: 12px; }
    .output-content { font-family: monospace; font-size: 13px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${workflow.name || '未命名工作流'}</h1>
      <p class="desc">${workflow.description || 'AI Creator 工作流'}</p>
    </div>
    <div class="canvas" id="canvas"></div>
    <button class="run-btn" onclick="runWorkflow()">▶ 运行工作流</button>
    <div class="output" id="output" style="display:none;">
      <div class="output-title">执行结果</div>
      <div class="output-content" id="output-content"></div>
    </div>
  </div>
  <script>
    const workflow = ${jsonData};
    
    // 简单的节点执行器
    const executors = {
      manual: async () => ({ success: true, output: { message: '手动触发执行' } }),
      character: async (node) => ({ success: true, output: { characterId: 'char-' + Date.now() } }),
      music: async (node) => ({ success: true, output: { musicId: 'music-' + Date.now() } }),
      tts: async (node) => ({ success: true, output: { ttsId: 'tts-' + Date.now() } }),
      poster: async (node) => ({ success: true, output: { posterId: 'poster-' + Date.now() } }),
      loop: async (node) => ({ success: true, output: { iterations: node.config?.count || 3 } }),
      condition: async (node) => ({ success: true, output: { branch: 'true' } }),
      forLoop: async (node) => ({ success: true, output: { iterations: node.config?.count || 3 } }),
      whileLoop: async (node) => ({ success: true, output: { iterations: 3 } }),
      subflowCall: async (node) => ({ success: true, output: { subflowId: node.config?.workflowId } })
    };

    function renderNodes() {
      const canvas = document.getElementById('canvas');
      workflow.nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = 'node';
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        el.innerHTML = \`
          <div class="node-header">
            <span class="node-icon">\${getNodeIcon(node.type, node.subtype)}</span>
            <span class="node-name">\${getNodeName(node.subtype)}</span>
          </div>
          <div class="node-body">\${getNodeDesc(node)}</div>
        \`;
        canvas.appendChild(el);
      });
    }

    function getNodeIcon(type, subtype) {
      const icons = {
        trigger: '⚡', creator: '🎨', logic: '🔀', output: '📤', loop: '🔁', subflow: '📦'
      };
      return icons[type] || '📌';
    }

    function getNodeName(subtype) {
      const names = {
        manual: '手动触发', character: '角色生成', music: '配乐生成',
        tts: '配音生成', poster: '海报生成', loop: '循环', condition: '条件判断',
        forLoop: 'For循环', whileLoop: 'While循环', doWhileLoop: 'Do-While循环',
        subflowCall: '子流程调用'
      };
      return names[subtype] || subtype;
    }

    function getNodeDesc(node) {
      if (node.config) {
        if (node.config.description) return node.config.description;
        if (node.config.style) return '风格: ' + node.config.style;
        if (node.config.mood) return '情绪: ' + node.config.mood;
        if (node.config.count) return '次数: ' + node.config.count;
      }
      return '配置节点';
    }

    async function runWorkflow() {
      const output = document.getElementById('output');
      const content = document.getElementById('output-content');
      output.style.display = 'block';
      content.textContent = '开始执行...\n';
      
      const results = {};
      for (const node of workflow.nodes) {
        const executor = executors[node.subtype] || executors.manual;
        content.textContent += \`[\${node.subtype}] 执行中...\n\`;
        await new Promise(r => setTimeout(r, 500));
        const result = await executor(node);
        results[node.id] = result;
        content.textContent += \`[\${node.subtype}] 完成: \${JSON.stringify(result.output)}\n\`;
      }
      content.textContent += '\n✅ 工作流执行完成';
    }

    renderNodes();
  </script>
</body>
</html>`;
  }

  /**
   * 生成下载文件
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME 类型
   */
  generateFile(content, filename, mimeType) {
    let blob;
    if (mimeType === 'image/png') {
      // 处理 base64 数据
      const base64Data = content.replace(/^data:image\/png;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'image/png' });
    } else {
      blob = new Blob([content], { type: mimeType });
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 导出单例
const workflowExport = new WorkflowExport();

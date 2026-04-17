# AI Creator H5

> AI 图片/音乐/语音生成平台 H5 版本

## 项目信息

| 项目 | 内容 |
|------|------|
| 提案ID | P-20260412-007 |
| 项目名 | ai-creator-h5 |
| 框架 | Vite + 原生 JavaScript SPA |
| 部署地址 | https://yeluo45.github.io/ai-creator-h5/ |

## 功能特性

| 模块 | 功能 | 状态 |
|------|------|------|
| 图片生成 | image-01 文本生成图片 | ✅ 实现 |
| 音乐生成 | music-2.6 文本生成音乐 | ✅ 实现 |
| TTS HD | 语音合成 | ✅ 实现 |
| 历史记录 | 图片/音乐/语音历史 | ✅ 实现 |
| API 配置 | MiniMax Key 本地配置 | ✅ 实现 |

## 技术架构

```
H5 SPA (Hash 路由)
  └─ Web API 适配层（替代微信 wx.* API）
       ├─ localStorage 替代 Storage
       ├─ fetch 替代 wx.request
       ├─ new Audio() 替代 createInnerAudioContext
       └─ 自定义 Toast/Modal 组件
  └─ MiniMax Adapter（fetch 版）
       ├─ imageService
       ├─ musicService
       └─ ttsService
```

## 目录结构

```
ai-creator-h5/
├── index.html
├── package.json
├── vite.config.js
├── dist/                    # 构建产物
│   ├── index.html
│   └── assets/
└── src/
    ├── app.js               # 主入口 + 路由
    ├── adapter/
    │   ├── web-api.js       # Web API 适配层
    │   └── MiniMaxAdapter.js # MiniMax API (fetch 版)
    ├── services/
    │   ├── imageService.js
    │   ├── musicService.js
    │   └── ttsService.js
    ├── pages/
    │   ├── index.js
    │   ├── generate.js
    │   ├── history.js
    │   └── my.js
    └── styles/
        └── global.css
```

## 快速启动

```bash
npm install
npm run dev     # 开发模式 http://localhost:3200
npm run build   # 生产构建
```

## 使用说明

1. 打开应用后，点击「我的」配置 MiniMax API Key 和 Group ID
2. 获取地址：https://api.minimax.chat
3. 返回首页选择功能（图片/音乐/语音）
4. 输入描述文字，点击生成
5. 生成完成后可预览、下载

## 部署

- 自动部署到 GitHub Pages：https://yeluo45.github.io/ai-creator-h5/
- 构建产物在 `dist/` 目录
- 部署分支：`gh-pages`

---

**提案ID**: P-20260412-007
**交付时间**: 2026-04-18
**状态**: H5 版本已完成并部署

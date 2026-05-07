/**
 * templates.js - Prompt Templates Data
 */

export const templates = {
  image: [
    {
      id: 'img-portrait',
      name: '👤 人物肖像',
      desc: '生成人物肖像照片',
      prompt: '一位 [风格描述] 的 [年龄段] [性别]，面部特写，细节丰富',
      params: { style: 'vivid', size: '1024x1024' }
    },
    {
      id: 'img-landscape',
      name: '🏞️ 风景大片',
      desc: '生成自然风景照片',
      prompt: '[时间]的[地点]风景，[天气描述]，[光线描述]，电影级构图',
      params: { style: 'vivid', size: '1792x1024' }
    },
    {
      id: 'img-cartoon',
      name: '🎨 卡通插画',
      desc: '生成卡通风格图片',
      prompt: '[风格]风格的卡通插画，[主题描述]，色彩鲜艳，细节精美',
      params: { style: 'natural', size: '1024x1792' }
    },
    {
      id: 'img-architecture',
      name: '🏛️ 建筑摄影',
      desc: '生成建筑相关图片',
      prompt: '[风格]风格的现代建筑，[材质描述]，[光线]下的建筑外观，超高清摄影',
      params: { style: 'vivid', size: '1792x1024' }
    },
    {
      id: 'img-food',
      name: '🍜 美食摄影',
      desc: '生成美食照片',
      prompt: '精致[菜系]美食摄影，[角度]拍摄，[光线]，[背景描述]，让人垂涎欲滴',
      params: { style: 'vivid', size: '1024x1024' }
    },
    {
      id: 'img-animal',
      name: '🐱 动物特写',
      desc: '生成动物照片',
      prompt: '[动物种类]的特写照片，[姿态描述]，[背景环境]，[光线]自然光',
      params: { style: 'vivid', size: '1024x1024' }
    }
  ],
  music: [
    {
      id: 'music-pop',
      name: '🎤 流行音乐',
      desc: '生成流行风格音乐',
      prompt: '[主题描述]的流行歌曲，[情绪描述]，[节奏描述]，[乐器描述]',
      params: { genre: 'pop', duration: 60 }
    },
    {
      id: 'music-rock',
      name: '🎸 摇滚乐',
      desc: '生成摇滚风格音乐',
      prompt: '[主题描述]的摇滚音乐，[情绪描述]，[节奏描述]，[吉他/鼓点描述]',
      params: { genre: 'rock', duration: 60 }
    },
    {
      id: 'music-jazz',
      name: '🎷 爵士乐',
      desc: '生成爵士风格音乐',
      prompt: '[主题描述]的爵士乐，[情绪描述]，[节奏描述]，[乐器描述]',
      params: { genre: 'jazz', duration: 120 }
    },
    {
      id: 'music-classical',
      name: '🎻 古典音乐',
      desc: '生成古典风格音乐',
      prompt: '[主题描述]的古典音乐，[情绪描述]，[节奏描述]，[乐器描述]',
      params: { genre: 'classical', duration: 180 }
    },
    {
      id: 'music-electronic',
      name: '🎹 电子音乐',
      desc: '生成电子风格音乐',
      prompt: '[主题描述]的电子音乐，[情绪描述]，[节奏描述]，[合成器音效描述]',
      params: { genre: 'electronic', duration: 60 }
    },
    {
      id: 'music-folk',
      name: '🪕 民谣音乐',
      desc: '生成民谣风格音乐',
      prompt: '[主题描述]的民谣歌曲，[情绪描述]，[节奏描述]，[吉他弹唱描述]',
      params: { genre: 'folk', duration: 120 }
    }
  ],
  tts: [
    {
      id: 'tts-narrate',
      name: '📖 故事朗读',
      desc: '生成旁白讲解语音',
      prompt: '[角色名称]：[对话内容]，[语气描述]',
      params: { voice: 'female-shaonv' }
    },
    {
      id: 'tts-dub',
      name: '🎬 电影配音',
      desc: '生成电影配音效果',
      prompt: '[角色名称]：[对话内容]，[情感描述]，[场景描述]',
      params: { voice: 'male-qn-qingse' }
    },
    {
      id: 'tts-guide',
      name: '🗺️ 导游讲解',
      desc: '生成导游讲解语音',
      prompt: '欢迎来到[景点名称]，[介绍内容]，[语气热情/专业]',
      params: { voice: 'female-yujie' }
    },
    {
      id: 'tts-commercial',
      name: '📢 广告宣传',
      desc: '生成广告宣传语音',
      prompt: '[品牌名称]，[产品描述]，[号召行动]',
      params: { voice: 'male-qn-jingxing' }
    },
    {
      id: 'tts-podcast',
      name: '🎙️ 播客主持',
      desc: '生成播客主持语音',
      prompt: '大家好，欢迎收听[节目名称]，[开场内容]，[话题引入]',
      params: { voice: 'female-shaonv' }
    },
    {
      id: 'tts-greeting',
      name: '💐 节日祝福',
      desc: '生成节日祝福语音',
      prompt: '[节日名称]到了，[祝福内容]，[情感真挚/欢快]',
      params: { voice: 'female-yujie' }
    }
  ]
};

export function getTemplatesByType(type) {
  return templates[type] || [];
}

export function getTemplateById(type, id) {
  const list = templates[type] || [];
  return list.find(t => t.id === id);
}

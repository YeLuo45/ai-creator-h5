import "./index-zZBXRajj.js";
const MARKET_KEY = "ai-creator-templates";
const PRESET_TEMPLATES = [
  {
    id: "img-landscape",
    name: "风景画生成",
    icon: "🏞️",
    description: "生成高质量自然风景图片",
    type: "image",
    prompt: "A beautiful {scene} landscape, {style}, high detail, 8k",
    params: {
      scene: { type: "select", label: "场景", options: ["mountain", "beach", "forest", "desert"], default: "mountain" },
      style: { type: "select", label: "风格", options: ["realistic", "impressionist", "oil painting"], default: "realistic" }
    },
    tags: ["image", "landscape", "风景"],
    installCount: 1247,
    rating: 4.8
  },
  {
    id: "img-portrait",
    name: "人物肖像生成",
    icon: "👤",
    description: "生成逼真的人物肖像",
    type: "image",
    prompt: "A stunning portrait of {subject}, {style}, high detail, soft lighting",
    params: {
      subject: { type: "text", label: "主体", placeholder: "e.g. a young woman", default: "" },
      style: { type: "select", label: "风格", options: ["realistic", "artistic", "photographic"], default: "realistic" }
    },
    tags: ["image", "portrait", "人物"],
    installCount: 983,
    rating: 4.6
  },
  {
    id: "img-logo",
    name: "Logo设计",
    icon: "🎨",
    description: "生成创意Logo设计",
    type: "image",
    prompt: "A minimalist {brand} logo design, {style}, vector graphics, clean lines",
    params: {
      brand: { type: "text", label: "品牌名", placeholder: "Brand name", default: "" },
      style: { type: "select", label: "风格", options: ["minimalist", "modern", "vintage", "tech"], default: "minimalist" }
    },
    tags: ["image", "logo", "设计"],
    installCount: 2156,
    rating: 4.9
  },
  {
    id: "music-ambient",
    name: "氛围音乐",
    icon: "🎵",
    description: "生成放松氛围背景音乐",
    type: "music",
    prompt: "Ambient music, {mood}, {instrument}, calm and peaceful, 180 seconds",
    params: {
      mood: { type: "select", label: "情绪", options: ["calm", "mysterious", "epic", "dreamy"], default: "calm" },
      instrument: { type: "select", label: "乐器", options: ["piano", "synthesizer", "strings", "nature sounds"], default: "piano" }
    },
    tags: ["music", "ambient", "氛围"],
    installCount: 567,
    rating: 4.5
  },
  {
    id: "music-game",
    name: "游戏BGM",
    icon: "🎮",
    description: "生成游戏背景音乐",
    type: "music",
    prompt: "Epic game soundtrack, {genre}, energetic, {tempo} tempo, orchestral",
    params: {
      genre: { type: "select", label: "类型", options: ["action", "rpg", "puzzle", "racing"], default: "action" },
      tempo: { type: "select", label: "节奏", options: ["fast", "medium", "slow"], default: "medium" }
    },
    tags: ["music", "game", "游戏"],
    installCount: 432,
    rating: 4.3
  },
  {
    id: "tts-narration",
    name: "旁白配音",
    icon: "🎙️",
    description: "生成纪录片/旁白风格配音",
    type: "tts",
    prompt: "{text}",
    params: {
      text: { type: "textarea", label: "文本内容", placeholder: "Enter narration text...", default: "" }
    },
    tags: ["tts", "narration", "旁白"],
    installCount: 789,
    rating: 4.7
  },
  {
    id: "tts-story",
    name: "故事朗读",
    icon: "📖",
    description: "生成故事书风格配音",
    type: "tts",
    prompt: "{text}",
    params: {
      text: { type: "textarea", label: "故事内容", placeholder: "Once upon a time...", default: "" }
    },
    tags: ["tts", "story", "故事"],
    installCount: 654,
    rating: 4.4
  },
  {
    id: "text-poem",
    name: "诗歌创作",
    icon: "✍️",
    description: "创作各种风格的诗歌",
    type: "text",
    prompt: "Write a {form} poem about {topic}, {style}",
    params: {
      form: { type: "select", label: "形式", options: ["haiku", "sonnet", "free verse", "limerick"], default: "haiku" },
      topic: { type: "text", label: "主题", placeholder: "e.g. autumn", default: "" },
      style: { type: "select", label: "风格", options: ["romantic", "nature", "philosophical", "humorous"], default: "nature" }
    },
    tags: ["text", "poem", "诗歌"],
    installCount: 321,
    rating: 4.2
  }
];
function getMarketTemplates(type = null) {
  let templates = [...PRESET_TEMPLATES];
  const userTemplates = getUserTemplates();
  templates = [...templates, ...userTemplates];
  if (type) {
    templates = templates.filter((t) => t.type === type);
  }
  return templates;
}
function getUserTemplates() {
  try {
    const data = localStorage.getItem(MARKET_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function saveUserTemplate(template) {
  const userTemplates = getUserTemplates();
  const existing = userTemplates.findIndex((t) => t.id === template.id);
  if (existing >= 0) {
    userTemplates[existing] = { ...template, updatedAt: Date.now() };
  } else {
    userTemplates.push({ ...template, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(MARKET_KEY, JSON.stringify(userTemplates));
  return true;
}
function installTemplate(templateId) {
  const templates = getMarketTemplates();
  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    return { success: false, error: "模板不存在" };
  }
  const installed = getInstalledTemplates();
  if (!installed.find((t) => t.id === templateId)) {
    installed.push({
      ...template,
      installedAt: Date.now()
    });
    localStorage.setItem(MARKET_KEY + "-installed", JSON.stringify(installed));
  }
  return { success: true, template };
}
function getInstalledTemplates() {
  try {
    const data = localStorage.getItem(MARKET_KEY + "-installed");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function searchTemplates(query, type = null) {
  const templates = getMarketTemplates(type);
  const q = query.toLowerCase();
  return templates.filter(
    (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
function createTemplate(data) {
  const template = {
    id: `custom-${Date.now()}`,
    name: data.name || "未命名模板",
    icon: data.icon || "📄",
    description: data.description || "",
    type: data.type || "text",
    prompt: data.prompt || "",
    params: data.params || {},
    tags: data.tags || ["custom"],
    isUserCreated: true,
    installCount: 0,
    rating: 0
  };
  saveUserTemplate(template);
  return { success: true, template };
}
export {
  getMarketTemplates as a,
  createTemplate as c,
  getInstalledTemplates as g,
  installTemplate as i,
  searchTemplates as s
};
//# sourceMappingURL=TemplateMarket-BFmIOwYb.js.map

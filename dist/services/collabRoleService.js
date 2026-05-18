/**
 * collabRoleService.js - AI Role Collaboration Service V2
 * Provides multi-role collaboration, parallel creation, and role preset management
 */

const CollabRoleService = {
  // Storage keys
  PRESETS_KEY: 'collab_role_presets',
  ACTIVE_COLLAB_KEY: 'active_collab_session',
  
  // Maximum roles per collaboration
  MAX_ROLES: 4,
  
  // Role categories for collaboration modes
  ROLE_CATEGORIES: {
    illustrator: { icon: '🎨', name: '插画师', color: '#667eea' },
    musician: { icon: '🎵', name: '音乐人', color: '#f093fb' },
    voiceActor: { icon: '🎤', name: '配音师', color: '#4facfe' },
    designer: { icon: '✨', name: '设计师', color: '#f5af19' },
    writer: { icon: '📝', name: '编剧', color: '#667eea' },
    director: { icon: '🎬', name: '导演', color: '#e53935' }
  },

  /**
   * Generate unique ID
   */
  generateId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  },

  /**
   * Get all available roles
   */
  getRoles() {
    return [
      {
        type: 'illustrator',
        name: '插画师',
        icon: '🎨',
        description: '专业AI插画创作助手',
        specialties: ['二次元插画', '写实风格', '概念设计', '角色立绘'],
        scenes: ['社交媒体配图', '游戏美术', '书籍插画', '品牌设计'],
        promptPrefix: 'As a professional AI illustrator with expertise in creating stunning visual artwork, I specialize in detailed illustration, character design, and artistic composition. Create a beautiful, professionally crafted illustration with careful attention to lighting, color harmony, and artistic detail.',
        capabilities: ['image', 'style_transfer', 'character_design'],
        collaborationMode: 'sequential'
      },
      {
        type: 'musician',
        name: '音乐人',
        icon: '🎵',
        description: '专业AI音乐创作助手',
        specialties: ['编曲制作', '旋律创作', '混音指导', '风格融合'],
        scenes: ['原创音乐', '视频配乐', '游戏音效', '广告音乐'],
        promptPrefix: 'As a professional AI music composer and producer, I create original music with sophisticated arrangements, melismatic melodies, and professional audio production quality. Compose an original musical piece with excellent melody, harmony, rhythm, and production value.',
        capabilities: ['music', 'melody', 'arrangement', 'mixing'],
        collaborationMode: 'sequential'
      },
      {
        type: 'voiceActor',
        name: '配音师',
        icon: '🎤',
        description: '专业AI语音合成助手',
        specialties: ['情感配音', '多语言支持', '角色配音', '旁白朗读'],
        scenes: ['视频配音', '有声读物', '游戏语音', '广告旁白'],
        promptPrefix: 'As a professional AI voice actor and voice synthesis specialist, I create natural, expressive, and emotionally resonant speech with professional vocal quality, proper diction, and authentic emotional delivery.',
        capabilities: ['tts', 'voice_clone', 'emotion_control'],
        collaborationMode: 'sequential'
      },
      {
        type: 'designer',
        name: '设计师',
        icon: '✨',
        description: '专业AI设计创作助手',
        specialties: ['UI设计', '海报设计', 'LOGO设计', '包装设计'],
        scenes: ['APP界面', '营销海报', '品牌视觉', '产品包装'],
        promptPrefix: 'As a professional AI designer specializing in visual communication and design aesthetics, I create stunning, professional designs with excellent composition, color theory, typography, and modern design principles.',
        capabilities: ['image', 'vector', 'layout', 'branding'],
        collaborationMode: 'sequential'
      },
      {
        type: 'writer',
        name: '编剧',
        icon: '📝',
        description: '专业AI剧本创作助手',
        specialties: ['故事构思', '对白创作', '情节设计', '世界观构建'],
        scenes: ['短视频脚本', '微电影', '广告文案', '游戏剧情'],
        promptPrefix: 'As a professional AI screenwriter and narrative designer, I create compelling stories with well-developed characters, engaging dialogue, and effective narrative structure.',
        capabilities: ['script', 'story', 'dialogue', 'worldbuilding'],
        collaborationMode: 'parallel'
      },
      {
        type: 'director',
        name: '导演',
        icon: '🎬',
        description: '专业AI视觉导演助手',
        specialties: ['镜头设计', '场景调度', '视觉叙事', '风格把控'],
        scenes: ['分镜设计', '视觉分镜', '短片策划', '创作指导'],
        promptPrefix: 'As a professional AI film director and visual storyteller, I create compelling visual narratives with sophisticated camera work, precise scene composition, and strong directorial vision.',
        capabilities: ['storyboard', 'shot_design', 'visual_style', 'scene_composition'],
        collaborationMode: 'parallel'
      }
    ];
  },

  /**
   * Get role by type
   */
  getRoleByType(type) {
    return this.getRoles().find(role => role.type === type) || null;
  },

  /**
   * Get collaboration prompt for multiple roles
   */
  getCollabPrompt(roleTypes, basePrompt) {
    const roles = roleTypes.map(t => this.getRoleByType(t)).filter(Boolean);
    if (roles.length === 0) return basePrompt;

    // Build collaborative prompt with role hierarchy
    let collabPrompt = '';
    
    if (roles.length === 1) {
      collabPrompt = roles[0].promptPrefix + basePrompt;
    } else {
      // Multi-role collaboration prompt
      collabPrompt = '【多角色协作创作】\n\n';
      
      // Add role descriptions in sequence
      roles.forEach((role, index) => {
        collabPrompt += `${index + 1}. 【${role.name}】${role.description}\n`;
        collabPrompt += `   专长: ${role.specialties.join(', ')}\n`;
        collabPrompt += `   指令: ${role.promptPrefix}\n\n`;
      });
      
      // Add collaboration instruction
      collabPrompt += '【协作要求】\n';
      collabPrompt += `- 角色[1] 负责：${roles[0].specialties[0]}\n`;
      if (roles[1]) {
        collabPrompt += `- 角色[2] 负责：${roles[1].specialties[0]}\n`;
      }
      if (roles[2]) {
        collabPrompt += `- 角色[3] 负责：${roles[2].specialties[0]}\n`;
      }
      if (roles[3]) {
        collabPrompt += `- 角色[4] 负责：${roles[3].specialties[0]}\n`;
      }
      
      collabPrompt += '\n【创作任务】\n';
      collabPrompt += basePrompt;
    }
    
    return collabPrompt;
  },

  /**
   * Get parallel creation prompt (each role works independently)
   */
  getParallelPrompt(roleType, basePrompt, context = {}) {
    const role = this.getRoleByType(roleType);
    if (!role) return basePrompt;

    let prompt = role.promptPrefix;
    
    // Add context-aware enhancements
    if (context.projectType) {
      prompt += `Focus on ${context.projectType} content. `;
    }
    if (context.style) {
      prompt += `Style: ${context.style}. `;
    }
    if (context.mood) {
      prompt += `Mood: ${context.mood}. `;
    }
    
    prompt += '\n\nTask: ' + basePrompt;
    
    return prompt;
  },

  /**
   * Save role preset
   */
  savePreset(preset) {
    const presets = this.getPresets();
    const newPreset = {
      id: preset.id || this.generateId(),
      name: preset.name || '未命名预设',
      roles: preset.roles || [],
      mode: preset.mode || 'sequential', // sequential | parallel | hybrid
      config: preset.config || {},
      createdAt: preset.createdAt || Date.now(),
      updatedAt: Date.now(),
      usageCount: preset.usageCount || 0
    };

    // Update existing or add new
    const existingIndex = presets.findIndex(p => p.id === newPreset.id);
    if (existingIndex >= 0) {
      presets[existingIndex] = newPreset;
    } else {
      presets.push(newPreset);
    }

    localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
    return newPreset;
  },

  /**
   * Get all presets
   */
  getPresets() {
    try {
      return JSON.parse(localStorage.getItem(this.PRESETS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Get preset by ID
   */
  getPresetById(presetId) {
    const presets = this.getPresets();
    return presets.find(p => p.id === presetId) || null;
  },

  /**
   * Delete preset
   */
  deletePreset(presetId) {
    const presets = this.getPresets();
    const filtered = presets.filter(p => p.id !== presetId);
    localStorage.setItem(this.PRESETS_KEY, JSON.stringify(filtered));
  },

  /**
   * Increment preset usage count
   */
  usePreset(presetId) {
    const presets = this.getPresets();
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      preset.usageCount = (preset.usageCount || 0) + 1;
      preset.lastUsed = Date.now();
      localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
    }
  },

  /**
   * Create collaboration session
   */
  createSession(config) {
    const session = {
      id: this.generateId(),
      name: config.name || '协作创作',
      roles: config.roles || [],
      mode: config.mode || 'sequential',
      prompt: config.prompt || '',
      context: config.context || {},
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      results: [],
      progress: {
        total: config.roles?.length || 0,
        completed: 0,
        current: null
      }
    };

    localStorage.setItem(this.ACTIVE_COLLAB_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Get active session
   */
  getActiveSession() {
    try {
      return JSON.parse(localStorage.getItem(this.ACTIVE_COLLAB_KEY) || 'null');
    } catch {
      return null;
    }
  },

  /**
   * Update session progress
   */
  updateSessionProgress(completedRole, result) {
    const session = this.getActiveSession();
    if (!session) return null;

    session.progress.completed++;
    session.progress.current = completedRole;
    session.results.push({
      role: completedRole,
      result: result,
      timestamp: Date.now()
    });
    session.updatedAt = Date.now();

    localStorage.setItem(this.ACTIVE_COLLAB_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Complete session
   */
  completeSession() {
    const session = this.getActiveSession();
    if (!session) return null;

    session.status = 'completed';
    session.updatedAt = Date.now();
    
    // Save to history
    this.saveSessionToHistory(session);
    
    localStorage.removeItem(this.ACTIVE_COLLAB_KEY);
    return session;
  },

  /**
   * Cancel session
   */
  cancelSession() {
    localStorage.removeItem(this.ACTIVE_COLLAB_KEY);
  },

  /**
   * Save session to history
   */
  saveSessionToHistory(session) {
    const historyKey = 'collab_session_history';
    try {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.unshift(session);
      // Keep last 20 sessions
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      console.error('Failed to save session history:', e);
    }
  },

  /**
   * Get session history
   */
  getSessionHistory() {
    try {
      return JSON.parse(localStorage.getItem('collab_session_history') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Generate combined output from session results
   */
  generateCombinedOutput(session) {
    if (!session || !session.results.length) return null;

    return {
      id: session.id,
      name: session.name,
      roles: session.roles,
      mode: session.mode,
      outputs: session.results.map(r => r.result),
      createdAt: session.createdAt,
      duration: session.updatedAt - session.createdAt
    };
  },

  /**
   * Validate role combination
   */
  validateCombination(roles) {
    if (!roles || roles.length === 0) {
      return { valid: false, reason: '请至少选择一个角色' };
    }
    if (roles.length > this.MAX_ROLES) {
      return { valid: false, reason: `最多只能选择 ${this.MAX_ROLES} 个角色` };
    }

    // Check for duplicate roles
    const uniqueRoles = [...new Set(roles)];
    if (uniqueRoles.length !== roles.length) {
      return { valid: false, reason: '不能选择重复的角色' };
    }

    return { valid: true };
  },

  /**
   * Get recommended role combinations
   */
  getRecommendedCombos() {
    return [
      {
        id: 'combo_video',
        name: '🎬 视频创作组合',
        description: '编剧+导演+插画师+配音师',
        roles: ['writer', 'director', 'illustrator', 'voiceActor'],
        icon: '🎬',
        color: '#e53935'
      },
      {
        id: 'combo_music_video',
        name: '🎵 音乐视频组合',
        description: '音乐人+导演+插画师',
        roles: ['musician', 'director', 'illustrator'],
        icon: '🎵',
        color: '#f093fb'
      },
      {
        id: 'combo_game',
        name: '🎮 游戏美术组合',
        description: '插画师+设计师+音乐人',
        roles: ['illustrator', 'designer', 'musician'],
        icon: '🎮',
        color: '#667eea'
      },
      {
        id: 'combo_branding',
        name: '✨ 品牌设计组合',
        description: '设计师+插画师+编剧',
        roles: ['designer', 'illustrator', 'writer'],
        icon: '✨',
        color: '#f5af19'
      }
    ];
  },

  /**
   * Check if role supports parallel mode
   */
  supportsParallel(roleType) {
    const role = this.getRoleByType(roleType);
    return role && role.capabilities.includes('script');
  },

  /**
   * Get collaboration mode for roles
   */
  getCollaborationMode(roles) {
    if (roles.length <= 1) return 'single';
    
    const hasParallelCapable = roles.some(r => this.supportsParallel(r));
    
    if (hasParallelCapable && roles.length >= 3) {
      return 'hybrid'; // Some parallel, some sequential
    }
    
    return 'sequential';
  },

  /**
   * Export presets for sharing
   */
  exportPresets() {
    const presets = this.getPresets();
    return JSON.stringify(presets, null, 2);
  },

  /**
   * Import presets from JSON
   */
  importPresets(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format');
      }
      
      const existing = this.getPresets();
      const merged = [...existing];
      
      imported.forEach(preset => {
        if (preset.id && preset.name && Array.isArray(preset.roles)) {
          // Generate new ID to avoid conflicts
          preset.id = this.generateId();
          merged.push(preset);
        }
      });
      
      localStorage.setItem(this.PRESETS_KEY, JSON.stringify(merged));
      return { success: true, count: imported.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// Export for global usage
window.CollabRoleService = CollabRoleService;
/**
 * roleService.js - AI Role Service
 * Provides role data, selection, and prompt prefix generation
 */

const ROLES = [
  {
    type: 'illustrator',
    name: '插画师',
    icon: '🎨',
    description: '专业AI插画创作助手',
    specialties: ['二次元插画', '写实风格', '概念设计', '角色立绘'],
   适用场景: ['社交媒体配图', '游戏美术', '书籍插画', '品牌设计'],
    promptPrefix: 'As a professional AI illustrator with expertise in creating stunning visual artwork, I specialize in detailed illustration, character design, and artistic composition. Create a beautiful, professionally crafted illustration with careful attention to lighting, color harmony, and artistic detail. ',
    recommendedTypes: ['image']
  },
  {
    type: 'musician',
    name: '音乐人',
    icon: '🎵',
    description: '专业AI音乐创作助手',
    specialties: ['编曲制作', '旋律创作', '混音指导', '风格融合'],
   适用场景: ['原创音乐', '视频配乐', '游戏音效', '广告音乐'],
    promptPrefix: 'As a professional AI music composer and producer, I create original music with sophisticated arrangements, melismatic melodies, and professional audio production quality. Compose an original musical piece with excellent melody, harmony, rhythm, and production value. ',
    recommendedTypes: ['music']
  },
  {
    type: 'voiceActor',
    name: '配音师',
    icon: '🎤',
    description: '专业AI语音合成助手',
    specialties: ['情感配音', '多语言支持', '角色配音', '旁白朗读'],
   适用场景: ['视频配音', '有声读物', '游戏语音', '广告旁白'],
    promptPrefix: 'As a professional AI voice actor and voice synthesis specialist, I create natural, expressive, and emotionally resonant speech with professional vocal quality, proper diction, and authentic emotional delivery. ',
    recommendedTypes: ['tts']
  },
  {
    type: 'designer',
    name: '设计师',
    icon: '✨',
    description: '专业AI设计创作助手',
    specialties: ['UI设计', '海报设计', 'LOGO设计', '包装设计'],
   适用场景: ['APP界面', '营销海报', '品牌视觉', '产品包装'],
    promptPrefix: 'As a professional AI designer specializing in visual communication and design aesthetics, I create stunning, professional designs with excellent composition, color theory, typography, and modern design principles. ',
    recommendedTypes: ['image']
  }
];

/**
 * Get all available roles
 */
export function getRoles() {
  return ROLES;
}

/**
 * Get role by type
 */
export function getRoleByType(type) {
  return ROLES.find(role => role.type === type) || null;
}

/**
 * Get role by creation type (image/music/tts)
 */
export function getRoleByCreationType(creationType) {
  return ROLES.find(role => role.recommendedTypes.includes(creationType)) || null;
}

/**
 * Get role prompt prefix
 */
export function getRolePrompt(roleType) {
  const role = getRoleByType(roleType);
  return role ? role.promptPrefix : '';
}

/**
 * Get role display info
 */
export function getRoleDisplayInfo(roleType) {
  const role = getRoleByType(roleType);
  if (!role) return null;
  
  return {
    name: role.name,
    icon: role.icon,
    description: role.description,
    specialties: role.specialties,
   适用场景: role.适用场景
  };
}

/**
 * Save selected role to localStorage
 */
export function saveSelectedRole(roleType) {
  localStorage.setItem('selected_role', roleType);
}

/**
 * Get saved selected role
 */
export function getSelectedRole() {
  return localStorage.getItem('selected_role') || null;
}

/**
 * Clear selected role
 */
export function clearSelectedRole() {
  localStorage.removeItem('selected_role');
}
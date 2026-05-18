/**
 * templateGallery.js - Template Marketplace Service
 * Manages built-in templates and user interactions
 */

/**
 * Generate SVG thumbnail for template
 * @param {Object} template - Template object
 * @returns {string} SVG string
 */
function generateTemplateThumbnail(template) {
  const colors = {
    music: { bg: '#7C3AED', fg: '#C4B5FD' },
    drawing: { bg: '#2563EB', fg: '#93C5FD' },
    video: { bg: '#059669', fg: '#6EE7B7' },
    text: { bg: '#D97706', fg: '#FCD34D' },
    voice: { bg: '#EC4899', fg: '#F9A8D4' }
  };
  
  const cat = template.category || 'text';
  const color = colors[cat] || colors.text;
  
  // Count node types for visualization
  const nodeCount = template.nodes?.length || 3;
  const connectionCount = template.connections?.length || 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
    <rect width="120" height="80" rx="6" fill="${color.bg}"/>
    <text x="60" y="20" text-anchor="middle" fill="${color.fg}" font-size="10" font-weight="bold">${template.name?.slice(0, 12) || 'Template'}</text>
    <circle cx="30" cy="50" r="8" fill="${color.fg}" opacity="0.9"/>
    <circle cx="60" cy="50" r="8" fill="${color.fg}" opacity="0.7"/>
    <circle cx="90" cy="50" r="8" fill="${color.fg}" opacity="0.5"/>
    <line x1="38" y1="50" x2="52" y2="50" stroke="${color.fg}" stroke-width="2" opacity="0.6"/>
    <line x1="68" y1="50" x2="82" y2="50" stroke="${color.fg}" stroke-width="2" opacity="0.6"/>
    <text x="60" y="70" text-anchor="middle" fill="${color.fg}" font-size="8" opacity="0.8">${nodeCount}节点 · ${connectionCount}连接</text>
  </svg>`;
}

// Built-in templates data
const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-ancient-music',
    name: '古风歌曲创作',
    author: 'AI Creator',
    description: '创作一首优美的古风歌曲，包含词曲创作和演唱合成',
    category: 'music',
    style: 'ancient',
    difficulty: 'beginner',
    nodes: [
      { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 100, config: {} },
      { id: 'n2', type: 'creator', subtype: 'character', x: 250, y: 100, config: { style: 'ancient', description: '古风歌手形象' } },
      { id: 'n3', type: 'creator', subtype: 'music', x: 400, y: 100, config: { mood: 'sad', duration: 180 } },
      { id: 'n4', type: 'creator', subtype: 'tts', x: 550, y: 100, config: { voice: 'female-mature' } },
      { id: 'n5', type: 'output', subtype: 'save', x: 700, y: 100, config: {} }
    ],
    connections: [
      { from: 'n1', fromPort: 'out', to: 'n2', toPort: 'in' },
      { from: 'n2', fromPort: 'out', to: 'n3', toPort: 'in' },
      { from: 'n3', fromPort: 'out', to: 'n4', toPort: 'in' },
      { from: 'n4', fromPort: 'out', to: 'n5', toPort: 'in' }
    ],
    rating: 4.8,
    useCount: 342,
    thumbnail: '',
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: 'tpl-scifi-music',
    name: '科幻音乐制作',
    author: 'AI Creator',
    description: '制作充满未来感的科幻风格背景音乐',
    category: 'music',
    style: 'scifi',
    difficulty: 'intermediate',
    nodes: [
      { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 150, config: {} },
      { id: 'n2', type: 'creator', subtype: 'music', x: 250, y: 150, config: { mood: 'epic', duration: 240 } },
      { id: 'n3', type: 'loop', subtype: 'forLoop', x: 400, y: 150, config: { variable: 'i', count: 3, maxIterations: 10 } },
      { id: 'n4', type: 'creator', subtype: 'tts', x: 550, y: 100, config: { voice: 'male-adult' } },
      { id: 'n5', type: 'creator', subtype: 'poster', x: 550, y: 200, config: { template: 'scifi-theme' } },
      { id: 'n6', type: 'output', subtype: 'save', x: 700, y: 150, config: {} }
    ],
    connections: [
      { from: 'n1', fromPort: 'out', to: 'n2', toPort: 'in' },
      { from: 'n2', fromPort: 'out', to: 'n3', toPort: 'in' },
      { from: 'n3', fromPort: 'body', to: 'n4', toPort: 'in' },
      { from: 'n3', fromPort: 'body', to: 'n5', toPort: 'in' },
      { from: 'n4', fromPort: 'out', to: 'n6', toPort: 'in' }
    ],
    rating: 4.6,
    useCount: 218,
    thumbnail: '',
    createdAt: Date.now() - 86400000 * 25
  },
  {
    id: 'tpl-illustration',
    name: '插画创作',
    author: 'AI Creator',
    description: '创作精美插画，支持多种艺术风格',
    category: 'drawing',
    style: 'realistic',
    difficulty: 'intermediate',
    nodes: [
      { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 120, config: {} },
      { id: 'n2', type: 'creator', subtype: 'character', x: 250, y: 120, config: { style: 'realistic', description: '插画角色' } },
      { id: 'n3', type: 'creator', subtype: 'poster', x: 400, y: 120, config: { template: 'illustration' } },
      { id: 'n4', type: 'output', subtype: 'save', x: 550, y: 120, config: {} }
    ],
    connections: [
      { from: 'n1', fromPort: 'out', to: 'n2', toPort: 'in' },
      { from: 'n2', fromPort: 'out', to: 'n3', toPort: 'in' },
      { from: 'n3', fromPort: 'out', to: 'n4', toPort: 'in' }
    ],
    rating: 4.9,
    useCount: 567,
    thumbnail: '',
    createdAt: Date.now() - 86400000 * 20
  },
  {
    id: 'tpl-video-workflow',
    name: '视频剪辑工作流',
    author: 'AI Creator',
    description: '完整的视频创作和剪辑工作流，支持批量处理',
    category: 'video',
    style: 'abstract',
    difficulty: 'expert',
    nodes: [
      { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 200, config: {} },
      { id: 'n2', type: 'creator', subtype: 'poster', x: 250, y: 100, config: { template: 'video-cover' } },
      { id: 'n3', type: 'creator', subtype: 'music', x: 250, y: 300, config: { mood: 'epic', duration: 60 } },
      { id: 'n4', type: 'loop', subtype: 'forLoop', x: 400, y: 200, config: { variable: 'i', count: 5, maxIterations: 20 } },
      { id: 'n5', type: 'creator', subtype: 'tts', x: 550, y: 200, config: { voice: 'female-youth' } },
      { id: 'n6', type: 'logic', subtype: 'condition', x: 700, y: 200, config: { field: 'type', value: 'video' } },
      { id: 'n7', type: 'output', subtype: 'save', x: 850, y: 200, config: {} }
    ],
    connections: [
      { from: 'n1', fromPort: 'out', to: 'n2', toPort: 'in' },
      { from: 'n1', fromPort: 'out', to: 'n3', toPort: 'in' },
      { from: 'n2', fromPort: 'out', to: 'n4', toPort: 'in' },
      { from: 'n3', fromPort: 'out', to: 'n4', toPort: 'in' },
      { from: 'n4', fromPort: 'body', to: 'n5', toPort: 'in' },
      { from: 'n5', fromPort: 'out', to: 'n6', toPort: 'in' },
      { from: 'n6', fromPort: 'true', to: 'n7', toPort: 'in' }
    ],
    rating: 4.4,
    useCount: 156,
    thumbnail: '',
    createdAt: Date.now() - 86400000 * 15
  },
  {
    id: 'tpl-copywriting',
    name: '文案写作',
    author: 'AI Creator',
    description: '智能文案创作工作流，支持多种文案类型',
    category: 'text',
    style: 'realistic',
    difficulty: 'beginner',
    nodes: [
      { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 100, config: {} },
      { id: 'n2', type: 'creator', subtype: 'character', x: 250, y: 100, config: { style: 'realistic', description: '文案风格选择' } },
      { id: 'n3', type: 'logic', subtype: 'condition', x: 400, y: 100, config: { field: 'type', value: 'marketing' } },
      { id: 'n4', type: 'output', subtype: 'save', x: 550, y: 60, config: {} },
      { id: 'n5', type: 'output', subtype: 'share', x: 550, y: 140, config: {} }
    ],
    connections: [
      { from: 'n1', fromPort: 'out', to: 'n2', toPort: 'in' },
      { from: 'n2', fromPort: 'out', to: 'n3', toPort: 'in' },
      { from: 'n3', fromPort: 'true', to: 'n4', toPort: 'in' },
      { from: 'n3', fromPort: 'false', to: 'n5', toPort: 'in' }
    ],
    rating: 4.7,
    useCount: 423,
    thumbnail: '',
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: 'tpl-voice-synthesis',
    name: '配音合成',
    author: 'AI Creator',
    description: '高质量语音合成，支持多种音色和语言',
    category: 'voice',
    style: 'scifi',
    difficulty: 'beginner',
    nodes: [
      { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 100, config: {} },
      { id: 'n2', type: 'creator', subtype: 'tts', x: 250, y: 100, config: { voice: 'female-youth' } },
      { id: 'n3', type: 'loop', subtype: 'whileLoop', x: 400, y: 100, config: { variable: 'i', condition: 'i < 3', maxIterations: 10 } },
      { id: 'n4', type: 'output', subtype: 'save', x: 550, y: 100, config: {} }
    ],
    connections: [
      { from: 'n1', fromPort: 'out', to: 'n2', toPort: 'in' },
      { from: 'n2', fromPort: 'out', to: 'n3', toPort: 'in' },
      { from: 'n3', fromPort: 'body', to: 'n4', toPort: 'in' }
    ],
    rating: 4.5,
    useCount: 289,
    thumbnail: '',
    createdAt: Date.now() - 86400000 * 5
  }
];

// Generate thumbnails for all templates
BUILTIN_TEMPLATES.forEach(tpl => {
  tpl.thumbnail = generateTemplateThumbnail(tpl);
});

// User ratings/favorites storage key
const RATINGS_KEY = 'workflow_template_ratings';
const FAVORITES_KEY = 'workflow_template_favorites';

/**
 * Get user ratings from localStorage
 * @returns {Object} User ratings map
 */
function getUserRatings() {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Save user rating
 * @param {string} ratingKey - Rating key
 * @param {number} rating - Rating value
 */
function saveUserRating(ratingKey, rating) {
  const ratings = getUserRatings();
  ratings[ratingKey] = rating;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

/**
 * Get user favorites from localStorage
 * @returns {string[]} Array of favorite template IDs
 */
function getUserFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Save user favorites
 * @param {string[]} favorites - Array of favorite template IDs
 */
function saveUserFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/**
 * Get all templates with filters
 * @param {Object} filters - Filter options
 * @param {string} filters.category - Category filter (music|drawing|video|text|voice)
 * @param {string} filters.style - Style filter (ancient|scifi|realistic|abstract)
 * @param {string} filters.difficulty - Difficulty filter (beginner|intermediate|expert)
 * @param {string} filters.search - Search query
 * @returns {Object[]} Filtered templates with user data
 */
function getTemplates(filters = {}) {
  const userRatings = getUserRatings();
  const userFavorites = getUserFavorites();
  
  let filtered = BUILTIN_TEMPLATES.map(tpl => ({
    ...tpl,
    userRating: userRatings[tpl.id] || null,
    isFavorite: userFavorites.includes(tpl.id)
  }));
  
  if (filters.category) {
    filtered = filtered.filter(t => t.category === filters.category);
  }
  
  if (filters.style) {
    filtered = filtered.filter(t => t.style === filters.style);
  }
  
  if (filters.difficulty) {
    filtered = filtered.filter(t => t.difficulty === filters.difficulty);
  }
  
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.author.toLowerCase().includes(query)
    );
  }
  
  // Sort by rating and use count
  filtered.sort((a, b) => (b.rating * b.useCount) - (a.rating * a.useCount));
  
  return filtered;
}

/**
 * Get a template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null
 */
function getTemplateById(id) {
  const tpl = BUILTIN_TEMPLATES.find(t => t.id === id);
  if (!tpl) return null;
  
  const userRatings = getUserRatings();
  const userFavorites = getUserFavorites();
  
  return {
    ...tpl,
    userRating: userRatings[id] || null,
    isFavorite: userFavorites.includes(id)
  };
}

/**
 * Rate a template
 * @param {string} id - Template ID
 * @param {number} rating - Rating value (1-5)
 * @returns {Object} Updated template with new rating
 */
function rateTemplate(id, rating) {
  const template = BUILTIN_TEMPLATES.find(t => t.id === id);
  if (!template) return null;
  
  // Save user rating
  saveUserRating(id, rating);
  
  // Recalculate average rating
  const userRatings = getUserRatings();
  const allRatings = [template.rating * 10, rating]; // Using base rating and user rating
  const avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
  template.rating = Math.round(avgRating * 10) / 10;
  
  return {
    ...template,
    userRating: rating,
    isFavorite: getUserFavorites().includes(id)
  };
}

/**
 * Toggle favorite status for a template
 * @param {string} id - Template ID
 * @returns {Object} Updated template with favorite status
 */
function favoriteTemplate(id) {
  const template = BUILTIN_TEMPLATES.find(t => t.id === id);
  if (!template) return null;
  
  let favorites = getUserFavorites();
  const index = favorites.indexOf(id);
  
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  
  saveUserFavorites(favorites);
  
  return {
    ...template,
    userRating: getUserRatings()[id] || null,
    isFavorite: index === -1
  };
}

/**
 * Export a template to JSON
 * @param {Object} template - Template object
 * @returns {string} JSON string of the template
 */
function exportTemplate(template) {
  const exportData = {
    ...template,
    // Remove runtime properties
    userRating: undefined,
    isFavorite: undefined,
    thumbnail: undefined, // Don't export thumbnail SVG
    // Add metadata
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Download template as JSON file
 * @param {Object} template - Template object
 */
function downloadTemplate(template) {
  const json = exportTemplate(template);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name || 'template'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get template categories with counts
 * @returns {Object} Category counts
 */
function getCategoryCounts() {
  const counts = {
    all: BUILTIN_TEMPLATES.length,
    music: 0,
    drawing: 0,
    video: 0,
    text: 0,
    voice: 0
  };
  
  BUILTIN_TEMPLATES.forEach(tpl => {
    if (counts[tpl.category] !== undefined) {
      counts[tpl.category]++;
    }
  });
  
  return counts;
}

// Export for use in other modules
window.TemplateGallery = {
  getTemplates,
  getTemplateById,
  rateTemplate,
  favoriteTemplate,
  exportTemplate,
  downloadTemplate,
  getCategoryCounts,
  generateTemplateThumbnail
};
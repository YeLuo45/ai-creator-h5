/**
 * favoriteService.js - 收藏服务
 */

const FAVORITE_KEYS = {
  FOLDERS: 'folders',
  getFolderItems: (folderId) => `favorites_${folderId}`,
};

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * 获取所有收藏夹
 */
function getFolders() {
  const data = localStorage.getItem(FAVORITE_KEYS.FOLDERS);
  return data ? JSON.parse(data) : [];
}

/**
 * 获取单个收藏夹
 */
function getFolder(id) {
  const folders = getFolders();
  return folders.find(f => f.id === id) || null;
}

/**
 * 创建收藏夹
 */
function createFolder(name, type = 'mixed') {
  const folders = getFolders();
  const now = new Date().toISOString();
  const folder = {
    id: generateId(),
    name,
    type,
    cover: '',
    count: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  folders.push(folder);
  localStorage.setItem(FAVORITE_KEYS.FOLDERS, JSON.stringify(folders));
  return folder;
}

/**
 * 删除收藏夹
 */
function deleteFolder(id) {
  const folders = getFolders();
  const newFolders = folders.filter(f => f.id !== id);
  localStorage.setItem(FAVORITE_KEYS.FOLDERS, JSON.stringify(newFolders));
  // 删除收藏夹的items
  localStorage.removeItem(FAVORITE_KEYS.getFolderItems(id));
}

/**
 * 更新收藏夹
 */
function updateFolder(id, updates) {
  const folders = getFolders();
  const index = folders.findIndex(f => f.id === id);
  if (index === -1) return null;
  
  folders[index] = {
    ...folders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(FAVORITE_KEYS.FOLDERS, JSON.stringify(folders));
  return folders[index];
}

/**
 * 添加项目到收藏夹
 */
function addToFolder(folderId, item) {
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return false;
  
  // 检查是否已存在
  const exists = folder.items.some(i => i.itemId === item.itemId);
  if (exists) return false;
  
  folder.items.push({
    itemId: item.itemId,
    type: item.type,
    url: item.url,
    prompt: item.prompt || '',
    cover: item.cover || '',
    title: item.title || '',
    duration: item.duration || 0,
    addedAt: new Date().toISOString(),
  });
  
  folder.count = folder.items.length;
  folder.updatedAt = new Date().toISOString();
  
  // 更新封面为第一个项目
  if (folder.items.length === 1 && folder.items[0].cover) {
    folder.cover = folder.items[0].cover;
  }
  
  localStorage.setItem(FAVORITE_KEYS.FOLDERS, JSON.stringify(folders));
  return true;
}

/**
 * 从收藏夹移除项目
 */
function removeFromFolder(folderId, itemId) {
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return false;
  
  folder.items = folder.items.filter(i => i.itemId !== itemId);
  folder.count = folder.items.length;
  folder.updatedAt = new Date().toISOString();
  
  // 更新封面
  if (folder.items.length > 0 && folder.items[0].cover) {
    folder.cover = folder.items[0].cover;
  } else {
    folder.cover = '';
  }
  
  localStorage.setItem(FAVORITE_KEYS.FOLDERS, JSON.stringify(folders));
  return true;
}

/**
 * 获取收藏夹的项目
 */
function getFolderItems(folderId) {
  const folder = getFolder(folderId);
  return folder ? folder.items : [];
}

/**
 * 检查项目是否在收藏夹中
 */
function isItemInFolder(folderId, itemId) {
  const folder = getFolder(folderId);
  if (!folder) return false;
  return folder.items.some(i => i.itemId === itemId);
}

/**
 * 获取项目所在的收藏夹列表
 */
function getItemFolders(itemId) {
  const folders = getFolders();
  return folders.filter(f => f.items.some(i => i.itemId === itemId));
}

/**
 * 创建默认收藏夹（如果不存在）
 */
function ensureDefaultFolders() {
  const folders = getFolders();
  if (folders.length === 0) {
    createFolder('我的图片', 'image');
    createFolder('我的音乐', 'music');
    createFolder('我的语音', 'tts');
    createFolder('综合收藏', 'mixed');
  }
}

// 导出到全局
window.FavoriteService = {
  getFolders,
  getFolder,
  createFolder,
  deleteFolder,
  updateFolder,
  addToFolder,
  removeFromFolder,
  getFolderItems,
  isItemInFolder,
  getItemFolders,
  ensureDefaultFolders,
  FAVORITE_KEYS,
};

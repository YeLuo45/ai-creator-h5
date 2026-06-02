/**
 * Workflow Storage Service
 * IndexedDB 存储工作流模板
 */
const WorkflowStorage = {
  DB_NAME: 'ai-creator-workflow',
  DB_VERSION: 1,
  STORE_NAME: 'workflows',
  
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  },

  async save(workflow) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      workflow.updatedAt = Date.now();
      const request = workflow.id ? store.put(workflow) : store.add(workflow);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async load(id) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async list() {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(id) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async ensureDB() {
    if (!this.db) await this.init();
  },

  // 获取示例模板
  getSampleWorkflows() {
    return [
      {
        id: 'sample-1',
        name: '角色+配乐+配音',
        description: '一键生成角色、配乐和配音',
        isSample: true,
        nodes: [
          { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 200, config: {} },
          { id: 'n2', type: 'creator', subtype: 'character', x: 300, y: 200, config: { style: 'anime', description: '' } },
          { id: 'n3', type: 'creator', subtype: 'music', x: 500, y: 200, config: { mood: 'epic', duration: 60 } },
          { id: 'n4', type: 'creator', subtype: 'tts', x: 700, y: 200, config: { voice: 'female-youth' } },
          { id: 'n5', type: 'output', subtype: 'save', x: 900, y: 200, config: {} }
        ],
        connections: [
          { from: 'n1', to: 'n2', fromPort: 'out', toPort: 'in' },
          { from: 'n2', to: 'n3', fromPort: 'out', toPort: 'in' },
          { from: 'n3', to: 'n4', fromPort: 'out', toPort: 'in' },
          { from: 'n4', to: 'n5', fromPort: 'out', toPort: 'in' }
        ]
      },
      {
        id: 'sample-2',
        name: '海报批量生成',
        description: '循环生成多张海报',
        isSample: true,
        nodes: [
          { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 200, config: {} },
          { id: 'n2', type: 'logic', subtype: 'loop', x: 300, y: 200, config: { count: 5 } },
          { id: 'n3', type: 'creator', subtype: 'poster', x: 500, y: 200, config: { template: 'default' } },
          { id: 'n4', type: 'output', subtype: 'save', x: 700, y: 200, config: {} }
        ],
        connections: [
          { from: 'n1', to: 'n2', fromPort: 'out', toPort: 'in' },
          { from: 'n2', to: 'n3', fromPort: 'out', toPort: 'in' },
          { from: 'n3', to: 'n4', fromPort: 'out', toPort: 'in' }
        ]
      },
      {
        id: 'sample-3',
        name: '条件分支创作',
        description: '根据内容类型选择创作路径',
        isSample: true,
        nodes: [
          { id: 'n1', type: 'trigger', subtype: 'manual', x: 100, y: 200, config: {} },
          { id: 'n2', type: 'logic', subtype: 'condition', x: 300, y: 200, config: { field: 'type', operator: '==', value: 'video' } },
          { id: 'n3', type: 'creator', subtype: 'music', x: 500, y: 100, config: {} },
          { id: 'n4', type: 'creator', subtype: 'tts', x: 500, y: 300, config: {} },
          { id: 'n5', type: 'output', subtype: 'share', x: 700, y: 200, config: {} }
        ],
        connections: [
          { from: 'n1', to: 'n2', fromPort: 'out', toPort: 'in' },
          { from: 'n2', to: 'n3', fromPort: 'true', toPort: 'in' },
          { from: 'n2', to: 'n4', fromPort: 'false', toPort: 'in' },
          { from: 'n3', to: 'n5', fromPort: 'out', toPort: 'in' },
          { from: 'n4', to: 'n5', fromPort: 'out', toPort: 'in' }
        ]
      }
    ];
  }
};
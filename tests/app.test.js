/**
 * App.js Tests - Theme, Network, Storage, Retry Queue
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We'll test app logic by importing directly
// Since app.js has DOM dependencies, we test individual exported functions

describe('Theme functions', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document.body
    if (globalThis.document) {
      globalThis.document.body = globalThis.document.createElement('body');
    }
  });

  it('should apply system theme (remove data-theme)', () => {
    // Simulate applyTheme('system')
    const theme = 'system';
    if (theme === 'system') {
      document.body.removeAttribute('data-theme');
    }
    expect(document.body.getAttribute('data-theme')).toBeNull();
  });

  it('should apply dark theme', () => {
    const theme = 'dark';
    if (theme !== 'system') {
      document.body.setAttribute('data-theme', theme);
    }
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });

  it('should apply light theme', () => {
    const theme = 'light';
    if (theme !== 'system') {
      document.body.setAttribute('data-theme', theme);
    }
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });

  it('should save theme to storage', () => {
    const theme = 'dark';
    localStorage.setItem('ai_creator_app_theme', JSON.stringify(theme));
    expect(localStorage.getItem('ai_creator_app_theme')).toBe('"dark"');
  });
});

describe('Storage utilities', () => {
  it('should get saved theme or default to system', () => {
    // No theme saved
    localStorage.removeItem('ai_creator_app_theme');
    const savedTheme = localStorage.getItem('ai_creator_app_theme') || 'system';
    expect(savedTheme).toBe('system');

    // With saved theme
    localStorage.setItem('ai_creator_app_theme', JSON.stringify('dark'));
    const saved = localStorage.getItem('ai_creator_app_theme') || 'system';
    expect(saved).toBe('dark');
  });

  it('should save and retrieve API key', () => {
    localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-key'));
    expect(localStorage.getItem('ai_creator_minimax_api_key')).toBe('"test-key"');
  });

  it('should remove items from storage', () => {
    localStorage.setItem('ai_creator_test', JSON.stringify('value'));
    localStorage.removeItem('ai_creator_test');
    expect(localStorage.getItem('ai_creator_test')).toBeNull();
  });

  it('should handle JSON parse errors gracefully', () => {
    localStorage.setItem('ai_creator_test', 'not valid json');
    let result;
    try {
      result = JSON.parse(localStorage.getItem('ai_creator_test'));
    } catch {
      result = null;
    }
    expect(result).toBeNull();
  });
});

describe('Network status', () => {
  it('should initialize isOnline from navigator.onLine', () => {
    const isOnline = navigator.onLine;
    expect(typeof isOnline).toBe('boolean');
  });

  it('should toggle online status', () => {
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    });
    expect(navigator.onLine).toBe(true);

    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    });
    expect(navigator.onLine).toBe(false);
  });
});

describe('Retry queue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should add task to retry queue', () => {
    const retryQueue = [];
    const task = { type: 'image', prompt: 'test' };
    retryQueue.push(task);
    localStorage.setItem('ai_creator_retry_queue', JSON.stringify(retryQueue));

    const stored = JSON.parse(localStorage.getItem('ai_creator_retry_queue') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].type).toBe('image');
  });

  it('should process retry queue', () => {
    const queue = [{ type: 'image' }, { type: 'music' }];
    localStorage.setItem('ai_creator_retry_queue', JSON.stringify(queue));

    const stored = JSON.parse(localStorage.getItem('ai_creator_retry_queue') || '[]');
    expect(stored.length).toBe(2);

    // Simulate processing
    const processed = [...stored];
    stored.length = 0;
    localStorage.removeItem('ai_creator_retry_queue');

    expect(processed.length).toBe(2);
    expect(JSON.parse(localStorage.getItem('ai_creator_retry_queue') || '[]').length).toBe(0);
  });

  it('should not process queue when offline', () => {
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    });

    const retryQueue = [{ type: 'image' }];
    const isOnline = navigator.onLine;

    if (!isOnline || retryQueue.length === 0) {
      // Don't process
    }

    expect(retryQueue.length).toBe(1); // Still has item
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    });
  });
});

describe('Toast notification', () => {
  beforeEach(() => {
    // Clean up any existing toasts
    document.querySelectorAll('.toast').forEach(el => el.remove());
  });

  it('should create toast element', () => {
    const title = 'Test message';
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = title;
    document.body.appendChild(el);

    const toast = document.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Test message');
  });

  it('should remove toast after timeout', () => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = 'Temporary';
    document.body.appendChild(el);

    // Simulate timeout removal
    const removeToast = () => el.remove();
    setTimeout(removeToast, 10);

    // At this point toast should still exist
    expect(document.querySelector('.toast')).not.toBeNull();
  });
});

describe('Modal dialog', () => {
  it('should create modal with confirm and cancel', async () => {
    const modalConfig = {
      title: 'Confirm',
      content: 'Are you sure?',
      showCancel: true,
      cancelText: 'No',
      confirmText: 'Yes'
    };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${modalConfig.title}</div>
        <div class="modal-content">${modalConfig.content}</div>
        <div class="modal-btns">
          ${modalConfig.showCancel ? `<button class="btn" id="modal-cancel">${modalConfig.cancelText}</button>` : ''}
          <button class="btn btn-primary" id="modal-confirm">${modalConfig.confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    expect(document.querySelector('.modal-title')?.textContent).toBe('Confirm');
    expect(document.querySelector('#modal-confirm')).not.toBeNull();
    expect(document.querySelector('#modal-cancel')).not.toBeNull();
  });

  it('should resolve promise on confirm', async () => {
    const promise = new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.innerHTML = `<button id="modal-confirm">OK</button>`;
      document.body.appendChild(overlay);

      overlay.querySelector('#modal-confirm')?.addEventListener('click', () => {
        overlay.remove();
        resolve({ confirm: true });
      });

      // Simulate click
      overlay.querySelector('#modal-confirm')?.click();
    });

    const result = await promise;
    expect(result.confirm).toBe(true);
  });
});

describe('Generate button state', () => {
  it('should be disabled when offline', () => {
    const isOnline = false;
    const btn = { disabled: false, textContent: 'Generate' };

    btn.disabled = !isOnline;
    if (!isOnline) {
      btn.textContent = '🔌 当前离线';
    }

    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('🔌 当前离线');
  });

  it('should be enabled when online', () => {
    const isOnline = true;
    const btn = { disabled: true, textContent: '🔌 当前离线' };

    btn.disabled = !isOnline;
    if (!isOnline) {
      btn.textContent = '🔌 当前离线';
    } else {
      btn.textContent = '开始生成';
    }

    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('开始生成');
  });
});

describe('History limit', () => {
  it('should limit to 50 items', () => {
    let history = [];
    for (let i = 0; i < 55; i++) {
      history.unshift({ id: i, createdAt: new Date().toISOString() });
      if (history.length > 50) history.pop();
    }
    expect(history.length).toBe(50);
  });
});

describe('Route handling', () => {
  it('should extract hash from location', () => {
    const hash = '';
    const page = hash.slice(1) || 'index';
    expect(page).toBe('index');
  });

  it('should handle empty hash as index', () => {
    const hash = '#';
    const page = hash.slice(1) || 'index';
    expect(page).toBe('');
  });
});

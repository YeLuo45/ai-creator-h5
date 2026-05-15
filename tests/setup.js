/**
 * Vitest Setup - Mock localStorage, fetch, online/offline
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index) {
      return Object.keys(store)[index] ?? null;
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
});

// Mock fetch
const fetchMock = jest.fn ? jest.fn() : (() => {
  const handlers = [];
  return {
    mockResolvedValue: (response) => {
      handlers.push({ pattern: '*', response });
    },
    mockResponse: (response) => {
      handlers.push({ pattern: '*', response });
    },
    mockImplementation: (url, options) => {
      const handler = handlers.find(h => url.includes(h.pattern)) || handlers[handlers.length - 1];
      if (handler && typeof handler.response === 'function') {
        return handler.response(url, options);
      }
      if (handler) {
        return Promise.resolve(handler.response);
      }
      return Promise.reject(new Error(`No mock handler for ${url}`));
    },
    _addHandler: (pattern, response) => {
      handlers.push({ pattern, response });
    }
  };
})();

// Also support vi.mock style via fetchMock.mock*
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetchMock;
}

// Mock navigator.onLine
Object.defineProperty(globalThis.navigator, 'onLine', {
  value: true,
  writable: true,
  configurable: true
});

// Mock window.location
if (!globalThis.location) {
  globalThis.location = {
    hash: '',
    reload: () => {}
  };
} else {
  Object.defineProperty(globalThis.location, 'hash', {
    value: '',
    writable: true,
    configurable: true
  });
}

// Mock window.matchMedia
if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  });
}

// Mock document.body
if (!globalThis.document?.body) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
}

// Reset between tests
beforeEach(() => {
  localStorageMock.clear();
  fetchMock.mockClear();
  globalThis.navigator.onLine = true;
  if (globalThis.location) {
    globalThis.location.hash = '';
  }
  // Clear event listeners storage
  globalThis._eventListeners = {};
});

export { localStorageMock, fetchMock };

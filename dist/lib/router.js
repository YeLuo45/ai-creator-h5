/**
 * router.js - Simple hash-based SPA router
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  async handleRoute() {
    const rawHash = window.location.hash.replace('#', '') || '/pages/index.html';
    const path = rawHash.startsWith('/') ? rawHash : '/' + rawHash;
    const [pathOnly, query] = path.split('?');
    const params = {};
    if (query) {
      query.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v);
      });
    }

    // Tab bar active state
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.classList.toggle('active', path.includes(tab.dataset.page));
    });

    // Load page
    const container = document.getElementById('pageContainer');
    if (this.routes[path]) {
      await this.routes[path](container, params);
      this.currentPage = path;
    } else {
      // Default to index
      if (this.routes['/pages/index.html']) {
        await this.routes['/pages/index.html'](container, params);
        this.currentPage = '/pages/index.html';
      }
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
}

window.router = new Router();

// Register route loader
async function loadPage(path, params = {}) {
  const container = document.getElementById('pageContainer');
  try {
    const res = await fetch(path);
    const html = await res.text();

    // Create temp div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Extract and inject styles
    const styles = temp.querySelectorAll('style');
    const existingStyles = document.getElementById('page-styles');
    if (existingStyles) existingStyles.remove();
    const styleEl = document.createElement('style');
    styleEl.id = 'page-styles';
    styles.forEach(s => styleEl.appendChild(document.createTextNode(s.textContent)));
    document.head.appendChild(styleEl);

    // Extract and inject scripts
    const scripts = temp.querySelectorAll('script:not([src])');
    const pageContent = temp.querySelector('.page') || temp.querySelector('main') || temp;

    container.innerHTML = '';
    container.appendChild(pageContent);

    // Execute inline scripts
    scripts.forEach(script => {
      try {
        eval(script.textContent);
      } catch (e) {
        console.error('Script error:', e);
      }
    });

    // Trigger page init
    if (window.pageInit) {
      window.pageInit(params);
      window.pageInit = null;
    }
  } catch (e) {
    console.error('Page load error:', e);
    container.innerHTML = '<div class="page"><div class="empty-state"><p>页面加载失败</p></div></div>';
  }
}

// Register routes
window.router.register('/pages/index.html', async (container, params) => {
  await loadPage('pages/index.html', params);
});

window.router.register('/pages/generate.html', async (container, params) => {
  await loadPage('pages/generate.html', params);
});

window.router.register('/pages/history.html', async (container, params) => {
  await loadPage('pages/history.html', params);
});

window.router.register('/pages/my.html', async (container, params) => {
  await loadPage('pages/my.html', params);
});

window.router.register('/pages/favorites.html', async (container, params) => {
  await loadPage('pages/favorites.html', params);
});

window.router.register('/pages/folder.html', async (container, params) => {
  await loadPage('pages/folder.html', params);
});

// Navigation helpers
window.navigateTo = function(path) {
  window.location.hash = path;
};

window.switchTab = function(path) {
  window.location.hash = path;
};

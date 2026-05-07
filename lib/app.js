/**
 * app.js - H5 App Entry (替代微信小程序 App())
 */

window.appInstance = null;

class App {
  constructor() {
    this.globalData = {
      userInfo: null,
      openid: '',
      credits: 0,
      apiKey: '',
      groupId: '',
    };
    window.appInstance = this;
  }

  onLaunch() {
    // 初始化加载本地存储
    const apiKey = localStorage.getItem('minimax_api_key') || '';
    const userInfo = localStorage.getItem('user_info') || null;
    const credits = localStorage.getItem('credits') || 0;
    const openid = localStorage.getItem('openid') || '';
    const groupId = localStorage.getItem('minimax_group_id') || '';

    this.globalData.apiKey = apiKey;
    this.globalData.userInfo = userInfo;
    this.globalData.credits = credits;
    this.globalData.openid = openid;
    this.globalData.groupId = groupId;

    // 模拟登录检查
    this.checkLogin();
  }

  checkLogin() {
    if (!this.globalData.openid) {
      console.log('[AI Creator H5] 未检测到登录态');
    }
  }

  // 模拟登录
  async doLogin() {
    const mockOpenid = 'h5_' + Math.random().toString(36).substring(2, 18);
    this.globalData.openid = mockOpenid;
    localStorage.setItem('openid', mockOpenid);
    return mockOpenid;
  }

  // 模拟获取用户信息
  async getUserProfile() {
    const userInfo = {
      nickname: 'H5用户',
      avatarUrl: '',
    };
    this.globalData.userInfo = userInfo;
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    return userInfo;
  }

  // 更新积分
  updateCredits(delta) {
    const newCredits = Math.max(0, this.globalData.credits + delta);
    this.globalData.credits = newCredits;
    localStorage.setItem('credits', newCredits);
    return newCredits;
  }

  // 检查 API Key
  hasApiKey() {
    return !!(this.globalData.apiKey && this.globalData.groupId);
  }

  // 设置 API Key
  setApiKey(key, groupId) {
    this.globalData.apiKey = key;
    this.globalData.groupId = groupId;
    localStorage.setItem('minimax_api_key', key);
    localStorage.setItem('minimax_group_id', groupId);
  }

  onShow(options) {
    // 分享回溯
    if (options && options.query && options.query.invite_openid) {
      console.log('[AI Creator H5] 分享回溯邀请人:', options.query.invite_openid);
    }
  }
}

// 页面基类
class Page {
  constructor(options) {
    this.data = options.data || {};
    this._init(options);
  }

  _init(options) {
    // 执行 onLoad
    if (options.onLoad) {
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const params = {};
      urlParams.forEach((v, k) => params[k] = v);
      options.onLoad.call(this, params);
    }
  }

  setData(obj) {
    Object.assign(this.data, obj);
    // 触发 UI 更新
    if (this._updateUI) this._updateUI();
  }

  refreshUserInfo() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      credits: Number(app.globalData.credits),
      hasApiKey: app.hasApiKey(),
    });
  }

  refreshCredits() {
    const app = getApp();
    this.setData({ credits: Number(app.globalData.credits) });
  }
}

// 工具函数
function getApp() {
  return window.appInstance;
}

// 初始化 App
window.App = App;
window.Page = Page;
window.getApp = getApp;

// 创建 App 实例
const app = new App();
app.onLaunch();

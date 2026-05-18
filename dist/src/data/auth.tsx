/**
 * auth.tsx - 认证与用户状态管理
 */

import * as React from 'react';

// ========== 类型定义 ==========

export interface UserInfo {
  nickname: string;
  avatarUrl: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  openid: string;
  userInfo: UserInfo | null;
  credits: number;
  hasApiKey: boolean;
  apiKey: string;
  groupId: string;
}

export interface AuthContextType {
  state: AuthState;
  login: () => Promise<void>;
  logout: () => void;
  setApiKey: (apiKey: string, groupId: string) => void;
  updateCredits: (delta: number) => number;
  refreshUserInfo: () => void;
}

// ========== Storage Keys ==========

const STORAGE_KEYS = {
  OPENID: 'openid',
  USER_INFO: 'user_info',
  CREDITS: 'credits',
  API_KEY: 'minimax_api_key',
  GROUP_ID: 'minimax_group_id',
};

// ========== Auth Provider Component ==========

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => {
    // 初始化从 localStorage 读取
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    const groupId = localStorage.getItem(STORAGE_KEYS.GROUP_ID) || '';
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    const openid = localStorage.getItem(STORAGE_KEYS.OPENID) || '';
    const credits = Number(localStorage.getItem(STORAGE_KEYS.CREDITS) || '0');

    return {
      isLoggedIn: !!openid,
      openid,
      userInfo: userInfoStr ? JSON.parse(userInfoStr) : null,
      credits,
      hasApiKey: !!(apiKey && groupId),
      apiKey,
      groupId,
    };
  });

  const login = React.useCallback(async () => {
    // 模拟登录 - 生成随机 openid
    const mockOpenid = 'h5_' + Math.random().toString(36).substring(2, 18);
    const mockUserInfo: UserInfo = {
      nickname: 'H5用户',
      avatarUrl: '',
    };

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEYS.OPENID, mockOpenid);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(mockUserInfo));

    setState(prev => ({
      ...prev,
      isLoggedIn: true,
      openid: mockOpenid,
      userInfo: mockUserInfo,
    }));
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.OPENID);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);

    setState(prev => ({
      ...prev,
      isLoggedIn: false,
      openid: '',
      userInfo: null,
    }));
  }, []);

  const setApiKey = React.useCallback((apiKey: string, groupId: string) => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.GROUP_ID, groupId);

    setState(prev => ({
      ...prev,
      apiKey,
      groupId,
      hasApiKey: !!(apiKey && groupId),
    }));
  }, []);

  const updateCredits = React.useCallback((delta: number) => {
    setState(prev => {
      const newCredits = Math.max(0, prev.credits + delta);
      localStorage.setItem(STORAGE_KEYS.CREDITS, String(newCredits));
      return { ...prev, credits: newCredits };
    });
    return state.credits + delta;
  }, [state.credits]);

  const refreshUserInfo = React.useCallback(() => {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    const credits = Number(localStorage.getItem(STORAGE_KEYS.CREDITS) || '0');

    setState(prev => ({
      ...prev,
      userInfo: userInfoStr ? JSON.parse(userInfoStr) : prev.userInfo,
      credits,
    }));
  }, []);

  const value = React.useMemo(
    () => ({
      state,
      login,
      logout,
      setApiKey,
      updateCredits,
      refreshUserInfo,
    }),
    [state, login, logout, setApiKey, updateCredits, refreshUserInfo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ========== Hook ==========

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ========== 工具函数 ==========

export function getAuthState(): AuthState {
  const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  const groupId = localStorage.getItem(STORAGE_KEYS.GROUP_ID) || '';
  const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  const openid = localStorage.getItem(STORAGE_KEYS.OPENID) || '';
  const credits = Number(localStorage.getItem(STORAGE_KEYS.CREDITS) || '0');

  return {
    isLoggedIn: !!openid,
    openid,
    userInfo: userInfoStr ? JSON.parse(userInfoStr) : null,
    credits,
    hasApiKey: !!(apiKey && groupId),
    apiKey,
    groupId,
  };
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

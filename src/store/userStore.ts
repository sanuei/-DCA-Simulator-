import { create } from 'zustand';
import { api, getDeviceId } from '../services/api';

interface UserState {
  user: any | null;
  stats: any | null;
  token: string | null;
  isPro: boolean;
  isLoading: boolean;
  login: (referralCode?: string) => Promise<void>;
  checkStatus: () => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  stats: null,
  token: localStorage.getItem('dca_token'),
  isPro: false,
  isLoading: false,

  login: async (referralCode) => {
    set({ isLoading: true });
    try {
      const data = await api.login(referralCode);
      if (data.success) {
        localStorage.setItem('dca_token', data.data.token);
        set({ 
          token: data.data.token, 
          user: data.data.user,
          isPro: data.data.user.tier === 'pro'
        });
        // 获取用户统计信息
        const userData = await api.getUser(data.data.token);
        if (userData.success) {
          set({ stats: userData.data.stats });
        }
      }
    } catch (e) {
      console.error('Login failed', e);
    } finally {
      set({ isLoading: false });
    }
  },

  checkStatus: async () => {
    const { token, login } = get();
    if (!token) {
      await login();
      return;
    }

    try {
      const data = await api.getUser(token);
      if (data.success) {
        set({ 
          user: data.data.user,
          isPro: data.data.user.tier === 'pro',
          stats: data.data.stats
        });
      } else {
        // Token invalid? Re-login
        await login();
      }
    } catch (e) {
      console.error('Check status failed', e);
    }
  },

  logout: () => {
    localStorage.removeItem('dca_token');
    set({ user: null, token: null, isPro: false });
  }
}));


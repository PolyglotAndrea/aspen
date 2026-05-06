/**
 * 认证 Store
 * 管理会员登录状态、token、个人资料
 */

import { defineStore } from 'pinia';
import { memberApi, setCurrentMemberId } from '../utils/api';

export interface MemberInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  levelId: string;
  points: number;
  totalPoints: number;
  balance: number;
  status: string;
  birthday?: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    member: null as MemberInfo | null,
    isLoggedIn: false,
  }),

  getters: {
    memberName: (state) => state.member?.nickname || state.member?.phone || '未登录',
    memberLevel: (state) => state.member?.levelId || 'bronze',
    points: (state) => state.member?.points || 0,
  },

  actions: {
    async loginPhone(phone: string) {
      const res = await memberApi.loginPhone(phone) as any;
      if (res.token) {
        this.token = res.token;
        this.member = res.member;
        this.isLoggedIn = true;
        setCurrentMemberId(res.member.id);
      }
      return res;
    },

    async loginPassword(username: string, password: string) {
      const res = await memberApi.loginPassword(username, password) as any;
      if (res.token) {
        this.token = res.token;
        this.member = res.member;
        this.isLoggedIn = true;
        setCurrentMemberId(res.member.id);
      }
      return res;
    },

    async loadProfile() {
      if (!this.isLoggedIn) return;
      try {
        const profile = await memberApi.getProfile() as any;
        this.member = profile;
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    },

    async updateProfile(data: Partial<MemberInfo>) {
      const updated = await memberApi.updateProfile(data) as any;
      if (updated) {
        this.member = { ...this.member, ...updated } as MemberInfo;
      }
      return updated;
    },

    logout() {
      this.token = '';
      this.member = null;
      this.isLoggedIn = false;
      setCurrentMemberId('');
    },
  },

  persist: {
    key: 'aspen-auth',
    storage: {
      getItem: (key: string) => {
        try { return uni.getStorageSync(key); } catch { return null; }
      },
      setItem: (key: string, value: string) => {
        try { uni.setStorageSync(key, value); } catch {}
      },
      removeItem: (key: string) => {
        try { uni.removeStorageSync(key); } catch {}
      },
    },
  },
});

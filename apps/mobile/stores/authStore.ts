import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  tier: string;
  verificationBadge: boolean;
  profileImageUrl: string | null;
  bio?: string | null;
  city?: string | null;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  auctionCount?: number;
  averageRating?: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  fetchProfile: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

/**
 * Decode JWT payload to check expiry (without verifying signature).
 * Returns true if token is expired or invalid.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await authService.login({ email, password });
    const { user, accessToken, refreshToken } = data.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
    // Fetch full profile in background
    get().fetchProfile();
  },

  signup: async (email, password, username, displayName) => {
    const { data } = await authService.signup({ email, password, username, displayName });
    const { user, accessToken, refreshToken } = data.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try { await authService.logout(); } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  fetchProfile: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser?.username) return;
      const { data } = await userService.getProfile(currentUser.username);
      if (data?.data) {
        set({ user: { ...currentUser, ...data.data } });
      }
    } catch {
      // Profile fetch is non-critical, silently fail
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      // Check if access token is expired
      if (isTokenExpired(token)) {
        // Try to refresh using refresh token
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken && !isTokenExpired(refreshToken)) {
          try {
            const { data } = await authService.refresh(refreshToken);
            const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
            await SecureStore.setItemAsync('accessToken', newAccess);
            await SecureStore.setItemAsync('refreshToken', newRefresh);
            set({ isAuthenticated: true, isLoading: false });
            // Fetch full profile
            get().fetchProfile();
            return;
          } catch {
            // Refresh failed, force logout
          }
        }
        // Both tokens expired
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      set({ isAuthenticated: true, isLoading: false });
      // Fetch full profile
      get().fetchProfile();
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));

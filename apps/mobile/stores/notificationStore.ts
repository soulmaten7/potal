import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (refresh?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (refresh = false) => {
    set({ isLoading: true });
    try {
      const { data } = await notificationService.getNotifications();
      set({ notifications: data.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationService.getUnreadCount();
      set({ unreadCount: data.data?.count || 0 });
    } catch {}
  },

  markAllRead: async () => {
    await notificationService.markAllRead();
    set({ unreadCount: 0, notifications: get().notifications.map(n => ({ ...n, isRead: true })) });
  },
}));

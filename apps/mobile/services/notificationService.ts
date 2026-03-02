import api from './api';

export const notificationService = {
  getNotifications: (cursor?: string) =>
    api.get('/notifications', { params: { cursor } }),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

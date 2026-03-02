import { useEffect } from 'react';
import { useNotificationStore } from '../stores/notificationStore';

export function useNotification() {
  const store = useNotificationStore();

  useEffect(() => {
    store.fetchUnreadCount();
  }, []);

  return store;
}

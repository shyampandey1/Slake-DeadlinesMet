"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { syncFcmToken } from '@/lib/fcm';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      // Auto-sync token if user is signed in and permission is already granted
      if (Notification.permission === 'granted' && user && !('isMockUser' in user)) {
        syncFcmToken(user.uid).catch(() => {});
      }
    }
  }, [user]);

  const requestPermissionAndToken = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported by this browser.');
      return null;
    }

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted' && user && !('isMockUser' in user)) {
        return await syncFcmToken(user.uid);
      }
      return null;
    } catch (error) {
      console.error('An error occurred while retrieving token: ', error);
      return null;
    }
  }, [user]);

  return { permission, requestPermissionAndToken };
}

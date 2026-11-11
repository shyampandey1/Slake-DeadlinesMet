"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { syncFcmToken, syncFcmTokenDetailed, type FcmSyncResult } from '@/lib/fcm';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastSyncResult, setLastSyncResult] = useState<FcmSyncResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted' && user && !('isMockUser' in user)) {
        syncFcmTokenDetailed(user.uid)
          .then((res) => setLastSyncResult(res))
          .catch(() => {});
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
        const res = await syncFcmTokenDetailed(user.uid);
        setLastSyncResult(res);
        return res.token;
      }
      return null;
    } catch (error) {
      console.error('An error occurred while retrieving token: ', error);
      return null;
    }
  }, [user]);

  const forceSyncToken = useCallback(async () => {
    if (!user || 'isMockUser' in user) return null;
    const res = await syncFcmTokenDetailed(user.uid);
    setLastSyncResult(res);
    return res;
  }, [user]);

  return { permission, requestPermissionAndToken, lastSyncResult, forceSyncToken, syncFcmToken };
}

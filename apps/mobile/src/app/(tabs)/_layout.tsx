import * as Notifications from 'expo-notifications';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/lib/auth';
import { registerPushToken } from '@/lib/notifications';

export default function TabsLayout() {
  const { session } = useAuth();
  const uid = session?.user.id;

  useEffect(() => {
    if (uid) registerPushToken(uid);
  }, [uid]);

  // Bildirime dokununca ilgili ekrana git (ör. sohbet).
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = lastResponse?.notification.request.content.data?.url;
    if (typeof url === 'string' && url !== '/') router.push(url as never);
  }, [lastResponse]);

  if (!session) return <Redirect href="/giris" />;
  return <AppTabs />;
}

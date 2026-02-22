import webpush from 'web-push';
import { vapidConfig } from './vapid-config';

export async function sendPushNotification(subscription: any, payload: { title: string; body: string; url?: string; icon?: string }) {
  if (!vapidConfig.publicKey || !vapidConfig.privateKey) {
    throw new Error('VAPID keys not configured');
  }

  webpush.setVapidDetails(vapidConfig.subject, vapidConfig.publicKey, vapidConfig.privateKey);

  return webpush.sendNotification(subscription, JSON.stringify(payload));
}

export async function sendToAllSubscriptions(payload: { title: string; body: string; url?: string }) {
  const { turso } = await import('@/lib/turso');
  const result = await turso.execute({ sql: 'SELECT * FROM push_subscriptions WHERE active = 1', args: [] });
  let sent = 0, failed = 0;
  for (const sub of result.rows as any[]) {
    try {
      await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } }, payload);
      sent++;
    } catch {
      failed++;
      await turso.execute({ sql: 'UPDATE push_subscriptions SET active = 0 WHERE id = ?', args: [sub.id] });
    }
  }
  return { sent, failed };
}

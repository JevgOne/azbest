import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { title, body, url, icon, subscriptionIds } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ success: false, error: 'Title and body are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');

    // Get target subscriptions
    let sql = 'SELECT * FROM push_subscriptions WHERE active = 1';
    const args: any[] = [];
    if (subscriptionIds?.length) {
      sql += ` AND id IN (${subscriptionIds.map(() => '?').join(',')})`;
      args.push(...subscriptionIds);
    }

    const result = await turso.execute({ sql, args });
    const subscriptions = result.rows;

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const webpush = await import('web-push');
        webpush.setVapidDetails(
          `mailto:${process.env.VAPID_EMAIL || 'admin@qsport.cz'}`,
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!,
        );
        await webpush.sendNotification(
          JSON.parse((sub as any).subscription_json),
          JSON.stringify({ title, body, url, icon }),
        );
        sent++;
      } catch {
        failed++;
      }
    }

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'push_sent', entityType: 'push',
      details: `Push sent: ${sent} delivered, ${failed} failed`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: { sent, failed, total: subscriptions.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { syncAllAnalytics } = await import('@/lib/genviral/analytics');
    const result = await syncAllAnalytics();

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'social_analytics_synced', entityType: 'social_post',
      details: `Synchronizoval analytiku pro ${result.synced} příspěvek(ů)`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

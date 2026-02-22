import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { postId, scheduledAt } = await request.json();
    if (!postId || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'postId and scheduledAt are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `UPDATE social_posts SET status = 'scheduled', scheduled_at = ?, updated_at = unixepoch() WHERE post_id = ?`,
      args: [scheduledAt, postId],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'social_post_scheduled', entityType: 'social_post', entityId: postId,
      details: `Scheduled post for ${scheduledAt}`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

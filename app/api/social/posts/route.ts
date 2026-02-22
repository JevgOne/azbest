import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');

    let sql = 'SELECT * FROM social_posts';
    const conditions: string[] = [];
    const args: any[] = [];

    if (status) { conditions.push('status = ?'); args.push(status); }
    if (platform) { conditions.push('platform = ?'); args.push(platform); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY scheduled_at DESC, created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { content, platform, mediaUrls, scheduledAt } = await request.json();
    if (!content || !platform) {
      return NextResponse.json({ success: false, error: 'Content and platform are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    const postId = `post_${Date.now()}`;
    const status = scheduledAt ? 'scheduled' : 'draft';

    await turso.execute({
      sql: `INSERT INTO social_posts (post_id, content, platform, media_urls, status, scheduled_at, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
      args: [postId, content, platform, JSON.stringify(mediaUrls || []), status, scheduledAt || null, user.email],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'social_post_created', entityType: 'social_post', entityId: postId,
      details: `Created ${platform} post`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: { postId, status } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

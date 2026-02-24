import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getAutoPostConfig, getQueue, getHistory } = await import('@/lib/auto-posting');
    const { turso } = await import('@/lib/turso');

    const [config, queue, historyData, accountsResult] = await Promise.all([
      getAutoPostConfig(),
      getQueue(),
      getHistory(20, 0),
      turso.execute({
        sql: 'SELECT * FROM genviral_accounts WHERE connected = 1 ORDER BY platform, username',
        args: [],
      }),
    ]);

    // Get scheduled/recent GenViral posts for planning data
    const recentPostsResult = await turso.execute({
      sql: `SELECT sp.*, gps.genviral_account_id, gps.platform as post_platform, gps.status as post_status,
                   ga.username as account_username
            FROM social_posts sp
            LEFT JOIN genviral_post_states gps ON gps.social_post_id = sp.id
            LEFT JOIN genviral_accounts ga ON ga.genviral_id = gps.genviral_account_id
            WHERE sp.status IN ('scheduled', 'published')
            ORDER BY COALESCE(sp.scheduled_at, sp.published_at, sp.created_at) DESC
            LIMIT 30`,
      args: [],
    });

    return NextResponse.json({
      success: true,
      data: {
        config,
        queue,
        history: historyData.history,
        historyTotal: historyData.total,
        accounts: accountsResult.rows,
        recentPosts: recentPostsResult.rows,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { saveAutoPostConfig } = await import('@/lib/auto-posting');
    const { logActivity } = await import('@/lib/activity-log');

    await saveAutoPostConfig({
      enabled: body.enabled,
      rules: body.rules,
      accountIds: body.accountIds,
      captionPrompt: body.captionPrompt,
      postTime: body.postTime,
    });

    await logActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'settings_updated',
      entityType: 'settings',
      details: `Updated auto-posting config: ${body.enabled ? 'enabled' : 'disabled'}`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

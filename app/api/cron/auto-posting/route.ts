import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Auth: Vercel cron or manual trigger with CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getAutoPostConfig, runAutoPost } = await import('@/lib/auto-posting');

    const config = await getAutoPostConfig();
    if (!config || !config.enabled) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Auto-posting is disabled' });
    }

    const result = await runAutoPost(config, 'auto');

    return NextResponse.json({ success: result.success, data: result });
  } catch (error: any) {
    console.error('Auto-posting cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Manual trigger from admin UI — uses session auth
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getAutoPostConfig, runAutoPost } = await import('@/lib/auto-posting');

    const config = await getAutoPostConfig();
    if (!config) {
      return NextResponse.json({ success: false, error: 'Auto-posting not configured' }, { status: 400 });
    }

    if (config.accountIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No social accounts selected' }, { status: 400 });
    }

    const result = await runAutoPost(config, 'manual_trigger');

    return NextResponse.json({ success: result.success, data: result });
  } catch (error: any) {
    console.error('Auto-posting manual trigger error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

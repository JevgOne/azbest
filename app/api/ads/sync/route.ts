import { NextRequest, NextResponse } from 'next/server';

// POST /api/ads/sync — sync all or specific platforms
export async function POST(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const { platforms, dateFrom, dateTo } = body;

    const { syncAllAds } = await import('@/lib/ads/sync-all');
    const result = await syncAllAds(platforms, dateFrom, dateTo);

    // Log activity
    const { logActivity } = await import('@/lib/activity-log');
    logActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: result.errors.length ? 'ads_sync_failed' : 'ads_synced',
      entityType: 'ad_sync',
      details: `Synced ${result.totalCampaigns} campaigns, ${result.totalStats} daily stats. Errors: ${result.errors.length}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/ads/sync — get sync history
export async function GET() {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getSyncHistory } = await import('@/lib/ads/sync-all');
    const history = await getSyncHistory();

    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

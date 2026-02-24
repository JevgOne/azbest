import { NextRequest, NextResponse } from 'next/server';

// GET /api/ads/overview — unified overview stats
export async function GET(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getUnifiedPlatformStats, getUnifiedDailyStats, getTopCampaigns } = await import('@/lib/ads/unified-stats');

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const platform = searchParams.get('platform') as any;

    const [platformStats, dailyStats, topCampaigns] = await Promise.all([
      getUnifiedPlatformStats(),
      getUnifiedDailyStats(days, platform || undefined),
      getTopCampaigns(),
    ]);

    return NextResponse.json({
      success: true,
      data: { platformStats, dailyStats, topCampaigns },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

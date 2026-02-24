import { NextRequest, NextResponse } from 'next/server';

// GET /api/ads/daily-stats — unified daily stats for charts
export async function GET(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { getUnifiedDailyStats } = await import('@/lib/ads/unified-stats');
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const platform = searchParams.get('platform') as any;

    const stats = await getUnifiedDailyStats(days, platform || undefined);

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

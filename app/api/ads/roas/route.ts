import { NextRequest, NextResponse } from 'next/server';

// GET /api/ads/roas — ROAS data
export async function GET(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { calculateRoas, getRoasByPlatform } = await import('@/lib/ads/roas-calculator');
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const [perCampaign, perPlatform] = await Promise.all([
      calculateRoas(dateFrom, dateTo),
      getRoasByPlatform(),
    ]);

    return NextResponse.json({
      success: true,
      data: { perCampaign, perPlatform },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/ads/roas — recalculate ROAS
export async function POST(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { calculateRoas } = await import('@/lib/ads/roas-calculator');
    const body = await request.json().catch(() => ({}));
    const result = await calculateRoas(body.dateFrom, body.dateTo);

    const { logActivity } = await import('@/lib/activity-log');
    logActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'ads_roas_calculated',
      entityType: 'ad_campaign',
      details: `Recalculated ROAS for ${result.length} campaigns`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

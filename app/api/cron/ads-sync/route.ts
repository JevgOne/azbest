import { NextRequest, NextResponse } from 'next/server';

// Cron job: sync all ad platforms + recalculate ROAS
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { syncAllAds } = await import('@/lib/ads/sync-all');
    const { calculateRoas } = await import('@/lib/ads/roas-calculator');

    // Sync all platforms
    const syncResult = await syncAllAds();

    // Recalculate ROAS
    const roasResult = await calculateRoas();

    return NextResponse.json({
      success: true,
      sync: {
        campaigns: syncResult.totalCampaigns,
        stats: syncResult.totalStats,
        errors: syncResult.errors,
      },
      roas: {
        campaignsCalculated: roasResult.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

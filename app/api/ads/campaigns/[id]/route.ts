import { NextRequest, NextResponse } from 'next/server';

// GET /api/ads/campaigns/[id] — campaign detail with daily stats
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { id } = await params;

    const [campaignResult, statsResult, keywordsResult] = await Promise.all([
      turso.execute({
        sql: `SELECT * FROM ad_campaigns WHERE id = ?`,
        args: [id],
      }),
      turso.execute({
        sql: `SELECT * FROM campaign_daily_stats WHERE campaign_id = ? ORDER BY date DESC LIMIT 90`,
        args: [id],
      }),
      turso.execute({
        sql: `SELECT * FROM ad_keywords WHERE campaign_id = ? ORDER BY impressions DESC LIMIT 50`,
        args: [id],
      }),
    ]);

    if (!campaignResult.rows.length) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign: campaignResult.rows[0],
        dailyStats: statsResult.rows,
        keywords: keywordsResult.rows,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

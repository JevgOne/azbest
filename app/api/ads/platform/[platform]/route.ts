import { NextRequest, NextResponse } from 'next/server';
import type { AdPlatform } from '@/types/ads';

const VALID_PLATFORMS: AdPlatform[] = ['google_ads', 'meta_ads', 'sklik', 'heureka', 'zbozi', 'mergado'];

// GET /api/ads/platform/[platform] — platform-specific data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { platform } = await params;
    if (!VALID_PLATFORMS.includes(platform as AdPlatform)) {
      return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const [campaigns, dailyStats, syncLog] = await Promise.all([
      turso.execute({
        sql: `SELECT * FROM ad_campaigns WHERE platform=? ORDER BY spend DESC LIMIT ?`,
        args: [platform, limit],
      }),
      turso.execute({
        sql: `SELECT ds.date, SUM(ds.impressions) as impressions, SUM(ds.clicks) as clicks,
                SUM(ds.spend) as spend, SUM(ds.conversions) as conversions, SUM(ds.revenue) as revenue
              FROM campaign_daily_stats ds
              JOIN ad_campaigns c ON c.id = ds.campaign_id
              WHERE c.platform = ? AND ds.date >= date('now', '-30 days')
              GROUP BY ds.date ORDER BY ds.date ASC`,
        args: [platform],
      }),
      turso.execute({
        sql: `SELECT * FROM ad_sync_log WHERE platform=? ORDER BY started_at DESC LIMIT 5`,
        args: [platform],
      }),
    ]);

    // Platform-specific extras
    let extras: any = {};

    if (platform === 'heureka') {
      const bids = await turso.execute({
        sql: `SELECT * FROM heureka_bids WHERE active=1 ORDER BY spend DESC LIMIT 50`,
        args: [],
      });
      extras.bids = bids.rows;
    }

    if (platform === 'mergado') {
      const feeds = await turso.execute({
        sql: `SELECT * FROM mergado_feeds ORDER BY synced_at DESC`,
        args: [],
      });
      const rules = await turso.execute({
        sql: `SELECT r.*, f.name as feed_name FROM mergado_rules r JOIN mergado_feeds f ON f.id = r.feed_id ORDER BY r.priority DESC`,
        args: [],
      });
      extras.feeds = feeds.rows;
      extras.rules = rules.rows;
    }

    if (platform === 'google_ads') {
      const keywords = await turso.execute({
        sql: `SELECT * FROM ad_keywords WHERE platform='google_ads' ORDER BY impressions DESC LIMIT 50`,
        args: [],
      });
      extras.keywords = keywords.rows;
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.rows,
        dailyStats: dailyStats.rows,
        syncHistory: syncLog.rows,
        ...extras,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/ads/platform/[platform] — sync specific platform
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { platform } = await params;
    if (!VALID_PLATFORMS.includes(platform as AdPlatform)) {
      return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { syncAllAds } = await import('@/lib/ads/sync-all');
    const result = await syncAllAds([platform as AdPlatform], body.dateFrom, body.dateTo);

    const { logActivity } = await import('@/lib/activity-log');
    logActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: result.errors.length ? 'ads_sync_failed' : 'ads_synced',
      entityType: 'ad_sync',
      entityName: platform,
      details: `Synced ${platform}: ${result.totalCampaigns} campaigns, ${result.totalStats} stats`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

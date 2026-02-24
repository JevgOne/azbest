import type { AdPlatform, UnifiedPlatformStats, UnifiedDailyStats } from '@/types/ads';
import { PLATFORM_LABELS } from '@/types/ads';

/**
 * Get aggregated stats per platform for the overview dashboard.
 */
export async function getUnifiedPlatformStats(): Promise<UnifiedPlatformStats[]> {
  const { turso } = await import('@/lib/turso');

  const result = await turso.execute({
    sql: `SELECT
            platform,
            COUNT(*) as campaign_count,
            SUM(impressions) as impressions,
            SUM(clicks) as clicks,
            SUM(spend) as spend,
            SUM(conversions) as conversions,
            SUM(revenue) as revenue
          FROM ad_campaigns
          GROUP BY platform
          ORDER BY SUM(spend) DESC`,
    args: [],
  });

  // Check which platforms have API keys configured
  const connected: Record<string, boolean> = {
    google_ads: !!(process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CUSTOMER_ID),
    meta_ads: !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
    sklik: !!process.env.SKLIK_API_TOKEN,
    heureka: !!process.env.HEUREKA_API_KEY,
    zbozi: !!process.env.ZBOZI_API_KEY,
    mergado: !!process.env.MERGADO_API_TOKEN,
  };

  const allPlatforms: AdPlatform[] = ['google_ads', 'meta_ads', 'sklik', 'heureka', 'zbozi', 'mergado'];
  const dbData = new Map<string, any>();
  for (const row of result.rows as any[]) {
    dbData.set(row.platform, row);
  }

  return allPlatforms.map((platform) => {
    const data = dbData.get(platform);
    const impressions = data?.impressions || 0;
    const clicks = data?.clicks || 0;
    const spend = data?.spend || 0;
    const revenue = data?.revenue || 0;

    return {
      platform,
      label: PLATFORM_LABELS[platform],
      connected: connected[platform] || false,
      impressions,
      clicks,
      spend,
      conversions: data?.conversions || 0,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      campaignCount: data?.campaign_count || 0,
    };
  });
}

/**
 * Get unified daily stats across all platforms.
 */
export async function getUnifiedDailyStats(
  days: number = 30,
  platform?: AdPlatform
): Promise<UnifiedDailyStats[]> {
  const { turso } = await import('@/lib/turso');

  const conditions: string[] = [`ds.date >= date('now', '-${days} days')`];
  const args: any[] = [];

  if (platform) {
    conditions.push('c.platform = ?');
    args.push(platform);
  }

  const where = conditions.join(' AND ');

  const result = await turso.execute({
    sql: `SELECT
            ds.date,
            SUM(ds.impressions) as impressions,
            SUM(ds.clicks) as clicks,
            SUM(ds.spend) as spend,
            SUM(ds.conversions) as conversions,
            SUM(ds.revenue) as revenue
          FROM campaign_daily_stats ds
          JOIN ad_campaigns c ON c.id = ds.campaign_id
          WHERE ${where}
          GROUP BY ds.date
          ORDER BY ds.date ASC`,
    args,
  });

  return (result.rows as any[]).map((r) => ({
    date: r.date,
    impressions: r.impressions || 0,
    clicks: r.clicks || 0,
    spend: r.spend || 0,
    conversions: r.conversions || 0,
    revenue: r.revenue || 0,
  }));
}

/**
 * Get top campaigns across all platforms.
 */
export async function getTopCampaigns(limit: number = 10) {
  const { turso } = await import('@/lib/turso');

  const result = await turso.execute({
    sql: `SELECT * FROM ad_campaigns WHERE spend > 0 ORDER BY spend DESC LIMIT ?`,
    args: [limit],
  });

  return result.rows;
}

import type { SyncResult } from '@/types/ads';

export async function syncGoogleAds(dateFrom?: string, dateTo?: string): Promise<SyncResult> {
  const { turso } = await import('@/lib/turso');
  const { getCampaignPerformance, getDailyPerformance, getKeywordPerformance, getGoogleAdsCustomer } = await import('@/lib/google-ads');

  let campaignsSynced = 0;
  let statsSynced = 0;

  // Build date range for GAQL
  let dateRange = 'LAST_30_DAYS';
  if (dateFrom && dateTo) {
    dateRange = `'${dateFrom}' AND '${dateTo}'`;
  }
  const gaqlRange = dateFrom && dateTo
    ? `segments.date BETWEEN '${dateFrom}' AND '${dateTo}'`
    : `segments.date DURING LAST_30_DAYS`;

  // 1. Sync campaigns
  const campaigns = await getCampaignPerformance(dateFrom && dateTo ? dateRange : undefined);
  for (const c of campaigns) {
    await turso.execute({
      sql: `INSERT INTO ad_campaigns (platform, external_id, name, status, impressions, clicks, spend, conversions, ctr, cpc, synced_at)
            VALUES ('google_ads', ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
            ON CONFLICT(platform, external_id) DO UPDATE SET
              name=excluded.name, status=excluded.status,
              impressions=excluded.impressions, clicks=excluded.clicks, spend=excluded.spend,
              conversions=excluded.conversions, ctr=excluded.ctr, cpc=excluded.cpc,
              synced_at=unixepoch(), updated_at=unixepoch()`,
      args: [
        String(c.id), c.name, c.status === 2 ? 'active' : 'paused',
        c.impressions || 0, c.clicks || 0, c.cost || 0, c.conversions || 0,
        c.ctr || 0, c.avgCpc || 0,
      ],
    });
    campaignsSynced++;
  }

  // 2. Sync daily stats per campaign
  const customer = await getGoogleAdsCustomer();
  const dailyRows = await customer.query(`
    SELECT campaign.id, segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM campaign WHERE ${gaqlRange} ORDER BY segments.date ASC
  `);

  for (const row of dailyRows as any[]) {
    const campaignExternalId = String(row.campaign.id);
    const date = row.segments.date;

    // Find local campaign id
    const local = await turso.execute({
      sql: `SELECT id FROM ad_campaigns WHERE platform='google_ads' AND external_id=?`,
      args: [campaignExternalId],
    });
    if (!local.rows.length) continue;
    const campaignId = (local.rows[0] as any).id;

    const spend = (row.metrics.cost_micros || 0) / 1000000;
    const clicks = row.metrics.clicks || 0;
    const impressions = row.metrics.impressions || 0;

    await turso.execute({
      sql: `INSERT INTO campaign_daily_stats (campaign_id, date, impressions, clicks, spend, conversions, ctr, cpc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(campaign_id, date) DO UPDATE SET
              impressions=excluded.impressions, clicks=excluded.clicks, spend=excluded.spend,
              conversions=excluded.conversions, ctr=excluded.ctr, cpc=excluded.cpc`,
      args: [
        campaignId, date, impressions, clicks, spend,
        row.metrics.conversions || 0,
        impressions > 0 ? clicks / impressions : 0,
        clicks > 0 ? spend / clicks : 0,
      ],
    });
    statsSynced++;
  }

  // 3. Sync keywords
  const keywords = await getKeywordPerformance(dateFrom && dateTo ? dateRange : undefined);
  for (const kw of keywords) {
    await turso.execute({
      sql: `INSERT INTO ad_keywords (platform, keyword, match_type, impressions, clicks, spend, conversions)
            VALUES ('google_ads', ?, ?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING`,
      args: [kw.keyword, kw.matchType || 'broad', kw.impressions || 0, kw.clicks || 0, kw.cost || 0, kw.conversions || 0],
    });
  }

  // 4. Create UTM mapping for Google campaigns
  for (const c of campaigns) {
    await turso.execute({
      sql: `INSERT INTO utm_ad_mapping (platform, utm_source, utm_medium, utm_campaign)
            VALUES ('google_ads', 'google', 'cpc', ?)
            ON CONFLICT(utm_source, utm_medium, utm_campaign) DO UPDATE SET
              platform='google_ads'`,
      args: [String(c.id)],
    });
    // Also link campaign_id
    const local = await turso.execute({
      sql: `SELECT id FROM ad_campaigns WHERE platform='google_ads' AND external_id=?`,
      args: [String(c.id)],
    });
    if (local.rows.length) {
      await turso.execute({
        sql: `UPDATE utm_ad_mapping SET campaign_id=? WHERE utm_source='google' AND utm_medium='cpc' AND utm_campaign=?`,
        args: [(local.rows[0] as any).id, String(c.id)],
      });
    }
  }

  return { platform: 'google_ads', syncType: 'full', campaignsSynced, statsSynced };
}

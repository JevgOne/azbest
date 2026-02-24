import type { SyncResult } from '@/types/ads';

export async function syncSklik(dateFrom?: string, dateTo?: string): Promise<SyncResult> {
  const { turso } = await import('@/lib/turso');
  const { getSklikCampaigns, getSklikStats } = await import('@/lib/sklik/client');

  let campaignsSynced = 0;
  let statsSynced = 0;

  // Default date range: last 30 days
  const now = new Date();
  const from = dateFrom || new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
  const to = dateTo || now.toISOString().split('T')[0];

  // 1. Sync campaigns
  const campaigns = await getSklikCampaigns();
  const campaignIds: number[] = [];

  for (const c of campaigns) {
    const status = c.status === 'active' ? 'active' : 'paused';
    await turso.execute({
      sql: `INSERT INTO ad_campaigns (platform, external_id, name, status, daily_budget, currency, synced_at)
            VALUES ('sklik', ?, ?, ?, ?, 'CZK', unixepoch())
            ON CONFLICT(platform, external_id) DO UPDATE SET
              name=excluded.name, status=excluded.status, daily_budget=excluded.daily_budget,
              synced_at=unixepoch(), updated_at=unixepoch()`,
      args: [String(c.id), c.name || `Kampaň ${c.id}`, status, c.dayBudget || null],
    });
    campaignIds.push(c.id);
    campaignsSynced++;
  }

  if (!campaignIds.length) {
    return { platform: 'sklik', syncType: 'full', campaignsSynced: 0, statsSynced: 0 };
  }

  // 2. Sync daily stats
  const stats = await getSklikStats(campaignIds, from, to);
  for (const row of stats) {
    const campaignExternalId = String(row.campaignId || row.id);
    const local = await turso.execute({
      sql: `SELECT id FROM ad_campaigns WHERE platform='sklik' AND external_id=?`,
      args: [campaignExternalId],
    });
    if (!local.rows.length) continue;
    const campaignId = (local.rows[0] as any).id;

    // Stats may be per-day entries
    const days = row.stats || [row];
    for (const day of Array.isArray(days) ? days : [days]) {
      const date = day.date || from;
      const impressions = day.impressions || 0;
      const clicks = day.clicks || 0;
      const spend = (day.cost || 0) / 100; // Sklik returns haléře

      await turso.execute({
        sql: `INSERT INTO campaign_daily_stats (campaign_id, date, impressions, clicks, spend, conversions, ctr, cpc)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(campaign_id, date) DO UPDATE SET
                impressions=excluded.impressions, clicks=excluded.clicks, spend=excluded.spend,
                conversions=excluded.conversions, ctr=excluded.ctr, cpc=excluded.cpc`,
        args: [
          campaignId, date, impressions, clicks, spend,
          day.conversions || 0,
          impressions > 0 ? clicks / impressions : 0,
          clicks > 0 ? spend / clicks : 0,
        ],
      });
      statsSynced++;
    }

    // Update campaign totals from stats
    const totals = await turso.execute({
      sql: `SELECT SUM(impressions) as imp, SUM(clicks) as clk, SUM(spend) as sp, SUM(conversions) as conv
            FROM campaign_daily_stats WHERE campaign_id=?`,
      args: [campaignId],
    });
    if (totals.rows.length) {
      const t = totals.rows[0] as any;
      await turso.execute({
        sql: `UPDATE ad_campaigns SET impressions=?, clicks=?, spend=?, conversions=?,
                ctr=CASE WHEN ?> 0 THEN CAST(? AS REAL)/?  ELSE 0 END,
                cpc=CASE WHEN ?> 0 THEN CAST(? AS REAL)/?  ELSE 0 END
              WHERE id=?`,
        args: [t.imp, t.clk, t.sp, t.conv, t.imp, t.clk, t.imp, t.clk, t.sp, t.clk, campaignId],
      });
    }
  }

  // 3. UTM mapping for Sklik
  for (const c of campaigns) {
    await turso.execute({
      sql: `INSERT INTO utm_ad_mapping (platform, utm_source, utm_medium, utm_campaign)
            VALUES ('sklik', 'seznam', 'cpc', ?)
            ON CONFLICT(utm_source, utm_medium, utm_campaign) DO UPDATE SET platform='sklik'`,
      args: [String(c.id)],
    });
  }

  return { platform: 'sklik', syncType: 'full', campaignsSynced, statsSynced };
}

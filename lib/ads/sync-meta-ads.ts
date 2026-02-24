import type { SyncResult } from '@/types/ads';

export async function syncMetaAds(dateFrom?: string, dateTo?: string): Promise<SyncResult> {
  const { turso } = await import('@/lib/turso');
  const { getCampaigns, getCampaignInsights, getAdSets } = await import('@/lib/meta-ads');

  let campaignsSynced = 0;
  let statsSynced = 0;

  // 1. Sync campaigns
  const campaigns = await getCampaigns();
  for (const c of campaigns) {
    await turso.execute({
      sql: `INSERT INTO ad_campaigns (platform, external_id, name, status, daily_budget, synced_at)
            VALUES ('meta_ads', ?, ?, ?, ?, unixepoch())
            ON CONFLICT(platform, external_id) DO UPDATE SET
              name=excluded.name, status=excluded.status, daily_budget=excluded.daily_budget,
              synced_at=unixepoch(), updated_at=unixepoch()`,
      args: [c.id, c.name, c.status === 'ACTIVE' ? 'active' : 'paused', c.dailyBudget || null],
    });
    campaignsSynced++;
  }

  // 2. Sync campaign insights (aggregated)
  const datePreset = dateFrom ? 'last_30d' : 'last_30d';
  const insights = await getCampaignInsights(datePreset);
  for (const i of insights) {
    await turso.execute({
      sql: `UPDATE ad_campaigns SET
              impressions=?, clicks=?, spend=?, ctr=?, cpc=?, synced_at=unixepoch(), updated_at=unixepoch()
            WHERE platform='meta_ads' AND external_id=?`,
      args: [i.impressions, i.clicks, i.spend, i.ctr, i.cpc, i.campaignId],
    });
  }

  // 3. Sync daily stats using time_increment
  try {
    const { metaDailyInsights } = await import('@/lib/ads/meta-daily');
    const daily = await metaDailyInsights(dateFrom, dateTo);
    for (const d of daily) {
      const local = await turso.execute({
        sql: `SELECT id FROM ad_campaigns WHERE platform='meta_ads' AND external_id=?`,
        args: [d.campaignId],
      });
      if (!local.rows.length) continue;
      const campaignId = (local.rows[0] as any).id;

      await turso.execute({
        sql: `INSERT INTO campaign_daily_stats (campaign_id, date, impressions, clicks, spend, conversions, ctr, cpc)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(campaign_id, date) DO UPDATE SET
                impressions=excluded.impressions, clicks=excluded.clicks, spend=excluded.spend,
                conversions=excluded.conversions, ctr=excluded.ctr, cpc=excluded.cpc`,
        args: [campaignId, d.date, d.impressions, d.clicks, d.spend, d.conversions, d.ctr, d.cpc],
      });
      statsSynced++;
    }
  } catch {
    // Daily insights may fail if Meta API rate limited — not critical
  }

  // 4. UTM mapping
  for (const c of campaigns) {
    await turso.execute({
      sql: `INSERT INTO utm_ad_mapping (platform, utm_source, utm_medium, utm_campaign)
            VALUES ('meta_ads', 'facebook', 'cpc', ?)
            ON CONFLICT(utm_source, utm_medium, utm_campaign) DO UPDATE SET platform='meta_ads'`,
      args: [c.id],
    });
    const local = await turso.execute({
      sql: `SELECT id FROM ad_campaigns WHERE platform='meta_ads' AND external_id=?`,
      args: [c.id],
    });
    if (local.rows.length) {
      await turso.execute({
        sql: `UPDATE utm_ad_mapping SET campaign_id=? WHERE utm_source='facebook' AND utm_medium='cpc' AND utm_campaign=?`,
        args: [(local.rows[0] as any).id, c.id],
      });
    }
  }

  return { platform: 'meta_ads', syncType: 'full', campaignsSynced, statsSynced };
}

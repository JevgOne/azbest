import type { AdPlatform, SyncResult } from '@/types/ads';

interface SyncAllResult {
  results: SyncResult[];
  errors: { platform: AdPlatform; error: string }[];
  totalCampaigns: number;
  totalStats: number;
}

export async function syncAllAds(
  platforms?: AdPlatform[],
  dateFrom?: string,
  dateTo?: string
): Promise<SyncAllResult> {
  const { turso } = await import('@/lib/turso');
  const results: SyncResult[] = [];
  const errors: { platform: AdPlatform; error: string }[] = [];

  const allPlatforms: AdPlatform[] = platforms || ['google_ads', 'meta_ads', 'sklik', 'heureka', 'zbozi', 'mergado'];

  for (const platform of allPlatforms) {
    // Log sync start
    const logResult = await turso.execute({
      sql: `INSERT INTO ad_sync_log (platform, sync_type, status, date_from, date_to)
            VALUES (?, 'full', 'running', ?, ?)`,
      args: [platform, dateFrom || null, dateTo || null],
    });
    const syncLogId = Number(logResult.lastInsertRowid);

    try {
      let result: SyncResult;

      switch (platform) {
        case 'google_ads': {
          const { syncGoogleAds } = await import('./sync-google-ads');
          result = await syncGoogleAds(dateFrom, dateTo);
          break;
        }
        case 'meta_ads': {
          const { syncMetaAds } = await import('./sync-meta-ads');
          result = await syncMetaAds(dateFrom, dateTo);
          break;
        }
        case 'sklik': {
          const { syncSklik } = await import('./sync-sklik');
          result = await syncSklik(dateFrom, dateTo);
          break;
        }
        case 'heureka': {
          const { syncHeureka } = await import('./sync-heureka');
          result = await syncHeureka();
          break;
        }
        case 'zbozi': {
          const { syncZbozi } = await import('./sync-zbozi');
          result = await syncZbozi();
          break;
        }
        case 'mergado': {
          const { syncMergado } = await import('./sync-mergado');
          result = await syncMergado();
          break;
        }
        default:
          continue;
      }

      results.push(result);

      // Log sync complete
      await turso.execute({
        sql: `UPDATE ad_sync_log SET status='completed', campaigns_synced=?, stats_synced=?, completed_at=unixepoch() WHERE id=?`,
        args: [result.campaignsSynced, result.statsSynced, syncLogId],
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error';
      errors.push({ platform, error: errorMsg });

      // Log sync failure
      await turso.execute({
        sql: `UPDATE ad_sync_log SET status='failed', error_message=?, completed_at=unixepoch() WHERE id=?`,
        args: [errorMsg, syncLogId],
      });
    }
  }

  return {
    results,
    errors,
    totalCampaigns: results.reduce((s, r) => s + r.campaignsSynced, 0),
    totalStats: results.reduce((s, r) => s + r.statsSynced, 0),
  };
}

export async function getSyncHistory(platform?: AdPlatform, limit: number = 20) {
  const { turso } = await import('@/lib/turso');

  const conditions: string[] = [];
  const args: any[] = [];

  if (platform) {
    conditions.push('platform = ?');
    args.push(platform);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await turso.execute({
    sql: `SELECT * FROM ad_sync_log ${where} ORDER BY started_at DESC LIMIT ?`,
    args: [...args, limit],
  });

  return result.rows;
}

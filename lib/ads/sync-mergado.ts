import type { SyncResult } from '@/types/ads';

export async function syncMergado(): Promise<SyncResult> {
  const { turso } = await import('@/lib/turso');
  const { getMergadoFeeds, getMergadoRules } = await import('@/lib/mergado/client');

  let campaignsSynced = 0;
  let statsSynced = 0;

  // 1. Sync feeds
  const feedsResponse = await getMergadoFeeds();
  const feeds = feedsResponse.results || feedsResponse.data || feedsResponse || [];

  for (const feed of Array.isArray(feeds) ? feeds : []) {
    const feedId = String(feed.id);
    await turso.execute({
      sql: `INSERT INTO mergado_feeds (mergado_id, name, format, url, products_count, status, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, unixepoch())
            ON CONFLICT(mergado_id) DO UPDATE SET
              name=excluded.name, url=excluded.url, products_count=excluded.products_count,
              status=excluded.status, synced_at=unixepoch(), updated_at=unixepoch()`,
      args: [
        feedId,
        feed.name || `Feed ${feedId}`,
        feed.format || 'xml',
        feed.url || null,
        feed.products_count || 0,
        feed.status || 'active',
      ],
    });
    campaignsSynced++;

    // 2. Sync rules for each feed
    try {
      const rulesResponse = await getMergadoRules(feedId);
      const rules = rulesResponse.results || rulesResponse.data || rulesResponse || [];

      // Get local feed id
      const localFeed = await turso.execute({
        sql: `SELECT id FROM mergado_feeds WHERE mergado_id=?`,
        args: [feedId],
      });
      if (!localFeed.rows.length) continue;
      const localFeedId = (localFeed.rows[0] as any).id;

      for (const rule of Array.isArray(rules) ? rules : []) {
        await turso.execute({
          sql: `INSERT INTO mergado_rules (feed_id, mergado_rule_id, name, type, status, priority)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(feed_id, mergado_rule_id) DO UPDATE SET
                  name=excluded.name, type=excluded.type, status=excluded.status, priority=excluded.priority`,
          args: [
            localFeedId,
            String(rule.id),
            rule.name || `Pravidlo ${rule.id}`,
            rule.type || null,
            rule.status || 'active',
            rule.priority || 0,
          ],
        });
        statsSynced++;
      }
    } catch {
      // Rules fetch may fail for some feeds
    }
  }

  // 3. Ensure Mergado campaign record
  await turso.execute({
    sql: `INSERT INTO ad_campaigns (platform, external_id, name, status, currency, synced_at)
          VALUES ('mergado', 'mergado-feeds', 'Mergado Feed Management', 'active', 'CZK', unixepoch())
          ON CONFLICT(platform, external_id) DO UPDATE SET synced_at=unixepoch(), updated_at=unixepoch()`,
    args: [],
  });

  return { platform: 'mergado', syncType: 'full', campaignsSynced, statsSynced };
}

import type { SyncResult } from '@/types/ads';

export async function syncZbozi(): Promise<SyncResult> {
  const { turso } = await import('@/lib/turso');

  let campaignsSynced = 0;

  // Zboží.cz is feed-based, similar to Heureka
  // Ensure a Zboží campaign exists
  await turso.execute({
    sql: `INSERT INTO ad_campaigns (platform, external_id, name, status, currency, synced_at)
          VALUES ('zbozi', 'zbozi-feed', 'Zboží.cz Produktový feed', 'active', 'CZK', unixepoch())
          ON CONFLICT(platform, external_id) DO UPDATE SET synced_at=unixepoch(), updated_at=unixepoch()`,
    args: [],
  });
  campaignsSynced = 1;

  // Update feed stats
  const productCount = await turso.execute({
    sql: `SELECT COUNT(*) as cnt FROM products WHERE visibility='visible'`,
    args: [],
  });
  const count = (productCount.rows[0] as any)?.cnt || 0;

  await turso.execute({
    sql: `INSERT INTO product_feeds (platform, name, format, products_count, last_generated_at, status)
          VALUES ('zbozi', 'Zboží.cz XML Feed', 'xml', ?, unixepoch(), 'active')
          ON CONFLICT DO NOTHING`,
    args: [count],
  });

  return { platform: 'zbozi', syncType: 'full', campaignsSynced, statsSynced: 0 };
}

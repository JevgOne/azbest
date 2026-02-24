import type { SyncResult } from '@/types/ads';

export async function syncHeureka(): Promise<SyncResult> {
  const { turso } = await import('@/lib/turso');

  let campaignsSynced = 0;
  let statsSynced = 0;

  // Heureka doesn't have traditional campaigns — we model it as a single "Heureka Feed" campaign
  // and track product-level bids

  // 1. Ensure a Heureka campaign exists
  await turso.execute({
    sql: `INSERT INTO ad_campaigns (platform, external_id, name, status, currency, synced_at)
          VALUES ('heureka', 'heureka-feed', 'Heureka Produktový feed', 'active', 'CZK', unixepoch())
          ON CONFLICT(platform, external_id) DO UPDATE SET synced_at=unixepoch(), updated_at=unixepoch()`,
    args: [],
  });
  campaignsSynced = 1;

  // 2. Sync reviews (uses existing heureka reviews module)
  try {
    const { syncHeurekaReviews } = await import('@/lib/heureka/reviews');
    const result = await syncHeurekaReviews();
    statsSynced += result.synced || 0;
  } catch {
    // Reviews sync is optional
  }

  // 3. Update feed stats — count products in the feed
  const productCount = await turso.execute({
    sql: `SELECT COUNT(*) as cnt FROM products WHERE visibility='visible'`,
    args: [],
  });
  const count = (productCount.rows[0] as any)?.cnt || 0;

  await turso.execute({
    sql: `INSERT INTO product_feeds (platform, name, format, products_count, last_generated_at, status)
          VALUES ('heureka', 'Heureka XML Feed', 'xml', ?, unixepoch(), 'active')
          ON CONFLICT DO NOTHING`,
    args: [count],
  });

  // 4. Update Heureka campaign with bid totals
  const bidTotals = await turso.execute({
    sql: `SELECT SUM(impressions) as imp, SUM(clicks) as clk, SUM(spend) as sp, SUM(conversions) as conv, SUM(revenue) as rev
          FROM heureka_bids WHERE active=1`,
    args: [],
  });
  if (bidTotals.rows.length) {
    const t = bidTotals.rows[0] as any;
    const imp = t.imp || 0;
    const clk = t.clk || 0;
    const sp = t.sp || 0;
    const rev = t.rev || 0;
    await turso.execute({
      sql: `UPDATE ad_campaigns SET impressions=?, clicks=?, spend=?, conversions=?, revenue=?,
              roas=CASE WHEN ?> 0 THEN CAST(? AS REAL)/?  ELSE 0 END,
              ctr=CASE WHEN ?> 0 THEN CAST(? AS REAL)/?  ELSE 0 END,
              cpc=CASE WHEN ?> 0 THEN CAST(? AS REAL)/?  ELSE 0 END
            WHERE platform='heureka' AND external_id='heureka-feed'`,
      args: [imp, clk, sp, t.conv || 0, rev, sp, rev, sp, imp, clk, imp, clk, sp, clk],
    });
  }

  return { platform: 'heureka', syncType: 'full', campaignsSynced, statsSynced };
}

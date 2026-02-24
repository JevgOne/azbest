import type { RoasData, AdPlatform } from '@/types/ads';

/**
 * Calculate ROAS by linking ad spend (from ad_campaigns) to revenue (from orders via UTM).
 */
export async function calculateRoas(
  dateFrom?: string,
  dateTo?: string
): Promise<RoasData[]> {
  const { turso } = await import('@/lib/turso');

  // Build date filter for orders
  const dateConditions: string[] = [];
  const dateArgs: any[] = [];

  if (dateFrom) {
    dateConditions.push('o.created_at >= ?');
    dateArgs.push(Math.floor(new Date(dateFrom).getTime() / 1000));
  }
  if (dateTo) {
    dateConditions.push('o.created_at <= ?');
    dateArgs.push(Math.floor(new Date(dateTo + 'T23:59:59').getTime() / 1000));
  }

  const dateWhere = dateConditions.length ? `AND ${dateConditions.join(' AND ')}` : '';

  // Get revenue per campaign via UTM mapping
  const result = await turso.execute({
    sql: `SELECT
            c.id as campaign_id,
            c.name as campaign_name,
            c.platform,
            c.spend,
            COALESCE(rev.total_revenue, 0) as revenue,
            COALESCE(rev.order_count, 0) as orders
          FROM ad_campaigns c
          LEFT JOIN (
            SELECT
              m.campaign_id,
              SUM(o.total_price) as total_revenue,
              COUNT(o.id) as order_count
            FROM utm_ad_mapping m
            JOIN orders o ON o.utm_source = m.utm_source
              AND o.utm_medium = m.utm_medium
              AND o.utm_campaign = m.utm_campaign
            WHERE m.campaign_id IS NOT NULL ${dateWhere}
            GROUP BY m.campaign_id
          ) rev ON rev.campaign_id = c.id
          WHERE c.spend > 0 OR rev.total_revenue > 0
          ORDER BY c.spend DESC`,
    args: dateArgs,
  });

  const rows: RoasData[] = (result.rows as any[]).map((r) => ({
    campaign_id: r.campaign_id,
    campaign_name: r.campaign_name,
    platform: r.platform as AdPlatform,
    spend: r.spend || 0,
    revenue: r.revenue || 0,
    roas: r.spend > 0 ? r.revenue / r.spend : 0,
    orders: r.orders || 0,
  }));

  // Update ROAS in ad_campaigns table
  for (const row of rows) {
    await turso.execute({
      sql: `UPDATE ad_campaigns SET revenue=?, roas=?, updated_at=unixepoch() WHERE id=?`,
      args: [row.revenue, row.roas, row.campaign_id],
    });
  }

  return rows;
}

/**
 * Get aggregated ROAS per platform.
 */
export async function getRoasByPlatform(): Promise<Record<AdPlatform, { spend: number; revenue: number; roas: number; orders: number }>> {
  const { turso } = await import('@/lib/turso');

  const result = await turso.execute({
    sql: `SELECT
            c.platform,
            SUM(c.spend) as total_spend,
            SUM(c.revenue) as total_revenue,
            COUNT(DISTINCT o.id) as total_orders
          FROM ad_campaigns c
          LEFT JOIN utm_ad_mapping m ON m.campaign_id = c.id
          LEFT JOIN orders o ON o.utm_source = m.utm_source
            AND o.utm_medium = m.utm_medium
            AND o.utm_campaign = m.utm_campaign
          GROUP BY c.platform`,
    args: [],
  });

  const platforms: Record<string, { spend: number; revenue: number; roas: number; orders: number }> = {};

  for (const row of result.rows as any[]) {
    const spend = row.total_spend || 0;
    const revenue = row.total_revenue || 0;
    platforms[row.platform] = {
      spend,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      orders: row.total_orders || 0,
    };
  }

  return platforms as Record<AdPlatform, { spend: number; revenue: number; roas: number; orders: number }>;
}

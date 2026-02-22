export async function generateWeeklyReport() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateFrom = weekAgo.toISOString().split('T')[0];
  const dateTo = now.toISOString().split('T')[0];

  // Collect data from various sources
  const { turso } = await import('@/lib/turso');
  const orders = await turso.execute({ sql: 'SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE created_at >= ?', args: [Math.floor(weekAgo.getTime() / 1000)] }).catch(() => ({ rows: [{ count: 0, revenue: 0 }] }));

  return {
    type: 'weekly',
    title: `Týdenní report ${dateFrom} - ${dateTo}`,
    dateFrom, dateTo,
    data: { orders: (orders.rows[0] as any)?.count || 0, revenue: (orders.rows[0] as any)?.revenue || 0 },
  };
}

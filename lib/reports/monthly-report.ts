export async function generateMonthlyReport() {
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const dateFrom = monthAgo.toISOString().split('T')[0];
  const dateTo = now.toISOString().split('T')[0];

  const { turso } = await import('@/lib/turso');
  const orders = await turso.execute({ sql: 'SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE created_at >= ?', args: [Math.floor(monthAgo.getTime() / 1000)] }).catch(() => ({ rows: [{ count: 0, revenue: 0 }] }));

  return {
    type: 'monthly',
    title: `Měsíční report ${dateFrom} - ${dateTo}`,
    dateFrom, dateTo,
    data: { orders: (orders.rows[0] as any)?.count || 0, revenue: (orders.rows[0] as any)?.revenue || 0 },
  };
}

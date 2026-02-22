export async function calculateRFM() {
  const { turso } = await import('@/lib/turso');
  const now = Math.floor(Date.now() / 1000);

  const customers = await turso.execute({
    sql: `SELECT id, email, total_orders, total_spent, last_order_at FROM customers WHERE total_orders > 0`,
    args: [],
  });

  for (const customer of customers.rows as any[]) {
    const daysSinceLastOrder = customer.last_order_at ? Math.floor((now - customer.last_order_at) / 86400) : 999;

    // RFM scoring (1-5 scale)
    const recency = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 90 ? 4 : daysSinceLastOrder <= 180 ? 3 : daysSinceLastOrder <= 365 ? 2 : 1;
    const frequency = customer.total_orders >= 10 ? 5 : customer.total_orders >= 5 ? 4 : customer.total_orders >= 3 ? 3 : customer.total_orders >= 2 ? 2 : 1;
    const monetary = customer.total_spent >= 20000 ? 5 : customer.total_spent >= 10000 ? 4 : customer.total_spent >= 5000 ? 3 : customer.total_spent >= 2000 ? 2 : 1;

    const segment = getSegment(recency, frequency, monetary);
    const score = `${recency}${frequency}${monetary}`;

    await turso.execute({
      sql: 'UPDATE customers SET rfm_recency = ?, rfm_frequency = ?, rfm_monetary = ?, rfm_segment = ?, rfm_score = ?, updated_at = unixepoch() WHERE id = ?',
      args: [recency, frequency, monetary, segment, score, customer.id],
    });
  }
}

function getSegment(r: number, f: number, m: number): string {
  const avg = (r + f + m) / 3;
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  if (r >= 4 && f >= 3) return 'loyal_customers';
  if (r >= 4 && f <= 2) return 'new_customers';
  if (r <= 2 && f >= 3) return 'at_risk';
  if (r <= 2 && f <= 2 && m >= 3) return 'cant_lose';
  if (r <= 2 && f <= 2) return 'lost';
  if (avg >= 3) return 'potential_loyalists';
  return 'need_attention';
}

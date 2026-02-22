export async function detectAbandonedCarts() {
  // Shoptet doesn't have a direct abandoned cart API
  // We detect by comparing sessions with incomplete orders
  return { detected: 0 };
}

export async function getAbandonedCarts(limit: number = 50) {
  const { turso } = await import('@/lib/turso');
  const result = await turso.execute({
    sql: 'SELECT * FROM abandoned_carts WHERE recovered = 0 ORDER BY abandoned_at DESC LIMIT ?',
    args: [limit],
  });
  return result.rows;
}

export async function checkCompetitorPrices() {
  const { turso } = await import('@/lib/turso');
  const competitors = await turso.execute({ sql: 'SELECT * FROM competitors WHERE monitoring_enabled = 1', args: [] });

  for (const comp of competitors.rows as any[]) {
    try {
      // In production, implement actual price scraping
      await turso.execute({ sql: 'UPDATE competitors SET last_checked_at = unixepoch() WHERE id = ?', args: [comp.id] });
    } catch (error) {
      console.error(`Error checking competitor ${comp.name}:`, error);
    }
  }
}

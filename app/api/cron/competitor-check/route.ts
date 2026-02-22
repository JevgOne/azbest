import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { turso } = await import('@/lib/turso');

    // Get competitors with price tracking enabled
    const competitorsResult = await turso.execute({
      sql: 'SELECT * FROM competitors WHERE track_prices = 1',
      args: [],
    });

    let checked = 0;
    for (const competitor of competitorsResult.rows as any[]) {
      try {
        // Fetch competitor site to check for price changes
        const response = await fetch(competitor.url, {
          headers: { 'User-Agent': 'QSport Marketing Bot/1.0' },
        });

        if (response.ok) {
          await turso.execute({
            sql: `UPDATE competitors SET last_checked_at = unixepoch(), last_status = ? WHERE id = ?`,
            args: ['ok', competitor.id],
          });
          checked++;
        } else {
          await turso.execute({
            sql: `UPDATE competitors SET last_checked_at = unixepoch(), last_status = ? WHERE id = ?`,
            args: [`error_${response.status}`, competitor.id],
          });
        }
      } catch {
        await turso.execute({
          sql: `UPDATE competitors SET last_checked_at = unixepoch(), last_status = ? WHERE id = ?`,
          args: ['error_fetch', competitor.id],
        });
      }
    }

    return NextResponse.json({ success: true, data: { checked, total: competitorsResult.rows.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

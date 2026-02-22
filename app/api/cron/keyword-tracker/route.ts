import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { turso } = await import('@/lib/turso');

    // Get all tracked keywords
    const keywordsResult = await turso.execute({
      sql: 'SELECT * FROM tracked_keywords WHERE active = 1',
      args: [],
    });

    let tracked = 0;
    for (const keyword of keywordsResult.rows as any[]) {
      try {
        // Check ranking for each keyword (using Search Console data if available)
        const { getTopQueries } = await import('@/lib/google-search-console');
        const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL || 'https://www.qsport.cz';
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const queries = await getTopQueries(siteUrl, startDate, endDate, 1000);
        const match = queries.find((q: any) => q.query?.toLowerCase() === keyword.keyword?.toLowerCase());

        await turso.execute({
          sql: `INSERT INTO keyword_rankings (keyword_id, position, clicks, impressions, checked_at)
                VALUES (?, ?, ?, ?, unixepoch())`,
          args: [keyword.id, match?.position || null, match?.clicks || 0, match?.impressions || 0],
        });

        await turso.execute({
          sql: `UPDATE tracked_keywords SET last_position = ?, last_checked_at = unixepoch() WHERE id = ?`,
          args: [match?.position || null, keyword.id],
        });

        tracked++;
      } catch {
        // Skip individual keyword errors
      }
    }

    return NextResponse.json({ success: true, data: { tracked, total: keywordsResult.rows.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

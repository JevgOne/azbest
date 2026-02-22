import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { turso } = await import('@/lib/turso');

    // Check for scheduled reports that need to be generated
    const scheduledReports = await turso.execute({
      sql: `SELECT * FROM scheduled_reports WHERE active = 1 AND next_run_at <= unixepoch()`,
      args: [],
    });

    let generated = 0;
    for (const report of scheduledReports.rows as any[]) {
      try {
        const reportId = `report_${Date.now()}_${generated}`;

        // Generate report data based on type
        let reportData: any = { generatedAt: new Date().toISOString(), type: report.type };

        if (report.type === 'traffic') {
          const { getGA4Overview } = await import('@/lib/google-analytics');
          reportData.ga4 = await getGA4Overview().catch(() => null);
        } else if (report.type === 'ads') {
          const { getCampaignPerformance } = await import('@/lib/google-ads');
          reportData.googleAds = await getCampaignPerformance().catch(() => null);
        }

        await turso.execute({
          sql: `INSERT INTO reports (report_id, type, date_range, format, generated_by, data, created_at)
                VALUES (?, ?, ?, 'json', 'cron', ?, unixepoch())`,
          args: [reportId, report.type, report.date_range || 'last_7_days', JSON.stringify(reportData)],
        });

        // Calculate next run time based on frequency
        const frequencies: Record<string, number> = {
          daily: 86400,
          weekly: 604800,
          monthly: 2592000,
        };
        const nextRun = Math.floor(Date.now() / 1000) + (frequencies[report.frequency] || 604800);

        await turso.execute({
          sql: `UPDATE scheduled_reports SET last_run_at = unixepoch(), next_run_at = ? WHERE id = ?`,
          args: [nextRun, report.id],
        });

        generated++;
      } catch {
        // Skip individual report errors
      }
    }

    return NextResponse.json({ success: true, data: { generated, total: scheduledReports.rows.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

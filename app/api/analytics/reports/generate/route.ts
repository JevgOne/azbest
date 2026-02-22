import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { type, dateRange, format } = await request.json();
    if (!type) {
      return NextResponse.json({ success: false, error: 'Report type is required' }, { status: 400 });
    }

    // Generate report based on type
    const reportData: any = {
      id: `report_${Date.now()}`,
      type,
      dateRange: dateRange || 'last_30_days',
      format: format || 'json',
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
    };

    // Store report record in DB
    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO reports (report_id, type, date_range, format, generated_by, data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [reportData.id, type, reportData.dateRange, reportData.format, user.email, JSON.stringify(reportData)],
    });

    await logActivity({
      userId: user.id, userEmail: user.email, userName: user.name,
      action: 'report_generated', entityType: 'report', entityId: reportData.id,
      details: `Generated ${type} report`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: reportData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

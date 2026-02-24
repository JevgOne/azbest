import { NextRequest, NextResponse } from 'next/server';

// GET /api/ads/campaigns — list campaigns with filters
export async function GET(request: NextRequest) {
  const { getAuthUser, unauthorizedResponse } = await import('@/lib/auth/require-auth');
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: string[] = [];
    const args: any[] = [];

    if (platform) {
      conditions.push('platform = ?');
      args.push(platform);
    }
    if (status) {
      conditions.push('status = ?');
      args.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [campaigns, countResult] = await Promise.all([
      turso.execute({
        sql: `SELECT * FROM ad_campaigns ${where} ORDER BY spend DESC LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      }),
      turso.execute({
        sql: `SELECT COUNT(*) as count FROM ad_campaigns ${where}`,
        args,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: campaigns.rows,
      total: (countResult.rows[0] as any)?.count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

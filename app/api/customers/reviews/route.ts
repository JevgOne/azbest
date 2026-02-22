import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const source = searchParams.get('source');
    const minRating = searchParams.get('minRating');

    let sql = 'SELECT * FROM reviews';
    const conditions: string[] = [];
    const args: any[] = [];

    if (source) { conditions.push('source = ?'); args.push(source); }
    if (minRating) { conditions.push('rating >= ?'); args.push(parseInt(minRating)); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM reviews', args: [] });

    return NextResponse.json({
      success: true,
      data: { reviews: result.rows, total: (countResult.rows[0] as any)?.count || 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

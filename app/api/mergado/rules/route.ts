import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('feedId');
    const { turso } = await import('@/lib/turso');

    let sql = 'SELECT * FROM mergado_rules';
    const args: any[] = [];
    if (feedId) {
      sql += ' WHERE feed_id = ?';
      args.push(feedId);
    }
    sql += ' ORDER BY priority ASC';

    const result = await turso.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

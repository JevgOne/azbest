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

    let sql = 'SELECT * FROM reviews';
    const args: any[] = [];
    if (source) {
      sql += ' WHERE source = ?';
      args.push(source);
    }
    sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { syncHeurekaReviews } = await import('@/lib/heureka/reviews');
    const result = await syncHeurekaReviews();
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

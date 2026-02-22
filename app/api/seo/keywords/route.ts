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

    const result = await turso.execute({
      sql: 'SELECT * FROM tracked_keywords ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [limit, offset],
    });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM tracked_keywords', args: [] });

    return NextResponse.json({
      success: true,
      data: { keywords: result.rows, total: (countResult.rows[0] as any)?.count || 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { keyword, url, searchEngine } = await request.json();
    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO tracked_keywords (keyword, url, search_engine, created_at, updated_at)
            VALUES (?, ?, ?, unixepoch(), unixepoch())`,
      args: [keyword, url || 'https://www.qsport.cz', searchEngine || 'google.cz'],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

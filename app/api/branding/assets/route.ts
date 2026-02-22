import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let sql = 'SELECT * FROM brand_assets';
    const args: any[] = [];
    if (type) {
      sql += ' WHERE type = ?';
      args.push(type);
    }
    sql += ' ORDER BY created_at DESC';

    const result = await turso.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { name, type, url, description, metadata } = await request.json();
    if (!name || !type || !url) {
      return NextResponse.json({ success: false, error: 'Name, type, and URL are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO brand_assets (name, type, url, description, metadata, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [name, type, url, description || null, JSON.stringify(metadata || {}), user.email],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

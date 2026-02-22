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
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM products';
    const conditions: string[] = [];
    const args: any[] = [];

    if (brand) { conditions.push('brand = ?'); args.push(brand); }
    if (search) { conditions.push('name LIKE ?'); args.push(`%${search}%`); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM products', args: [] });

    return NextResponse.json({ success: true, data: { products: result.rows, total: (countResult.rows[0] as any)?.count || 0 } });
  } catch (error) {
    return NextResponse.json({ success: true, data: { products: [], total: 0 } });
  }
}

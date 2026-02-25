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
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM products';
    let countSql = 'SELECT COUNT(*) as count FROM products';
    const conditions: string[] = [];
    const args: any[] = [];

    if (brand) { conditions.push('brand = ?'); args.push(brand); }
    if (category) { conditions.push('category = ?'); args.push(category); }
    if (visibility) { conditions.push('visibility = ?'); args.push(visibility); }
    if (search) { conditions.push('(name LIKE ? OR brand LIKE ?)'); args.push(`%${search}%`, `%${search}%`); }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    const countArgs = [...args];
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    const countResult = await turso.execute({ sql: countSql, args: countArgs });

    return NextResponse.json({ success: true, data: { products: result.rows, total: (countResult.rows[0] as any)?.count || 0 } });
  } catch (error) {
    return NextResponse.json({ success: true, data: { products: [], total: 0 } });
  }
}

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
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM orders';
    let countSql = 'SELECT COUNT(*) as count FROM orders';
    const conditions: string[] = [];
    const args: any[] = [];

    if (status) { conditions.push('status = ?'); args.push(status); }
    if (search) { conditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)'); args.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const countArgs = [...args];
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    const countResult = await turso.execute({ sql: countSql, args: countArgs });

    return NextResponse.json({ success: true, data: { orders: result.rows, total: (countResult.rows[0] as any)?.count || 0 } });
  } catch (error) {
    return NextResponse.json({ success: true, data: { orders: [], total: 0 } });
  }
}

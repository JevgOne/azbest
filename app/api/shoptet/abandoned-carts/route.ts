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
    const recovered = searchParams.get('recovered');

    let sql = 'SELECT * FROM abandoned_carts';
    let countSql = 'SELECT COUNT(*) as count FROM abandoned_carts';
    const conditions: string[] = [];
    const args: any[] = [];

    if (recovered === '1') { conditions.push('recovered = 1'); }
    else if (recovered === '0') { conditions.push('recovered = 0'); }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ' ORDER BY abandoned_at DESC LIMIT ? OFFSET ?';
    const countArgs = [...args];
    args.push(limit, offset);

    const result = await turso.execute({ sql, args });
    const countResult = await turso.execute({ sql: countSql, args: countArgs });

    // Aggregate metrics
    const totalResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM abandoned_carts', args: [] });
    const recoveredResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM abandoned_carts WHERE recovered = 1', args: [] });
    const lostRevenueResult = await turso.execute({ sql: 'SELECT COALESCE(SUM(total_price), 0) as total FROM abandoned_carts WHERE recovered = 0', args: [] });
    const recoveredRevenueResult = await turso.execute({ sql: 'SELECT COALESCE(SUM(total_price), 0) as total FROM abandoned_carts WHERE recovered = 1', args: [] });

    return NextResponse.json({
      success: true,
      data: {
        carts: result.rows,
        total: (countResult.rows[0] as any)?.count || 0,
        metrics: {
          totalAbandoned: (totalResult.rows[0] as any)?.count || 0,
          recoveredCount: (recoveredResult.rows[0] as any)?.count || 0,
          lostRevenue: (lostRevenueResult.rows[0] as any)?.total || 0,
          recoveredRevenue: (recoveredRevenueResult.rows[0] as any)?.total || 0,
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: true, data: { carts: [], total: 0, metrics: { totalAbandoned: 0, recoveredCount: 0, lostRevenue: 0, recoveredRevenue: 0 } } });
  }
}

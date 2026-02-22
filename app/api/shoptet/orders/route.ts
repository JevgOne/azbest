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

    const result = await turso.execute({ sql: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?', args: [limit, offset] });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM orders', args: [] });

    return NextResponse.json({ success: true, data: { orders: result.rows, total: (countResult.rows[0] as any)?.count || 0 } });
  } catch (error) {
    return NextResponse.json({ success: true, data: { orders: [], total: 0 } });
  }
}

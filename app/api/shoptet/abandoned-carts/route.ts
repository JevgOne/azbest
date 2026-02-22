import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({ sql: 'SELECT * FROM abandoned_carts ORDER BY abandoned_at DESC LIMIT 50', args: [] });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    return NextResponse.json({ success: true, data: [] });
  }
}

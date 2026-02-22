import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({
      sql: 'SELECT id, endpoint, user_agent, active, created_at FROM push_subscriptions ORDER BY created_at DESC',
      args: [],
    });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM push_subscriptions WHERE active = 1', args: [] });

    return NextResponse.json({
      success: true,
      data: { subscriptions: result.rows, activeCount: (countResult.rows[0] as any)?.count || 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

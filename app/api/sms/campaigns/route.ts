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
      sql: 'SELECT * FROM sms_campaigns ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [limit, offset],
    });
    const countResult = await turso.execute({ sql: 'SELECT COUNT(*) as count FROM sms_campaigns', args: [] });

    return NextResponse.json({
      success: true,
      data: { campaigns: result.rows, total: (countResult.rows[0] as any)?.count || 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

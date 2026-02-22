import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const result = await turso.execute({
      sql: `SELECT * FROM social_posts
            WHERE scheduled_at >= ? AND scheduled_at <= ?
            ORDER BY scheduled_at ASC`,
      args: [startDate, endDate],
    });

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/require-auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { turso } = await import('@/lib/turso');
    const result = await turso.execute({
      sql: 'SELECT * FROM competitors ORDER BY name ASC',
      args: [],
    });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { name, url, notes, trackPrices } = await request.json();
    if (!name || !url) {
      return NextResponse.json({ success: false, error: 'Name and URL are required' }, { status: 400 });
    }

    const { turso } = await import('@/lib/turso');
    await turso.execute({
      sql: `INSERT INTO competitors (name, url, notes, track_prices, created_at, updated_at)
            VALUES (?, ?, ?, ?, unixepoch(), unixepoch())`,
      args: [name, url, notes || null, trackPrices ? 1 : 0],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
